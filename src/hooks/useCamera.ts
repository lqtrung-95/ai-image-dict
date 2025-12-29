'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = useCallback(async (facing: 'user' | 'environment' = 'environment') => {
    try {
      setError(null);
      setIsReady(false);

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      // Check if component is still mounted and video element exists
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        
        // Wait for video to be ready before playing
        await new Promise<void>((resolve, reject) => {
          const video = videoRef.current;
          if (!video) {
            reject(new Error('Video element not found'));
            return;
          }
          
          const handleCanPlay = () => {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            resolve();
          };
          
          const handleError = () => {
            video.removeEventListener('canplay', handleCanPlay);
            video.removeEventListener('error', handleError);
            reject(new Error('Video failed to load'));
          };
          
          video.addEventListener('canplay', handleCanPlay);
          video.addEventListener('error', handleError);
        });
        
        // Only play if video element still exists
        if (videoRef.current) {
          await videoRef.current.play();
          setStream(mediaStream);
          setFacingMode(facing);
          setIsReady(true);
        } else {
          // Component unmounted, stop the stream
          mediaStream.getTracks().forEach((track) => track.stop());
        }
      } else {
        // Component unmounted, stop the stream
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    } catch (err) {
      // Ignore AbortError which happens when component unmounts
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      const errorMessage =
        err instanceof Error
          ? err.name === 'NotAllowedError'
            ? 'Camera access denied. Please enable camera permissions in your browser settings.'
            : err.name === 'NotFoundError'
              ? 'No camera found on this device.'
              : `Camera error: ${err.message}`
          : 'Failed to access camera';
      setError(errorMessage);
      setIsReady(false);
    }
  }, [stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsReady(false);
  }, [stream]);

  const switchCamera = useCallback(() => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user';
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current || !isReady) return null;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Flip horizontally if using front camera
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0);

    return canvas.toDataURL('image/jpeg', 0.85);
  }, [isReady, facingMode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  return {
    videoRef,
    stream,
    error,
    isReady,
    facingMode,
    startCamera,
    stopCamera,
    switchCamera,
    capturePhoto,
  };
}

