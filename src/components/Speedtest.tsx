'use client';

import { useState, useEffect, useRef } from 'react';
import { Place } from '@/lib/supabase';

interface SpeedtestProps {
  place: Place;
  onComplete: () => void;
}

interface SpeedResult {
  download: number;
  upload: number;
  latency: number;
  jitter: number;
  packetLoss: number;
}

export default function Speedtest({ place, onComplete }: SpeedtestProps) {
  const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [results, setResults] = useState<SpeedResult | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<any>(null);

  const formatSpeed = (mbps: number) => {
    if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
    return `${mbps.toFixed(1)} Mbps`;
  };

  const startTest = async () => {
    setStatus('running');
    setError(null);
    setProgress(0);

    try {
      const SpeedTest = (await import('@cloudflare/speedtest')).default;

      engineRef.current = new SpeedTest({
        autoStart: false,
      });

      engineRef.current.onRunningChange = (running: boolean) => {
        if (!running && status === 'running') {
          setStatus('complete');
        }
      };

      engineRef.current.onResultsChange = ({ type }: { type: string }) => {
        if (!engineRef.current?.results?.raw) return;

        const raw = engineRef.current.results.raw;
        const total = 100;
        let current = 0;

        if (raw.download?.points?.length) {
          current += 30 * (raw.download.points.length / 10);
        }
        if (raw.upload?.points?.length) {
          current += 30 * (raw.upload.points.length / 10);
        }
        if (raw.latency?.points?.length) {
          current += 20;
        }
        if (raw.packetLoss !== undefined) {
          current += 20;
        }

        setProgress(Math.min(current, total));
      };

      engineRef.current.onFinish = (results: any) => {
        const summary = results.getSummary();
        const raw = results.raw;

        const result: SpeedResult = {
          download: summary.getDownloadBandwidth() / 1000000,
          upload: summary.getUploadBandwidth() / 1000000,
          latency: summary.getUnloadedLatency() / 1000000,
          jitter: summary.getJitter() / 1000000,
          packetLoss: raw.packetLoss || 0,
        };

        setResults(result);
        setStatus('complete');

        fetch('/api/speedtests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            place_id: place.id,
            download_mbps: result.download,
            upload_mbps: result.upload,
            latency_ms: result.latency,
            jitter_ms: result.jitter,
            packet_loss: result.packetLoss,
          }),
        }).then(() => onComplete());
      };

      engineRef.current.onError = (e: any) => {
        setError(e.message || 'Speedtest failed');
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
    <div className="bg-white rounded-lg p-6 shadow-lg">
      <h3 className="text-lg font-semibold mb-4">
        Speed Test: {place.name}
      </h3>

      {status === 'idle' && (
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Test your internet speed at this location
          </p>
          <button
            onClick={startTest}
            className="bg-[#2D1B69] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#3d2a8a] transition-colors"
          >
            Start Speed Test
          </button>
        </div>
      )}

      {status === 'running' && (
        <div className="text-center">
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-[#2D1B69] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
          <p className="text-gray-600">Running speed test...</p>
          <p className="text-sm text-gray-400 mt-2">
            This will measure download, upload, latency, and jitter
          </p>
        </div>
      )}

      {status === 'complete' && results && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-700">Download</p>
              <p className="text-2xl font-bold text-green-800">
                {formatSpeed(results.download)}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-700">Upload</p>
              <p className="text-2xl font-bold text-blue-800">
                {formatSpeed(results.upload)}
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-700">Latency</p>
              <p className="text-2xl font-bold text-yellow-800">
                {results.latency.toFixed(0)} ms
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-700">Jitter</p>
              <p className="text-2xl font-bold text-purple-800">
                {results.jitter.toFixed(1)} ms
              </p>
            </div>
          </div>
          <p className="text-center text-green-600 font-medium">
            Test saved successfully!
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}
    </div>
  );
}