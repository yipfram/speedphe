'use client';

import { useState, useRef } from 'react';
import type { Results } from '@cloudflare/speedtest';
import SpeedTest from '@cloudflare/speedtest';
import { Place } from '@/lib/db';

interface SpeedtestProps {
  place: Place;
  onComplete: () => void;
}

interface SpeedResult {
  download: number;
  upload: number;
  latency: number;
  jitter: number;
}

type SpeedTestConfig = NonNullable<ConstructorParameters<typeof SpeedTest>[0]>;

const SPEEDTEST_MEASUREMENTS: SpeedTestConfig['measurements'] = [
  { type: 'latency', numPackets: 1 },
  { type: 'download', bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: 'latency', numPackets: 20 },
  { type: 'download', bytes: 1e5, count: 9 },
  { type: 'download', bytes: 1e6, count: 8 },
  { type: 'upload', bytes: 1e5, count: 8 },
  { type: 'upload', bytes: 1e6, count: 6 },
  { type: 'download', bytes: 1e7, count: 6 },
  { type: 'upload', bytes: 1e7, count: 4 },
  { type: 'download', bytes: 2.5e7, count: 4 },
  { type: 'upload', bytes: 2.5e7, count: 4 },
  { type: 'download', bytes: 1e8, count: 3 },
  { type: 'upload', bytes: 5e7, count: 3 },
  { type: 'download', bytes: 2.5e8, count: 2 },
];

export default function Speedtest({ place, onComplete }: SpeedtestProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [results, setResults] = useState<SpeedResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<InstanceType<typeof SpeedTest> | null>(null);

  const formatSpeed = (mbps: number) => {
    if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
    return `${mbps.toFixed(1)} Mbps`;
  };

  const saveResults = async (result: SpeedResult) => {
    const response = await fetch('/api/speedtests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place_id: place.id,
        download_mbps: result.download,
        upload_mbps: result.upload,
        latency_ms: result.latency,
        jitter_ms: result.jitter,
        packet_loss: null,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save speedtest results');
    }
  };

  const startTest = async () => {
    setStatus('running');
    setError(null);
    setProgress(0);

    try {
      const speedTestOptions = {
        autoStart: false,
        measurements: SPEEDTEST_MEASUREMENTS,
      } satisfies ConstructorParameters<typeof SpeedTest>[0];

      engineRef.current?.pause();
      engineRef.current = new SpeedTest(speedTestOptions);

      engineRef.current.onRunningChange = (running: boolean) => {
        if (!running && engineRef.current?.isFinished) {
          setStatus('complete');
        }
      };

      engineRef.current.onResultsChange = ({ type: _type }) => {
        if (!engineRef.current) return;

        const currentResults = engineRef.current.results;
        let current = 0;

        if (currentResults.getDownloadBandwidthPoints().length) {
          current += 40 * Math.min(currentResults.getDownloadBandwidthPoints().length / 10, 1);
        }
        if (currentResults.getUploadBandwidthPoints().length) {
          current += 35 * Math.min(currentResults.getUploadBandwidthPoints().length / 8, 1);
        }
        if (currentResults.getUnloadedLatency() !== undefined) {
          current += 25;
        }

        setProgress(Math.min(current, 100));
      };

      engineRef.current.onFinish = async (results: Results) => {
        const result: SpeedResult = {
          download: (results.getDownloadBandwidth() || 0) / 1000000,
          upload: (results.getUploadBandwidth() || 0) / 1000000,
          latency: results.getUnloadedLatency() || 0,
          jitter: results.getUnloadedJitter() || 0,
        };

        setResults(result);
        setStatus('complete');
        setProgress(100);

        try {
          await saveResults(result);
          onComplete();
        } catch (saveError) {
          console.error('Speedtest save error:', saveError);
          setError('Test completed, but saving the results failed.');
        }
      };

      engineRef.current.onError = (e: string) => {
        setError(e || 'Speedtest failed');
        setStatus('idle');
      };

      engineRef.current.play();
    } catch (err) {
      console.error('Speedtest error:', err);
      setError('Failed to initialize speedtest');
      setStatus('idle');
    }
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

      {status === 'running' && (
        <div className="py-2">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#2D1B69]">Testing...</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {Math.round(progress)}%
              </span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#2D1B69] to-[#FF6B35] h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="text-xs text-[var(--text-muted)] text-center">
            Measuring download, upload, latency &amp; jitter
          </p>
        </div>
      )}

      {status === 'complete' && results && (
        <div className="py-1">
          <div className="grid grid-cols-2 gap-2.5 mb-3">
            <div className="bg-emerald-50 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#059669"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14" />
                  <path d="m19 12-7 7-7-7" />
                </svg>
                <p className="text-[11px] font-medium text-emerald-600">Download</p>
              </div>
              <p className="text-lg font-bold text-emerald-800 font-mono">
                {formatSpeed(results.download)}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 19V5" />
                  <path d="m5 12 7-7 7 7" />
                </svg>
                <p className="text-[11px] font-medium text-blue-600">Upload</p>
              </div>
              <p className="text-lg font-bold text-blue-800 font-mono">
                {formatSpeed(results.upload)}
              </p>
            </div>
            <div className="bg-amber-50 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#d97706"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                <p className="text-[11px] font-medium text-amber-600">Latency</p>
              </div>
              <p className="text-lg font-bold text-amber-800 font-mono">
                {results.latency.toFixed(0)} ms
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl">
              <div className="flex items-center gap-1.5 mb-1">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#7c3aed"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12h4l3-9 4 18 3-9h4" />
                </svg>
                <p className="text-[11px] font-medium text-purple-600">Jitter</p>
              </div>
              <p className="text-lg font-bold text-purple-800 font-mono">
                {results.jitter.toFixed(1)} ms
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-1.5 text-emerald-600 bg-emerald-50 rounded-lg py-2">
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
