'use client';

import { useState, useCallback } from 'react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface UseNativeCameraOptions {
  onImageCapture?: (imageData: string) => void;
  onError?: (error: Error) => void;
}

export function useNativeCamera(options: UseNativeCameraOptions = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [isNative, setIsNative] = useState(() => Capacitor.isNativePlatform());

  const requestPermissions = useCallback(async () => {
    if (!isNative) return true;

    try {
      const permission = await Camera.requestPermissions();
      return permission.camera === 'granted';
    } catch {
      return false;
    }
  }, [isNative]);

  const takePhoto = useCallback(async () => {
    setIsLoading(true);

    try {
      if (isNative) {
        // Use native camera
        const hasPermission = await requestPermissions();
        if (!hasPermission) {
          throw new Error('Camera permission denied');
        }

        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Camera,
        });

        if (image.base64String) {
          const imageData = `data:image/jpeg;base64,${image.base64String}`;
          options.onImageCapture?.(imageData);
          return imageData;
        }
      }
      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to take photo');
      options.onError?.(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, requestPermissions, options]);

  const selectFromGallery = useCallback(async () => {
    setIsLoading(true);

    try {
      if (isNative) {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Photos,
        });

        if (image.base64String) {
          const imageData = `data:image/jpeg;base64,${image.base64String}`;
          options.onImageCapture?.(imageData);
          return imageData;
        }
      }
      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Failed to select photo');
      options.onError?.(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [isNative, options]);

  return {
    isNative,
    isLoading,
    takePhoto,
    selectFromGallery,
    requestPermissions,
  };
}
