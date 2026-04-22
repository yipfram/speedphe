import { NextRequest } from 'next/server';
import { getDatabaseErrorDetails, getPool } from '@/lib/db';
import { getClientIp } from '@/lib/getClientIp';
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiRequestContext,
  runLoggedQuery,
} from '@/lib/api-logging';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestContext = createApiRequestContext(request, '/api/places/[id]/speedtests');
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '10';

  try {
    const pool = getPool();
    const result = await runLoggedQuery(
      pool,
      `SELECT
         id,
         place_id,
         download_mbps,
         upload_mbps,
         latency_ms,
         jitter_ms,
         packet_loss,
         created_at
       FROM speedtests
       WHERE place_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [id, parseInt(limit, 10)],
      requestContext,
      'places.speedtests.list'
    );

    return apiJsonResponse(
      requestContext,
      { speedtests: result.rows || [] },
      { context: { resultCount: result.rows.length } }
    );
  } catch (error) {
    const { message, status } = getDatabaseErrorDetails(error);

    return apiErrorResponse(requestContext, message, error, { status });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestContext = createApiRequestContext(request, '/api/places/[id]/speedtests');
  const { id } = await params;

  try {
    const pool = getPool();
    const body = await request.json();
    const { download_mbps, upload_mbps, latency_ms, jitter_ms, packet_loss } = body;

    if (download_mbps === undefined || upload_mbps === undefined || latency_ms === undefined) {
      return apiJsonResponse(
        requestContext,
        { error: 'download_mbps, upload_mbps, and latency_ms are required' },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);

    const result = await runLoggedQuery(
      pool,
      `INSERT INTO speedtests (place_id, download_mbps, upload_mbps, latency_ms, jitter_ms, packet_loss, client_ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, place_id, download_mbps, upload_mbps, latency_ms, jitter_ms, packet_loss, created_at`,
      [
        id,
        download_mbps,
        upload_mbps,
        latency_ms,
        jitter_ms || null,
        packet_loss || null,
        clientIp || null,
      ],
      requestContext,
      'places.speedtests.create'
    );

    return apiJsonResponse(requestContext, { speedtest: result.rows[0] }, { status: 201 });
  } catch (error) {
    const { message, status } = getDatabaseErrorDetails(error);

    return apiErrorResponse(requestContext, message, error, { status });
  }
}
