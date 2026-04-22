'use client';

interface SavedSpeedtestResult {
  id: string;
  download_mbps: number;
  upload_mbps: number;
  latency_ms: number;
  jitter_ms: number | null;
  created_at: string;
}

interface LatestSpeedtestResultProps {
  result: SavedSpeedtestResult | null;
  isLoading: boolean;
  formatSpeed: (mbps: number) => string;
}

const formatTimestamp = (value: string) =>
  new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

export function LatestSpeedtestResult({
  result,
  isLoading,
  formatSpeed,
}: LatestSpeedtestResultProps) {
  if (isLoading) {
    return <p className="text-sm text-[var(--text-muted)]">Loading latest speedtest...</p>;
  }

  if (!result) {
    return (
      <p className="text-sm text-[var(--text-muted)]">No speedtest result yet for this place</p>
    );
  }

  return (
    <div className="text-left">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--foreground)]">Latest speedtest result</p>
          <p className="text-xs text-[var(--text-muted)]">{formatTimestamp(result.created_at)}</p>
        </div>
        <div className="rounded-full bg-[var(--border-light)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)]">
          Previous test
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-xl border border-[var(--border)] bg-white p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">Download</p>
          </div>
          <p className="font-mono text-lg font-bold text-[var(--foreground)]">
            {formatSpeed(result.download_mbps)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">Upload</p>
          </div>
          <p className="font-mono text-lg font-bold text-[var(--foreground)]">
            {formatSpeed(result.upload_mbps)}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">Latency</p>
          </div>
          <p className="font-mono text-lg font-bold text-[var(--foreground)]">
            {result.latency_ms.toFixed(0)} ms
          </p>
        </div>
        <div className="rounded-xl border border-[var(--border)] bg-white p-3">
          <div className="mb-1 flex items-center gap-1.5">
            <p className="text-[11px] font-medium text-[var(--text-secondary)]">Jitter</p>
          </div>
          <p className="font-mono text-lg font-bold text-[var(--foreground)]">
            {result.jitter_ms === null ? '--' : `${result.jitter_ms.toFixed(1)} ms`}
          </p>
        </div>
      </div>
    </div>
  );
}

export type { SavedSpeedtestResult };
