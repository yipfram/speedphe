import { NextRequest } from 'next/server';
import { getDatabaseErrorDetails, getPool, type DiscoverablePlace } from '@/lib/db';
import { getClientIp } from '@/lib/getClientIp';
import { searchViewportCoffeeShops } from '@/lib/google-places';
import {
  apiErrorResponse,
  apiJsonResponse,
  createApiRequestContext,
  runLoggedQuery,
} from '@/lib/api-logging';

const TESTED_ONLY_RADIUS_KM = 6;
const MEDIUM_DENSITY_RADIUS_KM = 2.5;
const MAX_UNTESTED_CLOSE_VIEW = 30;
const MAX_UNTESTED_MEDIUM_VIEW = 12;
const GOOGLE_ONLY_MIN_RATING = 4;
const GOOGLE_ONLY_MIN_REVIEWS = 8;

function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDelta = toRadians(lat2 - lat1);
  const lngDelta = toRadians(lng2 - lng1);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(lngDelta / 2) ** 2;

  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isWithinViewport(
  place: { lat: number; lng: number },
  viewport: { north: number; south: number; east: number; west: number }
) {
  const withinLat = place.lat <= viewport.north && place.lat >= viewport.south;
  const withinLng =
    viewport.west <= viewport.east
      ? place.lng >= viewport.west && place.lng <= viewport.east
      : place.lng >= viewport.west || place.lng <= viewport.east;

  return withinLat && withinLng;
}

function compareUntestedPlaces(left: DiscoverablePlace, right: DiscoverablePlace) {
  const leftRating = left.rating ?? 0;
  const rightRating = right.rating ?? 0;

  if (leftRating !== rightRating) {
    return rightRating - leftRating;
  }

  const leftReviews = left.user_ratings_total ?? 0;
  const rightReviews = right.user_ratings_total ?? 0;

  if (leftReviews !== rightReviews) {
    return rightReviews - leftReviews;
  }

  return left.distance_km - right.distance_km;
}

