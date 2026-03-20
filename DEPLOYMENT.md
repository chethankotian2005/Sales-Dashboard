# Deployment Guide

## Environment Variables Setup

### Backend (.env)
Create a `.env` file in the `backend/` directory with the following variables:

```
DEBUG=False
SECRET_KEY=your-production-secret-key
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1,.vercel.app
CORS_ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain.vercel.app
```

### Frontend (.env)
Create a `.env` file in the `frontend/` directory:

```
VITE_API_URL=https://your-backend-domain.vercel.app/api
```

## Vercel Deployment

### Frontend Deployment
1. Connect your GitHub repository to Vercel
2. Set the root directory to `frontend`
3. Framework preset: Vite
4. Set environment variables in Vercel dashboard
5. Deploy

### Backend Deployment
1. Create a new Vercel project for the backend
2. Set the root directory to `backend`
3. Framework preset: Python
4. Set environment variables in Vercel dashboard
5. Deploy

### Monorepo Deployment (Alternative)
You can also deploy both frontend and backend from the root using the provided `vercel.json` configuration.

## Environment Variables on Vercel

Make sure to set these environment variables in your Vercel dashboard:

### Frontend Project
- `VITE_API_URL`: URL of your deployed backend

### Backend Project
- `DEBUG`: False
- `SECRET_KEY`: Your secure Django secret key
- `ALLOWED_HOSTS`: Include your Vercel domain
- `CORS_ALLOWED_ORIGINS`: Include your frontend domain

## Database

The application is configured to use SQLite for development. For production, you may want to configure PostgreSQL using the `DATABASE_URL` environment variable.

## Demo Credentials

After deployment and database seeding:
- Username: demo
- Password: demo123

Or:
- Username: admin
- Password: admin123