import { createClient, SupabaseClient } from '@supabase/supabase-js';

let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
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
  jitter_ms: number;
  packet_loss: number;
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