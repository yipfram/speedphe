import { NextRequest } from 'next/server';
import { getDatabaseErrorDetails, getPool } from '@/lib/db';
import { getClientIp } from '@/lib/getClientIp';
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiRequestContext,
  runLoggedQuery,
} from '@/lib/api-logging';

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request, '/api/speedtests');

  try {
    const pool = getPool();
    const body = await request.json();
    const { place_id, download_mbps, upload_mbps, latency_ms, jitter_ms, packet_loss } = body;
    const clientIp = getClientIp(request);

    if (!place_id) {
      return apiJsonResponse(requestContext, { error: 'place_id is required' }, { status: 400 });
    }

    if (download_mbps === undefined || upload_mbps === undefined || latency_ms === undefined) {
      return apiJsonResponse(
        requestContext,
        { error: 'download_mbps, upload_mbps, and latency_ms are required' },
        { status: 400 }
      );
    }

    const result = await runLoggedQuery(
      pool,
      `INSERT INTO speedtests (place_id, download_mbps, upload_mbps, latency_ms, jitter_ms, packet_loss, client_ip)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, place_id, download_mbps, upload_mbps, latency_ms, jitter_ms, packet_loss, created_at`,
      [
        place_id,
        download_mbps,
        upload_mbps,
        latency_ms,
        jitter_ms || null,
        packet_loss || null,
        clientIp || null,
      ],
      requestContext,
      'speedtests.create'
    );

    return apiJsonResponse(requestContext, { speedtest: result.rows[0] }, { status: 201 });
  } catch (error) {
    const { message, status } = getDatabaseErrorDetails(error);

    return apiErrorResponse(requestContext, message, error, { status });
  }
}
