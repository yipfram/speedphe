'use client';

import { useSpeedtest } from '@/components/speedtest/useSpeedtest';
import { Place } from '@/lib/db';

interface SpeedtestProps {
  place: Place;
  onComplete: () => void;
}

export default function Speedtest({ place, onComplete }: SpeedtestProps) {
  const { error, formatSpeed, progress, results, startTest, status } = useSpeedtest({
    placeId: place.id,
    onComplete,
  });

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
          <p className="text-sm text-[var(--text-muted)] mb-4">
            Measure download, upload, latency, and jitter at this location
          </p>
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
            Run Speed Test
          </button>
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
