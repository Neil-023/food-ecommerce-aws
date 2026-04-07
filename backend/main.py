import os
from collections import defaultdict
from datetime import datetime, timedelta, timezone
from itertools import combinations
from typing import List, Optional

import cloudinary
import cloudinary.uploader
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, File, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

import models
from database import SessionLocal, engine


load_dotenv()


def get_required_env(name: str) -> str:
    value = (os.getenv(name) or "").strip()
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


def get_csv_env(name: str) -> List[str]:
    raw_value = get_required_env(name)
    values = [value.strip() for value in raw_value.split(",") if value.strip()]
    if not values:
        raise RuntimeError(f"Environment variable {name} must contain at least one value")
    return values


models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Food E-Commerce API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_csv_env("CORS_ALLOW_ORIGINS"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


SECRET_KEY = get_required_env("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = int(os.getenv("ACCESS_TOKEN_MINUTES", "30"))
REFRESH_TOKEN_DAYS = int(os.getenv("REFRESH_TOKEN_DAYS", "14"))

ADMIN_USERNAME = get_required_env("ADMIN_USERNAME")
ADMIN_PASSWORD = get_required_env("ADMIN_PASSWORD")
ADMIN_EMAIL = get_required_env("ADMIN_EMAIL")
DEMO_ADMIN_USERNAME = "demo_admin"
CLOUDINARY_URL = (os.getenv("CLOUDINARY_URL") or "").strip() or None

if CLOUDINARY_URL:
    cloudinary.config(cloudinary_url=CLOUDINARY_URL, secure=True)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class RegisterRequest(BaseModel):
    username: str
    password: str = Field(min_length=6)
    full_name: str
    contact_number: Optional[str] = None
    email_address: str
    address: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class CartItemUpsertRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class CartItemQuantityRequest(BaseModel):
    quantity: int


class CreateOrderItemRequest(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class CreateOrderRequest(BaseModel):
    items: Optional[List[CreateOrderItemRequest]] = None


class AdminProductCreateRequest(BaseModel):
    category_id: int
    product_name: str
    product_desc: str
    price: float = Field(gt=0)
    avail_stocks: int = Field(ge=0)
    product_img: Optional[str] = None


class AdminProductUpdateRequest(BaseModel):
    category_id: Optional[int] = None
    product_name: Optional[str] = None
    product_desc: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    product_img: Optional[str] = None


class AdminStockUpdateRequest(BaseModel):
    avail_stocks: int = Field(ge=0)


class AdminOrderStatusRequest(BaseModel):
    status: str


class CategoryCreateRequest(BaseModel):
    category_name: str
    icon_name: Optional[str] = None


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_token(subject: str, role: str, token_type: str, expires_delta: timedelta) -> str:
    expire_at = datetime.now(timezone.utc) + expires_delta
    payload = {
        "sub": subject,
        "role": role,
        "type": token_type,
        "exp": expire_at,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def serialize_user(user: models.User):
    return {
        "user_id": user.user_id,
        "username": user.username,
        "full_name": user.full_name,
        "contact_number": user.contact_number,
        "email_address": user.email_address,
        "role": user.role,
        "image": user.image,
    }


def serialize_product(product: models.Product):
    return {
        "product_id": product.product_id,
        "category_id": product.category_id,
        "seller_id": 1,
        "product_name": product.product_name,
        "product_desc": product.product_desc,
        "product_img": product.product_img,
        "price": product.price,
        "avail_stocks": product.avail_stocks,
    }


def create_auth_payload(user: models.User):
    access_token = create_token(
        subject=str(user.user_id),
        role=user.role,
        token_type="access",
        expires_delta=timedelta(minutes=ACCESS_TOKEN_MINUTES),
    )
    refresh_token = create_token(
        subject=str(user.user_id),
        role=user.role,
        token_type="refresh",
        expires_delta=timedelta(days=REFRESH_TOKEN_DAYS),
    )
    return {
        "user": serialize_user(user),
        "auth_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


def get_user_by_token(token: str, db: Session) -> models.User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired token",
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        token_type = payload.get("type")
        subject = payload.get("sub")
        if token_type != "access" or not subject:
            raise credentials_error
    except JWTError:
        raise credentials_error

    user = db.query(models.User).filter(models.User.user_id == int(subject)).first()
    if not user:
        raise credentials_error
    return user


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> models.User:
    return get_user_by_token(token, db)


def require_admin(user: models.User = Depends(get_current_user)) -> models.User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_non_demo_user(user: models.User = Depends(get_current_user)) -> models.User:
    if user.username == DEMO_ADMIN_USERNAME:
        raise HTTPException(status_code=403, detail="Modifications are disabled in Demo Mode.")
    return user


def get_or_create_user_cart(user_id: int, db: Session) -> models.Cart:
    cart = db.query(models.Cart).filter(models.Cart.user_id == user_id).first()
    if cart:
        return cart

    cart = models.Cart(user_id=user_id)
    db.add(cart)
    db.commit()
    db.refresh(cart)
    return cart


def serialize_cart(cart: models.Cart, db: Session):
    cart_items = db.query(models.CartItem).filter(models.CartItem.cart_id == cart.cart_id).all()
    items = []
    for entry in cart_items:
        product = db.query(models.Product).filter(
            models.Product.product_id == entry.product_id,
            models.Product.deleted_at.is_(None),
        ).first()
        if not product:
            continue
        items.append(
            {
                "cart_item_id": entry.cart_item_id,
                "product_id": product.product_id,
                "product_name": product.product_name,
                "product_img": product.product_img,
                "price": product.price,
                "quantity": entry.quantity,
                "seller_id": 1,
                "seller_name": "Admin Store",
                "stock": product.avail_stocks,
            }
        )

    return {
        "cart_id": cart.cart_id,
        "items": items,
    }


def seed_defaults(db: Session):
    admin = db.query(models.User).filter(models.User.role == "admin").first()
    if not admin:
        db.add(
            models.User(
                username=ADMIN_USERNAME,
                password_hash=hash_password(ADMIN_PASSWORD),
                full_name="Store Admin",
                contact_number="N/A",
                email_address=ADMIN_EMAIL,
                role="admin",
                image=None,
            )
        )
        db.commit()

    if db.query(models.Category).count() == 0:
        db.add_all(
            [
                models.Category(category_name="Pizzas", icon_name="local_pizza"),
                models.Category(category_name="Pasta", icon_name="dinner_dining"),
                models.Category(category_name="Beverages", icon_name="local_cafe"),
            ]
        )
        db.commit()


@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        seed_defaults(db)
    finally:
        db.close()


@app.get("/health")
@app.get("/api/health")
def health_check():
    return {"status": "online", "server": "oracle-amd-1gb"}


@app.post("/api/auth/register")
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already exists")
    if db.query(models.User).filter(models.User.email_address == payload.email_address).first():
        raise HTTPException(status_code=400, detail="Email already exists")

    user = models.User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        full_name=payload.full_name,
        contact_number=payload.contact_number,
        email_address=payload.email_address,
        role="buyer",
        image=None,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    get_or_create_user_cart(user.user_id, db)
    return create_auth_payload(user)


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username/password")
    get_or_create_user_cart(user.user_id, db)
    return create_auth_payload(user)


@app.post("/api/auth/refresh")
def refresh(payload: RefreshRequest, db: Session = Depends(get_db)):
    credentials_error = HTTPException(status_code=401, detail="Invalid refresh token")
    try:
        decoded = jwt.decode(payload.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if decoded.get("type") != "refresh":
            raise credentials_error
        subject = decoded.get("sub")
        if not subject:
            raise credentials_error
    except JWTError:
        raise credentials_error

    user = db.query(models.User).filter(models.User.user_id == int(subject)).first()
    if not user:
        raise credentials_error

    return create_auth_payload(user)


@app.post("/api/logout")
def logout(_user: models.User = Depends(get_current_user)):
    return {"message": "Logged out"}


@app.get("/api/auth/me")
def me(current_user: models.User = Depends(get_current_user)):
    return {"user": serialize_user(current_user)}


@app.get("/api/categories")
def get_categories(db: Session = Depends(get_db)):
    categories = db.query(models.Category).order_by(models.Category.category_name.asc()).all()
    return [
        {
            "category_id": category.category_id,
            "category_name": category.category_name,
            "icon_name": category.icon_name,
        }
        for category in categories
    ]


@app.post("/api/admin/categories")
def create_category(
    payload: CategoryCreateRequest,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
    _allowed_user: models.User = Depends(require_non_demo_user),
):
    existing = (
        db.query(models.Category)
        .filter(models.Category.category_name.ilike(payload.category_name.strip()))
        .first()
    )
    if existing:
        return {
            "category_id": existing.category_id,
            "category_name": existing.category_name,
            "icon_name": existing.icon_name,
        }

    category = models.Category(
        category_name=payload.category_name.strip(),
        icon_name=payload.icon_name,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return {
        "category_id": category.category_id,
        "category_name": category.category_name,
        "icon_name": category.icon_name,
    }


@app.get("/api/products")
def list_products(
    db: Session = Depends(get_db),
    category_id: Optional[int] = Query(default=None),
    seller_id: Optional[int] = Query(default=None),
):
    query = db.query(models.Product).filter(models.Product.deleted_at.is_(None))
    if category_id is not None:
        query = query.filter(models.Product.category_id == category_id)

    products = query.order_by(models.Product.created_at.desc()).all()
    # seller_id is accepted for compatibility but ignored in single-store mode.
    _ = seller_id
    return [serialize_product(product) for product in products]


@app.get("/api/products/{product_id}")
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(models.Product).filter(
        models.Product.product_id == product_id,
        models.Product.deleted_at.is_(None),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return serialize_product(product)


@app.post("/api/admin/uploads/product-image")
async def upload_product_image(
    file: UploadFile = File(...),
    _admin: models.User = Depends(require_admin),
    _allowed_user: models.User = Depends(require_non_demo_user),
):
    if not CLOUDINARY_URL:
        raise HTTPException(status_code=500, detail="Cloudinary is not configured")

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are allowed")

    try:
        result = cloudinary.uploader.upload(file.file, folder="food-ecommerce/products")
        image_url = result.get("secure_url")
        if not image_url:
            raise HTTPException(status_code=502, detail="Cloudinary did not return an image URL")

        return {
            "image_url": image_url,
            "public_id": result.get("public_id"),
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=502, detail="Image upload failed")
    finally:
        await file.close()


@app.post("/api/admin/products")
def create_product(
    payload: AdminProductCreateRequest,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
    _allowed_user: models.User = Depends(require_non_demo_user),
):
    category = db.query(models.Category).filter(models.Category.category_id == payload.category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    product = models.Product(
        category_id=payload.category_id,
        product_name=payload.product_name.strip(),
        product_desc=payload.product_desc.strip(),
        product_img=payload.product_img,
        price=payload.price,
        avail_stocks=payload.avail_stocks,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return serialize_product(product)


@app.put("/api/admin/products/{product_id}")
def update_product(
    product_id: int,
    payload: AdminProductUpdateRequest,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
    _allowed_user: models.User = Depends(require_non_demo_user),
):
    product = db.query(models.Product).filter(
        models.Product.product_id == product_id,
        models.Product.deleted_at.is_(None),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if payload.category_id is not None:
        category = db.query(models.Category).filter(models.Category.category_id == payload.category_id).first()
        if not category:
            raise HTTPException(status_code=404, detail="Category not found")
        product.category_id = payload.category_id
    if payload.product_name is not None:
        product.product_name = payload.product_name.strip()
    if payload.product_desc is not None:
        product.product_desc = payload.product_desc.strip()
    if payload.price is not None:
        product.price = payload.price
    if payload.product_img is not None:
        product.product_img = payload.product_img

    db.commit()
    db.refresh(product)
    return serialize_product(product)


@app.put("/api/admin/products/{product_id}/stock")
def update_product_stock(
    product_id: int,
    payload: AdminStockUpdateRequest,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
    _allowed_user: models.User = Depends(require_non_demo_user),
):
    product = db.query(models.Product).filter(
        models.Product.product_id == product_id,
        models.Product.deleted_at.is_(None),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.avail_stocks = payload.avail_stocks
    db.commit()
    db.refresh(product)
    return serialize_product(product)


@app.delete("/api/admin/products/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    _admin: models.User = Depends(require_admin),
    _allowed_user: models.User = Depends(require_non_demo_user),
):
    product = db.query(models.Product).filter(
        models.Product.product_id == product_id,
        models.Product.deleted_at.is_(None),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.deleted_at = datetime.now(timezone.utc)
    db.commit()
    return {"message": "Product deleted"}


@app.get("/api/cart")
def get_cart(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    cart = get_or_create_user_cart(current_user.user_id, db)
    return serialize_cart(cart, db)


@app.post("/api/cart/items")
def add_cart_item(
    payload: CartItemUpsertRequest,
    current_user: models.User = Depends(get_current_user),
    _allowed_user: models.User = Depends(require_non_demo_user),
    db: Session = Depends(get_db),
):
    product = db.query(models.Product).filter(
        models.Product.product_id == payload.product_id,
        models.Product.deleted_at.is_(None),
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.avail_stocks < payload.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    cart = get_or_create_user_cart(current_user.user_id, db)
    existing = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.cart_id,
        models.CartItem.product_id == payload.product_id,
    ).first()

    if existing:
        new_qty = existing.quantity + payload.quantity
        if new_qty > product.avail_stocks:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        existing.quantity = new_qty
    else:
        db.add(
            models.CartItem(
                cart_id=cart.cart_id,
                product_id=payload.product_id,
                quantity=payload.quantity,
            )
        )
    db.commit()
    return serialize_cart(cart, db)


@app.put("/api/cart/items/{product_id}")
def update_cart_item(
    product_id: int,
    payload: CartItemQuantityRequest,
    current_user: models.User = Depends(get_current_user),
    _allowed_user: models.User = Depends(require_non_demo_user),
    db: Session = Depends(get_db),
):
    cart = get_or_create_user_cart(current_user.user_id, db)
    item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.cart_id,
        models.CartItem.product_id == product_id,
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if payload.quantity <= 0:
        db.delete(item)
    else:
        product = db.query(models.Product).filter(
            models.Product.product_id == product_id,
            models.Product.deleted_at.is_(None),
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        if payload.quantity > product.avail_stocks:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        item.quantity = payload.quantity

    db.commit()
    return serialize_cart(cart, db)


@app.delete("/api/cart/items/{product_id}")
def remove_cart_item(
    product_id: int,
    current_user: models.User = Depends(get_current_user),
    _allowed_user: models.User = Depends(require_non_demo_user),
    db: Session = Depends(get_db),
):
    cart = get_or_create_user_cart(current_user.user_id, db)
    item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.cart_id,
        models.CartItem.product_id == product_id,
    ).first()
    if item:
        db.delete(item)
        db.commit()
    return serialize_cart(cart, db)


@app.delete("/api/cart")
def clear_cart(
    current_user: models.User = Depends(get_current_user),
    _allowed_user: models.User = Depends(require_non_demo_user),
    db: Session = Depends(get_db),
):
    cart = get_or_create_user_cart(current_user.user_id, db)
    db.query(models.CartItem).filter(models.CartItem.cart_id == cart.cart_id).delete()
    db.commit()
    return {"message": "Cart cleared"}


@app.post("/api/orders")
def create_order(
    payload: CreateOrderRequest,
    current_user: models.User = Depends(get_current_user),
    _allowed_user: models.User = Depends(require_non_demo_user),
    db: Session = Depends(get_db),
):
    items_to_purchase = []
    cart = get_or_create_user_cart(current_user.user_id, db)

    if payload.items:
        for item in payload.items:
            items_to_purchase.append({"product_id": item.product_id, "quantity": item.quantity})
    else:
        cart_items = db.query(models.CartItem).filter(models.CartItem.cart_id == cart.cart_id).all()
        for item in cart_items:
            items_to_purchase.append({"product_id": item.product_id, "quantity": item.quantity})

    if not items_to_purchase:
        raise HTTPException(status_code=400, detail="No items to checkout")

    total = 0.0
    product_rows = []
    for item in items_to_purchase:
        product = db.query(models.Product).filter(
            models.Product.product_id == item["product_id"],
            models.Product.deleted_at.is_(None),
        ).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item['product_id']} not found")
        if product.avail_stocks < item["quantity"]:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.product_name}")
        product_rows.append((product, item["quantity"]))
        total += product.price * item["quantity"]

    order = models.Order(buyer_id=current_user.user_id, status="pending", total_price=total)
    db.add(order)
    db.flush()

    for product, quantity in product_rows:
        db.add(
            models.OrderItem(
                order_id=order.order_id,
                product_id=product.product_id,
                quantity=quantity,
                price_each=product.price,
            )
        )
        product.avail_stocks -= quantity

    db.query(models.CartItem).filter(models.CartItem.cart_id == cart.cart_id).delete()
    db.commit()
    db.refresh(order)

    return {
        "order_id": order.order_id,
        "buyer_id": order.buyer_id,
        "status": order.status,
        "total_price": order.total_price,
        "ordered_at": order.ordered_at,
    }


@app.get("/api/orders")
def list_my_orders(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Order)
    if current_user.role != "admin":
        query = query.filter(models.Order.buyer_id == current_user.user_id)

    orders = query.order_by(models.Order.ordered_at.desc()).all()
    output = []
    for order in orders:
        order_items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.order_id).all()
        formatted_items = []
        for item in order_items:
            product = db.query(models.Product).filter(models.Product.product_id == item.product_id).first()
            formatted_items.append(
                {
                    "product_id": item.product_id,
                    "product_name": product.product_name if product else "Unknown Product",
                    "product_img": product.product_img if product else None,
                    "quantity": item.quantity,
                    "price_each": item.price_each,
                }
            )

        output.append(
            {
                "order_id": order.order_id,
                "buyer_id": order.buyer_id,
                "status": order.status,
                "total_price": order.total_price,
                "ordered_at": order.ordered_at,
                "shops": [
                    {
                        "seller_id": 1,
                        "seller_name": "Admin Store",
                        "status": order.status,
                        "items": formatted_items,
                    }
                ],
            }
        )
    return output


@app.get("/api/admin/orders")
def list_admin_orders(_admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    orders = db.query(models.Order).order_by(models.Order.ordered_at.desc()).all()
    response = []
    for order in orders:
        buyer = db.query(models.User).filter(models.User.user_id == order.buyer_id).first()
        order_items = db.query(models.OrderItem).filter(models.OrderItem.order_id == order.order_id).all()
        items = []
        for order_item in order_items:
            product = db.query(models.Product).filter(models.Product.product_id == order_item.product_id).first()
            items.append(
                {
                    "product_id": order_item.product_id,
                    "product_name": product.product_name if product else "Unknown Product",
                    "product_img": product.product_img if product else None,
                    "quantity": order_item.quantity,
                    "price_each": order_item.price_each,
                }
            )

        response.append(
            {
                "order_id": order.order_id,
                "ordered_at": order.ordered_at,
                "status": order.status,
                "customer_name": buyer.full_name if buyer else "Unknown Customer",
                "isManager": True,
                "items": items,
            }
        )
    return response


@app.patch("/api/admin/orders/{order_id}/status")
def update_admin_order_status(
    order_id: int,
    payload: AdminOrderStatusRequest,
    _admin: models.User = Depends(require_admin),
    _allowed_user: models.User = Depends(require_non_demo_user),
    db: Session = Depends(get_db),
):
    valid = {"pending", "delivered", "completed"}
    if payload.status not in valid:
        raise HTTPException(status_code=400, detail="Invalid status")

    order = db.query(models.Order).filter(models.Order.order_id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order.status = payload.status
    db.commit()
    db.refresh(order)
    return {
        "order_id": order.order_id,
        "status": order.status,
    }


@app.get("/api/admin/analytics")
def get_admin_analytics(_admin: models.User = Depends(require_admin), db: Session = Depends(get_db)):
    orders = db.query(models.Order).order_by(models.Order.ordered_at.desc()).all()
    order_items = db.query(models.OrderItem).all()
    products = db.query(models.Product).all()
    categories = db.query(models.Category).all()
    users = db.query(models.User).all()

    products_by_id = {product.product_id: product for product in products}
    categories_by_id = {category.category_id: category for category in categories}
    users_by_id = {user.user_id: user for user in users}

    items_by_order_id = defaultdict(list)
    for item in order_items:
        items_by_order_id[item.order_id].append(item)

    product_totals = defaultdict(int)
    category_revenue = defaultdict(float)
    customer_totals = defaultdict(float)
    combo_counts = defaultdict(int)
    recent_orders = []

    for order in orders:
        customer_totals[order.buyer_id] += float(order.total_price or 0)

        items = items_by_order_id.get(order.order_id, [])
        unique_product_ids = sorted({item.product_id for item in items})
        for product_a, product_b in combinations(unique_product_ids, 2):
            combo_counts[(product_a, product_b)] += 1

        for item in items:
            quantity = int(item.quantity or 0)
            product_totals[item.product_id] += quantity

            product = products_by_id.get(item.product_id)
            if product and product.category_id in categories_by_id:
                revenue = float(item.price_each or 0) * quantity
                category_revenue[product.category_id] += revenue

            if len(recent_orders) < 25:
                buyer = users_by_id.get(order.buyer_id)
                recent_orders.append(
                    {
                        "order_id": order.order_id,
                        "buyer_id": order.buyer_id,
                        "full_name": buyer.full_name if buyer else "Unknown Customer",
                        "product_id": item.product_id,
                        "product_name": product.product_name if product else "Unknown Product",
                        "product_img": product.product_img if product else None,
                        "quantity": quantity,
                        "ordered_at": order.ordered_at,
                    }
                )

    top_products = []
    for product_id, total_sold in sorted(product_totals.items(), key=lambda row: row[1], reverse=True)[:4]:
        product = products_by_id.get(product_id)
        top_products.append(
            {
                "product_id": product_id,
                "product_name": product.product_name if product else "Unknown Product",
                "total_sold": total_sold,
            }
        )

    top_categories = []
    for category_id, total_revenue in sorted(category_revenue.items(), key=lambda row: row[1], reverse=True)[:4]:
        category = categories_by_id.get(category_id)
        top_categories.append(
            {
                "category_id": category_id,
                "category_name": category.category_name if category else "Unknown Category",
                "total_revenue": total_revenue,
            }
        )

    top_customers = []
    for user_id, total_spent in sorted(customer_totals.items(), key=lambda row: row[1], reverse=True)[:3]:
        user = users_by_id.get(user_id)
        top_customers.append(
            {
                "user_id": user_id,
                "full_name": user.full_name if user else "Unknown Customer",
                "total_spent": total_spent,
            }
        )

    combos = []
    for index, ((product_a_id, product_b_id), count) in enumerate(
        sorted(combo_counts.items(), key=lambda row: row[1], reverse=True)[:5],
        start=1,
    ):
        product_a = products_by_id.get(product_a_id)
        product_b = products_by_id.get(product_b_id)
        combos.append(
            {
                "combo_id": index,
                "product1_id": product_a_id,
                "product1_name": product_a.product_name if product_a else "Unknown Product",
                "product2_id": product_b_id,
                "product2_name": product_b.product_name if product_b else "Unknown Product",
                "count": count,
            }
        )

    return {
        "topProducts": top_products,
        "topCategories": top_categories,
        "topCustomers": top_customers,
        "combos": combos,
        "recentOrders": recent_orders,
    }