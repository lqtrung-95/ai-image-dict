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
        <p className="text-[#bacbbe] mb-4">Native camera is only available in the mobile app.</p>
        <Link href="/capture">
          <Button className="bg-[#76ffbb] hover:opacity-90">
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
          <Button variant="ghost" size="icon" className="text-[#bacbbe]">
            <ChevronLeft className="w-5 h-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold text-white">Take Photo</h1>
      </div>

      {!capturedImage ? (
        <Card className="bg-[#1c2024] border-white/10 p-8">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#76ffbb]/10 flex items-center justify-center">
              <Camera className="w-10 h-10 text-[#76ffbb]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white mb-2">Capture Vocabulary</h2>
              <p className="text-[#bacbbe]">
                Take a photo of objects around you to learn their names in Chinese
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button
                onClick={handleTakePhoto}
                disabled={isLoading}
                className="bg-[#76ffbb] hover:opacity-90 h-14 text-lg"
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
                className="border-white/10 text-[#e0e2e8] hover:bg-[#272a2e] h-14"
              >
                <ImageIcon className="w-5 h-5 mr-2" />
                Choose from Gallery
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="bg-[#1c2024] border-white/10 overflow-hidden">
          <div className="aspect-square bg-[#101417] relative">
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
              className="flex-1 border-white/10 text-[#e0e2e8] hover:bg-[#272a2e]"
            >
              Retake
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing}
              className="flex-1 bg-[#76ffbb] hover:opacity-90"
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
