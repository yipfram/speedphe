import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  const pool = getPool();

  try {
    const body = await request.json();
    const { place_id, download_mbps, upload_mbps, latency_ms, jitter_ms, packet_loss } = body;

    if (!place_id) {
      return NextResponse.json({ error: 'place_id is required' }, { status: 400 });
    }

    if (download_mbps === undefined || upload_mbps === undefined || latency_ms === undefined) {
      return NextResponse.json(
        { error: 'download_mbps, upload_mbps, and latency_ms are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO speedtests (place_id, download_mbps, upload_mbps, latency_ms, jitter_ms, packet_loss)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [place_id, download_mbps, upload_mbps, latency_ms, jitter_ms || null, packet_loss || null]
    );

    return NextResponse.json({ speedtest: result.rows[0] });
  } catch (error) {
    console.error('Error creating speedtest:', error);
    return NextResponse.json({ error: 'Failed to create speedtest' }, { status: 500 });
  }
}
