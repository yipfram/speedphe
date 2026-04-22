'use client';

import { MapPinIcon } from '@/components/Icons';
import { FloatingPanel } from '@/components/home/FloatingPanel';

interface AddPlaceDraft {
  lat: number;
  lng: number;
  name: string;
}

interface AddPlacePanelProps {
  draft: AddPlaceDraft;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export function AddPlacePanel({ draft, onNameChange, onSubmit, onCancel }: AddPlacePanelProps) {
  return (
    <FloatingPanel title="Add Coffee Shop" onClose={onCancel}>
      <input
        type="text"
        placeholder="Coffee shop name"
        value={draft.name}
        onChange={(event) => onNameChange(event.target.value)}
        className="mb-3 w-full rounded-xl border border-[var(--border)] px-4 py-2.5 text-sm placeholder:text-gray-400 focus:border-[#2D1B69] focus:ring-2 focus:ring-[#2D1B69]/20 focus:outline-none"
      />
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-xs text-[var(--text-muted)]">
        <MapPinIcon />
        {draft.lat.toFixed(4)}, {draft.lng.toFixed(4)}
      </div>
      <div className="flex gap-2.5">
        <button
          onClick={onSubmit}
          className="flex-1 rounded-xl bg-[#2D1B69] py-2.5 text-sm font-semibold text-white hover:bg-[#3d2a8a] active:scale-[0.98]"
        >
          Add Place
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-[var(--border)] py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-[0.98]"
        >
          Cancel
        </button>
      </div>
    </FloatingPanel>
  );
}
