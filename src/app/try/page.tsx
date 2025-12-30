'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PhotoUpload } from '@/components/upload/PhotoUpload';
import { AnalyzingState } from '@/components/analysis/AnalysisSkeleton';
import { TrialResult } from '@/components/analysis/TrialResult';
import { ErrorMessage } from '@/components/ui/error-boundary';
import { compressImage, extractBase64 } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Camera, Upload, ArrowLeft } from 'lucide-react';

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
  exampleSentences?: Record<string, { zh: string; pinyin: string; en: string }>;
}

type Mode = 'choose' | 'camera' | 'upload' | 'analyzing' | 'result' | 'error';

export default function TryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('choose');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasTriedBefore, setHasTriedBefore] = useState(false);

  useEffect(() => {
    // Check if user has tried before
    const tried = localStorage.getItem('trial_used');
    if (tried) {
      setHasTriedBefore(true);
    }
  }, []);

  // If logged in, redirect to capture
  useEffect(() => {
    if (user) {
      router.push('/capture');
    }
  }, [user, router]);

  const handleAnalyze = async (imageData: string) => {
    setMode('analyzing');
    setError(null);

    try {
      // Compress image before sending
      const compressedImage = await compressImage(imageData, 1024);
      const base64 = extractBase64(compressedImage);

      const response = await fetch('/api/analyze-trial', {
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
      setMode('result');

      // Mark trial as used
      localStorage.setItem('trial_used', 'true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze image');
      setMode('error');
    }
  };

  const handleRetry = () => {
    setMode('choose');
    setError(null);
    setAnalysisData(null);
  };

  // Show limited trial for returning visitors
  if (hasTriedBefore && mode === 'choose') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-4">You've already tried the demo! 🎉</h1>
          <p className="text-slate-400 mb-6">
            Create a free account to get unlimited analyses, save vocabulary, 
            practice with flashcards, and track your progress.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => router.push('/signup')}
              className="w-full bg-purple-600 hover:bg-purple-700"
              size="lg"
            >
              Create Free Account
            </Button>
            <Button 
              onClick={() => router.push('/login')}
              variant="outline"
              className="w-full border-slate-600 text-slate-300"
            >
              Already have an account? Sign in
            </Button>
            <Button 
              onClick={() => {
                localStorage.removeItem('trial_used');
                setHasTriedBefore(false);
              }}
              variant="ghost"
              className="w-full text-slate-500"
              size="sm"
            >
              Try again anyway
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {mode === 'choose' && (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-3">Try AI Image Dictionary</h1>
            <p className="text-slate-400">
              Capture or upload a photo to see AI-powered Chinese vocabulary detection in action.
              <br />
              <span className="text-purple-400">No sign-up required!</span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            <button
              onClick={() => setMode('camera')}
              className="group p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-purple-500/50 transition-all text-left"
            >
              <div className="w-16 h-16 mb-4 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Camera className="w-8 h-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Use Camera</h2>
              <p className="text-slate-400">
                Take a photo of objects around you
              </p>
            </button>

            <button
              onClick={() => setMode('upload')}
              className="group p-8 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-blue-500/50 transition-all text-left"
            >
              <div className="w-16 h-16 mb-4 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">Upload Photo</h2>
              <p className="text-slate-400">
                Choose an image from your device
              </p>
            </button>
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            Your photo is analyzed securely and not stored.
          </p>
        </>
      )}

      {mode === 'camera' && (
        <>
          <Button
            variant="ghost"
            onClick={() => setMode('choose')}
            className="text-slate-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white mb-6">Take a Photo</h1>
          {/* Dynamic import for camera to avoid SSR issues */}
          <CameraSection onCapture={handleAnalyze} />
        </>
      )}

      {mode === 'upload' && (
        <>
          <Button
            variant="ghost"
            onClick={() => setMode('choose')}
            className="text-slate-400 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-white mb-6">Upload Photo</h1>
          <PhotoUpload onUpload={handleAnalyze} />
        </>
      )}

      {mode === 'analyzing' && (
        <>
          <h1 className="text-2xl font-bold text-white mb-6">Analyzing...</h1>
          <AnalyzingState />
        </>
      )}

      {mode === 'result' && analysisData && (
        <TrialResult
          imageUrl={analysisData.imageUrl}
          sceneDescription={analysisData.sceneDescription}
          objects={analysisData.objects}
          exampleSentences={analysisData.exampleSentences}
          onTryAgain={handleRetry}
        />
      )}

      {mode === 'error' && (
        <ErrorMessage
          title="Analysis Failed"
          message={error || 'Something went wrong. Please try again.'}
          onRetry={handleRetry}
        />
      )}
    </div>
  );
}

// Camera section component to handle dynamic camera import
function CameraSection({ onCapture }: { onCapture: (data: string) => void }) {
  const [CameraComponent, setCameraComponent] = useState<React.ComponentType<{
    onCapture: (data: string) => void;
    onClose: () => void;
    className?: string;
  }> | null>(null);

  useEffect(() => {
    import('@/components/camera/CameraCapture').then((mod) => {
      setCameraComponent(() => mod.CameraCapture);
    });
  }, []);

  if (!CameraComponent) {
    return <div className="h-72 bg-slate-800/50 rounded-2xl animate-pulse" />;
  }

  return (
    <CameraComponent
      onCapture={onCapture}
      onClose={() => {}}
      className="aspect-[4/3] max-h-[70vh]"
    />
  );
}

