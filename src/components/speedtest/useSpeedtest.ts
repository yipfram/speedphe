'use client';

import type { Results } from '@cloudflare/speedtest';
import SpeedTest from '@cloudflare/speedtest';
import { createLoggedClientError, isLoggedClientError, logClientError } from '@/lib/logging';
import { useEffect, useRef, useState } from 'react';

interface UseSpeedtestParams {
  ensurePlaceId: () => Promise<string>;
  onComplete: () => void;
}

export interface SpeedResult {
  download: number | null;
  upload: number | null;
  latency: number | null;
  jitter: number | null;
}

type SpeedTestConfig = NonNullable<ConstructorParameters<typeof SpeedTest>[0]>;

const SPEEDTEST_MEASUREMENTS: SpeedTestConfig['measurements'] = [
  { type: 'latency', numPackets: 1 },
  { type: 'download', bytes: 1e5, count: 1, bypassMinDuration: true },
  { type: 'latency', numPackets: 10 },
  { type: 'download', bytes: 1e5, count: 5 },
  { type: 'download', bytes: 1e6, count: 4 },
  { type: 'upload', bytes: 1e5, count: 4 },
  { type: 'upload', bytes: 1e6, count: 4 },
  { type: 'download', bytes: 1e7, count: 3 },
  { type: 'upload', bytes: 1e7, count: 3 },
  { type: 'download', bytes: 2.5e7, count: 2 },
  { type: 'upload', bytes: 2.5e7, count: 2 },
];

const EMPTY_RESULTS: SpeedResult = {
  download: null,
  upload: null,
  latency: null,
  jitter: null,
};

const getCurrentResults = (speedResults: Results): SpeedResult => ({
  download: (speedResults.getDownloadBandwidth() ?? 0) / 1000000 || null,
  upload: (speedResults.getUploadBandwidth() ?? 0) / 1000000 || null,
  latency: speedResults.getUnloadedLatency() ?? null,
  jitter: speedResults.getUnloadedJitter() ?? null,
});

// TODO: Implement loss packets
export function useSpeedtest({ ensurePlaceId, onComplete }: UseSpeedtestParams) {
  const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle');
  const [results, setResults] = useState<SpeedResult>(EMPTY_RESULTS);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const engineRef = useRef<InstanceType<typeof SpeedTest> | null>(null);

  useEffect(() => {
    return () => {
      engineRef.current?.pause();
    };
  }, []);

  const formatSpeed = (mbps: number) => {
    if (mbps >= 1000) return `${(mbps / 1000).toFixed(1)} Gbps`;
    return `${mbps.toFixed(1)} Mbps`;
  };

  const saveResults = async (placeId: string, result: SpeedResult) => {
    const response = await fetch('/api/speedtests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        place_id: placeId,
        download_mbps: result.download,
        upload_mbps: result.upload,
        latency_ms: result.latency,
        jitter_ms: result.jitter,
        packet_loss: null,
      }),
    });
    const data: { error?: string; requestId?: string } = await response.json();

    if (!response.ok) {
      const errorMessage = data.error ?? 'Failed to save speedtest results';

      logClientError('client.fetch.error', {
        action: 'speedtests.save',
        endpoint: '/api/speedtests',
        status: response.status,
        requestId: data.requestId,
        message: errorMessage,
      });
      throw createLoggedClientError(errorMessage);
    }
  };

  const startTest = async () => {
    setStatus('running');
    setError(null);
    setProgress(0);
    setResults(EMPTY_RESULTS);

    try {
      const placeId = await ensurePlaceId();
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

      engineRef.current.onResultsChange = () => {
        if (!engineRef.current) return;

        const currentResults = engineRef.current.results;
        setResults(getCurrentResults(currentResults));
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

        setProgress(Math.min(current, 95));
      };

      engineRef.current.onFinish = async (speedResults: Results) => {
        const result = getCurrentResults(speedResults);

        setResults(result);
        setStatus('complete');
        setProgress(100);

        try {
          await saveResults(placeId, {
            download: result.download ?? 0,
            upload: result.upload ?? 0,
            latency: result.latency ?? 0,
            jitter: result.jitter ?? 0,
          });
          onComplete();
        } catch (saveError) {
          if (!isLoggedClientError(saveError)) {
            logClientError('client.fetch.error', {
              action: 'speedtests.save',
              endpoint: '/api/speedtests',
              message:
                saveError instanceof Error ? saveError.message : 'Failed to save speedtest results',
            });
          }
          setError('Test completed, but saving the results failed.');
        }
      };

      engineRef.current.onError = (speedtestError: string) => {
        setError(speedtestError || 'Speedtest failed');
        setStatus('idle');
      };

      engineRef.current.play();
    } catch (err) {
      logClientError('client.fetch.error', {
        action: 'speedtests.initialize',
        endpoint: 'cloudflare-speedtest',
        message: err instanceof Error ? err.message : 'Failed to initialize speedtest',
      });
      setError('Failed to initialize speedtest');
      setStatus('idle');
    }
  };

  return {
    error,
    formatSpeed,
    progress,
    results,
    startTest,
    status,
  };
}
