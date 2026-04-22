'use client';

import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Place, NearbyPlace } from '@/lib/db';
import { MenuIcon } from '@/components/Icons';
import Speedtest from '@/components/Speedtest';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#FAFAFA]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-[#2D1B69] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-[var(--text-muted)] font-medium">Loading map...</p>
      </div>
    </div>
  ),
});

export default function Home() {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [newPlaceLat, setNewPlaceLat] = useState<number | null>(null);
  const [newPlaceLng, setNewPlaceLng] = useState<number | null>(null);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setUserLocation(loc);
          loadNearbyPlaces(loc.lat, loc.lng);
        },
        () => {
          const defaultLoc = { lat: 48.8566, lng: 2.3522 };
          setUserLocation(defaultLoc);
          loadNearbyPlaces(defaultLoc.lat, defaultLoc.lng);
        }
      );
    }
  }, []);

  const loadNearbyPlaces = async (lat: number, lng: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=10`);
      const data = await res.json();
      setPlaces(data.places || []);
    } catch (err) {
      console.error('Failed to load places:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPlace = useCallback((lat: number, lng: number) => {
    setNewPlaceLat(lat);
    setNewPlaceLng(lng);
    setShowAddPlace(true);
    setSelectedPlace(null);
  }, []);

  const handlePlaceSelect = useCallback((place: Place) => {
    setSelectedPlace(place);
    setShowAddPlace(false);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const submitNewPlace = async () => {
    if (!newPlaceName || newPlaceLat === null || newPlaceLng === null) return;
    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newPlaceName, lat: newPlaceLat, lng: newPlaceLng }),
      });
      const data = await res.json();
      setPlaces([...places, data.place]);
      setSelectedPlace(data.place);
      setShowAddPlace(false);
      setNewPlaceName('');
      setNewPlaceLat(null);
      setNewPlaceLng(null);
    } catch (err) {
      console.error('Failed to add place:', err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#FAFAFA]">
      {/* Sidebar */}
      <div
        className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          fixed md:relative z-20 h-full
          w-[320px] md:w-[360px]
          flex flex-col
          transition-transform duration-300 ease-in-out
          md:translate-x-0
        `}
      >
        <Sidebar
          places={places}
          selectedPlace={selectedPlace}
          isLoading={isLoading}
          onPlaceSelect={handlePlaceSelect}
          onRefresh={() => userLocation && loadNearbyPlaces(userLocation.lat, userLocation.lng)}
        />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-10 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 relative">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden absolute top-4 left-4 z-[5] w-10 h-10 bg-white rounded-xl shadow-md flex items-center justify-center hover:bg-gray-50 active:scale-95 transition-all"
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
          <div
            className="absolute top-4 right-4 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl p-5 z-[5]"
            style={{ boxShadow: 'var(--card-shadow-xl)' }}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1 min-w-0 pr-3">
                <h2 className="text-lg font-bold text-gray-900 leading-tight">
                  {selectedPlace.name}
                </h2>
                {selectedPlace.address && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">{selectedPlace.address}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedPlace(null)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 shrink-0"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
            <Speedtest
              place={selectedPlace}
              onComplete={() =>
                userLocation && loadNearbyPlaces(userLocation.lat, userLocation.lng)
              }
            />
          </div>
        )}

        {showAddPlace && (
          <div
            className="absolute top-4 right-4 w-[340px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl p-5 z-[5]"
            style={{ boxShadow: 'var(--card-shadow-xl)' }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add Coffee Shop</h2>
              <button
                onClick={() => {
                  setShowAddPlace(false);
                  setNewPlaceLat(null);
                  setNewPlaceLng(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <line x1="18" x2="6" y1="6" y2="18" />
                  <line x1="6" x2="18" y1="6" y2="18" />
                </svg>
              </button>
            </div>
            <input
              type="text"
              placeholder="Coffee shop name"
              value={newPlaceName}
              onChange={(e) => setNewPlaceName(e.target.value)}
              className="w-full border border-[var(--border)] rounded-xl px-4 py-2.5 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#2D1B69]/20 focus:border-[#2D1B69] placeholder:text-gray-400"
            />
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-4 bg-gray-50 rounded-lg px-3 py-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {newPlaceLat?.toFixed(4)}, {newPlaceLng?.toFixed(4)}
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={submitNewPlace}
                className="flex-1 bg-[#2D1B69] text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-[#3d2a8a] active:scale-[0.98]"
              >
                Add Place
              </button>
              <button
                onClick={() => {
                  setShowAddPlace(false);
                  setNewPlaceLat(null);
                  setNewPlaceLng(null);
                }}
                className="flex-1 border border-[var(--border)] text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50 active:scale-[0.98]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Sidebar({
  places,
  selectedPlace,
  isLoading,
  onPlaceSelect,
  onRefresh,
}: {
  places: NearbyPlace[];
  selectedPlace: Place | null;
  isLoading: boolean;
  onPlaceSelect: (place: Place) => void;
  onRefresh: () => void;
}) {
  const getSpeedBadge = (speed?: number) => {
    if (!speed) return { color: 'bg-gray-100 text-gray-500', label: 'No data' };
    if (speed > 50)
      return { color: 'bg-emerald-100 text-emerald-700', label: `${speed.toFixed(0)} Mbps` };
    if (speed > 25)
      return { color: 'bg-yellow-100 text-yellow-700', label: `${speed.toFixed(0)} Mbps` };
    if (speed > 10)
      return { color: 'bg-orange-100 text-orange-700', label: `${speed.toFixed(0)} Mbps` };
    return { color: 'bg-red-100 text-red-700', label: `${speed.toFixed(0)} Mbps` };
  };

  return (
    <div className="flex flex-col h-full bg-white border-r border-[var(--border)]">
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-9 h-9 rounded-xl bg-[#2D1B69] flex items-center justify-center">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
              <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              <line x1="6" x2="6" y1="2" y2="4" />
              <line x1="10" x2="10" y1="2" y2="4" />
              <line x1="14" x2="14" y1="2" y2="4" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#2D1B69] tracking-tight">Casph&eacute;</h1>
        </div>
        <p className="text-xs text-[var(--text-muted)] ml-11">Find cafes with fast WiFi</p>
      </div>

      {/* Refresh button */}
      <div className="px-5 pb-4">
        <button
          onClick={onRefresh}
          className="w-full bg-[#FF6B35] text-white py-2.5 px-4 rounded-xl font-semibold text-sm hover:bg-[#e55a2b] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
          </svg>
          Refresh Places
        </button>
      </div>

      <div className="px-5">
        <div className="h-px bg-[var(--border)]" />
      </div>

      {/* Places list */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-6 h-6 border-2 border-[#2D1B69] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-[var(--text-muted)]">Finding nearby cafes...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#9ca3af"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
                <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">No cafes found nearby</p>
            <p className="text-xs text-[var(--text-muted)]">
              Double-click on the map to add a coffee shop
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {places.map((place) => {
              const badge = getSpeedBadge(place.avg_download_mbps);
              return (
                <div
                  key={place.id}
                  onClick={() => onPlaceSelect(place)}
                  className={`
                    p-3.5 rounded-xl cursor-pointer transition-all duration-150
                    ${
                      selectedPlace?.id === place.id
                        ? 'bg-[var(--primary-lighter)] ring-1 ring-[#2D1B69]/20'
                        : 'hover:bg-gray-50 active:bg-gray-100'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm text-gray-900 truncate">{place.name}</h3>
                      {place.address && (
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">
                          {place.address}
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-[var(--border)]">
        <p className="text-[11px] text-[var(--text-muted)] text-center">
          Double-click the map to add a new cafe
        </p>
      </div>
    </div>
  );
}
