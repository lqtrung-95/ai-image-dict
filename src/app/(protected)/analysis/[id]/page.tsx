'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AnalysisResult } from '@/components/analysis/AnalysisResult';
import { AnalysisSkeleton } from '@/components/analysis/AnalysisSkeleton';
import { ErrorMessage } from '@/components/ui/error-boundary';
import { createClient } from '@/lib/supabase/client';
import { apiFetch } from '@/lib/api-client';

interface AnalysisData {
  id: string;
  image_url: string;
  scene_context: {
    description?: string;
  };
  detected_objects: Array<{
    id: string;
    label_en: string;
    label_zh: string;
    pinyin: string;
    category: string;
    confidence: number;
  }>;
}

export default function AnalysisPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('photo_analyses')
        .select('*, detected_objects(*)')
        .eq('id', id)
        .single();

      if (error) {
        setError('Analysis not found');
      } else {
        setAnalysis(data);
      }
      setLoading(false);
    };

    fetchAnalysis();
  }, [id]);

  const handleSaveWord = async (word: {
    wordZh: string;
    wordPinyin: string;
    wordEn: string;
    detectedObjectId: string;
    listId?: string;
    exampleSentence?: string;
    hskLevel?: number | null;
  }) => {
    const response = await apiFetch('/api/vocabulary', {
      method: 'POST',
      body: JSON.stringify(word),
    });

    if (!response.ok && response.status !== 409) {
      throw new Error('Failed to save word');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Analysis</h1>
        <AnalysisSkeleton />
      </div>
    );
  }

  if (error || !analysis) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <h1 className="text-2xl font-bold text-white mb-6">Analysis</h1>
        <ErrorMessage
          title="Not Found"
          message={error || 'Analysis not found'}
          onRetry={() => router.push('/history')}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">Analysis Results</h1>
      <AnalysisResult
        id={analysis.id}
        imageUrl={analysis.image_url}
        sceneDescription={analysis.scene_context?.description}
        objects={analysis.detected_objects}
        onSaveWord={handleSaveWord}
        onUploadAnother={() => router.push('/upload')}
      />
    </div>
  );
}

