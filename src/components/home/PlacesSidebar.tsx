'use client';

import { CafeIcon, RefreshIcon } from '@/components/Icons';
import type { DiscoverablePlace } from '@/lib/db';

interface PlacesSidebarProps {
  places: DiscoverablePlace[];
  selectedPlace: DiscoverablePlace | null;
  isLoading: boolean;
  error: string | null;
  onPlaceSelect: (place: DiscoverablePlace) => void;
  onRefresh: () => void;
}

interface SpeedBadge {
  color: string;
  label: string;
}

function getSpeedBadge(place: DiscoverablePlace): SpeedBadge {
  if (!place.isSpeedtested) {
    return { color: 'bg-slate-100 text-slate-600', label: 'Not tested yet' };
  }

  const speed = place.avg_download_mbps;
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
  error,
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
        ) : error ? (
          <div className="px-4 py-8">
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">Unable to load nearby cafes</p>
              <p className="mt-1 text-xs leading-5 text-red-700">{error}</p>
            </div>
          </div>
        ) : places.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
              <CafeIcon className="text-gray-400" strokeWidth={1.5} width={24} height={24} />
            </div>
            <p className="mb-1 text-sm font-medium text-gray-700">No cafes found nearby</p>
            <p className="text-xs text-[var(--text-muted)]">Try refreshing your nearby search</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {places.map((place) => {
              const badge = getSpeedBadge(place);

              return (
                <button
                  key={place.google_place_id}
                  onClick={() => onPlaceSelect(place)}
                  className={[
                    'w-full rounded-xl p-3.5 text-left transition-all duration-150',
                    selectedPlace?.google_place_id === place.google_place_id
                      ? 'bg-[var(--primary-lighter)] ring-1 ring-[#2D1B69]/20'
                      : place.isSpeedtested
                        ? 'hover:bg-orange-50 active:bg-orange-100'
                        : 'hover:bg-gray-50 active:bg-gray-100',
                  ].join(' ')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-gray-900">
                          {place.name}
                        </h3>
                        <span
                          className={[
                            'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                            place.isSpeedtested
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600',
                          ].join(' ')}
                        >
                          {place.isSpeedtested ? 'Tested' : 'New'}
                        </span>
                      </div>
                      {place.address && (
                        <p className="mt-0.5 truncate text-xs text-[var(--text-muted)]">
                          {place.address}
                        </p>
                      )}
                      {!place.isSpeedtested && place.rating !== undefined && (
                        <p className="mt-1 text-[11px] text-[var(--text-muted)]">
                          {place.rating.toFixed(1)} rating
                          {place.user_ratings_total
                            ? ` · ${place.user_ratings_total} Google reviews`
                            : ''}
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
          Tested cafes stay pinned at the top of your nearby results
        </p>
      </div>
    </div>
  );
}
