import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const pool = getPool();
  const { id } = await params;

  try {
    const result = await pool.query(
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
      [id]
    );

    return NextResponse.json({ aggregate: result.rows[0] || null });
  } catch (error) {
    console.error('Error fetching aggregate:', error);
    return NextResponse.json({ error: 'Failed to fetch aggregate' }, { status: 500 });
  }
}
