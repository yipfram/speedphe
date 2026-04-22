'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapLoadingFallback } from '@/components/home/MapLoadingFallback';
import { Place, NearbyPlace } from '@/lib/db';

interface MapProps {
  places: NearbyPlace[];
  userLocation?: { lat: number; lng: number } | null;
  onPlaceSelect: (place: Place) => void;
  onAddPlace: (lat: number, lng: number) => void;
}

export default function Map({ places, userLocation, onPlaceSelect, onAddPlace }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const mapRef = useRef<ReturnType<typeof import('leaflet').map> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  const stableOnPlaceSelect = useCallback(onPlaceSelect, [onPlaceSelect]);
  const stableOnAddPlace = useCallback(onAddPlace, [onAddPlace]);

  useEffect(() => {
    if (!isMounted || !L || !containerRef.current) return;

    // Clean up previous map instance
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const center: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [48.8566, 2.3522];

    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(center, 14);

    mapRef.current = map;

    // Use a cleaner tile style (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    // Speed-based color function
    const getSpeedColor = (place: NearbyPlace) => {
      const speed = place.avg_download_mbps;
      if (!speed) return '#6b7280'; // gray - no data
      if (speed > 50) return '#22C55E'; // green
      if (speed > 25) return '#EAB308'; // yellow
      if (speed > 10) return '#FF6B35'; // orange
      return '#EF4444'; // red
    };

    const getSpeedLabel = (place: NearbyPlace) => {
      const speed = place.avg_download_mbps;
      if (!speed) return 'No data';
      return `${speed.toFixed(0)} Mbps`;
    };

    const customIcon = (color: string) =>
      L.divIcon({
        className: 'custom-marker',
        html: `
          <div style="
            position: relative;
            width: 32px;
            height: 32px;
          ">
            <div style="
              position: absolute;
              inset: 0;
              background: ${color};
              border-radius: 50%;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.25);
              transition: transform 0.2s ease;
            "></div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
              opacity: 0.6;
            "></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

    // Place markers
    places.forEach((place) => {
      const color = getSpeedColor(place);
      const speedLabel = getSpeedLabel(place);
      const marker = L.marker([place.lat, place.lng], {
        icon: customIcon(color),
      }).addTo(map);

      marker.bindPopup(`
        <div style="min-width: 180px; padding: 4px 0;">
          <div style="font-weight: 600; font-size: 15px; color: #1A1A1A; margin-bottom: 4px;">
            ${place.name}
          </div>
          ${place.address ? `<div style="color: #6b7280; font-size: 13px; margin-bottom: 6px;">${place.address}</div>` : ''}
          <div style="
            display: inline-block;
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            color: white;
            background: ${color};
          ">${speedLabel}</div>
        </div>
      `);

      marker.on('click', () => stableOnPlaceSelect(place));
    });

    // User location marker
    if (userLocation) {
      L.marker([userLocation.lat, userLocation.lng], {
        icon: L.divIcon({
          className: 'user-marker',
          html: `
            <div style="position: relative; width: 20px; height: 20px;">
              <div class="user-pulse-ring" style="
                position: absolute;
                inset: -6px;
                border-radius: 50%;
                background: rgba(45, 27, 105, 0.15);
              "></div>
              <div style="
                position: absolute;
                inset: 0;
                background: #2D1B69;
                border-radius: 50%;
                border: 3px solid white;
                box-shadow: 0 2px 8px rgba(45, 27, 105, 0.4);
              "></div>
            </div>
          `,
          iconSize: [20, 20],
          iconAnchor: [10, 10],
        }),
      })
        .addTo(map)
        .bindPopup('<div style="font-weight: 500;">Your location</div>');
    }

    // Double-click to add place
    map.on('dblclick', (e: { latlng: { lat: number; lng: number } }) => {
      stableOnAddPlace(e.latlng.lat, e.latlng.lng);
    });

    // Invalidate size after mount to ensure proper rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [isMounted, L, places, userLocation, stableOnPlaceSelect, stableOnAddPlace]);

  if (!isMounted) {
    return <MapLoadingFallback />;
  }

  return <div ref={containerRef} className="absolute inset-0" />;
}
