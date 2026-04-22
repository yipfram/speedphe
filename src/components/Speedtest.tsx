'use client';

import {
  LatestSpeedtestResult,
  type SavedSpeedtestResult,
} from '@/components/speedtest/LatestSpeedtestResult';
import { useSpeedtest } from '@/components/speedtest/useSpeedtest';
import { type DiscoverablePlace } from '@/lib/db';
import { createLoggedClientError, isLoggedClientError, logClientError } from '@/lib/logging';
import { useEffect, useState } from 'react';

interface SpeedtestProps {
  place: DiscoverablePlace;
  onComplete: () => void;
  onPlaceResolved: (place: DiscoverablePlace) => void;
}

export default function Speedtest({ place, onComplete, onPlaceResolved }: SpeedtestProps) {
  const [resolvedPlace, setResolvedPlace] = useState(place);
  const localPlaceId = resolvedPlace.id ?? null;
  const [lastResult, setLastResult] = useState<SavedSpeedtestResult | null>(null);
  const [isLoadingLastResult, setIsLoadingLastResult] = useState(true);

  useEffect(() => {
    setResolvedPlace(place);
  }, [place]);

  const ensureLocalPlaceId = async () => {
    if (resolvedPlace.id) {
      return resolvedPlace.id;
    }

    const response = await fetch('/api/places', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: resolvedPlace.name,
        lat: resolvedPlace.lat,
        lng: resolvedPlace.lng,
        address: resolvedPlace.address,
        google_place_id: resolvedPlace.google_place_id,
      }),
    });
    const data: { error?: string; place?: { id: string; created_at: string }; requestId?: string } =
      await response.json();

    if (!response.ok || !data.place) {
      const errorMessage = data.error ?? 'Failed to prepare this place for testing';

      logClientError('client.fetch.error', {
        action: 'places.ensure_local',
        endpoint: '/api/places',
        status: response.status,
        requestId: data.requestId,
        message: errorMessage,
      });
      throw createLoggedClientError(errorMessage);
    }

    const nextPlace: DiscoverablePlace = {
      ...resolvedPlace,
      id: data.place.id,
      created_at: data.place.created_at,
      isSpeedtested: true,
      test_count: resolvedPlace.test_count ?? 0,
    };

    setResolvedPlace(nextPlace);
    onPlaceResolved(nextPlace);

    return data.place.id;
  };

  const { error, formatSpeed, progress, results, startTest, status } = useSpeedtest({
    ensurePlaceId: ensureLocalPlaceId,
    onComplete,
  });

  useEffect(() => {
    const controller = new AbortController();

    const loadLastResult = async () => {
      if (!localPlaceId) {
        setLastResult(null);
        setIsLoadingLastResult(false);
        return;
      }

      setIsLoadingLastResult(true);

      try {
        const response = await fetch(`/api/places/${localPlaceId}/speedtests?limit=1`, {
          signal: controller.signal,
        });
        const data: { error?: string; requestId?: string; speedtests?: SavedSpeedtestResult[] } =
          await response.json();

        if (!response.ok) {
          const errorMessage = data.error ?? 'Failed to load previous speedtests';

          logClientError('client.fetch.error', {
            action: 'speedtests.load_latest',
            endpoint: `/api/places/${localPlaceId}/speedtests?limit=1`,
            status: response.status,
            requestId: data.requestId,
            message: errorMessage,
          });
          throw createLoggedClientError(errorMessage);
        }

        setLastResult(data.speedtests?.[0] ?? null);
      } catch (loadError) {
        if (controller.signal.aborted) {
          return;
        }

        if (!isLoggedClientError(loadError)) {
          logClientError('client.fetch.error', {
            action: 'speedtests.load_latest',
            endpoint: `/api/places/${localPlaceId}/speedtests?limit=1`,
            message:
              loadError instanceof Error ? loadError.message : 'Failed to load previous speedtests',
          });
        }
        setLastResult(null);
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingLastResult(false);
        }
      }
    };

    void loadLastResult();

    return () => {
      controller.abort();
    };
  }, [localPlaceId]);

  const renderMetricValue = (
    value: number | null,
    formatter: (metric: number) => string,
    fallback: string
  ) => {
    if (value === null) {
      return <span className="text-[var(--text-muted)]">{fallback}</span>;
    }

    return formatter(value);
  };
  return (
    <div>
      {status === 'idle' && (
        <div className="text-center py-2">
          <div className="mb-4">
            <LatestSpeedtestResult
              result={lastResult}
              isLoading={isLoadingLastResult}
              formatSpeed={formatSpeed}
            />
          </div>
          <button
            onClick={startTest}
            className="w-full bg-[#2D1B69] text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-[#3d2a8a] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
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
              <path d="m13 2-2 2.5h3L12 7" />
              <path d="M10 14v-3" />
              <path d="M14 14v-3" />
              <path d="M11 19c-1.7 0-3-1.3-3-3v-2h8v2c0 1.7-1.3 3-3 3Z" />
              <path d="M12 22v-3" />
            </svg>
            {resolvedPlace.isSpeedtested ? 'Run Speed Test' : 'Run First Speed Test'}
          </button>
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Test runs against{' '}
            <a
              href="https://github.com/cloudflare/speedtest/"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-[var(--primary)] underline underline-offset-2"
            >
              Cloudflare speed test servers
            </a>
            .
          </p>
        </div>
      )}

      {(status === 'running' || status === 'complete') && (
        <div className="py-1">
          {status === 'running' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--primary)]">Running test</span>
                <span className="text-xs font-mono text-[var(--text-muted)]">
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="w-full h-2 overflow-hidden rounded-full bg-[var(--border-light)]">
                <div
                  className="h-2 rounded-full bg-[var(--primary)] transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
                Live results update as each measurement completes
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="rounded-xl border border-[var(--border)] bg-white p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--primary)]"
                >
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </svg>
                <p className="text-[11px] font-medium text-[var(--text-secondary)]">Download</p>
              </div>
              <p className="font-mono text-lg font-bold text-[var(--foreground)]">
                {renderMetricValue(results.download, formatSpeed, 'Waiting...')}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--primary)]"
                >
                  <path d="M12 19V5" />
                  <path d="m5 12 7-7 7 7" />
                </svg>
                <p className="text-[11px] font-medium text-[var(--text-secondary)]">Upload</p>
              </div>
              <p className="font-mono text-lg font-bold text-[var(--foreground)]">
                {renderMetricValue(results.upload, formatSpeed, 'Waiting...')}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--primary)]"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-[11px] font-medium text-[var(--text-secondary)]">Latency</p>
              </div>
              <p className="font-mono text-lg font-bold text-[var(--foreground)]">
                {renderMetricValue(results.latency, (value) => `${value.toFixed(0)} ms`, '--')}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border)] bg-white p-3">
              <div className="mb-1 flex items-center gap-1.5">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[var(--primary)]"
                >
                  <path d="M2 12h4l3-9 4 18 3-9h4" />
                </svg>
                <p className="text-[11px] font-medium text-[var(--text-secondary)]">Jitter</p>
              </div>
              <p className="font-mono text-lg font-bold text-[var(--foreground)]">
                {renderMetricValue(results.jitter, (value) => `${value.toFixed(1)} ms`, '--')}
              </p>
            </div>
          </div>

          {status === 'complete' && (
            <div className="flex items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--border-light)] py-2 text-[var(--text-secondary)]">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <p className="text-xs font-semibold">Results saved</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl text-sm mt-2">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" x2="12" y1="8" y2="12" />
            <line x1="12" x2="12.01" y1="16" y2="16" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}
