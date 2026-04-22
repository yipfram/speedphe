import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(request: NextRequest) {
  const pool = getPool();
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '5';

  if (!lat || !lng) {
    return NextResponse.json({ error: 'lat and lng are required' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      `SELECT
        id, name, address, lat, lng, google_place_id, created_at,
        (6371 * acos(cos(radians($1)) * cos(radians(lat)) *
          cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat))))::FLOAT AS distance_km
      FROM places
      WHERE (6371 * acos(cos(radians($1)) * cos(radians(lat)) *
          cos(radians(lng) - radians($2)) +
          sin(radians($1)) * sin(radians(lat)))) <= $3
      ORDER BY distance_km`,
      [parseFloat(lat), parseFloat(lng), parseFloat(radius)]
    );

    return NextResponse.json({ places: result.rows || [] });
  } catch (error) {
    console.error('Error fetching places:', error);
    return NextResponse.json({ error: 'Failed to fetch places' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const pool = getPool();

  try {
    const body = await request.json();
    const { name, lat, lng, address, google_place_id } = body;

    if (!name || lat === undefined || lng === undefined) {
      return NextResponse.json({ error: 'name, lat, and lng are required' }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO places (name, lat, lng, address, google_place_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, lat, lng, address || null, google_place_id || null]
    );

    return NextResponse.json({ place: result.rows[0] });
  } catch (error) {
    console.error('Error creating place:', error);
    return NextResponse.json({ error: 'Failed to create place' }, { status: 500 });
  }
}
