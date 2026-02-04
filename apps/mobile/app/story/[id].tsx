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
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api-client';

interface VocabularyItem {
  id: string;
  label_zh: string;
  label_en: string;
  pinyin: string;
  confidence: number;
  category: string;
}

interface Photo {
  story_photo_id: string;
  caption: string | null;
  id: string;
  image_url: string;
  created_at: string;
  vocabulary: VocabularyItem[];
}

interface GeneratedContent {
  storyZh: string;
  storyPinyin: string;
  storyEn: string;
  usedWords?: string[];
}

interface Story {
  id: string;
  title: string;
  description: string | null;
  generated_content: GeneratedContent | null;
  created_at: string;
  photos: Photo[];
  vocabularyCount: number;
  totalVocabularyItems: number;
}

export default function StoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  const fetchStory = useCallback(async () => {
    try {
      const data = await apiClient.get<{ story: Story }>(`/api/stories/${id}`);
      setStory(data.story);
    } catch (error) {
      console.error('Failed to fetch story:', error);
      Alert.alert('Error', 'Failed to load story');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStory();
  }, [fetchStory]);

  // Native TTS using device speech engine (not Google TTS)
  const speakWord = (text: string, id?: string) => {
    try {
      // Stop any current speech
      Speech.stop();

      if (speakingId === id) {
        // Toggle off if same item
        setSpeakingId(null);
        return;
      }

      setSpeakingId(id || 'story');

      Speech.speak(text, {
        language: 'zh-CN',
        pitch: 1.0,
        rate: 0.8,
        onDone: () => setSpeakingId(null),
        onStopped: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    } catch (error) {
      console.error('Speech error:', error);
      setSpeakingId(null);
    }
  };

  const handleGenerateStory = async () => {
    if (!story) return;
    setLoading(true);
    try {
      const data = await apiClient.post<{ story: Story }>(`/api/stories/${id}`, {});
      setStory(data.story);
      Alert.alert('Success', 'Story generated!');
    } catch (error: any) {
      console.error('Generate story error:', error);
      Alert.alert('Error', error?.message || 'Failed to generate story');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!story) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle" size={64} color={subtextColor} />
        <Text style={[styles.emptyTitle, { color: textColor }]}>Story not found</Text>
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
        <Text style={styles.headerTitle} numberOfLines={1}>{story.title}</Text>
        <Text style={styles.headerSubtitle}>
          {story.photos.length} photos · {story.vocabularyCount} words
        </Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Description */}
        {story.description && (
          <View style={[styles.sectionCard, { backgroundColor: cardColor }]}>
            <Text style={[styles.sectionLabel, { color: subtextColor }]}>Description</Text>
            <Text style={[styles.descriptionText, { color: textColor }]}>{story.description}</Text>
          </View>
        )}

        {/* Generated Story */}
        {story.generated_content && (
          <View style={[styles.sectionCard, { backgroundColor: cardColor }]}>
            <View style={styles.storyHeader}>
              <Text style={[styles.sectionLabel, { color: subtextColor }]}>AI Generated Story</Text>
              <TouchableOpacity
                style={[styles.listenButton, speakingId === 'story' && styles.listenButtonActive]}
                onPress={() => speakWord(story.generated_content?.storyZh || '', 'story')}
              >
                {speakingId === 'story' ? (
                  <ActivityIndicator size="small" color="#7c3aed" />
                ) : (
                  <Ionicons name="volume-high" size={20} color="#7c3aed" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={[styles.storyChinese, { color: textColor }]}>{story.generated_content.storyZh}</Text>
            <Text style={[styles.storyPinyin, { color: subtextColor }]}>{story.generated_content.storyPinyin}</Text>
            <Text style={[styles.storyEnglish, { color: textColor }]}>{story.generated_content.storyEn}</Text>
          </View>
        )}

        {/* Generate Story Button */}
        {!story.generated_content && story.vocabularyCount > 0 && (
          <TouchableOpacity style={styles.generateButton} onPress={handleGenerateStory}>
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.generateButtonText}>Generate AI Story</Text>
          </TouchableOpacity>
        )}

        {/* Photos */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>Photos</Text>
        {story.photos.map((photo, index) => (
          <View key={photo.story_photo_id} style={[styles.photoCard, { backgroundColor: cardColor }]}>
            <Image source={{ uri: photo.image_url }} style={styles.photoImage} resizeMode="cover" />
            {photo.caption && (
              <View style={styles.captionContainer}>
                <Text style={[styles.captionText, { color: textColor }]}>{photo.caption}</Text>
              </View>
            )}
            <Text style={[styles.photoNumber, { color: subtextColor }]}>Photo {index + 1}</Text>
          </View>
        ))}

        {/* Vocabulary */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Vocabulary ({story.totalVocabularyItems})
        </Text>
        {story.photos.map((photo) =>
          photo.vocabulary.map((item) => (
            <View key={item.id} style={[styles.wordCard, { backgroundColor: cardColor }]}>
              <View style={styles.wordContent}>
                <View style={styles.wordInfo}>
                  <Text style={[styles.categoryBadge, { color: '#7c3aed' }]}>{item.category}</Text>
                  <Text style={[styles.chineseText, { color: textColor }]}>{item.label_zh}</Text>
                  <Text style={styles.pinyinText}>{item.pinyin}</Text>
                  <Text style={[styles.englishText, { color: subtextColor }]}>{item.label_en}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.speakButton, speakingId === item.id && styles.speakButtonActive]}
                  onPress={() => speakWord(item.label_zh, item.id)}
                >
                  {speakingId === item.id ? (
                    <ActivityIndicator size="small" color="#7c3aed" />
                  ) : (
                    <Ionicons name="volume-high" size={20} color="#7c3aed" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
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
    fontSize: 24,
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
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listenButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  listenButtonActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
  storyChinese: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 32,
    marginBottom: 8,
  },
  storyPinyin: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  storyEnglish: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  photoCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
  },
  photoImage: {
    width: '100%',
    height: 200,
  },
  captionContainer: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  captionText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  photoNumber: {
    fontSize: 12,
    padding: 12,
    paddingTop: 8,
  },
  wordCard: {
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  wordContent: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordInfo: {
    flex: 1,
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  chineseText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  pinyinText: {
    fontSize: 14,
    color: '#7c3aed',
    marginBottom: 2,
  },
  englishText: {
    fontSize: 13,
  },
  speakButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakButtonActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
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
