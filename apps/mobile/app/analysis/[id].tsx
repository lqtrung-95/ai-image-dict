import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api-client';

interface DetectedObject {
  id: string;
  zh: string;
  en: string;
  pinyin: string;
  confidence: number;
  category: string;
}

interface Analysis {
  id: string;
  image_url: string;
  scene_context: {
    description?: string;
  };
  created_at: string;
  detected_objects: DetectedObject[];
}

export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [showListModal, setShowListModal] = useState(false);
  const [lists, setLists] = useState<any[]>([]);
  const [wordToSave, setWordToSave] = useState<DetectedObject | null>(null);
  const [saving, setSaving] = useState(false);

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  const fetchAnalysis = useCallback(async () => {
    try {
      const data = await apiClient.get<{ analysis: Analysis }>(`/api/history/${id}`);
      setAnalysis(data.analysis);
    } catch (error) {
      console.error('Failed to fetch analysis:', error);
      Alert.alert('Error', 'Failed to load analysis');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchLists = async () => {
    try {
      const data = await apiClient.get<any[]>('/api/lists');
      setLists(data || []);
    } catch (error) {
      console.error('Failed to fetch lists:', error);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const speakWord = (word: string) => {
    try {
      Speech.speak(word, {
        language: 'zh-CN',
        pitch: 1.0,
        rate: 0.8,
      });
    } catch (error) {
      console.error('Speech error:', error);
    }
  };

  const saveWord = (obj: DetectedObject) => {
    setWordToSave(obj);
    fetchLists();
    setShowListModal(true);
  };

  const doSaveWord = async (listId?: string) => {
    if (!wordToSave) return;

    setSaving(true);
    try {
      const payload: any = {
        wordZh: wordToSave.zh,
        wordPinyin: wordToSave.pinyin,
        wordEn: wordToSave.en,
      };
      if (listId) {
        payload.listId = listId;
      }

      await apiClient.post('/api/vocabulary', payload);
      Alert.alert('Success', listId ? 'Word saved to list!' : 'Word saved to your vocabulary!');
      setShowListModal(false);
      setWordToSave(null);
    } catch (error: any) {
      if (error.message?.includes('already in vocabulary')) {
        Alert.alert('Info', 'This word is already in your vocabulary.');
      } else {
        Alert.alert('Error', 'Failed to save word');
      }
    } finally {
      setSaving(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle" size={64} color={subtextColor} />
        <Text style={[styles.emptyTitle, { color: textColor }]}>Analysis not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photo Analysis</Text>
        <Text style={styles.headerSubtitle}>{formatDate(analysis.created_at)}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: analysis.image_url }} style={styles.image} resizeMode="cover" />
        </View>

        {/* Scene Description */}
        {analysis.scene_context?.description && (
          <View style={[styles.sceneCard, { backgroundColor: cardColor }]}>
            <Text style={[styles.sceneLabel, { color: subtextColor }]}>Scene</Text>
            <Text style={[styles.sceneText, { color: textColor }]}>{analysis.scene_context.description}</Text>
          </View>
        )}

        {/* Detected Objects */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Detected Objects ({analysis.detected_objects?.length || 0})</Text>

        {(analysis.detected_objects || []).map((obj, index) => (
          <View key={obj.id || index} style={[styles.wordCard, { backgroundColor: cardColor }]}>
            <View style={styles.wordContent}>
              <View style={styles.wordHeader}>
                <View style={styles.wordInfo}>
                  <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(obj.category) }]}>
                    <Text style={styles.categoryText}>{obj.category}</Text>
                  </View>

                  <Text style={[styles.chineseText, { color: textColor }]}>{obj.zh}</Text>

                  <Text style={styles.pinyinText}>{obj.pinyin}</Text>

                  <Text style={[styles.englishText, { color: subtextColor }]}>{obj.en}</Text>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity style={styles.iconButton} onPress={() => speakWord(obj.zh)}>
                    <Ionicons name="volume-high" size={20} color="#7c3aed" />
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.iconButton} onPress={() => saveWord(obj)}>
                    <Ionicons name="bookmark-outline" size={20} color="#7c3aed" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.confidenceBadge}>
                <Text style={styles.confidenceText}>{Math.round(obj.confidence * 100)}% confidence</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* List Selection Modal */}
      <Modal
        visible={showListModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.listModalContent, { backgroundColor: isDark ? '#1a1a1a' : '#fff' }]}>
            <View style={styles.listModalHeader}>
              <Text style={[styles.listModalTitle, { color: isDark ? '#fff' : '#000' }]}>Save to List</Text>
              <TouchableOpacity onPress={() => setShowListModal(false)}>
                <Ionicons name="close" size={24} color={isDark ? '#9ca3af' : '#6b7280'} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.listModalSubtitle, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
              {wordToSave?.zh} - {wordToSave?.en}
            </Text>

            <ScrollView style={styles.listsContainer} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.listOption, { borderBottomColor: isDark ? '#374151' : '#e5e7eb' }]}
                onPress={() => doSaveWord()}
                disabled={saving}
              >
                <View style={styles.listOptionInfo}>
                  <Ionicons name="bookmark-outline" size={24} color="#7c3aed" />
                  <Text style={[styles.listOptionText, { color: isDark ? '#fff' : '#000' }]}>Just save to vocabulary</Text>
                </View>
                {saving && !wordToSave && <ActivityIndicator size="small" color="#7c3aed" />}
              </TouchableOpacity>

              {lists.map((list) => (
                <TouchableOpacity
                  key={list.id}
                  style={[styles.listOption, { borderBottomColor: isDark ? '#374151' : '#e5e7eb' }]}
                  onPress={() => doSaveWord(list.id)}
                  disabled={saving}
                >
                  <View style={styles.listOptionInfo}>
                    <View style={[styles.listColorDot, { backgroundColor: list.color }]} />
                    <Text style={[styles.listOptionText, { color: isDark ? '#fff' : '#000' }]}>{list.name}</Text>
                  </View>
                  {saving && wordToSave && <ActivityIndicator size="small" color="#7c3aed" />}
                </TouchableOpacity>
              ))}
            </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: '#7c3aed',
  },
  backButton: {
    marginBottom: 8,
    marginLeft: -4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageContainer: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  sceneCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sceneLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  sceneText: {
    fontSize: 16,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  wordCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: 'hidden',
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
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7c3aed',
    textTransform: 'capitalize',
  },
  chineseText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  pinyinText: {
    fontSize: 16,
    color: '#7c3aed',
    marginBottom: 4,
  },
  englishText: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confidenceBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  confidenceText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  listModalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  listModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  },
  listOptionText: {
    fontSize: 16,
  },
  listColorDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  backButtonText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
});
