'use client';

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MenuIcon } from '@/components/Icons';
import { MapLoadingFallback } from '@/components/home/MapLoadingFallback';
import { AddPlacePanel } from '@/components/home/AddPlacePanel';
import { PlaceDetailsPanel } from '@/components/home/PlaceDetailsPanel';
import { PlacesSidebar } from '@/components/home/PlacesSidebar';
import type { NearbyPlace, Place } from '@/lib/db';
import { createLoggedClientError, isLoggedClientError, logClientError } from '@/lib/logging';

const DEFAULT_LOCATION = { lat: 48.8566, lng: 2.3522 };

interface Coordinates {
  lat: number;
  lng: number;
}

interface AddPlaceDraft extends Coordinates {
  name: string;
}

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <MapLoadingFallback />,
});

export default function Home() {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [addPlaceDraft, setAddPlaceDraft] = useState<AddPlaceDraft | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);

  const resetAddPlaceDraft = useCallback(() => {
    setAddPlaceDraft(null);
  }, []);

  const loadNearbyPlaces = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setPlacesError(null);

    try {
      const response = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=10`);
      const data: { error?: string; places?: NearbyPlace[]; requestId?: string } =
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

      setPlaces(data.places ?? []);
    } catch (error) {
      if (!isLoggedClientError(error)) {
        logClientError('client.fetch.error', {
          action: 'places.load_nearby',
          endpoint: '/api/places',
          message: error instanceof Error ? error.message : 'Failed to load places',
        });
      }
      setPlacesError(error instanceof Error ? error.message : 'Failed to load places');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const initializeLocation = (location: Coordinates) => {
      setUserLocation(location);
      void loadNearbyPlaces(location.lat, location.lng);
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
  }, [loadNearbyPlaces]);

  const handleAddPlace = useCallback((lat: number, lng: number) => {
    setAddPlaceDraft({ lat, lng, name: '' });
    setSelectedPlace(null);
  }, []);

  const handleCloseSelectedPlace = useCallback(() => {
    setSelectedPlace(null);
  }, []);

  const handlePlaceSelect = useCallback(
    (place: Place) => {
      setSelectedPlace(place);
      resetAddPlaceDraft();

      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        setSidebarOpen(false);
      }
    },
    [resetAddPlaceDraft]
  );

  const handleRefreshPlaces = useCallback(() => {
    if (!userLocation) {
      return;
    }

    void loadNearbyPlaces(userLocation.lat, userLocation.lng);
  }, [loadNearbyPlaces, userLocation]);

  const handlePlaceNameChange = useCallback((name: string) => {
    setAddPlaceDraft((currentDraft) =>
      currentDraft
        ? {
            ...currentDraft,
            name,
          }
        : currentDraft
    );
  }, []);

  const handleSubmitNewPlace = useCallback(async () => {
    if (!addPlaceDraft || !addPlaceDraft.name.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: addPlaceDraft.name.trim(),
          lat: addPlaceDraft.lat,
          lng: addPlaceDraft.lng,
        }),
      });
      const data: { error?: string; place?: Place; requestId?: string } = await response.json();

      if (!response.ok || !data.place) {
        const errorMessage = data.error ?? 'Failed to add place';

        logClientError('client.fetch.error', {
          action: 'places.create',
          endpoint: '/api/places',
          status: response.status,
          requestId: data.requestId,
          message: errorMessage,
        });
        throw createLoggedClientError(errorMessage);
      }

      const createdPlace: NearbyPlace = {
        ...data.place,
        distance_km: 0,
        avg_download_mbps: null,
      };

      setPlaces((currentPlaces) => [...currentPlaces, createdPlace]);
      setSelectedPlace(data.place);
      resetAddPlaceDraft();
    } catch (error) {
      if (!isLoggedClientError(error)) {
        logClientError('client.fetch.error', {
          action: 'places.create',
          endpoint: '/api/places',
          message: error instanceof Error ? error.message : 'Failed to add place',
        });
      }
    }
  }, [addPlaceDraft, resetAddPlaceDraft]);

  const handleSpeedtestComplete = useCallback(() => {
    if (!userLocation) {
      return;
    }

    void loadNearbyPlaces(userLocation.lat, userLocation.lng);
  }, [loadNearbyPlaces, userLocation]);

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
            onAddPlace={handleAddPlace}
          />
        )}

        {selectedPlace && (
          <PlaceDetailsPanel
            place={selectedPlace}
            onClose={handleCloseSelectedPlace}
            onSpeedtestComplete={handleSpeedtestComplete}
          />
        )}

        {addPlaceDraft && (
          <AddPlacePanel
            draft={addPlaceDraft}
            onNameChange={handlePlaceNameChange}
            onSubmit={handleSubmitNewPlace}
            onCancel={resetAddPlaceDraft}
          />
        )}
      </div>
    </div>
  );
}
