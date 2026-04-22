import { Pool } from 'pg';

let _pool: Pool | null = null;

type ErrorWithDetails = Error & {
  cause?: unknown;
  code?: string;
  errors?: unknown[];
};

const CONNECTION_ERROR_CODES = new Set([
  'EAI_AGAIN',
  'ECONNREFUSED',
  'ECONNRESET',
  'ENETUNREACH',
  'ENOTFOUND',
  'EHOSTUNREACH',
  'ETIMEDOUT',
]);

function collectErrorCandidates(error: unknown, visited = new Set<unknown>()): ErrorWithDetails[] {
  if (!error || visited.has(error)) {
    return [];
  }

  visited.add(error);

  if (!(error instanceof Error)) {
    return [];
  }

  const currentError = error as ErrorWithDetails;
  const nestedErrors = Array.isArray(currentError.errors)
    ? currentError.errors.flatMap((nestedError) => collectErrorCandidates(nestedError, visited))
    : [];

  return [currentError, ...collectErrorCandidates(currentError.cause, visited), ...nestedErrors];
}

export function getDatabaseErrorDetails(error: unknown): { message: string; status: number } {
  const candidates = collectErrorCandidates(error);
  const hasDnsResolutionIssue = candidates.some(
    (candidate) =>
      candidate.code === 'EAI_AGAIN' || candidate.message.toLowerCase().includes('getaddrinfo')
  );

  const isConnectionIssue = candidates.some((candidate) => {
    const message = candidate.message.toLowerCase();

    return (
      (candidate.code && CONNECTION_ERROR_CODES.has(candidate.code)) ||
      message.includes('timeout') ||
      message.includes('timed out') ||
      message.includes('connect')
    );
  });

  if (hasDnsResolutionIssue) {
    return {
      message:
        'Database host could not be resolved. Check DATABASE_URL and the server DNS/network configuration.',
      status: 503,
    };
  }

  if (isConnectionIssue) {
    return {
      message:
        'Database connection timed out. Check DATABASE_URL and that PostgreSQL is reachable.',
      status: 503,
    };
  }

  return {
    message: 'Database request failed.',
    status: 500,
  };
}

export function getPool(): Pool {
  if (!_pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('Missing DATABASE_URL environment variable');
    }

    const connectionTimeoutMs = Number(process.env.DB_CONNECTION_TIMEOUT_MS ?? '5000');

    _pool = new Pool({
      connectionString: databaseUrl,
      connectionTimeoutMillis: Number.isFinite(connectionTimeoutMs) ? connectionTimeoutMs : 5000,
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
  avg_download_mbps: number | null;
  avg_upload_mbps?: number | null;
  avg_latency_ms?: number | null;
  test_count?: number;
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
