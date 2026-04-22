import { NextRequest } from 'next/server';
import { getDatabaseErrorDetails, getPool } from '@/lib/db';
import { getClientIp } from '@/lib/getClientIp';
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiRequestContext,
  runLoggedQuery,
} from '@/lib/api-logging';

export async function GET(request: NextRequest) {
  const requestContext = createApiRequestContext(request, '/api/places');
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '5';

  if (!lat || !lng) {
    return apiJsonResponse(requestContext, { error: 'lat and lng are required' }, { status: 400 });
  }

  try {
    const pool = getPool();
    const result = await runLoggedQuery(
      pool,
      `SELECT
        p.id,
        p.name,
        p.address,
        p.lat,
        p.lng,
        p.google_place_id,
        p.created_at,
        stats.avg_download_mbps,
        stats.avg_upload_mbps,
        stats.avg_latency_ms,
        stats.test_count,
        (6371 * acos(cos(radians($1)) * cos(radians(lat)) *
          cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))))::FLOAT AS distance_km
      FROM places p
      LEFT JOIN (
        SELECT
          place_id,
          AVG(download_mbps)::FLOAT AS avg_download_mbps,
          AVG(upload_mbps)::FLOAT AS avg_upload_mbps,
          AVG(latency_ms)::FLOAT AS avg_latency_ms,
          COUNT(*)::INTEGER AS test_count
        FROM speedtests
        GROUP BY place_id
      ) stats ON stats.place_id = p.id
      WHERE (6371 * acos(cos(radians($1)) * cos(radians(lat)) *
          cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat)))) <= $3
      ORDER BY distance_km`,
      [parseFloat(lat), parseFloat(lng), parseFloat(radius)],
      requestContext,
      'places.list'
    );

    return apiJsonResponse(
      requestContext,
      { places: result.rows || [] },
      { context: { resultCount: result.rows.length } }
    );
  } catch (error) {
    const { message, status } = getDatabaseErrorDetails(error);

    return apiErrorResponse(requestContext, message, error, { status });
  }
}

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request, '/api/places');

  try {
    const pool = getPool();
    const body = await request.json();
    const { name, lat, lng, address, google_place_id } = body;
    const clientIp = getClientIp(request);

    if (!name || lat === undefined || lng === undefined) {
      return apiJsonResponse(
        requestContext,
        { error: 'name, lat, and lng are required' },
        { status: 400 }
      );
    }

    const result = await runLoggedQuery(
      pool,
      `INSERT INTO places (name, lat, lng, address, google_place_id, client_ip)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, address, lat, lng, google_place_id, created_at`,
      [name, lat, lng, address || null, google_place_id || null, clientIp || null],
      requestContext,
      'places.create'
    );

    return apiJsonResponse(requestContext, { place: result.rows[0] }, { status: 201 });
  } catch (error) {
    const { message, status } = getDatabaseErrorDetails(error);

    return apiErrorResponse(requestContext, message, error, { status });
  }
}
