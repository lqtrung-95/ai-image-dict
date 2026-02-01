---
title: "Phase 05: Photo Capture and AI Analysis"
description: "Implement camera capture, image upload, and AI-powered vocabulary detection"
---

# Phase 05: Photo Capture and AI Analysis

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [phase-04-core-ui-components-and-design-system.md](./phase-04-core-ui-components-and-design-system.md)
- Research: [researcher-camera-media-report.md](./research/researcher-camera-media-report.md)
- Codebase: `src/app/(protected)/capture-native/page.tsx`

## Overview
- **Priority:** P0
- **Status:** Pending
- **Description:** Implement photo capture using expo-image-picker, image compression, and AI analysis integration with Groq API.
- **Estimated Effort:** 4-5 days

## Key Insights
- Use `expo-image-picker` for simpler native camera UI
- Compress images to 1024px max before upload
- Convert to base64 for Groq API
- Show loading state during analysis
- Cache analysis results locally

## Requirements

### Functional Requirements
- Camera capture from device
- Photo selection from gallery
- Image compression and optimization
- AI analysis with loading states
- Display detected objects with vocabulary
- Save analysis to history

### Technical Requirements
- expo-image-picker integration
- expo-image-manipulator for compression
- Base64 encoding for API
- Progress indicators
- Error handling

## Architecture

### Flow
```
User taps Capture
    ↓
Image Picker (Camera/Gallery)
    ↓
Compress Image (1024px, 80% quality)
    ↓
Convert to Base64
    ↓
Send to /api/analyze
    ↓
Display Results
    ↓
Save to History
```

## Related Code Files
- `src/app/(protected)/capture-native/page.tsx`
- `src/hooks/use-native-camera.ts`
- `src/app/api/analyze/route.ts`
- `src/components/analysis/AnalysisResult.tsx`

## Implementation Steps

### Step 1: Create Camera Hook
Create `hooks/useCamera.ts`:
```typescript
import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

interface UseCameraReturn {
  image: string | null;
  isLoading: boolean;
  error: string | null;
  captureImage: () => Promise<void>;
  pickImage: () => Promise<void>;
  clearImage: () => void;
  getBase64: () => Promise<string | null>;
}

export function useCamera(): UseCameraReturn {
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compressImage = async (uri: string): Promise<string> => {
    const manipulated = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipulated.uri;
  };

  const captureImage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setError('Camera permission is required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        const compressed = await compressImage(result.assets[0].uri);
        setImage(compressed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture image');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const pickImage = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setError('Photo library permission is required');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        const compressed = await compressImage(result.assets[0].uri);
        setImage(compressed);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to pick image');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearImage = useCallback(() => {
    setImage(null);
    setError(null);
  }, []);

  const getBase64 = useCallback(async (): Promise<string | null> => {
    if (!image) return null;
    const base64 = await FileSystem.readAsStringAsync(image, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return `data:image/jpeg;base64,${base64}`;
  }, [image]);

  return {
    image,
    isLoading,
    error,
    captureImage,
    pickImage,
    clearImage,
    getBase64,
  };
}
```

### Step 2: Create Analysis Hook
Create `hooks/useAnalysis.ts`:
```typescript
import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { PhotoAnalysis } from '@/lib/types';

interface UseAnalysisReturn {
  analysis: PhotoAnalysis | null;
  isAnalyzing: boolean;
  error: string | null;
  analyzeImage: (base64Image: string) => Promise<void>;
  clearAnalysis: () => void;
}

export function useAnalysis(): UseAnalysisReturn {
  const [analysis, setAnalysis] = useState<PhotoAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeImage = useCallback(async (base64Image: string) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await apiClient.post<PhotoAnalysis>('/api/analyze', {
        image: base64Image,
      });
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const clearAnalysis = useCallback(() => {
    setAnalysis(null);
    setError(null);
  }, []);

  return {
    analysis,
    isAnalyzing,
    error,
    analyzeImage,
    clearAnalysis,
  };
}
```

