export function MapLoadingFallback() {
  return (
    <div className="flex h-full items-center justify-center bg-[#FAFAFA]">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#2D1B69] border-t-transparent" />
        <p className="text-sm font-medium text-[var(--text-muted)]">Loading map...</p>
      </div>
    </div>
  );
}
