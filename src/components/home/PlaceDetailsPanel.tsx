'use client';

import Speedtest from '@/components/Speedtest';
import { FloatingPanel } from '@/components/home/FloatingPanel';
import type { DiscoverablePlace } from '@/lib/db';

interface PlaceDetailsPanelProps {
  place: DiscoverablePlace;
  onClose: () => void;
  onSpeedtestComplete: () => void;
  onPlaceResolved: (place: DiscoverablePlace) => void;
}

function buildGoogleMapsUrl(place: DiscoverablePlace) {
  const query = [place.name, place.address].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function PlaceDetailsPanel({
  place,
  onClose,
  onSpeedtestComplete,
  onPlaceResolved,
}: PlaceDetailsPanelProps) {
  return (
    <FloatingPanel
      title={place.name}
      onClose={onClose}
      headerContent={
        place.address ? (
          <p className="mt-1 text-sm text-[var(--text-muted)]">{place.address}</p>
        ) : undefined
      }
    >
      <div className="mb-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={[
              'rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide',
              place.isSpeedtested
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-slate-100 text-slate-600',
            ].join(' ')}
          >
            {place.isSpeedtested ? 'Speedtested' : 'Not tested yet'}
          </span>
          {place.rating !== undefined && (
            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700">
              {place.rating.toFixed(1)} Google rating
              {place.user_ratings_total ? ` · ${place.user_ratings_total} reviews` : ''}
            </span>
          )}
        </div>

        {place.isSpeedtested ? (
          <div className="grid grid-cols-3 gap-2.5">
            <div className="rounded-xl border border-[var(--border)] bg-white p-3">
              <p className="text-[11px] font-medium text-[var(--text-secondary)]">Avg Download</p>
              <p className="mt-1 font-mono text-base font-bold text-[var(--foreground)]">
                {place.avg_download_mbps === null
                  ? '--'
                  : `${place.avg_download_mbps.toFixed(0)} Mbps`}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-3">
              <p className="text-[11px] font-medium text-[var(--text-secondary)]">Avg Upload</p>
              <p className="mt-1 font-mono text-base font-bold text-[var(--foreground)]">
                {place.avg_upload_mbps == null ? '--' : `${place.avg_upload_mbps.toFixed(0)} Mbps`}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-3">
              <p className="text-[11px] font-medium text-[var(--text-secondary)]">Tests</p>
              <p className="mt-1 font-mono text-base font-bold text-[var(--foreground)]">
                {place.test_count ?? 0}
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-800">Be the first to test this cafe</p>
            <p className="mt-1 text-xs leading-5 text-slate-600">
              This place is discoverable from Google Places but has no recorded WiFi speed yet.
            </p>
          </div>
        )}

        <a
          href={buildGoogleMapsUrl(place)}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-[var(--primary)] underline underline-offset-2"
        >
          Open in Google Maps
        </a>
      </div>

      <Speedtest place={place} onComplete={onSpeedtestComplete} onPlaceResolved={onPlaceResolved} />
    </FloatingPanel>
  );
}
