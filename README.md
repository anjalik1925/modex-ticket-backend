# Modex Ticket Booking Backend  
Node.js · Express · PostgreSQL · Transactions · Concurrency Safe

## 📌 Overview
This project is a high-concurrency ticket booking backend system inspired by RedBus / BookMyShow.  
It ensures **no overbooking** using PostgreSQL row-level locks and atomic transactions.

## 🚀 Features
- Admin can create Shows/Trips.
- Users can:
  - View shows
  - Book seats (with concurrency-safe transactions)
- Booking statuses:
  - **PENDING**, **CONFIRMED**, **FAILED**
- Booking auto-expiry (2-min timeout worker)
- PostgreSQL row-level locking (FOR UPDATE) prevents race conditions.

## ⚙️ Setup Instructions
1. Install dependencies:
\\\
npm install
\\\

2. Setup PostgreSQL:
\\\
createdb -U postgres modex
psql -U postgres -d modex -f migrations/001_init.sql
\\\

3. Create .env with:
\\\
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@localhost:5432/modex
PORT=3000
EXPIRE_WORKER=true
\\\

4. Start server:
\\\
npm run dev
\\\

## API Endpoints
- POST /api/admin/shows
- GET /api/shows
- POST /api/shows/:id/book

