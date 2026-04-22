const GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

export interface GooglePlace {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  user_ratings_total?: number;
}

interface GooglePlaceResponse {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
}

interface GooglePlacesSearchResult {
  status: string;
  results: GooglePlaceResponse[];
}

interface GooglePlaceDetailsResult {
  status: string;
  result: GooglePlaceResponse;
}

export async function searchNearbyCoffeeShops(
  lat: number,
  lng: number,
  radius: number = 5000
): Promise<GooglePlace[]> {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=cafe&key=${GOOGLE_PLACES_API_KEY}`
  );

  const data = (await response.json()) as GooglePlacesSearchResult;

  if (data.status !== 'OK') {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  return data.results.map((place) => ({
    place_id: place.place_id,
    name: place.name,
    address: place.vicinity || '',
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    rating: place.rating,
    user_ratings_total: place.user_ratings_total,
  }));
}

export async function getPlaceDetails(placeId: string): Promise<GooglePlace> {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,rating,user_ratings_total&key=${GOOGLE_PLACES_API_KEY}`
  );

  const data = (await response.json()) as GooglePlaceDetailsResult;

  if (data.status !== 'OK') {
    throw new Error(`Google Places API error: ${data.status}`);
  }

  const place = data.result;
  return {
    place_id: place.place_id,
    name: place.name,
    address: place.formatted_address || '',
    lat: place.geometry.location.lat,
    lng: place.geometry.location.lng,
    rating: place.rating,
    user_ratings_total: place.user_ratings_total,
  };
}
