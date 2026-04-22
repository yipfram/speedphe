import { NextRequest } from 'next/server';
import { getDatabaseErrorDetails, getPool } from '@/lib/db';
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiRequestContext,
  runLoggedQuery,
} from '@/lib/api-logging';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const requestContext = createApiRequestContext(request, '/api/places/[id]/aggregate');
  const { id } = await params;

  try {
    const pool = getPool();
    const result = await runLoggedQuery(
      pool,
      `SELECT
        AVG(download_mbps)::FLOAT AS avg_download,
        AVG(upload_mbps)::FLOAT AS avg_upload,
        AVG(latency_ms)::FLOAT AS avg_latency,
        COUNT(*)::INTEGER AS test_count,
        MIN(download_mbps)::FLOAT AS min_download,
        MAX(download_mbps)::FLOAT AS max_download,
        MAX(created_at) AS last_test
      FROM speedtests
      WHERE place_id = $1`,
      [id],
      requestContext,
      'places.aggregate'
    );

    return apiJsonResponse(
      requestContext,
      { aggregate: result.rows[0] || null },
      { context: { hasAggregate: Boolean(result.rows[0]) } }
    );
  } catch (error) {
    const { message, status } = getDatabaseErrorDetails(error);

    return apiErrorResponse(requestContext, message, error, { status });
  }
}
