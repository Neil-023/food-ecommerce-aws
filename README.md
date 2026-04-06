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

This project now uses split hosting:

- Frontend: GitHub Pages
- Backend API + database: production server via Docker Compose

1. Configure backend env in GitHub secret `FOOD_ECOM_DOTENV`.

Required note:

- `CORS_ALLOW_ORIGINS` must include both your server domain and your GitHub Pages origin (for example `https://foodhub.mooo.com,https://your-username.github.io`).

2. Run the production stack (API and database):

```bash
docker compose -f docker-compose.prod.yml up -d
```

3. Production endpoints:

- API reverse proxy (Nginx): http://localhost:3001/api
- Backend container (FastAPI): http://localhost:8000/docs
- Frontend app: GitHub Pages URL

4. Stop production stack:

```bash
docker compose -f docker-compose.prod.yml down
```

## Frontend Deployment To GitHub Pages

Build and deploy the frontend from `frontend/`:

1. Install dependencies:

```bash
cd frontend
npm install
```

2. Build for GitHub Pages with your API server origin:

```bash
# PowerShell example (replace values)
$env:VITE_API_URL="https://foodhub.mooo.com"
$env:VITE_BASE_PATH="/food-ecommerce/"
npm run build
```

Notes:

- `VITE_API_URL` should be your public backend domain without trailing slash.
- `VITE_BASE_PATH` is `/` if you deploy to `username.github.io`, or `/<repo-name>/` for project pages.
- Hash router is auto-enabled when `VITE_BASE_PATH` is not `/`, preventing refresh 404s on GitHub Pages.

3. Publish:

```bash
npm run deploy
```

After deployment, keep backend and database running only on the server using `docker-compose.prod.yml`.
