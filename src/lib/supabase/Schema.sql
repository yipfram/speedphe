-- Casphé Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Places table
CREATE TABLE IF NOT EXISTS places (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  lat FLOAT NOT NULL,
  lng FLOAT NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_places_lat_lng ON places(lat, lng);
CREATE INDEX IF NOT EXISTS idx_speedtests_place_id ON speedtests(place_id);
CREATE INDEX IF NOT EXISTS idx_speedtests_created_at ON speedtests(created_at);

-- Row Level Security (RLS)
ALTER TABLE places ENABLE ROW LEVEL SECURITY;
ALTER TABLE speedtests ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access to places" ON places FOR SELECT USING (true);
CREATE POLICY "Allow public read access to speedtests" ON speedtests FOR SELECT USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert to places" ON places FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated insert to speedtests" ON speedtests FOR INSERT WITH CHECK (true);

-- Allow anyone to insert (for MVP - no auth required)
CREATE POLICY "Allow anyone insert to places" ON places FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anyone insert to speedtests" ON speedtests FOR INSERT WITH CHECK (true);

-- Create function to get nearby places
CREATE OR REPLACE FUNCTION get_nearby_places(
  search_lat FLOAT,
  search_lng FLOAT,
  search_radius_km FLOAT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  address TEXT,
  lat FLOAT,
  lng FLOAT,
  google_place_id TEXT,
  distance_km FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.address,
    p.lat,
    p.lng,
    p.google_place_id,
    (6371 * acos(cos(radians(search_lat)) * cos(radians(p.lat)) *
      cos(radians(p.lng) - radians(search_lng)) +
      sin(radians(search_lat)) * sin(radians(p.lat))))::FLOAT AS distance_km
  FROM places p
  WHERE (6371 * acos(cos(radians(search_lat)) * cos(radians(p.lat)) *
      cos(radians(p.lng) - radians(search_lng)) +
      sin(radians(search_lat)) * sin(radians(p.lat)))) <= search_radius_km
  ORDER BY distance_km;
END;
$$;

-- Create function to aggregate speedtests for a place
CREATE OR REPLACE FUNCTION get_place_speed_stats(place_uuid UUID)
RETURNS TABLE (
  avg_download FLOAT,
  avg_upload FLOAT,
  avg_latency FLOAT,
  test_count BIGINT,
  min_download FLOAT,
  max_download FLOAT,
  last_test TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    AVG(s.download_mbps)::FLOAT,
    AVG(s.upload_mbps)::FLOAT,
    AVG(s.latency_ms)::FLOAT,
    COUNT(*)::BIGINT,
    MIN(s.download_mbps)::FLOAT,
    MAX(s.download_mbps)::FLOAT,
    MAX(s.created_at)
  FROM speedtests s
  WHERE s.place_id = place_uuid;
END;
$$;
