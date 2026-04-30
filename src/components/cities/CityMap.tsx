'use client';

import { useEffect, useRef, useState } from 'react';
import { MapLoadingFallback } from '@/components/home/MapLoadingFallback';
import type { CityBounds } from '@/lib/cities';
import type { RankedCityPlace } from '@/lib/city-seo';

interface CityMapProps {
  center: {
    lat: number;
    lng: number;
  };
  bounds: CityBounds;
  places: RankedCityPlace[];
}

export function CityMap({ center, bounds, places }: CityMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const [leafletModule, setLeafletModule] = useState<typeof import('leaflet') | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<ReturnType<typeof import('leaflet').map> | null>(null);
  const markerLayerRef = useRef<ReturnType<typeof import('leaflet').layerGroup> | null>(null);

  useEffect(() => {
    setIsMounted(true);
    import('leaflet').then((leaflet) => {
      setLeafletModule(leaflet.default);
    });
  }, []);

  useEffect(() => {
    if (!isMounted || !leafletModule || !containerRef.current || mapRef.current) {
      return;
    }

    const map = leafletModule
      .map(containerRef.current, {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: false,
      })
      .setView([center.lat, center.lng], 13);

    mapRef.current = map;
    markerLayerRef.current = leafletModule.layerGroup().addTo(map);

    leafletModule
      .tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
      })
      .addTo(map);

    const cityBounds = leafletModule.latLngBounds(
      [bounds.south, bounds.west],
      [bounds.north, bounds.east]
    );

    setTimeout(() => {
      map.invalidateSize();
      map.fitBounds(cityBounds, {
        padding: [24, 24],
      });
    }, 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markerLayerRef.current = null;
    };
  }, [
    bounds.east,
    bounds.north,
    bounds.south,
    bounds.west,
    center.lat,
    center.lng,
    isMounted,
    leafletModule,
  ]);

  useEffect(() => {
    if (!leafletModule || !markerLayerRef.current || !mapRef.current) {
      return;
    }

    const markerLayer = markerLayerRef.current;
    markerLayer.clearLayers();

    places.forEach((place) => {
      const color =
        place.avg_download_mbps > 60
          ? '#1d9f5a'
          : place.avg_download_mbps > 30
            ? '#d5a021'
            : '#d76837';

      const marker = leafletModule.marker([place.lat, place.lng], {
        icon: leafletModule.divIcon({
          className: 'custom-marker',
          html: `
            <div style="position: relative; width: 28px; height: 28px;">
              <div style="position: absolute; inset: 0; border-radius: 9999px; background: ${color}; border: 3px solid white; box-shadow: 0 6px 16px rgba(0,0,0,0.18);"></div>
              <div style="position: absolute; inset: 8px; border-radius: 9999px; background: rgba(255,255,255,0.75);"></div>
            </div>
          `,
          iconAnchor: [14, 14],
          iconSize: [28, 28],
        }),
      });

      marker.bindPopup(`
        <div style="min-width: 180px; padding: 4px 0;">
          <div style="font-weight: 600; font-size: 15px; color: #1f1a17; margin-bottom: 4px;">
            ${place.name}
          </div>
          <div style="color: #6b5c51; font-size: 12px; margin-bottom: 6px;">
            ${place.address ?? 'Address unavailable'}
          </div>
          <div style="font-size: 12px; color: #3f342d;">
            ${place.avg_download_mbps.toFixed(1)} Mbps down · ${place.avg_latency_ms.toFixed(0)} ms latency
          </div>
        </div>
      `);

      markerLayer.addLayer(marker);
    });

    const cityBounds = leafletModule.latLngBounds(
      [bounds.south, bounds.west],
      [bounds.north, bounds.east]
    );

    const markerBounds = places.length
      ? leafletModule.latLngBounds(
          places.map((place) => [place.lat, place.lng] as [number, number])
        )
      : null;

    const targetBounds =
      markerBounds && markerBounds.isValid() && places.length > 1
        ? markerBounds.pad(0.28)
        : cityBounds;

    mapRef.current.fitBounds(targetBounds, {
      padding: [20, 20],
      maxZoom: places.length <= 1 ? 13 : 15,
    });
  }, [bounds.east, bounds.north, bounds.south, bounds.west, leafletModule, places]);

  if (!isMounted || !leafletModule) {
    return <MapLoadingFallback />;
  }

  return (
    <div className="relative h-[400px] w-full">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}
