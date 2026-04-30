interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | null;
  formatter: (v: number) => string;
  fallback: string;
}

export function MetricCard({ icon, label, value, formatter, fallback }: MetricCardProps) {
  return (
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
          {icon}
        </svg>
        <p className="text-[11px] font-medium text-[var(--text-secondary)]">{label}</p>
      </div>
      <p className="font-mono text-lg font-bold text-[var(--foreground)]">
        {value === null ? (
          <span className="text-[var(--text-muted)]">{fallback}</span>
        ) : (
          formatter(value)
        )}
      </p>
    </div>
  );
}
