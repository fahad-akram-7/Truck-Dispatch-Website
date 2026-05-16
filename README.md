# Truck Dispatching Management System

Production-style MVP full-stack web application with:
- `frontend`: React + Vite multi-role website (public, admin, driver)
- `backend`: Express + Prisma + MySQL API

## Feature Set

- Public company website pages (`Home`, `Services`, `Contact`)
- Customer and driver registration/login
- Customer load request submission
- Load tracking by request ID + customer email
- Admin panel:
  - Driver management (create/list/delete)
  - Load request management
  - Quote generation
  - Driver assignment
  - Dispatch board with status controls
- Driver portal:
  - View only assigned dispatches
  - Update own dispatch statuses
- Role-based access control (`ADMIN`, `DRIVER`, `CUSTOMER`)
- Realtime dispatch status event emission via Socket.IO

## Folder Structure

```txt
backend/
  prisma/schema.prisma
  src/
    app.js
    server.js
    config/db.js
    middleware/
    routes/
    utils/
frontend/
  src/
    App.jsx
    api.js
    main.jsx
```

## Backend Setup

1. Install Node.js (LTS) and npm.
2. In `backend`, install dependencies:
   - `npm install`
3. Copy `.env.example` to `.env` and update values.
4. Run Prisma migration and client generation:
   - `npx prisma migrate dev --name init`
   - `npx prisma generate`
5. Start API:
   - `npm run dev`
6. Seed initial admin account:
   - `npm run seed:admin`

Backend base URL: `http://localhost:5000`

## Frontend Setup

1. In `frontend`, install dependencies:
   - `npm install`
2. Start frontend:
   - `npm run dev`

Frontend URL: `http://localhost:5173`

## Main API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/drivers` (admin)
- `POST /api/drivers` (admin)
- `POST /api/loads`
- `GET /api/loads` (admin)
- `GET /api/loads/track/:id?email=...` (customer tracking)
- `POST /api/quotes/generate/:loadId` (admin)
- `GET /api/quotes/:loadId`
- `GET /api/dispatch` (admin dispatch board)
- `POST /api/dispatch/assign` (admin)
- `GET /api/dispatch/my-assignments` (driver)
- `PUT /api/dispatch/:id/status` (admin/driver)
- `GET /api/dispatch/:id/timeline`

## Security Rules Implemented

- Public signup cannot create admin users.
- Driver status update is restricted to their own assigned dispatches only.
- Admin-only APIs are protected with JWT + role middleware.

## Deployment Notes

- Login flow stores token in `localStorage`.
- Frontend can deploy to Vercel/Netlify.
- Backend can deploy to Render/Railway.
- Use local/managed MySQL (or switch provider as needed).
- Realtime status messages are emitted over Socket.IO on status changes.
- Add refresh token rotation, unit/integration tests, and production logging before final release.

## Production Deployment Quick Guide

### 1) Frontend environment

Copy `frontend/.env.production.example` to `frontend/.env.production` and set:
- `VITE_API_URL=https://your-backend-domain.com/api`
- `VITE_SOCKET_URL=https://your-backend-domain.com`

### 2) Backend environment

Set backend environment variables on your host:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLIENT_ORIGIN` (comma-separated if needed)
  - Example: `http://localhost:5173,https://your-frontend-domain.vercel.app`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

### 3) First deploy commands (backend)

After backend is live, run once:
- `npx prisma db push`
- `npm run seed:admin`

### 4) Recommended hosting setup

- Frontend: Vercel (project root: `frontend`)
- Backend: Render/Railway (project root: `backend`)
- Database: Managed MySQL (Railway/PlanetScale/Aiven/etc.)
