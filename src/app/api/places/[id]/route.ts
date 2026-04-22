import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = getSupabase();
  const { id } = await params;

  try {
    const { data: place, error } = await supabase.from('places').select('*').eq('id', id).single();

    if (error) throw error;
    if (!place) {
      return NextResponse.json({ error: 'Place not found' }, { status: 404 });
    }

    const { data: stats } = await supabase.rpc('get_place_speed_stats', {
      place_uuid: id,
    });

    return NextResponse.json({
      place,
      stats: stats?.[0] || null,
    });
  } catch (error) {
    console.error('Error fetching place:', error);
    return NextResponse.json({ error: 'Failed to fetch place' }, { status: 500 });
  }
}
