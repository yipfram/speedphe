'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MenuIcon } from '@/components/Icons';
import { MapLoadingFallback } from '@/components/home/MapLoadingFallback';
import { PlaceDetailsPanel } from '@/components/home/PlaceDetailsPanel';
import { PlacesSidebar } from '@/components/home/PlacesSidebar';
import type { DiscoverablePlace } from '@/lib/db';
import { createLoggedClientError, isLoggedClientError, logClientError } from '@/lib/logging';

const DEFAULT_LOCATION = { lat: 48.8566, lng: 2.3522 };

interface Coordinates {
  lat: number;
  lng: number;
}

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <MapLoadingFallback />,
});

export default function Home() {
  const [places, setPlaces] = useState<DiscoverablePlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<DiscoverablePlace | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [mapViewport, setMapViewport] = useState<{
    lat: number;
    lng: number;
    radiusKm: number;
    north: number;
    south: number;
    east: number;
    west: number;
  } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);

  const loadViewportPlaces = useCallback(
    async (viewport: {
      lat: number;
      lng: number;
      radiusKm: number;
      north: number;
      south: number;
      east: number;
      west: number;
    }) => {
      setIsLoading(true);
      setPlacesError(null);

      try {
        const params = new URLSearchParams({
          lat: String(viewport.lat),
          lng: String(viewport.lng),
          radius: String(viewport.radiusKm),
          north: String(viewport.north),
          south: String(viewport.south),
          east: String(viewport.east),
          west: String(viewport.west),
        });
        const response = await fetch(`/api/places?${params.toString()}`);
        const data: { error?: string; places?: DiscoverablePlace[]; requestId?: string } =
          await response.json();

        if (!response.ok) {
          const errorMessage = data.error ?? 'Failed to load places';

          logClientError('client.fetch.error', {
            action: 'places.load_nearby',
            endpoint: '/api/places',
            status: response.status,
            requestId: data.requestId,
            message: errorMessage,
          });
          throw createLoggedClientError(errorMessage);
        }

        const nextPlaces = data.places ?? [];

        setPlaces(nextPlaces);
        setSelectedPlace((currentSelectedPlace) => {
          if (!currentSelectedPlace) {
            return currentSelectedPlace;
          }

          return (
            nextPlaces.find(
              (place) => place.google_place_id === currentSelectedPlace.google_place_id
            ) ?? currentSelectedPlace
          );
        });
      } catch (error) {
        if (!isLoggedClientError(error)) {
          logClientError('client.fetch.error', {
            action: 'places.load_viewport',
            endpoint: '/api/places',
            message: error instanceof Error ? error.message : 'Failed to load places',
          });
        }
        setPlacesError(error instanceof Error ? error.message : 'Failed to load places');
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const initializeLocation = (location: Coordinates) => {
      setUserLocation(location);
    };

    if (!navigator.geolocation) {
      logClientError('geolocation.fallback', {
        reason: 'unsupported',
      });
      initializeLocation(DEFAULT_LOCATION);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        initializeLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        logClientError('geolocation.fallback', {
          reason: 'permission_denied_or_unavailable',
        });
        initializeLocation(DEFAULT_LOCATION);
      }
    );
  }, []);

  const handleCloseSelectedPlace = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  const handlePlaceSelect = useCallback((place: DiscoverablePlace) => {
    setSelectedPlace(place);

    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const handleRefreshPlaces = useCallback(() => {
    if (!mapViewport) {
      return;
    }

    void loadViewportPlaces(mapViewport);
  }, [loadViewportPlaces, mapViewport]);

  const handleSpeedtestComplete = useCallback(() => {
    if (!mapViewport) {
      return;
    }

    void loadViewportPlaces(mapViewport);
  }, [loadViewportPlaces, mapViewport]);

  const handlePlaceResolved = useCallback((place: DiscoverablePlace) => {
    setSelectedPlace(place);
    setPlaces((currentPlaces) =>
      currentPlaces
        .map((currentPlace) =>
          currentPlace.google_place_id === place.google_place_id
            ? {
                ...currentPlace,
                ...place,
                isSpeedtested: true,
              }
            : currentPlace
        )
        .sort((left, right) => {
          if (left.isSpeedtested !== right.isSpeedtested) {
            return left.isSpeedtested ? -1 : 1;
          }

          return left.distance_km - right.distance_km;
        })
    );
  }, []);

  const handleViewportChange = useCallback(
    (viewport: {
      lat: number;
      lng: number;
      radiusKm: number;
      north: number;
      south: number;
      east: number;
      west: number;
    }) => {
      setMapViewport((currentViewport) => {
        const latChanged = !currentViewport || Math.abs(currentViewport.lat - viewport.lat) > 0.001;
        const lngChanged = !currentViewport || Math.abs(currentViewport.lng - viewport.lng) > 0.001;
        const radiusChanged =
          !currentViewport || Math.abs(currentViewport.radiusKm - viewport.radiusKm) > 0.5;
        const northChanged =
          !currentViewport || Math.abs(currentViewport.north - viewport.north) > 0.001;
        const southChanged =
          !currentViewport || Math.abs(currentViewport.south - viewport.south) > 0.001;
        const eastChanged =
          !currentViewport || Math.abs(currentViewport.east - viewport.east) > 0.001;
        const westChanged =
          !currentViewport || Math.abs(currentViewport.west - viewport.west) > 0.001;

        if (
          !latChanged &&
          !lngChanged &&
          !radiusChanged &&
          !northChanged &&
          !southChanged &&
          !eastChanged &&
          !westChanged
        ) {
          return currentViewport;
        }

        void loadViewportPlaces(viewport);
        return viewport;
      });
    },
    [loadViewportPlaces]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
      <div
        className={[
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'fixed z-20 flex h-full w-[320px] flex-col transition-transform duration-300 ease-in-out md:relative md:w-[360px] md:translate-x-0',
        ].join(' ')}
      >
        <PlacesSidebar
          places={places}
          selectedPlace={selectedPlace}
          isLoading={isLoading}
          error={placesError}
          onPlaceSelect={handlePlaceSelect}
          onRefresh={handleRefreshPlaces}
        />
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="relative flex-1">
        <button
          onClick={() => setSidebarOpen(true)}
          className="absolute top-4 left-4 z-[5] flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-md transition-all hover:bg-gray-50 active:scale-95 md:hidden"
        >
          <MenuIcon />
        </button>

        {userLocation && (
          <Map
            places={places}
            userLocation={userLocation}
            onPlaceSelect={handlePlaceSelect}
            onViewportChange={handleViewportChange}
          />
        )}

        {selectedPlace && (
          <PlaceDetailsPanel
            place={selectedPlace}
            onClose={handleCloseSelectedPlace}
            onSpeedtestComplete={handleSpeedtestComplete}
            onPlaceResolved={handlePlaceResolved}
          />
        )}
      </div>
    </div>
  );
}
