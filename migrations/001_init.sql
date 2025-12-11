CREATE TYPE booking_status AS ENUM ('PENDING','CONFIRMED','FAILED');

CREATE TABLE shows (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  total_seats INTEGER NOT NULL,
  seats_available INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE bookings (
  id BIGSERIAL PRIMARY KEY,
  show_id BIGINT REFERENCES shows(id),
  user_id TEXT,
  seats_requested INTEGER NOT NULL,
  status booking_status NOT NULL DEFAULT 'PENDING',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
