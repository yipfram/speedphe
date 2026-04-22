import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const supabase = getSupabase();
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '5';

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.rpc('get_nearby_places', {
      search_lat: parseFloat(lat),
      search_lng: parseFloat(lng),
      search_radius_km: parseFloat(radius),
    });

    if (error) throw error;

    return NextResponse.json({ places: data || [] });
  } catch (error) {
    console.error('Error fetching places:', error);
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const body = await request.json();
    const { name, lat, lng, address, google_place_id } = body;

    if (!name || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'name, lat, and lng are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('places')
      .insert({
        name,
        lat,
        lng,
        address: address || null,
        google_place_id: google_place_id || null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ place: data });
  } catch (error) {
    console.error('Error creating place:', error);
    return NextResponse.json({ error: 'Failed to create place' }, { status: 500 });
  }
}
