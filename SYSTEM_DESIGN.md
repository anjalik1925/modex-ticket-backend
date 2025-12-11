1. High-Level Architecture
          ┌─────────────────────────────┐
          │          Client / UI        │
          └──────────────┬──────────────┘
                         │ HTTP
                         ▼
          ┌─────────────────────────────┐
          │     Node.js API Server      │
          │     (Express + pg)          │
          └──────────────┬──────────────┘
                         │ SQL Queries
                         ▼
          ┌─────────────────────────────┐
          │        PostgreSQL DB        │
          │ (Row-level locks + ACID TX) │
          └─────────────────────────────┘
                         │
                         │ Periodic Scan
                         ▼
          ┌─────────────────────────────┐
          │ Background Worker (Expiry)  │
          │ Marks old PENDING as FAILED │
          └─────────────────────────────┘


Key idea:
The API handles live bookings.
The background worker maintains system consistency.

📌 2. Database Schema
2.1 Shows Table
shows (
  id SERIAL PRIMARY KEY,
  name TEXT,
  start_time TIMESTAMP,
  total_seats INT,
  seats_available INT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

2.2 Bookings Table
bookings (
  id SERIAL PRIMARY KEY,
  show_id INT REFERENCES shows(id),
  user_id TEXT,
  seats_requested INT,
  status booking_status_enum,   -- PENDING / CONFIRMED / FAILED
  expires_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)

Why this schema works

seats_available is always updated using atomic updates inside transactions.

The status field allows the system to monitor pending and expired bookings.

📌 3. Concurrency Control Strategy

Preventing overbooking is the core requirement.

✔ Use PostgreSQL Row-Level Locking

Inside a transaction:

SELECT seats_available
FROM shows
WHERE id = $1
FOR UPDATE;


This ensures:

Only one transaction can modify a show’s seat count at a time.

Other booking attempts wait until the lock is released.

Prevents race conditions like:

Two users booking the last seat at the same time.

Negative seat counts.

Double-booking.

✔ Atomic Seat Update
UPDATE shows
SET seats_available = seats_available - $requested
WHERE id = $id;


If seats_available < requested, the transaction aborts → no booking.

📌 4. Background Worker — Booking Expiry

A timer job runs every 30 seconds:

▶ Purpose

Auto-cancel bookings stuck in PENDING for > 2 minutes.

Release held seats back to inventory.

▶ Worker Logic
SELECT * FROM bookings
WHERE status='PENDING' AND expires_at <= NOW();


Then:

Update booking → FAILED

Add seats back to show using FOR UPDATE to avoid conflicts

This ensures stale bookings never block real users.

📌 5. Scaling Strategy (Production-Level)
5.1 Horizontal Scaling — API Layer

Use multiple Node.js instances behind a load balancer:

Nginx / AWS ALB / Kubernetes Ingress


Because bookings rely on DB locks, no shared in-memory state is needed → API is easily scalable.

5.2 PostgreSQL Scaling
✔ Vertical Scaling (initial phase)

More CPU

More memory

Faster disk

✔ Read Replicas

API reads go to replica

Writes + bookings always go to master

✔ Partitioning / Sharding (advanced)

Shard by:

show_id

event_date

region

Improves performance when data size becomes very large.

5.3 Caching Layer (Redis)

Cache frequently accessed reads:

Show details

Seat availability

Popular events

Caching Strategy:

Write-through or write-around

Cache invalidation after booking

5.4 Queue-Based Booking (Future Optimization)

For extremely high concurrency (e.g., big concerts):

Add Kafka / RabbitMQ to queue booking requests

Worker processes one request at a time per show

Guaranteed ordering → zero race conditions

This becomes similar to BookMyShow’s queue system.

📌 6. Fault Tolerance & Reliability
✔ Graceful Failures

If booking fails (not enough seats OR lock timeout):

Return { status: "FAILED", reason: "Not enough seats" }

✔ Retry Logic

Client can retry safely because operations are idempotent.

✔ Containerization

Using Docker ensures:

Identical environments for dev/prod

Easy deployment with Docker Compose or Kubernetes

📌 7. Security Considerations

Use environment variables for DB credentials

Restrict admin APIs (JWT/Auth recommended)

Input validation (prevent SQL injection)

Rate limiting for public endpoints

📌 8. Observability & Monitoring

Use:

Winston / Pino for logs

Prometheus for metrics

Grafana dashboards

pg_stat_activity to monitor lock contention