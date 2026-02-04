import { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { useVocabularyStore } from '@/stores/vocabulary-store';
import { apiClient } from '@/lib/api-client';
import { compressImage, imageToBase64 } from '@/lib/image-utils';
import type { AnalysisResponse, VocabularyList } from '@/lib/types';

const { width, height } = Dimensions.get('window');

export default function CaptureModal() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, useTrial, hasUsedTrial } = useAuthStore();

  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showSignInModal, setShowSignInModal] = useState(false);
  const [signInAction, setSignInAction] = useState<'listen' | 'save' | null>(null);
  const [lists, setLists] = useState<VocabularyList[]>([]);
  const [showListModal, setShowListModal] = useState(false);
  const [wordToSave, setWordToSave] = useState<{ id: string; en: string; zh: string; pinyin: string; category: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const slideAnim = useRef(new Animated.Value(height)).current;

  // Fetch lists when component mounts or when screen is focused
  useEffect(() => {
    if (isAuthenticated) {
      fetchLists();
    }
  }, [isAuthenticated]);

  // Refresh lists when screen comes back into focus (e.g., after creating a new list)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchLists();
      }
    }, [isAuthenticated])
  );

  const fetchLists = async () => {
    try {
      const data = await apiClient.get<VocabularyList[]>('/api/lists');
      setLists(data || []);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    }
  };

  // Helper function to get category color
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'object':
        return 'rgba(59, 130, 246, 0.2)';
      case 'color':
        return 'rgba(236, 72, 153, 0.2)';
      case 'action':
        return 'rgba(16, 185, 129, 0.2)';
      default:
        return 'rgba(124, 58, 237, 0.2)';
    }
  };

  // Helper function to get HSK level color
  const getHskColor = (level: number) => {
    switch (level) {
      case 1:
        return 'rgba(34, 197, 94, 0.2)'; // Green
      case 2:
        return 'rgba(59, 130, 246, 0.2)'; // Blue
      case 3:
        return 'rgba(234, 179, 8, 0.2)'; // Yellow
      case 4:
        return 'rgba(249, 115, 22, 0.2)'; // Orange
      case 5:
        return 'rgba(239, 68, 68, 0.2)'; // Red
      case 6:
        return 'rgba(147, 51, 234, 0.2)'; // Purple
      default:
        return 'rgba(107, 114, 128, 0.2)'; // Gray
    }
  };

  // TTS function using expo-speech
  const speakWord = (word: string) => {
    console.log('Speaking:', word);
    try {
      Speech.speak(word, {
        language: 'zh-CN',
        pitch: 1.0,
        rate: 0.8,
      });
    } catch (error) {
      console.error('Speech error:', error);
      Alert.alert('Error', 'Unable to play pronunciation');
    }
  };

  // Handle listen action - show sign-in modal for guests
  const handleListen = (word: string) => {
    if (!isAuthenticated) {
      setSignInAction('listen');
      setShowSignInModal(true);
      return;
    }
    speakWord(word);
  };

  // Handle save action - show sign-in modal for guests
  const handleSave = (obj: { id: string; en: string; zh: string; pinyin: string; category: string }) => {
    if (!isAuthenticated) {
      setSignInAction('save');
      setShowSignInModal(true);
      return;
    }
    setWordToSave(obj);
    setShowListModal(true);
  };

  // Save word function - shows list selection modal
  const saveWord = (obj: { id: string; en: string; zh: string; pinyin: string; category: string }) => {
    setWordToSave(obj);
    setShowListModal(true);
  };

  // Get vocabulary store for cache invalidation
  const { clearCache } = useVocabularyStore();

  // Actually save the word
  const doSaveWord = async (listId?: string) => {
    if (!wordToSave) return;

    setSaving(true);
    try {
      const payload: any = {
        wordZh: wordToSave.zh,
        wordPinyin: wordToSave.pinyin,
        wordEn: wordToSave.en,
        detectedObjectId: wordToSave.id,
      };
      if (listId) {
        payload.listId = listId;
      }

      const response = await apiClient.post<{ id: string; wordZh: string; wordPinyin: string; wordEn: string; isLearned: boolean; createdAt: string }>('/api/vocabulary', payload);

      // Invalidate vocabulary cache to trigger refetch on next navigation
      // We clear the cache so that home/practice pages will fetch fresh data
      clearCache();

      Alert.alert('Success', listId ? 'Word saved to list!' : 'Word saved to your vocabulary!');
      setShowListModal(false);
      setWordToSave(null);
    } catch (error: any) {
      console.error('[doSaveWord] Failed:', error);
      if (error.message?.includes('already in vocabulary')) {
        Alert.alert('Info', 'This word is already in your vocabulary.');
      } else {
        Alert.alert('Error', error?.message || 'Failed to save word. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
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
      mediaTypes: ['images'],
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

    // Check trial eligibility
    if (!isAuthenticated) {
      if (hasUsedTrial) {
        setShowUpgradeModal(true);
        return;
      }
      useTrial();
    }

    setAnalyzing(true);
    try {
      console.log('Compressing image...');
      const compressedUri = await compressImage(image, 1024);
      console.log('Compressed URI:', compressedUri);

      console.log('Converting to base64...');
      const base64Image = await imageToBase64(compressedUri);
      console.log('Base64 length:', base64Image.length);

      // Check if image is too large (max 5MB for base64)
      if (base64Image.length > 7 * 1024 * 1024) {
        Alert.alert('Image Too Large', 'Please select a smaller image or reduce quality.');
        setAnalyzing(false);
        return;
      }

      console.log('Sending to API...');
      // Use /api/analyze for authenticated users (saves to history), /api/analyze-trial for guests
      const endpoint = isAuthenticated ? '/api/analyze' : '/api/analyze-trial';
      const response = await apiClient.post<AnalysisResponse>(endpoint, {
        image: base64Image,
      });

      console.log('API response received:', response);
      setResult(response);

      // Animate results in
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error: any) {
      console.error('Analysis failed:', error);
      Alert.alert(
        'Analysis Failed',
        error?.message || 'Unable to analyze image. Please try again with a different photo.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const closeModal = () => {
    router.back();
  };

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#000' }]}>
          Analyze Photo
        </Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image Selection Area */}
        {!image ? (
          <View style={styles.selectionContainer}>
            <TouchableOpacity
              onPress={takePhoto}
              style={[styles.selectionButton, { backgroundColor: '#7c3aed' }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Ionicons name="camera" size={32} color="#fff" />
              </View>
              <Text style={styles.selectionButtonText}>Take Photo</Text>
              <Text style={styles.selectionSubtext}>Capture something new</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickImage}
              style={[styles.selectionButton, { backgroundColor: isDark ? '#2a2a2a' : '#e5e7eb' }]}
            >
              <View style={[styles.iconCircle, { backgroundColor: isDark ? '#3a3a3a' : '#fff' }]}>
                <Ionicons name="images" size={32} color={isDark ? '#fff' : '#374151'} />
              </View>
              <Text style={[styles.selectionButtonText, { color: isDark ? '#fff' : '#374151' }]}>
                From Gallery
              </Text>
              <Text style={[styles.selectionSubtext, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                Choose existing photo
              </Text>
            </TouchableOpacity>

            {/* Trial Badge */}
            {!isAuthenticated && (
              <View style={styles.trialBadge}>
                <Ionicons name="gift" size={16} color="#7c3aed" />
                <Text style={styles.trialText}>
                  {hasUsedTrial ? 'Trial used - Sign up for more' : '1 free analysis available'}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.analysisContainer}>
            {/* Selected Image */}
            <View style={styles.imageContainer}>
              <Image source={{ uri: image }} style={styles.selectedImage} />
              <TouchableOpacity
                onPress={() => {
                  setImage(null);
                  setResult(null);
                }}
                style={styles.changeImageButton}
              >
                <Ionicons name="refresh" size={20} color="#fff" />
                <Text style={styles.changeImageText}>Change</Text>
              </TouchableOpacity>
            </View>

            {/* Analyze Button */}
            {!result && (
              <TouchableOpacity
                onPress={analyzeImage}
                disabled={analyzing}
                style={[styles.analyzeButton, analyzing && styles.analyzeButtonDisabled]}
              >
                {analyzing ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={24} color="#fff" />
                    <Text style={styles.analyzeButtonText}>Analyze with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Results */}
            {result && (
              <Animated.View style={[styles.resultsContainer, { transform: [{ translateY: slideAnim }] }]}>
                <View style={styles.resultsHeader}>
                  <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                  <Text style={[styles.resultsTitle, { color: isDark ? '#fff' : '#000' }]}>
                    Analysis Complete
                  </Text>
                </View>

                {/* Scene Description */}
                {(result.sceneDescription || result.sceneDescriptionZh) && (
                  <View style={[styles.sceneCard, { backgroundColor: cardColor }]}>
                    <Text style={[styles.sceneLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                      Scene
                    </Text>
                    {result.sceneDescriptionZh && (
                      <Text style={styles.sceneChineseText}>
                        {result.sceneDescriptionZh}
                      </Text>
                    )}
                    {result.sceneDescriptionPinyin && (
                      <Text style={styles.scenePinyinText}>
                        {result.sceneDescriptionPinyin}
                      </Text>
                    )}
                    {result.sceneDescription && (
                      <Text style={[styles.sceneText, { color: isDark ? '#fff' : '#000' }]}>
                        {result.sceneDescription}
                      </Text>
                    )}
                  </View>
                )}

                {/* Detected Objects - Show full content for all, intercept actions for guests */}
                <Text style={[styles.sectionTitle, { color: isDark ? '#fff' : '#000' }]}>
                  Detected Objects
                </Text>

                {result.objects.map((obj, index) => (
                  <View
                    key={obj.id || index}
                    style={[styles.wordCard, { backgroundColor: cardColor }]}>
                    <View style={styles.wordContent}>
                      <View style={styles.wordHeader}>
                        <View style={styles.wordInfo}>
                          {/* Category and HSK Badges */}
                          <View style={styles.badgesRow}>
                            <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(obj.category) }]}>
                              <Text style={styles.categoryText}>{obj.category}</Text>
                            </View>
                            {obj.hskLevel && (
                              <View style={[styles.hskBadge, { backgroundColor: getHskColor(obj.hskLevel) }]}>
                                <Text style={styles.hskText}>HSK {obj.hskLevel}</Text>
                              </View>
                            )}
                          </View>

                          {/* Chinese Character */}
                          <Text style={[styles.chineseText, { color: isDark ? '#fff' : '#000' }]}>
                            {obj.zh}
                          </Text>

                          {/* Pinyin */}
                          <Text style={styles.pinyinText}>{obj.pinyin}</Text>

                          {/* English Meaning */}
                          <Text style={[styles.englishText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                            {obj.en}
                          </Text>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                          {/* Speaker Button for TTS */}
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleListen(obj.zh)}>
                            <Ionicons name="volume-high" size={20} color="#7c3aed" />
                          </TouchableOpacity>

                          {/* Save Button */}
                          <TouchableOpacity
                            style={styles.iconButton}
                            onPress={() => handleSave(obj)}>
                            <Ionicons name="bookmark-outline" size={20} color="#7c3aed" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Confidence Badge */}
                      <View style={styles.confidenceBadge}>
                        <Text style={styles.confidenceText}>
                          {Math.round(obj.confidence * 100)}% confidence
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}

                {/* Sign Up CTA for trial users */}
                {!isAuthenticated && (
                  <View style={styles.ctaContainer}>
                    <Text style={[styles.ctaText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
                      Want unlimited analyses and vocabulary tracking?
                    </Text>
                    <TouchableOpacity
                      onPress={() => router.push('/(auth)/signup')}
                      style={styles.ctaButton}>
                      <Text style={styles.ctaButtonText}>Get Started Free</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.modalIcon}>
              <Ionicons name="rocket" size={48} color="#7c3aed" />
            </View>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
              Trial Complete!
            </Text>
            <Text style={[styles.modalText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              You've used your free analysis. Create an account to unlock unlimited analyses and save your vocabulary.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowUpgradeModal(false);
                router.push('/(auth)/signup');
              }}
              style={styles.modalPrimaryButton}>
              <Text style={styles.modalPrimaryButtonText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowUpgradeModal(false)}
              style={styles.modalSecondaryButton}>
              <Text style={[styles.modalSecondaryButtonText, { color: isDark ? '#fff' : '#374151' }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* List Selection Modal */}
      <Modal
        visible={showListModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowListModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.listModalContent, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.listModalHeader}>
              <Text style={[styles.listModalTitle, { color: isDark ? '#fff' : '#000' }]}>
                Save to List
              </Text>
              <TouchableOpacity onPress={() => setShowListModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.listModalSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {wordToSave?.zh} - {wordToSave?.en}
            </Text>

            <ScrollView style={styles.listsContainer} showsVerticalScrollIndicator={false}>
              {/* Save without list option */}
              <TouchableOpacity
                style={[styles.listOption, { borderBottomColor: isDark ? '#374151' : '#e5e7eb' }]}
                onPress={() => doSaveWord()}
                disabled={saving}>
                <View style={styles.listOptionInfo}>
                  <Ionicons name="bookmark-outline" size={24} color="#7c3aed" />
                  <Text style={[styles.listOptionText, { color: isDark ? '#fff' : '#000' }]}>
                    Just save to vocabulary
                  </Text>
                </View>
                {saving && !wordToSave && <ActivityIndicator size="small" color="#7c3aed" />}
              </TouchableOpacity>

              {/* List options */}
              {lists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  style={[styles.listOption, { borderBottomColor: isDark ? '#374151' : '#e5e7eb' }]}
                  onPress={() => doSaveWord(list.id)}
                  disabled={saving}>
                  <View style={styles.listOptionInfo}>
                    <View style={[styles.listColorDot, { backgroundColor: list.color }]} />
                    <Text style={[styles.listOptionText, { color: isDark ? '#fff' : '#000' }]}>
                      {list.name}
                    </Text>
                  </View>
                  {saving && wordToSave && <ActivityIndicator size="small" color="#7c3aed" />}
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.createListButton}
              onPress={() => {
                setShowListModal(false);
                router.push('/lists');
              }}>
              <Ionicons name="add-circle-outline" size={20} color="#7c3aed" />
              <Text style={styles.createListText}>Create New List</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Sign In Modal for Guests */}
      <Modal
        visible={showSignInModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSignInModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.modalIcon}>
              <Ionicons name={signInAction === 'listen' ? 'volume-high' : 'bookmark'} size={48} color="#7c3aed" />
            </View>
            <Text style={[styles.modalTitle, { color: isDark ? '#fff' : '#000' }]}>
              {signInAction === 'listen' ? 'Hear Pronunciation' : 'Save Word'}
            </Text>
            <Text style={[styles.modalText, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {signInAction === 'listen'
                ? 'Sign in to listen to Chinese pronunciation with text-to-speech.'
                : 'Sign in to save words to your vocabulary and track your progress.'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowSignInModal(false);
                router.push('/(auth)/signup');
              }}
              style={styles.modalPrimaryButton}>
              <Text style={styles.modalPrimaryButtonText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setShowSignInModal(false);
                router.push('/(auth)/login');
              }}
              style={styles.modalSecondaryButton}>
              <Text style={[styles.modalSecondaryButtonText, { color: isDark ? '#fff' : '#374151' }]}>
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSignInModal(false)}
              style={[styles.modalSecondaryButton, { marginTop: 8 }]}>
              <Text style={[styles.modalSecondaryButtonText, { color: isDark ? '#9ca3af' : '#9ca3af' }]}>
                Maybe Later
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  selectionContainer: {
    padding: 24,
    gap: 16,
  },
  selectionButton: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  selectionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  selectionSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 12,
  },
  trialText: {
    fontSize: 14,
    color: '#7c3aed',
    fontWeight: '500',
  },
  analysisContainer: {
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
  },
  selectedImage: {
    width: '100%',
    height: 300,
    borderRadius: 20,
  },
  changeImageButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  changeImageText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c3aed',
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginBottom: 24,
  },
  analyzeButtonDisabled: {
    opacity: 0.7,
  },
  analyzeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  resultsContainer: {
    gap: 12,
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sceneCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
  },
  sceneLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sceneText: {
    fontSize: 16,
    lineHeight: 22,
  },
  sceneChineseText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 4,
  },
  scenePinyinText: {
    fontSize: 14,
    color: '#a78bfa',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  wordCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  blurredContent: {
    position: 'relative',
    padding: 24,
    alignItems: 'center',
  },
  blurOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    zIndex: 1,
  },
  blurText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7c3aed',
    marginTop: 8,
  },
  blurSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  unlockButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  unlockButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  teaserText: {
    fontSize: 48,
    fontWeight: 'bold',
    opacity: 0.2,
  },
  wordContent: {
    padding: 16,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordInfo: {
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
    textTransform: 'capitalize',
  },
  hskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  hskText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#7c3aed',
  },
  chineseText: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  pinyinText: {
    fontSize: 16,
    color: '#7c3aed',
    marginTop: 2,
  },
  englishText: {
    fontSize: 14,
    marginTop: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 12,
  },
  saveButton: {
    padding: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    borderRadius: 12,
  },
  confidenceBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 12,
  },
  confidenceText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  ctaContainer: {
    alignItems: 'center',
    padding: 24,
    marginTop: 8,
  },
  ctaText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  ctaButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 320,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalPrimaryButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSecondaryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  modalSecondaryButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // List Selection Modal
  listModalContent: {
    width: '90%',
    maxHeight: '70%',
    borderRadius: 24,
    padding: 20,
  },
  listModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  listModalTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  listModalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
  },
  listsContainer: {
    maxHeight: 300,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  listOptionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  listColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  listOptionText: {
    fontSize: 16,
  },
  createListButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 8,
  },
  createListText: {
    fontSize: 16,
    color: '#7c3aed',
    fontWeight: '600',
  },
});
