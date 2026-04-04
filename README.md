# Food E-Commerce Docker Guide

This project now supports separate local and production Docker workflows.

## Local/Current Stack

Run the existing local stack:

```bash
docker compose up --build
```

Default local entrypoint:

- App (Nginx): http://localhost

Stop local stack:

```bash
docker compose down
```

## Production Stack

1. Build frontend assets locally or in CI (not on the server):

```bash
cd frontend
npm ci
npm run build
```

2. Build and publish the runtime-only frontend image:

```bash
docker build -f frontend/Dockerfile.prod -t food-ecommerce-frontend:prod frontend
```

3. Run the production stack (frontend on 3001, backend on 8000):

```bash
docker compose -f docker-compose.prod.yml up -d
```

If your server should pull a registry image, set FOOD_ECOM_FRONTEND_IMAGE first:

```bash
export FOOD_ECOM_FRONTEND_IMAGE=ghcr.io/your-org/food-ecommerce-frontend:prod
docker compose -f docker-compose.prod.yml up -d
```

4. Production endpoints:

- Frontend (Nginx): http://localhost:3001
- Backend (FastAPI): http://localhost:8000/docs

5. Stop production stack:

```bash
docker compose -f docker-compose.prod.yml down
```
