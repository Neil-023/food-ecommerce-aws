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

Run the production stack (frontend on 3001, backend on 8000):

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Production endpoints:

- Frontend (Nginx): http://localhost:3001
- Backend (FastAPI): http://localhost:8000/docs

Stop production stack:

```bash
docker compose -f docker-compose.prod.yml down
```
