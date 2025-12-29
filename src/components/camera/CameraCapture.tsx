'use client';

import { useEffect } from 'react';
import { useCamera } from '@/hooks/useCamera';
import { Button } from '@/components/ui/button';
import { Camera, SwitchCamera, X, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClose?: () => void;
  className?: string;
}

export function CameraCapture({ onCapture, onClose, className }: CameraCaptureProps) {
  const { videoRef, error, isReady, startCamera, stopCamera, switchCamera, capturePhoto } =
    useCamera();

  useEffect(() => {
    startCamera('environment');
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = () => {
    const imageData = capturePhoto();
    if (imageData) {
      stopCamera();
      onCapture(imageData);
    }
  };

  if (error) {
    return (
      <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Camera Access Required</h3>
        <p className="text-slate-400 mb-4 max-w-sm">{error}</p>
        <div className="flex gap-2">
          <Button
            onClick={() => startCamera('environment')}
            className="bg-purple-600 hover:bg-purple-700"
          >
            Try Again
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose} className="border-slate-600">
              Cancel
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative bg-black rounded-xl overflow-hidden', className)}>
      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(1)' }}
      />

      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">Initializing camera...</p>
          </div>
        </div>
      )}

      {/* Controls overlay */}
      {isReady && (
        <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="flex items-center justify-center gap-4">
            {/* Switch camera button */}
            <Button
              variant="outline"
              size="icon"
              onClick={switchCamera}
              className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <SwitchCamera className="w-5 h-5" />
            </Button>

            {/* Capture button */}
            <Button
              size="lg"
              onClick={handleCapture}
              className="rounded-full w-16 h-16 bg-white hover:bg-slate-100 text-slate-900"
            >
              <Camera className="w-6 h-6" />
            </Button>

            {/* Close button */}
            {onClose && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="rounded-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Viewfinder guides */}
      {isReady && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/50" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/50" />
          <div className="absolute bottom-20 left-4 w-8 h-8 border-l-2 border-b-2 border-white/50" />
          <div className="absolute bottom-20 right-4 w-8 h-8 border-r-2 border-b-2 border-white/50" />
        </div>
      )}
    </div>
  );
}

