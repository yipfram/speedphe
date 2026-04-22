import type { ReactNode } from 'react';
import { CloseIcon } from '@/components/Icons';

interface FloatingPanelProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  headerContent?: ReactNode;
}

export function FloatingPanel({ title, onClose, children, headerContent }: FloatingPanelProps) {
  return (
    <div
      className="absolute top-4 right-4 z-[5] w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-5"
      style={{ boxShadow: 'var(--card-shadow-xl)' }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {headerContent}
        </div>
        <button
          onClick={onClose}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          aria-label="Close panel"
        >
          <CloseIcon />
        </button>
      </div>
      {children}
    </div>
  );
}