### Step 3: Create Capture Screen
Create `app/(tabs)/capture.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Camera, Image as ImageIcon, X, Sparkles } from 'lucide-react-native';
import { useCamera } from '@/hooks/useCamera';
import { useAnalysis } from '@/hooks/useAnalysis';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';

export default function CaptureScreen() {
  const { image, isLoading: isCameraLoading, captureImage, pickImage, clearImage, getBase64 } = useCamera();
  const { analysis, isAnalyzing, error, analyzeImage, clearAnalysis } = useAnalysis();
  const [progress, setProgress] = useState(0);

  const handleAnalyze = async () => {
    const base64 = await getBase64();
    if (base64) {
      await analyzeImage(base64);
    }
  };

  const handleSave = async () => {
    // Navigate to vocabulary or show success
    Alert.alert('Success', 'Words saved to your vocabulary!');
  };

  if (analysis) {
    return (
      <ScrollView className="flex-1 bg-gray-50">
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-2xl font-bold text-gray-900">Analysis Results</Text>
            <TouchableOpacity onPress={() => { clearImage(); clearAnalysis(); }}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {image && (
            <Image source={{ uri: image }} className="w-full h-64 rounded-xl mb-4" resizeMode="cover" />
          )}

          {analysis.scene_context && (
            <Card className="mb-4 p-4">
              <Text className="text-sm text-gray-500 mb-1">Scene Context</Text>
              <Text className="text-gray-900">{analysis.scene_context}</Text>
            </Card>
          )}

          <Text className="text-lg font-semibold text-gray-900 mb-3">Detected Objects</Text>

          {analysis.detected_objects.map((obj, index) => (
            <Card key={obj.id || index} className="mb-3 p-4">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-purple-600 mb-1">
                    {obj.label_chinese_simplified}
                  </Text>
                  <Text className="text-lg text-gray-700 mb-1">{obj.pinyin}</Text>
                  <Text className="text-gray-500">{obj.label_english}</Text>
                  <Text className="text-xs text-gray-400 mt-2 capitalize">{obj.category}</Text>
                </View>
                <View className="bg-purple-100 px-2 py-1 rounded">
                  <Text className="text-purple-600 text-xs font-semibold">
                    {Math.round(obj.confidence * 100)}%
                  </Text>
                </View>
              </View>
            </Card>
          ))}

          <Button onPress={handleSave} className="mt-4">
            Save to Vocabulary
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">Capture Photo</Text>
        <Text className="text-gray-500 mb-6">Take a photo or upload to learn Chinese vocabulary</Text>

        {!image ? (
          <View className="space-y-4">
            <TouchableOpacity
              onPress={captureImage}
              disabled={isCameraLoading}
              className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 items-center"
            >
              <Camera size={48} color="#7c3aed" />
              <Text className="mt-4 text-lg font-semibold text-gray-900">Take Photo</Text>
              <Text className="text-gray-500">Use camera to capture</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickImage}
              disabled={isCameraLoading}
              className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 items-center"
            >
              <ImageIcon size={48} color="#7c3aed" />
              <Text className="mt-4 text-lg font-semibold text-gray-900">Upload Photo</Text>
              <Text className="text-gray-500">Choose from gallery</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Image source={{ uri: image }} className="w-full h-80 rounded-xl mb-4" resizeMode="cover" />

            {isAnalyzing ? (
              <Card className="p-6">
                <View className="items-center">
                  <Sparkles size={32} color="#7c3aed" className="mb-4" />
                  <Text className="text-lg font-semibold text-gray-900 mb-2">Analyzing...</Text>
                  <Text className="text-gray-500 text-center mb-4">AI is detecting objects and generating vocabulary</Text>
                  <Progress value={progress} className="w-full" />
                </View>
              </Card>
            ) : (
              <View className="flex-row space-x-3">
                <Button variant="outline" onPress={clearImage} className="flex-1">
                  Retake
                </Button>
                <Button onPress={handleAnalyze} className="flex-1">
                  Analyze
                </Button>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
```

## Todo List
- [ ] Create useCamera hook with image picker
- [ ] Create useAnalysis hook for API calls
- [ ] Build capture screen UI
- [ ] Implement image compression
- [ ] Add base64 conversion
- [ ] Create analysis results display
- [ ] Add loading states
- [ ] Handle errors gracefully
- [ ] Test on iOS device
- [ ] Test on Android device
- [ ] Verify API integration

## Success Criteria
- [ ] Camera capture works
- [ ] Gallery selection works
- [ ] Images compress correctly
- [ ] Analysis API returns results
- [ ] Results display with vocabulary
- [ ] Loading states show during analysis
- [ ] Errors handled gracefully

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Permission denied | Medium | High | Guide users to settings |
| Large image upload fails | Medium | Medium | Compress aggressively |
| API timeout | Low | High | Add retry logic |

## Security Considerations
- Images validated before upload
- No sensitive data in image metadata
- API calls authenticated

## Next Steps
After completing this phase, proceed to [Phase 06: Vocabulary Management](./phase-06-vocabulary-management.md).
