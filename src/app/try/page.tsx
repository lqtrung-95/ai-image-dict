'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { PhotoUpload } from '@/components/upload/PhotoUpload';
import { AnalyzingState } from '@/components/analysis/AnalysisSkeleton';
import { TrialResult } from '@/components/analysis/TrialResult';
import { ErrorMessage } from '@/components/ui/error-boundary';
import { compressImage, extractBase64 } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, Upload, ArrowLeft, Sparkles } from 'lucide-react';

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

const MAX_TRIALS_PER_DAY = 3;

// Helper to get today's date key
const getTodayKey = () => new Date().toISOString().split('T')[0];

// Helper to get trial count for today
const getTrialCount = (): number => {
  if (typeof window === 'undefined') return 0;
  const data = localStorage.getItem('trial_data');
  if (!data) return 0;
  
  try {
    const parsed = JSON.parse(data);
    if (parsed.date !== getTodayKey()) {
      // Reset for new day
      return 0;
    }
    return parsed.count || 0;
  } catch {
    return 0;
  }
};

// Helper to increment trial count
const incrementTrialCount = () => {
  const today = getTodayKey();
  const currentCount = getTrialCount();
  localStorage.setItem('trial_data', JSON.stringify({
    date: today,
    count: currentCount + 1,
  }));
};

export default function TryPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [mode, setMode] = useState<Mode>('choose');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [trialsUsed, setTrialsUsed] = useState(0);
  const [trialsRemaining, setTrialsRemaining] = useState(MAX_TRIALS_PER_DAY);

  const updateTrialCounts = useCallback(() => {
    const used = getTrialCount();
    setTrialsUsed(used);
    setTrialsRemaining(Math.max(0, MAX_TRIALS_PER_DAY - used));
  }, []);

  useEffect(() => {
    updateTrialCounts();
  }, [updateTrialCounts]);

  // If logged in, redirect to capture
  useEffect(() => {
    if (user) {
      router.push('/capture');
    }
  }, [user, router]);

  const handleAnalyze = async (imageData: string) => {
    // Check if trials exceeded
    if (trialsRemaining <= 0) {
      setError('You have used all your free trials for today. Sign up for unlimited access!');
      setMode('error');
      return;
    }

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

      // Increment trial count
      incrementTrialCount();
      updateTrialCounts();
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

  const hasTrialsLeft = trialsRemaining > 0;

  // Show limit reached screen
  if (!hasTrialsLeft && mode === 'choose') {
    return (
      <div className="container mx-auto px-4 py-12 max-w-lg text-center">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-500/20 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-orange-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            You've used all {MAX_TRIALS_PER_DAY} free trials today! 🎉
          </h1>
          <p className="text-slate-400 mb-6">
            Come back tomorrow for more, or create a free account for unlimited analyses.
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
          </div>
          <p className="text-slate-500 text-sm mt-6">
            Free trials reset daily at midnight.
          </p>
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
            </p>
            {/* Trial counter */}
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-purple-300 text-sm">
                {trialsRemaining} free {trialsRemaining === 1 ? 'trial' : 'trials'} remaining today
              </span>
            </div>
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

          {/* Signup CTA */}
          <Card className="max-w-2xl mx-auto mt-8 p-4 bg-gradient-to-r from-purple-900/30 to-pink-900/30 border-purple-500/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-slate-300 text-sm">
                Want unlimited analyses and vocabulary saving?
              </p>
              <Button 
                onClick={() => router.push('/signup')}
                className="bg-white text-purple-900 hover:bg-slate-100 whitespace-nowrap"
              >
                Create Free Account
              </Button>
            </div>
          </Card>
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Take a Photo</h1>
            <span className="text-sm text-purple-400">
              {trialsRemaining} {trialsRemaining === 1 ? 'trial' : 'trials'} left
            </span>
          </div>
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
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-white">Upload Photo</h1>
            <span className="text-sm text-purple-400">
              {trialsRemaining} {trialsRemaining === 1 ? 'trial' : 'trials'} left
            </span>
          </div>
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
        <>
          {/* Trial counter reminder */}
          <div className="mb-4 text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 text-sm text-slate-400">
              {trialsRemaining} free {trialsRemaining === 1 ? 'trial' : 'trials'} remaining today
            </span>
          </div>
          <TrialResult
            imageUrl={analysisData.imageUrl}
            sceneDescription={analysisData.sceneDescription}
            objects={analysisData.objects}
            exampleSentences={analysisData.exampleSentences}
            onTryAgain={handleRetry}
          />
        </>
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
