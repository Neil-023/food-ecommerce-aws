import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Category, Product, User, Order, OrderItem

# Load environment variables
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"))

DATABASE_URL = os.getenv("DATABASE_URL")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

def seed_database():
    print("--- 1. Syncing Categories ---")
    category_list = [
        {"name": "Pizza", "icon": "local_pizza"},
        {"name": "Beverage", "icon": "local_cafe"},
        {"name": "Salad", "icon": "fork_spoon"},
        {"name": "Pasta", "icon": "dinner_dining"},
        {"name": "Dessert", "icon": "icecream"},
    ]
    
    cat_map = {}
    for cat in category_list:
        existing = db.query(Category).filter(Category.category_name == cat["name"]).first()
        if not existing:
            new_cat = Category(category_name=cat["name"], icon_name=cat["icon"])
            db.add(new_cat)
            db.commit()
            db.refresh(new_cat)
            cat_map[cat["name"]] = new_cat.category_id
        else:
            cat_map[cat["name"]] = existing.category_id

    print("--- 2. Syncing Products ---")
    products_data = [
        # BEVERAGES
        {"name": "Caramel Coffee", "cat": "Beverage", "price": 85.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773992810/food-ecommerce/products/wvxlnarktyndwt66fjtg.png", "desc": "Smooth espresso and steamed milk swirled with buttery caramel for a sweet, toasted finish"},
        {"name": "Lemon Tea", "cat": "Beverage", "price": 85.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773992750/food-ecommerce/products/hqzdymvhxdwtq4shkczm.png", "desc": "A bright, soothing blend of premium black tea infused with fresh citrus and a hint of honey"},
        {"name": "Hot Choco", "cat": "Beverage", "price": 85.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773992698/food-ecommerce/products/ojfxll8ajl4sufovhrli.png", "desc": "Decadent melted cocoa and steamed milk, topped with a dusting of dark chocolate."},
        {"name": "Hot Cappuccino", "cat": "Beverage", "price": 85.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773992651/food-ecommerce/products/avjz94x6zm7vzn0pvsiy.png", "desc": "Velvety steamed milk over rich espresso, finished with a deep layer of silky foam."},
        
        # DESSERTS
        {"name": "Ice Cream", "cat": "Dessert", "price": 100.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773994133/food-ecommerce/products/iq9bptoiflzxilkvi5bc.png", "desc": "Two scoops of our premium, slow-churned vanilla bean or chocolate silk"},
        {"name": "Tiramisu Cake", "cat": "Dessert", "price": 100.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773994098/food-ecommerce/products/vssux1wgmqkilqv2xz3t.png", "desc": "Espresso-soaked sponge layers with airy mascarpone cream and a heavy dusting of cocoa"},
        {"name": "Blueberry Pie", "cat": "Dessert", "price": 100.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773994070/food-ecommerce/products/wyscvjwelahjmfsf081t.png", "desc": "Tart wild blackberries in a flaky, buttery crust, baked until bubbling and sweet"},
        {"name": "Belgian Waffle", "cat": "Dessert", "price": 100.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773994045/food-ecommerce/products/ubtmb8kwsd0pfvia2fsq.png", "desc": "Thick, golden, and crisp. Served with a dusting of powdered sugar and maple syrup"},
        
        # PASTA
        {"name": "Pasta Carbonara", "cat": "Pasta", "price": 120.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1774002228/food-ecommerce/products/pv2opyn8x25iq2bvo6f5.png", "desc": "Al dente pasta tossed in a creamy egg sauce with crispy pancetta and cracked black pepper"},
        {"name": "Tuna Pasta", "cat": "Pasta", "price": 120.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1774002087/food-ecommerce/products/jsggvizakofdts1pg8zs.png", "desc": "A Mediterranean delight with flaked tuna, capers, and garlic in a light olive oil sauce"},
        {"name": "Trenette Pesto", "cat": "Pasta", "price": 140.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773992907/food-ecommerce/products/xmft0eqmrwtyow0lunnn.png", "desc": "Flat, narrow ribbons of pasta coated in vibrant basil pesto, pine nuts, and Parmesan"},
        {"name": "Spaghetti Twist", "cat": "Pasta", "price": 120.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773992868/food-ecommerce/products/cltoxcaqykxn8ahn2pkj.png", "desc": "Classic long-strand pasta served with our slow-simmered, herb-infused marinara sauce"},
        
        # PIZZA
        {"name": "Classic Pizza", "cat": "Pizza", "price": 175.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773992548/food-ecommerce/products/cn8qbrn9mzw8gbqb6zyp.png", "desc": "Our signature cheese blend on a traditional tomato base. Simple, timeless, and perfectly baked"},
        {"name": "Sausage Pizza", "cat": "Pizza", "price": 175.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773992516/food-ecommerce/products/qlirzrxjqv16kiokbx8k.png", "desc": "Savory comfort. Herb-seasoned Italian sausage crumbles, roasted garlic, and stretchy mozzarella."},
        {"name": "Pepperoni Pizza", "cat": "Pizza", "price": 200.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773992460/food-ecommerce/products/uwuc8xqk2z6w7asib2jg.png", "desc": "A fan favorite. Loaded with premium zesty pepperoni and melted mozzarella over house red sauce"},
        {"name": "Margherita Pizza", "cat": "Pizza", "price": 175.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773992409/food-ecommerce/products/wnchisowzn2srecbmmik.png", "desc": "The Italian icon. San Marzano tomato sauce, fresh mozzarella, basil, and a drizzle of EVOO"},
        {"name": "Neapolitan Pizza", "cat": "Pizza", "price": 105.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773989996/food-ecommerce/products/otuuqr3ifvfqmwomwqii.png", "desc": "The authentic taste of Naples, fired at 900 degrees"},
        
        # SALAD
        {"name": "Vegetable Salad", "cat": "Salad", "price": 160.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773993570/food-ecommerce/products/zlyiwl1t4wlony2b4ay8.png", "desc": "A seasonal rainbow of crunchy garden veggies and leaf lettuce served with a balsamic herb dressing"},
        {"name": "Tuna Salad", "cat": "Salad", "price": 199.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773993540/food-ecommerce/products/kefedjlsop6eohuqdcjw.png", "desc": "Flaked line-caught tuna, cherry tomatoes, and cucumber on a bed of garden greens with lemon oil"},
        {"name": "Tofu Salad", "cat": "Salad", "price": 199.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773993448/food-ecommerce/products/sf5jq9pl9huukapff3bv.png", "desc": "Chilled organic tofu cubes over mixed greens with shredded carrots and a ginger-soy vinaigrette"},
        {"name": "Caesar Salad", "cat": "Salad", "price": 180.0, "img": "https://res.cloudinary.com/du7mvcm09/image/upload/v1773993380/food-ecommerce/products/c3owhoscsl4qhbohfrxk.png", "desc": "Crisp romaine hearts tossed in creamy dressing with garlic croutons and shaved Parmesan"}
    ]

    for item in products_data:
        real_cat_id = cat_map[item["cat"]]
        existing = db.query(Product).filter(Product.product_name == item["name"]).first()
        if existing:
            existing.product_desc = item["desc"]
            existing.product_img = item["img"]
            existing.price = item["price"]
            existing.category_id = real_cat_id
            existing.avail_stocks = 999
        else:
            new_product = Product(
                category_id=real_cat_id,
                product_name=item["name"],
                product_desc=item["desc"],
                product_img=item["img"],
                price=item["price"],
                avail_stocks=999
            )
            db.add(new_product)
    db.commit()

    print("--- 3. Syncing Customers & Orders ---")
    customers = [
        {"user": "gusion_test", "email": "gusion@mock.com", "name": "Gusion Dela Cruz"},
        {"user": "layla_test", "email": "layla@mock.com", "name": "Layla Santos"},
        {"user": "claude_test", "email": "claude@mock.com", "name": "Claude Ramirez"}
    ]
    
    user_map = {}
    for c in customers:
        existing_user = db.query(User).filter(User.email_address == c["email"]).first()
        if not existing_user:
            new_user = User(
                username=c["user"], email_address=c["email"], 
                full_name=c["name"], password_hash="dummy_hash", role="buyer"
            )
            db.add(new_user)
            db.commit()
            db.refresh(new_user)
            user_map[c["name"]] = new_user.user_id
        else:
            user_map[c["name"]] = existing_user.user_id

    # Fetch real Products to attach to orders
    pepperoni = db.query(Product).filter(Product.product_name == "Pepperoni Pizza").first()
    tiramisu = db.query(Product).filter(Product.product_name == "Tiramisu Cake").first()
    hot_choco = db.query(Product).filter(Product.product_name == "Hot Choco").first()
    tofu_salad = db.query(Product).filter(Product.product_name == "Tofu Salad").first()

    if all([pepperoni, tiramisu, hot_choco, tofu_salad]):
        # Order 1: Gusion bought Pizza and Cake
        if not db.query(Order).filter(Order.buyer_id == user_map["Gusion Dela Cruz"]).first():
            order1 = Order(buyer_id=user_map["Gusion Dela Cruz"], status="completed", total_price=(pepperoni.price * 2) + tiramisu.price)
            db.add(order1)
            db.commit()
            db.refresh(order1)
            db.add_all([
                OrderItem(order_id=order1.order_id, product_id=pepperoni.product_id, quantity=2, price_each=pepperoni.price),
                OrderItem(order_id=order1.order_id, product_id=tiramisu.product_id, quantity=1, price_each=tiramisu.price)
            ])

        # Order 2: Layla bought Hot Choco
        if not db.query(Order).filter(Order.buyer_id == user_map["Layla Santos"]).first():
            order2 = Order(buyer_id=user_map["Layla Santos"], status="completed", total_price=(hot_choco.price * 3))
            db.add(order2)
            db.commit()
            db.refresh(order2)
            db.add(OrderItem(order_id=order2.order_id, product_id=hot_choco.product_id, quantity=3, price_each=hot_choco.price))

        # Order 3: Claude bought a Salad
        if not db.query(Order).filter(Order.buyer_id == user_map["Claude Ramirez"]).first():
            order3 = Order(buyer_id=user_map["Claude Ramirez"], status="completed", total_price=tofu_salad.price)
            db.add(order3)
            db.commit()
            db.refresh(order3)
            db.add(OrderItem(order_id=order3.order_id, product_id=tofu_salad.product_id, quantity=1, price_each=tofu_salad.price))
            
        db.commit()
        print("✅ Full Database successfully seeded!")
    else:
        print("⚠️ Could not seed orders because some products were missing.")

if __name__ == "__main__":
    seed_database()