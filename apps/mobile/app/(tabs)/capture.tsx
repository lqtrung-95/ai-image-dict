import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api-client';
import { compressImage, imageToBase64 } from '@/lib/image-utils';
import type { AnalysisResponse } from '@/lib/types';

export default function CaptureScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);

  const requestPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos');
      return false;
    }
    return true;
  };

  const takePhoto = async () => {
    const hasPermission = await requestPermission();
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setResult(null);
    }
  };

  const analyzeImage = async () => {
    if (!image) return;

    setAnalyzing(true);
    try {
      const compressedUri = await compressImage(image, 1024);
      const base64Image = await imageToBase64(compressedUri);

      const response = await apiClient.post<AnalysisResponse>('/api/analyze', {
        image: base64Image,
      });

      setResult(response);
    } catch (error) {
      console.error('Analysis failed:', error);
      Alert.alert('Analysis Failed', 'Unable to analyze image. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const saveWord = async (word: AnalysisResponse['objects'][0]) => {
    try {
      await apiClient.post('/api/vocabulary', {
        wordZh: word.zh,
        wordPinyin: word.pinyin,
        wordEn: word.en,
      });
      Alert.alert('Success', 'Word saved to your vocabulary!');
    } catch (error) {
      console.error('Failed to save word:', error);
      Alert.alert('Error', 'Failed to save word. Please try again.');
    }
  };

  return (
    <ScrollView className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <View className="px-6 pt-12 pb-6 bg-primary">
        <Text className="text-2xl font-bold text-white">Photo Analysis</Text>
        <Text className="text-white/80 mt-1">
          Capture or upload a photo to learn Chinese vocabulary
        </Text>
      </View>

      {/* Image Selection */}
      <View className="px-4 mt-6">
        {!image ? (
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={takePhoto}
              className="flex-1 bg-primary p-6 rounded-xl items-center"
            >
              <Ionicons name="camera" size={32} color="white" />
              <Text className="text-white font-semibold mt-2">Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={pickImage}
              className="flex-1 bg-gray-200 dark:bg-gray-700 p-6 rounded-xl items-center"
            >
              <Ionicons name="images" size={32} color={isDark ? 'white' : '#374151'} />
              <Text className={`font-semibold mt-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
                Gallery
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Image source={{ uri: image }} className="w-full h-64 rounded-xl" resizeMode="cover" />
            <View className="flex-row gap-3 mt-4">
              <TouchableOpacity
                onPress={() => {
                  setImage(null);
                  setResult(null);
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 p-3 rounded-lg items-center"
              >
                <Text className={isDark ? 'text-white' : 'text-gray-700'}>Retake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={analyzeImage}
                disabled={analyzing}
                className="flex-1 bg-primary p-3 rounded-lg items-center"
              >
                {analyzing ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-semibold">Analyze</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Analysis Results */}
      {result && (
        <View className="px-4 mt-6 mb-8">
          <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Detected Objects
          </Text>

          {/* Scene Description */}
          {result.sceneDescription && (
            <View className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <Text className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Scene
              </Text>
              <Text className={`text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {result.sceneDescription}
              </Text>
            </View>
          )}

          {/* Objects */}
          {result.objects.map((obj, index) => (
            <View
              key={obj.id || index}
              className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                    {obj.zh}
                  </Text>
                  <Text className="text-lg text-primary mt-1">{obj.pinyin}</Text>
                  <Text className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {obj.en}
                  </Text>
                  <Text className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    Confidence: {Math.round(obj.confidence * 100)}%
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => saveWord(obj)}
                  className="bg-secondary p-2 rounded-lg"
                >
                  <Ionicons name="add" size={20} color="white" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {/* Colors */}
          {result.colors && result.colors.length > 0 && (
            <View className={`p-4 rounded-xl mb-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Colors
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {result.colors.map((color, index) => (
                  <View key={index} className="bg-primary/10 px-3 py-1 rounded-full">
                    <Text className="text-primary">
                      {color.zh} ({color.pinyin}) - {color.en}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Actions */}
          {result.actions && result.actions.length > 0 && (
            <View className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <Text className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Actions
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {result.actions.map((action, index) => (
                  <View key={index} className="bg-secondary/10 px-3 py-1 rounded-full">
                    <Text className="text-secondary">
                      {action.zh} ({action.pinyin}) - {action.en}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}
