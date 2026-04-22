import { Pool } from 'pg';

let _pool: Pool | null = null;

export function getPool(): Pool {
  if (!_pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('Missing DATABASE_URL environment variable');
    }
    _pool = new Pool({
      connectionString: databaseUrl,
    });
  }
  return _pool;
}

export interface Place {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  google_place_id: string | null;
  created_at: string;
}

export interface SpeedTest {
  id: string;
  place_id: string;
  download_mbps: number;
  upload_mbps: number;
  latency_ms: number;
  jitter_ms: number | null;
  packet_loss: number | null;
  created_at: string;
}

export interface SpeedTestWithPlace extends SpeedTest {
  places: Place;
}

export interface AggregatedSpeed {
  avg_download: number;
  avg_upload: number;
  avg_latency: number;
  test_count: number;
  min_download: number;
  max_download: number;
}

export interface NearbyPlace extends Place {
  distance_km: number;
  avg_download_mbps?: number;
}

export interface PlaceSpeedStats {
  avg_download: number;
  avg_upload: number;
  avg_latency: number;
  test_count: number;
  min_download: number;
  max_download: number;
  last_test: string;
}
