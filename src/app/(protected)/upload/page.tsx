'use client';

import { useState } from 'react';
import { PhotoUpload } from '@/components/upload/PhotoUpload';
import { AnalyzingState } from '@/components/analysis/AnalysisSkeleton';
import { AnalysisResult } from '@/components/analysis/AnalysisResult';
import { ErrorMessage } from '@/components/ui/error-boundary';
import { compressImage, extractBase64 } from '@/lib/utils';

interface AnalysisData {
  id: string;
  imageUrl: string;
  sceneDescription: string;
  objects: Array<{
    id: string;
    label_en: string;
    label_zh: string;
    pinyin: string;
    category: string;
    confidence: number;
  }>;
}

export default function UploadPage() {
  const [stage, setStage] = useState<'upload' | 'analyzing' | 'result' | 'error'>('upload');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (imageData: string) => {
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

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Analysis failed');
      }

      const data = await response.json();
      setAnalysisData(data);
      setStage('result');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      setStage('error');
    }
  };

  const handleSaveWord = async (word: {
    wordZh: string;
    wordPinyin: string;
    wordEn: string;
    detectedObjectId: string;
    collectionId?: string;
  }) => {
    const response = await fetch('/api/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(word),
    });

    if (!response.ok && response.status !== 409) {
      throw new Error('Failed to save word');
    }
  };

  const handleRetry = () => {
    setStage('upload');
    setError(null);
    setAnalysisData(null);
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">
        {stage === 'upload' && 'Upload Photo'}
        {stage === 'analyzing' && 'Analyzing...'}
        {stage === 'result' && 'Analysis Results'}
        {stage === 'error' && 'Error'}
      </h1>

      {stage === 'upload' && <PhotoUpload onUpload={handleUpload} />}

      {stage === 'analyzing' && <AnalyzingState />}

      {stage === 'result' && analysisData && (
        <AnalysisResult
          id={analysisData.id}
          imageUrl={analysisData.imageUrl}
          sceneDescription={analysisData.sceneDescription}
          objects={analysisData.objects}
          onSaveWord={handleSaveWord}
        />
      )}

      {stage === 'error' && (
        <ErrorMessage
          title="Analysis Failed"
          message={error || 'Something went wrong. Please try again.'}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}

