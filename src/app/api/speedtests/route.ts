import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

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

    const { data, error } = await supabase
      .from('speedtests')
      .insert({
        place_id,
        download_mbps,
        upload_mbps,
        latency_ms,
        jitter_ms: jitter_ms || null,
        packet_loss: packet_loss || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ speedtest: data });
  } catch (error) {
    console.error('Error creating speedtest:', error);
    return NextResponse.json({ error: 'Failed to create speedtest' }, { status: 500 });
  }
}
