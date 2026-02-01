'use client';

import { useRouter } from 'next/navigation';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { AnalyzingState } from '@/components/analysis/AnalysisSkeleton';
import { AnalysisResult } from '@/components/analysis/AnalysisResult';
import { ErrorMessage } from '@/components/ui/error-boundary';
import { UpgradeModal } from '@/components/upgrade/UpgradeModal';
import { useAnalyze } from '@/hooks/useAnalyze';
import { apiFetch } from '@/lib/api-client';

export default function CapturePage() {
  const router = useRouter();
  const { stage, analysisData, error, usage, analyze, reset, dismissLimitModal, isLimitExceeded } =
    useAnalyze();

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

  // Map hook stages to page stages
  const pageStage = stage === 'idle' ? 'capture' : stage === 'limit_exceeded' ? 'capture' : stage;

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <h1 className="text-2xl font-bold text-white mb-6">
        {pageStage === 'capture' && 'Capture Photo'}
        {pageStage === 'analyzing' && 'Analyzing...'}
        {pageStage === 'result' && 'Analysis Results'}
        {pageStage === 'error' && 'Error'}
      </h1>

      {/* Usage indicator */}
      {usage && pageStage === 'capture' && (
        <div className="mb-4 p-3 rounded-lg bg-slate-800/50 border border-slate-700">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-slate-400">Daily analyses</span>
            <span className="text-slate-300">
              {usage.remaining} of {usage.limit} remaining
            </span>
          </div>
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
              style={{ width: `${((usage.limit - usage.remaining) / usage.limit) * 100}%` }}
            />
          </div>
        </div>
      )}

      {pageStage === 'capture' && (
        <CameraCapture
          onCapture={analyze}
          onClose={() => router.push('/')}
          className="aspect-[4/3] max-h-[70vh]"
        />
      )}

      {pageStage === 'analyzing' && <AnalyzingState />}

      {pageStage === 'result' && analysisData && (
        <AnalysisResult
          id={analysisData.id}
          imageUrl={analysisData.imageUrl}
          sceneDescription={analysisData.sceneDescription}
          sceneDescriptionZh={analysisData.sceneDescriptionZh}
          sceneDescriptionPinyin={analysisData.sceneDescriptionPinyin}
          objects={analysisData.objects}
          exampleSentences={analysisData.exampleSentences}
          hskLevels={analysisData.hskLevels}
          onSaveWord={handleSaveWord}
          onUploadAnother={reset}
        />
      )}

      {pageStage === 'error' && (
        <ErrorMessage
          title="Analysis Failed"
          message={error || 'Something went wrong. Please try again.'}
          onRetry={reset}
        />
      )}

      {/* Upgrade Modal for limit exceeded */}
      <UpgradeModal
        open={isLimitExceeded}
        onClose={dismissLimitModal}
        usage={usage ? { current: usage.current, limit: usage.limit } : undefined}
      />
    </div>
  );
}
