import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabase();
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '10';

  try {
    const { data, error } = await supabase
      .from('speedtests')
      .select('*')
      .eq('place_id', id)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) throw error;

    return NextResponse.json({ speedtests: data || [] });
  } catch (error) {
    console.error('Error fetching speedtests:', error);
    return NextResponse.json({ error: 'Failed to fetch speedtests' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabase();
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

    const { data, error } = await supabase
      .from('speedtests')
      .insert({
        place_id: id,
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
