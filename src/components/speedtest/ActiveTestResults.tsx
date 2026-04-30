import { MetricCard } from '@/components/speedtest/MetricCard';
import { ScoreRing } from '@/components/speedtest/ScoreRing';
import { type AimScores, type SpeedResult } from '@/components/speedtest/useSpeedtest';

interface ActiveTestResultsProps {
  status: 'running' | 'complete';
  progress: number;
  results: SpeedResult;
  scores: AimScores;
  formatSpeed: (mbps: number) => string;
}

const formatMs0 = (v: number) => `${v.toFixed(0)} ms`;
const formatMs1 = (v: number) => `${v.toFixed(1)} ms`;

export function ActiveTestResults({
  status,
  progress,
  results,
  scores,
  formatSpeed,
}: ActiveTestResultsProps) {
  return (
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

      {status === 'complete' && scores.streaming && (
        <div className="mb-3 flex items-center justify-around rounded-xl border border-[var(--border)] bg-white px-2 py-3">
          <ScoreRing label="Streaming" score={scores.streaming} />
          <ScoreRing label="Gaming" score={scores.gaming} />
          <ScoreRing label="Video call" score={scores.rtc} />
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 mb-3">
        <MetricCard
          icon={
            <>
              <path d="M12 5v14" />
              <path d="m19 12-7 7-7-7" />
            </>
          }
          label="Download"
          value={results.download}
          formatter={formatSpeed}
          fallback="Waiting..."
        />
        <MetricCard
          icon={
            <>
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </>
          }
          label="Upload"
          value={results.upload}
          formatter={formatSpeed}
          fallback="Waiting..."
        />
        <MetricCard
          icon={
            <>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </>
          }
          label="Latency"
          value={results.latency}
          formatter={formatMs0}
          fallback="--"
        />
        <MetricCard
          icon={<path d="M2 12h4l3-9 4 18 3-9h4" />}
          label="Jitter"
          value={results.jitter}
          formatter={formatMs1}
          fallback="--"
        />
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
  );
}
