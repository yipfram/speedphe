'use client';

import { useEffect, useState, useCallback } from 'react';
import { Place } from '@/lib/supabase';

interface MapProps {
  places: Place[];
  onPlaceSelect: (place: Place) => void;
  onAddPlace: (lat: number, lng: number) => void;
}

export default function Map({ places, onPlaceSelect, onAddPlace }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);

  useEffect(() => {
    setIsMounted(true);
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  const stableOnPlaceSelect = useCallback(onPlaceSelect, [onPlaceSelect]);
  const stableOnAddPlace = useCallback(onAddPlace, [onAddPlace]);

  useEffect(() => {
    if (!isMounted || !L) return;

    const map = L.map('map').setView([48.8566, 2.3522], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    const customIcon = (color: string) =>
      L.divIcon({
        className: 'custom-marker',
        html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

    places.forEach((place) => {
      const marker = L.marker([place.lat, place.lng], {
        icon: customIcon('#6b7280'),
      }).addTo(map);

      marker.bindPopup(`
        <div style="min-width: 150px;">
          <strong>${place.name}</strong>
          <p style="margin: 4px 0 0; color: #666;">${place.address || ''}</p>
        </div>
      `);

      marker.on('click', () => stableOnPlaceSelect(place));
    });

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          map.setView([position.coords.latitude, position.coords.longitude], 14);
          L.marker([position.coords.latitude, position.coords.longitude], {
            icon: L.divIcon({
              className: 'user-marker',
              html: `<div style="background-color: #2D1B69; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 0 8px rgba(45, 27, 105, 0.2);"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            }),
          })
            .addTo(map)
            .bindPopup('You are here');
        },
        () => {}
      );
    }

    map.on('dblclick', (e: { latlng: { lat: number; lng: number } }) => {
      stableOnAddPlace(e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
    };
  }, [isMounted, L, places, stableOnPlaceSelect, stableOnAddPlace]);

  if (!isMounted) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  return <div id="map" className="h-full w-full" style={{ minHeight: '500px' }} />;
}
