import { getDatabaseErrorDetails, getPool } from '@/lib/db';
import { CITIES, type CityConfig, isWithinCityBounds } from '@/lib/cities';

const LIMITED_DATA_THRESHOLD = 3;

interface CityPlaceRow {
  id: string;
  name: string;
  address: string | null;
  lat: number;
  lng: number;
  google_place_id: string | null;
  avg_download_mbps: number;
  avg_upload_mbps: number;
  avg_latency_ms: number;
  avg_streaming_score: number | null;
  avg_gaming_score: number | null;
  avg_rtc_score: number | null;
  test_count: number;
  last_tested_at: string;
}

export interface RankedCityPlace extends CityPlaceRow {
  citySlug: string;
  rankScore: number;
  limitedData: boolean;
}

export interface CityStats {
  cafeCount: number;
  averageDownloadMbps: number | null;
  averageUploadMbps: number | null;
  averageLatencyMs: number | null;
  averageStreamingScore: number | null;
  averageGamingScore: number | null;
  averageRtcScore: number | null;
  totalTests: number;
  lastTestedAt: string | null;
}

export interface CityPageData {
  city: CityConfig;
  topPlaces: RankedCityPlace[];
  allPlaces: RankedCityPlace[];
  stats: CityStats;
  dataError: string | null;
  dataAvailable: boolean;
}

function roundMetric(value: number | null) {
  return value == null ? null : Number(value.toFixed(1));
}

function computeRankScore(place: CityPlaceRow) {
  const latencyScore = Math.max(0, 60 - place.avg_latency_ms) * 0.45;
  const stabilityBoost = Math.min(Math.log2(place.test_count + 1) * 4, 10);

  return (
    place.avg_download_mbps * 0.7 + place.avg_upload_mbps * 0.15 + latencyScore + stabilityBoost
  );
}

function rankPlace(citySlug: string, place: CityPlaceRow): RankedCityPlace {
  return {
    ...place,
    citySlug,
    rankScore: computeRankScore(place),
    limitedData: place.test_count < LIMITED_DATA_THRESHOLD,
  };
}

function buildCityStats(places: RankedCityPlace[]): CityStats {
  if (places.length === 0) {
    return {
      cafeCount: 0,
      averageDownloadMbps: null,
      averageUploadMbps: null,
      averageLatencyMs: null,
      averageStreamingScore: null,
      averageGamingScore: null,
      averageRtcScore: null,
      totalTests: 0,
      lastTestedAt: null,
    };
  }

  const totals = places.reduce(
    (accumulator, place) => ({
      download: accumulator.download + place.avg_download_mbps,
      upload: accumulator.upload + place.avg_upload_mbps,
      latency: accumulator.latency + place.avg_latency_ms,
      streaming: accumulator.streaming + (place.avg_streaming_score ?? 0),
      gaming: accumulator.gaming + (place.avg_gaming_score ?? 0),
      rtc: accumulator.rtc + (place.avg_rtc_score ?? 0),
      streamingCount: accumulator.streamingCount + Number(place.avg_streaming_score != null),
      gamingCount: accumulator.gamingCount + Number(place.avg_gaming_score != null),
      rtcCount: accumulator.rtcCount + Number(place.avg_rtc_score != null),
      tests: accumulator.tests + place.test_count,
      lastTestedAt:
        !accumulator.lastTestedAt || place.last_tested_at > accumulator.lastTestedAt
          ? place.last_tested_at
          : accumulator.lastTestedAt,
    }),
    {
      download: 0,
      upload: 0,
      latency: 0,
      streaming: 0,
      gaming: 0,
      rtc: 0,
      streamingCount: 0,
      gamingCount: 0,
      rtcCount: 0,
      tests: 0,
      lastTestedAt: null as string | null,
    }
  );

  return {
    cafeCount: places.length,
    averageDownloadMbps: roundMetric(totals.download / places.length),
    averageUploadMbps: roundMetric(totals.upload / places.length),
    averageLatencyMs: roundMetric(totals.latency / places.length),
    averageStreamingScore: roundMetric(
      totals.streamingCount ? totals.streaming / totals.streamingCount : null
    ),
    averageGamingScore: roundMetric(totals.gamingCount ? totals.gaming / totals.gamingCount : null),
    averageRtcScore: roundMetric(totals.rtcCount ? totals.rtc / totals.rtcCount : null),
    totalTests: totals.tests,
    lastTestedAt: totals.lastTestedAt,
  };
}

export async function getCityPageData(city: CityConfig): Promise<CityPageData> {
  try {
    const pool = getPool();
    const result = await pool.query<CityPlaceRow>(
      `SELECT
        p.id,
        p.name,
        p.address,
        p.lat,
        p.lng,
        p.google_place_id,
        AVG(s.download_mbps)::FLOAT AS avg_download_mbps,
        AVG(s.upload_mbps)::FLOAT AS avg_upload_mbps,
        AVG(s.latency_ms)::FLOAT AS avg_latency_ms,
        AVG((s.aim_scores->'streaming'->>'points')::FLOAT)::FLOAT AS avg_streaming_score,
        AVG((s.aim_scores->'gaming'->>'points')::FLOAT)::FLOAT AS avg_gaming_score,
        AVG((s.aim_scores->'rtc'->>'points')::FLOAT)::FLOAT AS avg_rtc_score,
        COUNT(*)::INTEGER AS test_count,
        MAX(s.created_at)::TEXT AS last_tested_at
      FROM places p
      INNER JOIN speedtests s ON s.place_id = p.id
      WHERE p.lat <= $1
        AND p.lat >= $2
        AND p.lng <= $3
        AND p.lng >= $4
      GROUP BY p.id, p.name, p.address, p.lat, p.lng, p.google_place_id`,
      [city.bounds.north, city.bounds.south, city.bounds.east, city.bounds.west]
    );

    const places = result.rows
      .filter((place) => isWithinCityBounds(place, city.bounds))
      .map((place) => rankPlace(city.slug, place))
      .sort((left, right) => right.rankScore - left.rankScore);

    return {
      city,
      allPlaces: places,
      topPlaces: places.slice(0, 10),
      stats: buildCityStats(places),
      dataError: null,
      dataAvailable: true,
    };
  } catch (error) {
    const details = getDatabaseErrorDetails(error);

    return {
      city,
      allPlaces: [],
      topPlaces: [],
      stats: buildCityStats([]),
      dataError: details.message,
      dataAvailable: false,
    };
  }
}

export async function getAllIndexedCityPages() {
  const cityPages = await Promise.all(CITIES.map((city) => getCityPageData(city)));

  return cityPages.filter((page) => page.stats.cafeCount > 0);
}
