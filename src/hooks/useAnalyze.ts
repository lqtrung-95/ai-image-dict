'use client';

import { useState, useCallback } from 'react';
import { compressImage, extractBase64 } from '@/lib/utils';

interface AnalysisData {
  id: string;
  imageUrl: string;
  sceneDescription: string;
  sceneDescriptionZh?: string;
  sceneDescriptionPinyin?: string;
  objects: Array<{
    id: string;
    label_en: string;
    label_zh: string;
    pinyin: string;
    category: string;
    confidence: number;
  }>;
  exampleSentences?: Record<string, { zh: string; pinyin: string; en: string }>;
  hskLevels?: Record<string, number | null>;
  usage?: {
    current: number;
    limit: number;
    remaining: number;
  };
}

interface UsageInfo {
  current: number;
  limit: number;
  remaining: number;
}

type Stage = 'idle' | 'analyzing' | 'result' | 'error' | 'limit_exceeded';

export function useAnalyze() {
  const [stage, setStage] = useState<Stage>('idle');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageInfo | null>(null);

  const analyze = useCallback(async (imageData: string) => {
    setStage('analyzing');
    setError(null);

    try {
      // Compress image before sending
      const compressedImage = await compressImage(imageData, 1024);
      const base64 = extractBase64(compressedImage);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle limit exceeded specially
        if (response.status === 429 && data.code === 'LIMIT_EXCEEDED') {
          setUsage(data.usage);
          setStage('limit_exceeded');
          return;
        }
        throw new Error(data.error || 'Analysis failed');
      }

      // Update usage info from successful response
      if (data.usage) {
        setUsage(data.usage);
      }

      setAnalysisData(data);
      setStage('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      setStage('error');
    }
  }, []);

  const reset = useCallback(() => {
    setStage('idle');
    setError(null);
    setAnalysisData(null);
  }, []);

  const dismissLimitModal = useCallback(() => {
    setStage('idle');
  }, []);

  return {
    stage,
    analysisData,
    error,
    usage,
    analyze,
    reset,
    dismissLimitModal,
    isLimitExceeded: stage === 'limit_exceeded',
  };
}

