import { type AimScore } from '@/components/speedtest/useSpeedtest';

const CLASSIFICATION_COLORS: Record<string, string> = {
  poor: '#EF4444',
  fair: '#FF6B35',
  good: '#EAB308',
  great: '#22C55E',
  excellent: '#16A34A',
};

interface ScoreRingProps {
  label: string;
  score: AimScore | null;
}

const RADIUS = 22;
const STROKE = 4;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const CENTER = RADIUS + STROKE;
const SIZE = CENTER * 2;

export function ScoreRing({ label, score }: ScoreRingProps) {
  const color = score ? (CLASSIFICATION_COLORS[score.classificationName] ?? '#6b7280') : '#e5e7eb';
  const progress = score ? score.points / 100 : 0;
  const dashOffset = CIRCUMFERENCE * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke="var(--border-light)"
          strokeWidth={STROKE}
        />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className="font-mono text-xs font-bold text-[var(--foreground)]"
        style={{ marginTop: -SIZE * 0.42 }}
      >
        {score ? score.points : '--'}
      </span>
      <p className="text-[10px] font-medium text-[var(--text-secondary)]">{label}</p>
      {score && (
        <span
          className="rounded-full px-1.5 py-px text-[9px] font-semibold text-white"
          style={{ background: color }}
        >
          {score.classificationName}
        </span>
      )}
    </div>
  );
}
