-- Add driver_id to bookings for per-booking driver assignment
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES users(id);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_bookings_driver_id ON bookings(driver_id);

-- Create driver_locations table for real-time GPS tracking
-- UPSERT: one row per driver, updated on each ping
CREATE TABLE IF NOT EXISTS driver_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(driver_id)
);

-- Create driver_location_history for trail tracking
CREATE TABLE IF NOT EXISTS driver_location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NOT NULL REFERENCES users(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  booking_id UUID REFERENCES bookings(id),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for fast history lookups
CREATE INDEX IF NOT EXISTS idx_driver_location_history_driver_id ON driver_location_history(driver_id, recorded_at DESC);
