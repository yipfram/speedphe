'use client';

import { CafeIcon, RefreshIcon } from '@/components/Icons';
import type { NearbyPlace, Place } from '@/lib/db';

interface PlacesSidebarProps {
  places: NearbyPlace[];
  selectedPlace: Place | null;
  isLoading: boolean;
  onPlaceSelect: (place: Place) => void;
  onRefresh: () => void;
}

interface SpeedBadge {
  color: string;
  label: string;
}

function getSpeedBadge(speed: number | null | undefined): SpeedBadge {
  if (speed == null) {
    return { color: 'bg-gray-100 text-gray-500', label: 'No data' };
  }
  if (speed > 50) {
    return { color: 'bg-emerald-100 text-emerald-700', label: `${speed.toFixed(0)} Mbps` };
  }
  if (speed > 25) {
    return { color: 'bg-yellow-100 text-yellow-700', label: `${speed.toFixed(0)} Mbps` };
  }
  if (speed > 10) {
    return { color: 'bg-orange-100 text-orange-700', label: `${speed.toFixed(0)} Mbps` };
  }

  return { color: 'bg-red-100 text-red-700', label: `${speed.toFixed(0)} Mbps` };
}

export function PlacesSidebar({
  places,
  selectedPlace,
  isLoading,
  onPlaceSelect,
  onRefresh,
}: PlacesSidebarProps) {
  return (
    <div className="flex h-full flex-col border-r border-[var(--border)] bg-white">
      <div className="px-5 pt-5 pb-4">
        <div className="mb-1 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2D1B69]">
            <CafeIcon className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#2D1B69]">Casph&eacute;</h1>
        </div>
        <p className="ml-11 text-xs text-[var(--text-muted)]">Find cafes with fast WiFi</p>
      </div>

      <div className="px-5 pb-4">
        <button
          onClick={onRefresh}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#FF6B35] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#e55a2b] active:scale-[0.98]"
        >
          <RefreshIcon />
          Refresh Places
        </button>
      </div>

      <div className="px-5">
        <div className="h-px bg-[var(--border)]" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#2D1B69] border-t-transparent" />
            <p className="text-sm text-[var(--text-muted)]">Finding nearby cafes...</p>
          </div>
        ) : places.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <CafeIcon className="text-gray-400" strokeWidth={1.5} width={24} height={24} />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-700">No cafes found nearby</p>
            <p className="text-xs text-[var(--text-muted)]">
              Double-click on the map to add a coffee shop
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {places.map((place) => {
              const badge = getSpeedBadge(place.avg_download_mbps);

              return (
                <button
                  key={place.id}
                  onClick={() => onPlaceSelect(place)}
                  className={[
                    'w-full rounded-xl p-3.5 text-left transition-all duration-150',
                    selectedPlace?.id === place.id
                      ? 'bg-[var(--primary-lighter)] ring-1 ring-[#2D1B69]/20'
                      : 'hover:bg-gray-50 active:bg-gray-100',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm font-semibold text-gray-900">{place.name}</h3>
                      {place.address && (
                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                          {place.address}
                        </p>
                      )}
                    </div>
                    <span
                      className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--border)] px-5 py-3">
        <p className="text-center text-[11px] text-[var(--text-muted)]">
          Double-click the map to add a new cafe
        </p>
      </div>
    </div>
  );
}
