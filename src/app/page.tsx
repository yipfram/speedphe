'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Place } from '@/lib/supabase';
import Speedtest from '@/components/Speedtest';

const Map = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-100">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function Home() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [showAddPlace, setShowAddPlace] = useState(false);
  const [newPlaceLat, setNewPlaceLat] = useState<number | null>(null);
  const [newPlaceLng, setNewPlaceLng] = useState<number | null>(null);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
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
    try {
      const res = await fetch(`/api/places?lat=${lat}&lng=${lng}&radius=10`);
      const data = await res.json();
      setPlaces(data.places || []);
    } catch (err) {
      console.error('Failed to load places:', err);
    }
  };

  const handleAddPlace = (lat: number, lng: number) => {
    setNewPlaceLat(lat);
    setNewPlaceLng(lng);
    setShowAddPlace(true);
  };

  const submitNewPlace = async () => {
    if (!newPlaceName || newPlaceLat === null || newPlaceLng === null) return;

    try {
      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newPlaceName,
          lat: newPlaceLat,
          lng: newPlaceLng,
        }),
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
    <div className="flex h-screen">
      <div className="w-1/3 min-w-[350px] bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-[#2D1B69]">Casphé</h1>
          <p className="text-sm text-gray-600">Find coffee shops with good WiFi</p>
        </div>

        <div className="p-4 border-b border-gray-200">
          <button
            onClick={() => userLocation && loadNearbyPlaces(userLocation.lat, userLocation.lng)}
            className="w-full bg-[#FF6B35] text-white py-2 px-4 rounded-lg font-medium hover:bg-[#e55a2b] transition-colors"
          >
            Refresh Places
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {places.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <p>No places found nearby.</p>
              <p className="text-sm mt-2">Double-click on the map to add a coffee shop.</p>
            </div>
          ) : (
            places.map((place) => (
              <div
                key={place.id}
                onClick={() => setSelectedPlace(place)}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                  selectedPlace?.id === place.id ? 'bg-purple-50' : ''
                }`}
              >
                <h3 className="font-medium text-gray-900">{place.name}</h3>
                {place.address && <p className="text-sm text-gray-500 mt-1">{place.address}</p>}
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 relative">
        {userLocation && (
          <Map places={places} onPlaceSelect={setSelectedPlace} onAddPlace={handleAddPlace} />
        )}

        {selectedPlace && (
          <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-semibold">{selectedPlace.name}</h2>
              <button
                onClick={() => setSelectedPlace(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            {selectedPlace.address && (
              <p className="text-sm text-gray-600 mb-4">{selectedPlace.address}</p>
            )}
            <Speedtest
              place={selectedPlace}
              onComplete={() => {
                if (userLocation) {
                  loadNearbyPlaces(userLocation.lat, userLocation.lng);
                }
              }}
            />
          </div>
        )}

        {showAddPlace && (
          <div className="absolute top-4 right-4 w-80 bg-white rounded-lg shadow-lg p-4">
            <h2 className="text-lg font-semibold mb-4">Add Coffee Shop</h2>
            <input
              type="text"
              placeholder="Coffee shop name"
              value={newPlaceName}
              onChange={(e) => setNewPlaceName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4"
            />
            <p className="text-sm text-gray-600 mb-4">
              Location: {newPlaceLat?.toFixed(4)}, {newPlaceLng?.toFixed(4)}
            </p>
            <div className="flex gap-2">
              <button
                onClick={submitNewPlace}
                className="flex-1 bg-[#2D1B69] text-white py-2 rounded-lg font-medium hover:bg-[#3d2a8a]"
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddPlace(false);
                  setNewPlaceLat(null);
                  setNewPlaceLng(null);
                }}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50"
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
