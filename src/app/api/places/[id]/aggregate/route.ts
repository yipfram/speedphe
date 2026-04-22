import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabase();
  const { id } = await params;

  try {
    const { data, error } = await supabase.rpc('get_place_speed_stats', {
      place_uuid: id,
    });

    if (error) throw error;

    return NextResponse.json({ aggregate: data?.[0] || null });
  } catch (error) {
    console.error('Error fetching aggregate:', error);
    return NextResponse.json({ error: 'Failed to fetch aggregate' }, { status: 500 });
  }
}