export async function GET(request: NextRequest) {
  const requestContext = createApiRequestContext(request, '/api/places');
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const radius = searchParams.get('radius') || '5';
  const north = searchParams.get('north');
  const south = searchParams.get('south');
  const east = searchParams.get('east');
  const west = searchParams.get('west');

  if (!lat || !lng) {
    return apiJsonResponse(requestContext, { error: 'lat and lng are required' }, { status: 400 });
  }

  try {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    const parsedRadiusKm = parseFloat(radius);
    const viewport =
      north && south && east && west
        ? {
            north: parseFloat(north),
            south: parseFloat(south),
            east: parseFloat(east),
            west: parseFloat(west),
          }
        : null;
    const googleSearchConfig =
      parsedRadiusKm >= TESTED_ONLY_RADIUS_KM
        ? { maxResultCount: 24, rankPreference: 'RELEVANCE' as const }
        : parsedRadiusKm > MEDIUM_DENSITY_RADIUS_KM
          ? { maxResultCount: 32, rankPreference: 'RELEVANCE' as const }
          : { maxResultCount: 40, rankPreference: 'DISTANCE' as const };
    const googlePlaces = viewport
      ? await searchViewportCoffeeShops(viewport, googleSearchConfig)
      : [];
    const pool = getPool();
    const result = await runLoggedQuery(
      pool,
      `SELECT
        p.id,
        p.name,
        p.address,
        p.lat,
        p.lng,
        p.google_place_id,
        p.created_at,
        stats.avg_download_mbps,
        stats.avg_upload_mbps,
        stats.avg_latency_ms,
        stats.test_count,
        (6371 * acos(cos(radians($1)) * cos(radians(p.lat)) *
          cos(radians(p.lng) - radians($2)) +
          sin(radians($1)) * sin(radians(p.lat))))::FLOAT AS distance_km
      FROM places p
      LEFT JOIN (
        SELECT
          place_id,
          AVG(download_mbps)::FLOAT AS avg_download_mbps,
          AVG(upload_mbps)::FLOAT AS avg_upload_mbps,
          AVG(latency_ms)::FLOAT AS avg_latency_ms,
          COUNT(*)::INTEGER AS test_count
        FROM speedtests
        GROUP BY place_id
      ) stats ON stats.place_id = p.id
      WHERE (6371 * acos(cos(radians($1)) * cos(radians(p.lat)) *
          cos(radians(p.lng) - radians($2)) +
          sin(radians($1)) * sin(radians(p.lat)))) <= $3
        AND ($4::FLOAT IS NULL OR p.lat <= $4)
        AND ($5::FLOAT IS NULL OR p.lat >= $5)
        AND (
          $6::FLOAT IS NULL OR $7::FLOAT IS NULL OR
          ($7 <= $6 AND p.lng BETWEEN $7 AND $6) OR
          ($7 > $6 AND (p.lng >= $7 OR p.lng <= $6))
        )`,
      [
        parsedLat,
        parsedLng,
        parsedRadiusKm,
        viewport?.north ?? null,
        viewport?.south ?? null,
        viewport?.east ?? null,
        viewport?.west ?? null,
      ],
      requestContext,
      'places.list'
    );

    const localPlaces = result.rows as Array<{
      id: string;
      name: string;
      address: string | null;
      lat: number;
      lng: number;
      google_place_id: string | null;
      created_at: string;
      avg_download_mbps: number | null;
      avg_upload_mbps: number | null;
      avg_latency_ms: number | null;
      test_count: number | null;
      distance_km: number;
    }>;

    const localPlacesByGoogleId = new Map(
      localPlaces
        .filter((row) => row.google_place_id)
        .map((row) => [row.google_place_id as string, row])
    );

    const places: DiscoverablePlace[] = googlePlaces
      .filter((googlePlace) =>
        viewport ? isWithinViewport({ lat: googlePlace.lat, lng: googlePlace.lng }, viewport) : true
      )
      .map((googlePlace) => {
        const localPlace = localPlacesByGoogleId.get(googlePlace.place_id);
        const distanceKm = getDistanceKm(parsedLat, parsedLng, googlePlace.lat, googlePlace.lng);

        return {
          id: localPlace?.id,
          google_place_id: googlePlace.place_id,
          name: googlePlace.name,
          address: googlePlace.address || localPlace?.address || null,
          lat: googlePlace.lat,
          lng: googlePlace.lng,
          created_at: localPlace?.created_at,
          distance_km: distanceKm,
          rating: googlePlace.rating,
          user_ratings_total: googlePlace.user_ratings_total,
          avg_download_mbps: localPlace?.avg_download_mbps ?? null,
          avg_upload_mbps: localPlace?.avg_upload_mbps ?? null,
          avg_latency_ms: localPlace?.avg_latency_ms ?? null,
          test_count: localPlace?.test_count ?? 0,
          isSpeedtested: Boolean(localPlace?.id),
        };
      })
      .filter(
        (place) =>
          place.isSpeedtested ||
          ((place.rating ?? 0) >= GOOGLE_ONLY_MIN_RATING &&
            (place.user_ratings_total ?? 0) >= GOOGLE_ONLY_MIN_REVIEWS)
      )
      .sort((left, right) => {
        if (left.isSpeedtested !== right.isSpeedtested) {
          return left.isSpeedtested ? -1 : 1;
        }

        return left.distance_km - right.distance_km;
      });

    const matchedGoogleIds = new Set(places.map((place) => place.google_place_id));
    const unmatchedLocalPlaces: DiscoverablePlace[] = localPlaces
      .filter(
        (localPlace) =>
          !localPlace.google_place_id || !matchedGoogleIds.has(localPlace.google_place_id)
      )
      .map((localPlace) => ({
        id: localPlace.id,
        google_place_id: localPlace.google_place_id ?? `local:${localPlace.id}`,
        name: localPlace.name,
        address: localPlace.address,
        lat: localPlace.lat,
        lng: localPlace.lng,
        created_at: localPlace.created_at,
        distance_km: localPlace.distance_km,
        avg_download_mbps: localPlace.avg_download_mbps,
        avg_upload_mbps: localPlace.avg_upload_mbps,
        avg_latency_ms: localPlace.avg_latency_ms,
        test_count: localPlace.test_count ?? 0,
        isSpeedtested: true,
      }));

    const testedPlaces = [...places.filter((place) => place.isSpeedtested), ...unmatchedLocalPlaces]
      .sort((left, right) => left.distance_km - right.distance_km)
      .filter(
        (place, index, collection) =>
          collection.findIndex(
            (candidate) => candidate.google_place_id === place.google_place_id
          ) === index
      );

    let untestedPlaces: DiscoverablePlace[] = [];

    if (parsedRadiusKm < TESTED_ONLY_RADIUS_KM) {
      const untestedLimit =
        parsedRadiusKm <= MEDIUM_DENSITY_RADIUS_KM
          ? MAX_UNTESTED_CLOSE_VIEW
          : MAX_UNTESTED_MEDIUM_VIEW;

      untestedPlaces = places
        .filter((place) => !place.isSpeedtested)
        .sort(compareUntestedPlaces)
        .slice(0, untestedLimit);
    }

    const mergedPlaces = [...testedPlaces, ...untestedPlaces].sort((left, right) => {
      if (left.isSpeedtested !== right.isSpeedtested) {
        return left.isSpeedtested ? -1 : 1;
      }

      return left.distance_km - right.distance_km;
    });

    return apiJsonResponse(
      requestContext,
      { places: mergedPlaces },
      { context: { resultCount: mergedPlaces.length } }
    );
  } catch (error) {
    const { message, status } = getDatabaseErrorDetails(error);

    return apiErrorResponse(requestContext, message, error, { status });
  }
}

export async function POST(request: NextRequest) {
  const requestContext = createApiRequestContext(request, '/api/places');

  try {
    const pool = getPool();
    const body = await request.json();
    const { name, lat, lng, address, google_place_id } = body;
    const clientIp = getClientIp(request);

    if (!name || lat === undefined || lng === undefined) {
      return apiJsonResponse(
        requestContext,
        { error: 'name, lat, and lng are required' },
        { status: 400 }
      );
    }

    const query = google_place_id
      ? `INSERT INTO places (name, lat, lng, address, google_place_id, client_ip)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (google_place_id) DO UPDATE
         SET
           name = EXCLUDED.name,
           lat = EXCLUDED.lat,
           lng = EXCLUDED.lng,
           address = COALESCE(EXCLUDED.address, places.address)
         RETURNING id, name, address, lat, lng, google_place_id, created_at`
      : `INSERT INTO places (name, lat, lng, address, google_place_id, client_ip)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, address, lat, lng, google_place_id, created_at`;

    const result = await runLoggedQuery(
      pool,
      query,
      [name, lat, lng, address || null, google_place_id || null, clientIp || null],
      requestContext,
      'places.create'
    );

    return apiJsonResponse(requestContext, { place: result.rows[0] }, { status: 201 });
  } catch (error) {
    const { message, status } = getDatabaseErrorDetails(error);

    return apiErrorResponse(requestContext, message, error, { status });
  }
}
