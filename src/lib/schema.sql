-- Casphé Database Schema
-- Run this against your PostgreSQL database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Places table
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
  client_ip INET,
  google_place_id TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Speedtests table
CREATE TABLE IF NOT EXISTS speedtests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id UUID NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  download_mbps FLOAT NOT NULL,
  upload_mbps FLOAT NOT NULL,
  latency_ms FLOAT NOT NULL,
  jitter_ms FLOAT,
  packet_loss FLOAT,
  aim_scores JSONB,
  client_ip INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_places_lat_lng ON places(lat, lng);
CREATE INDEX IF NOT EXISTS idx_speedtests_place_id ON speedtests(place_id);
CREATE INDEX IF NOT EXISTS idx_speedtests_created_at ON speedtests(created_at);

-- Migrations: add client_ip columns if missing (for existing databases)
ALTER TABLE places ADD COLUMN IF NOT EXISTS client_ip INET;
ALTER TABLE speedtests ADD COLUMN IF NOT EXISTS client_ip INET;
ALTER TABLE speedtests ADD COLUMN IF NOT EXISTS aim_scores JSONB;
