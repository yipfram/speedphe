'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MapLoadingFallback } from '@/components/home/MapLoadingFallback';
import { type DiscoverablePlace } from '@/lib/db';

interface MapProps {
  places: DiscoverablePlace[];
  userLocation?: { lat: number; lng: number } | null;
  onPlaceSelect: (place: DiscoverablePlace) => void;
  onViewportChange: (viewport: {
    lat: number;
    lng: number;
    radiusKm: number;
    north: number;
    south: number;
    east: number;
    west: number;
  }) => void;
}

export default function Map({ places, userLocation, onPlaceSelect, onViewportChange }: MapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [L, setL] = useState<typeof import('leaflet') | null>(null);
  const mapRef = useRef<ReturnType<typeof import('leaflet').map> | null>(null);
  const markerLayerRef = useRef<ReturnType<typeof import('leaflet').layerGroup> | null>(null);
  const userMarkerRef = useRef<ReturnType<typeof import('leaflet').marker> | null>(null);
  const hasCenteredOnUserRef = useRef(false);
  const viewportTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    import('leaflet').then((leaflet) => {
      setL(leaflet.default);
    });
  }, []);

  const stableOnPlaceSelect = useCallback(onPlaceSelect, [onPlaceSelect]);
  const stableOnViewportChange = useCallback(onViewportChange, [onViewportChange]);

  useEffect(() => {
    return () => {
      if (viewportTimeoutRef.current) {
        clearTimeout(viewportTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isMounted || !L || !containerRef.current || mapRef.current) return;

    const defaultCenter: [number, number] = userLocation
      ? [userLocation.lat, userLocation.lng]
      : [48.8566, 2.3522];
    const map = L.map(containerRef.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(defaultCenter, 14);

    mapRef.current = map;
    markerLayerRef.current = L.layerGroup().addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
      maxZoom: 19,
    }).addTo(map);

    const emitViewportChange = () => {
      const center = map.getCenter();
      const bounds = map.getBounds();
      const radiusMeters = center.distanceTo(bounds.getNorthEast());

      stableOnViewportChange({
        lat: center.lat,
        lng: center.lng,
        radiusKm: Math.max(1, Math.min(25, radiusMeters / 1000)),
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    };

    const handleViewportChange = () => {
      if (viewportTimeoutRef.current) {
        clearTimeout(viewportTimeoutRef.current);
      }

      viewportTimeoutRef.current = setTimeout(emitViewportChange, 250);
    };

    map.on('moveend', handleViewportChange);
    map.on('zoomend', handleViewportChange);

    setTimeout(() => {
      map.invalidateSize();
      emitViewportChange();
    }, 100);

    return () => {
      map.off('moveend', handleViewportChange);
      map.off('zoomend', handleViewportChange);
      if (viewportTimeoutRef.current) {
        clearTimeout(viewportTimeoutRef.current);
      }
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
      userMarkerRef.current = null;
    };
  }, [isMounted, L, userLocation, stableOnViewportChange]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !userLocation || hasCenteredOnUserRef.current) {
      return;
    }

    map.setView([userLocation.lat, userLocation.lng], 14);
    hasCenteredOnUserRef.current = true;
  }, [userLocation]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !L || !markerLayerRef.current) {
      return;
    }

    const getSpeedColor = (place: DiscoverablePlace) => {
      if (!place.isSpeedtested) return '#94A3B8';
      const speed = place.avg_download_mbps;
      if (speed == null) return '#6b7280';
      if (speed > 50) return '#22C55E';
      if (speed > 25) return '#EAB308';
      if (speed > 10) return '#FF6B35';
      return '#EF4444';
    };

    const getSpeedLabel = (place: DiscoverablePlace) => {
      if (!place.isSpeedtested) return 'Not tested';
      const speed = place.avg_download_mbps;
      if (speed == null) return 'No data';
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

    markerLayerRef.current.clearLayers();

    places.forEach((place) => {
      const color = getSpeedColor(place);
      const speedLabel = getSpeedLabel(place);
      const marker = L.marker([place.lat, place.lng], {
        icon: customIcon(color),
      });

      marker.bindPopup(`
        <div style="min-width: 180px; padding: 4px 0;">
          <div style="font-weight: 600; font-size: 15px; color: #1A1A1A; margin-bottom: 4px;">
            ${place.name}
          </div>
          ${place.address ? `<div style="color: #6b7280; font-size: 13px; margin-bottom: 6px;">${place.address}</div>` : ''}
          <div style="color: #475569; font-size: 12px; margin-bottom: 6px; font-weight: 600;">
            ${place.isSpeedtested ? 'Speedtested cafe' : 'Available for first speedtest'}
          </div>
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
      markerLayerRef.current?.addLayer(marker);
    });
  }, [L, places, stableOnPlaceSelect]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !L || !userLocation) {
      return;
    }

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
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
  }, [L, userLocation]);

  const handleRecenter = () => {
    const map = mapRef.current;
    if (!map || !userLocation) return;
    map.setView([userLocation.lat, userLocation.lng], 18, { animate: true });
  };

  if (!isMounted) {
    return <MapLoadingFallback />;
  }

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" />
      {userLocation && (
        <button
          onClick={handleRecenter}
          className="leaflet-recenter-btn absolute right-4 bottom-8 z-[1000] flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.06)] transition-all hover:bg-[#ede9f6] active:scale-95"
          aria-label="Recenter map on your location"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--primary, #2d1b69)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <line x1="2" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      )}
    </div>
  );
}
