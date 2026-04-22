'use client';

import Speedtest from '@/components/Speedtest';
import { FloatingPanel } from '@/components/home/FloatingPanel';
import type { Place } from '@/lib/db';

interface PlaceDetailsPanelProps {
  place: Place;
  onClose: () => void;
  onSpeedtestComplete: () => void;
}

export function PlaceDetailsPanel({ place, onClose, onSpeedtestComplete }: PlaceDetailsPanelProps) {
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
      <Speedtest place={place} onComplete={onSpeedtestComplete} />
    </FloatingPanel>
  );
}
