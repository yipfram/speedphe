const GOOGLE_PLACES_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface GooglePlace {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  user_ratings_total?: number;
}

interface SearchNearbyCoffeeShopsOptions {
  maxResultCount?: number;
  rankPreference?: 'DISTANCE' | 'POPULARITY';
}

interface SearchViewportCoffeeShopsOptions {
  maxResultCount?: number;
  rankPreference?: 'DISTANCE' | 'RELEVANCE';
}

interface SearchViewportCoffeeShopsViewport {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface GooglePlaceLocation {
  latitude: number;
  longitude: number;
}

interface GooglePlaceResponse {
  id: string;
  displayName?: {
    text: string;
  };
  formattedAddress?: string;
  location?: GooglePlaceLocation;
  rating?: number;
  userRatingCount?: number;
}

interface GooglePlacesSearchResult {
  places?: GooglePlaceResponse[];
}

interface GooglePlaceDetailsResult {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
  id?: string;
  displayName?: {
    text: string;
  };
  formattedAddress?: string;
  location?: GooglePlaceLocation;
  rating?: number;
  userRatingCount?: number;
}

interface GooglePlacesApiError {
  error?: {
    code?: number;
    message?: string;
    status?: string;
  };
}

function getApiKey(): string {
  if (!GOOGLE_PLACES_API_KEY) {
    throw new Error('Missing GOOGLE_PLACES_API_KEY environment variable');
  }

  return GOOGLE_PLACES_API_KEY;
}

function getGoogleApiErrorMessage(data: GooglePlacesApiError, fallbackStatus: string) {
  const status = data.error?.status ?? fallbackStatus;
  const message = data.error?.message;

  return message
    ? `Google Places API error: ${status} - ${message}`
    : `Google Places API error: ${status}`;
}

function mapGooglePlace(place: GooglePlaceResponse): GooglePlace {
  return {
    place_id: place.id,
    name: place.displayName?.text ?? 'Unknown place',
    address: place.formattedAddress ?? '',
    lat: place.location?.latitude ?? 0,
    lng: place.location?.longitude ?? 0,
    rating: place.rating,
    user_ratings_total: place.userRatingCount,
  };
}

export async function searchNearbyCoffeeShops(
  lat: number,
  lng: number,
  radius: number = 5000,
  options: SearchNearbyCoffeeShopsOptions = {}
): Promise<GooglePlace[]> {
  const apiKey = getApiKey();
  const maxResultCount = options.maxResultCount ?? 20;
  const rankPreference = options.rankPreference ?? 'DISTANCE';

  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount',
    },
    body: JSON.stringify({
      includedPrimaryTypes: ['cafe'],
      maxResultCount,
      locationRestriction: {
        circle: {
          center: {
            latitude: lat,
            longitude: lng,
          },
          radius,
        },
      },
      rankPreference,
    }),
  });

  const data = (await response.json()) as GooglePlacesSearchResult;

  if (!response.ok) {
    throw new Error(getGoogleApiErrorMessage(data as GooglePlacesApiError, response.statusText));
  }

  if (!data.places || data.places.length === 0) {
    return [];
  }

  return data.places.filter((place) => place.id && place.location).map(mapGooglePlace);
}

export async function searchViewportCoffeeShops(
  viewport: SearchViewportCoffeeShopsViewport,
  options: SearchViewportCoffeeShopsOptions = {}
): Promise<GooglePlace[]> {
  const apiKey = getApiKey();
  const pageSize = options.maxResultCount ?? 20;
  const rankPreference = options.rankPreference ?? 'RELEVANCE';

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount',
    },
    body: JSON.stringify({
      textQuery: 'cafe',
      pageSize,
      locationRestriction: {
        rectangle: {
          low: {
            latitude: viewport.south,
            longitude: viewport.west,
          },
          high: {
            latitude: viewport.north,
            longitude: viewport.east,
          },
        },
      },
      rankPreference,
      includedType: 'cafe',
      strictTypeFiltering: true,
    }),
  });

  const data = (await response.json()) as GooglePlacesSearchResult;

  if (!response.ok) {
    throw new Error(getGoogleApiErrorMessage(data as GooglePlacesApiError, response.statusText));
  }

  if (!data.places || data.places.length === 0) {
    return [];
  }

  return data.places.filter((place) => place.id && place.location).map(mapGooglePlace);
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlace> {
  const apiKey = getApiKey();

  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location,rating,userRatingCount',
    },
  });

  const data = (await response.json()) as GooglePlaceDetailsResult;

  if (!response.ok) {
    throw new Error(getGoogleApiErrorMessage(data, response.statusText));
  }

  if (!data.id || !data.location) {
    throw new Error('Google Places API error: NOT_FOUND');
  }

  return mapGooglePlace({
    id: data.id,
    displayName: data.displayName,
    formattedAddress: data.formattedAddress,
    location: data.location,
    rating: data.rating,
    userRatingCount: data.userRatingCount,
  });
}
