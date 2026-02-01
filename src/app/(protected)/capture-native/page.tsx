'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, ImageIcon, Loader2, ChevronLeft } from 'lucide-react';
import { useNativeCamera } from '@/hooks/use-native-camera';
import { toast } from 'sonner';
import { useAnalyze } from '@/hooks/useAnalyze';
import Link from 'next/link';

export default function NativeCapturePage() {
  const router = useRouter();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { takePhoto, selectFromGallery, isLoading, isNative } = useNativeCamera({
    onImageCapture: (imageData) => {
      setCapturedImage(imageData);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const { analyze, stage, analysisData } = useAnalyze();
  const analyzing = stage === 'analyzing';

  // Handle navigation when analysis is complete
  useEffect(() => {
    if (analysisData?.id) {
      router.push(`/analysis/${analysisData.id}`);
    }
  }, [analysisData, router]);

  const handleTakePhoto = async () => {
    try {
      await takePhoto();
    } catch {
      // Error handled by hook
    }
  };

  const handleSelectFromGallery = async () => {
    try {
      await selectFromGallery();
    } catch {
      // Error handled by hook
    }
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    await analyze(capturedImage);
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };

  // If not on native platform, redirect to regular capture
  if (!isNative && typeof window !== 'undefined') {
    return (
      <div className="container mx-auto px-4 py-6 max-w-2xl text-center">
        <p className="text-slate-400 mb-4">Native camera is only available in the mobile app.</p>
        <Link href="/capture">
          <Button className="bg-purple-600 hover:bg-purple-700">
            Use Web Camera
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/">
          <Button variant="ghost" size="icon" className="text-slate-400">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Take Photo</h1>
      </div>

      {!capturedImage ? (
        <Card className="bg-slate-800/50 border-slate-700 p-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-purple-600/20 flex items-center justify-center">
              <Camera className="w-10 h-10 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Capture Vocabulary</h2>
              <p className="text-slate-400">
                Take a photo of objects around you to learn their names in Chinese
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleTakePhoto}
                disabled={isLoading}
                className="bg-purple-600 hover:bg-purple-700 h-14 text-lg"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                ) : (
                  <Camera className="w-5 h-5 mr-2" />
                )}
                Take Photo
              </Button>
              <Button
                onClick={handleSelectFromGallery}
                disabled={isLoading}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-700 h-14"
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                Choose from Gallery
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
          <div className="aspect-square bg-slate-900 relative">
            <img
              src={capturedImage}
              alt="Captured"
              className="w-full h-full object-contain"
            />
          </div>
          <div className="p-4 flex gap-3">
            <Button
              onClick={handleRetake}
              variant="outline"
              className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Retake
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex-1 bg-purple-600 hover:bg-purple-700"
            >
              {analyzing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Camera className="w-4 h-4 mr-2" />
              )}
              Analyze
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
