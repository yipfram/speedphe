import { NextRequest, NextResponse } from 'next/server';
import { getDatabaseErrorDetails, getPool } from '@/lib/db';
import { getClientIp } from '@/lib/getClientIp';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const pool = getPool();
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '10';

  try {
    const result = await pool.query(
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
      [id, parseInt(limit)]
    );

    return NextResponse.json({ speedtests: result.rows || [] });
  } catch (error) {
    console.error('Error fetching speedtests:', error);
    const { message, status } = getDatabaseErrorDetails(error);

    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const pool = getPool();
  const { id } = await params;

  try {
    const body = await request.json();
    const { download_mbps, upload_mbps, latency_ms, jitter_ms, packet_loss } = body;

    if (download_mbps === undefined || upload_mbps === undefined || latency_ms === undefined) {
      return NextResponse.json(
        { error: 'download_mbps, upload_mbps, and latency_ms are required' },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);

    const result = await pool.query(
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
      ]
    );

    return NextResponse.json({ speedtest: result.rows[0] });
  } catch (error) {
    console.error('Error creating speedtest:', error);
    const { message, status } = getDatabaseErrorDetails(error);

    return NextResponse.json({ error: message }, { status });
  }
}
