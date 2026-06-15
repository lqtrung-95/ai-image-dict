'use client';

import { useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CameraCapture } from '@/components/camera/CameraCapture';
import { AnalyzingState } from '@/components/analysis/AnalysisSkeleton';
import { AnalysisResult } from '@/components/analysis/AnalysisResult';
import { ErrorMessage } from '@/components/ui/error-boundary';
import { UpgradeModal } from '@/components/upgrade/UpgradeModal';
import { useAnalyze } from '@/hooks/useAnalyze';
import { apiFetch } from '@/lib/api-client';
import { cn } from '@/lib/utils';

type CaptureMode = 'camera' | 'upload';

export default function CapturePage() {
  const router = useRouter();
  const { stage, analysisData, error, usage, analyze, reset, dismissLimitModal, isLimitExceeded } =
    useAnalyze();
  const [captureMode, setCaptureMode] = useState<CaptureMode>('camera');
  const [dragOver, setDragOver] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPreviewUrl(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyzeUpload = useCallback(() => {
    if (previewUrl) {
      analyze(previewUrl);
      setPreviewUrl(null);
    }
  }, [previewUrl, analyze]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleReset = () => {
    setPreviewUrl(null);
    reset();
  };

  const pageStage = stage === 'idle' ? 'capture' : stage === 'limit_exceeded' ? 'capture' : stage;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#e0e2e8] tracking-tight">
          {pageStage === 'capture' && 'Capture Photo'}
          {pageStage === 'analyzing' && 'Analyzing...'}
          {pageStage === 'result' && 'Analysis Results'}
          {pageStage === 'error' && 'Error'}
        </h1>
        <p className="text-[#bacbbe] mt-1 text-sm">Snap or upload a photo to extract Chinese vocabulary</p>
      </div>

      {/* Usage indicator */}
      {usage && pageStage === 'capture' && (
        <div className="mb-5 p-4 rounded-xl bg-[#181c20] border border-white/5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#bacbbe]">Daily analyses</span>
            <span className="text-[#e0e2e8] font-medium">
              {usage.remaining} of {usage.limit} remaining
            </span>
          </div>
          <div className="h-1.5 bg-[#272a2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#76ffbb] transition-all rounded-full"
              style={{ width: `${((usage.limit - usage.remaining) / usage.limit) * 100}%` }}
            />
          </div>
        </div>
      )}

      {pageStage === 'capture' && (
        <>
          {/* Mode tabs */}
          <div className="flex gap-1 p-1 bg-[#181c20] border border-white/5 rounded-xl mb-5 w-fit">
            <button
              onClick={() => setCaptureMode('camera')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                captureMode === 'camera'
                  ? 'bg-[#76ffbb]/10 text-[#76ffbb] border border-[#76ffbb]/30'
                  : 'text-[#bacbbe] hover:text-[#e0e2e8]'
              )}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>photo_camera</span>
              Camera
            </button>
            <button
              onClick={() => setCaptureMode('upload')}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                captureMode === 'upload'
                  ? 'bg-[#76ffbb]/10 text-[#76ffbb] border border-[#76ffbb]/30'
                  : 'text-[#bacbbe] hover:text-[#e0e2e8]'
              )}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>upload</span>
              Upload
            </button>
          </div>

          {captureMode === 'camera' && (
            <CameraCapture
              onCapture={analyze}
              onClose={() => router.push('/')}
              className="aspect-[4/3] max-h-[70vh]"
            />
          )}

          {captureMode === 'upload' && (
            <div className="space-y-4">
              {previewUrl ? (
                /* Preview before analyzing */
                <div className="relative rounded-xl overflow-hidden bg-[#181c20] border border-white/5">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full max-h-[70vh] object-contain"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex gap-3 justify-center">
                    <button
                      onClick={() => setPreviewUrl(null)}
                      className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                    >
                      Choose Different
                    </button>
                    <button
                      onClick={handleAnalyzeUpload}
                      className="px-6 py-2 rounded-lg bg-[#76ffbb] text-[#003822] text-sm font-semibold hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>auto_awesome</span>
                      Analyze Photo
                    </button>
                  </div>
                </div>
              ) : (
                /* Drop zone */
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'aspect-[4/3] max-h-[70vh] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all',
                    dragOver
                      ? 'border-[#76ffbb] bg-[#76ffbb]/5'
                      : 'border-white/10 bg-[#181c20] hover:border-[#76ffbb]/40 hover:bg-[#76ffbb]/5'
                  )}
                >
                  <span className="material-symbols-outlined text-5xl text-[#849589] mb-4">
                    {dragOver ? 'download' : 'add_photo_alternate'}
                  </span>
                  <p className="text-[#e0e2e8] font-medium mb-1">
                    {dragOver ? 'Drop to upload' : 'Drop an image here'}
                  </p>
                  <p className="text-[#849589] text-sm mb-4">or click to browse your files</p>
                  <span className="px-4 py-2 rounded-lg bg-[#76ffbb]/10 border border-[#76ffbb]/30 text-[#76ffbb] text-sm font-medium">
                    Browse Files
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                  />
                </div>
              )}
            </div>
          )}
        </>
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
          onUploadAnother={handleReset}
        />
      )}

      {pageStage === 'error' && (
        <ErrorMessage
          title="Analysis Failed"
          message={error || 'Something went wrong. Please try again.'}
          onRetry={handleReset}
        />
      )}

      <UpgradeModal
        open={isLimitExceeded}
        onClose={dismissLimitModal}
        usage={usage ? { current: usage.current, limit: usage.limit } : undefined}
      />
    </div>
  );
}
