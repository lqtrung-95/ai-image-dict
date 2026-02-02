import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api-client';
import { VocabularyItem } from '@/lib/types';

interface ListDetails {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_public: boolean;
  wordCount: number;
  learnedCount: number;
}

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [list, setList] = useState<ListDetails | null>(null);
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  const fetchListDetails = useCallback(async () => {
    try {
      const data = await apiClient.get<{ list: ListDetails; words: VocabularyItem[] }>(`/api/lists/${id}`);
      setList(data.list);
      setWords(data.words || []);
    } catch (error) {
      console.error('Failed to fetch list details:', error);
      Alert.alert('Error', 'Failed to load list details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchListDetails();
  }, [fetchListDetails]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchListDetails();
  };

  const handlePractice = () => {
    if (words.length === 0) {
      Alert.alert('No Words', 'Add some words to this list first');
      return;
    }
    router.push({
      pathname: '/practice-session',
      params: { listId: id },
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#7c3aed" />
      </View>
    );
  }

  if (!list) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="alert-circle" size={64} color={subtextColor} />
        <Text style={[styles.emptyTitle, { color: textColor }]}>List not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: list.color }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{list.name}</Text>
        {list.description && (
          <Text style={styles.headerSubtitle}>{list.description}</Text>
        )}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            {list.wordCount} words • {list.learnedCount} learned
          </Text>
          {list.is_public && (
            <View style={styles.publicBadge}>
              <Ionicons name="earth" size={12} color="#fff" />
              <Text style={styles.publicText}>Public</Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {words.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list" size={64} color={subtextColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No words yet</Text>
            <Text style={[styles.emptySubtitle, { color: subtextColor }]}>
              Add words from your vocabulary to this list
            </Text>
          </View>
        ) : (
          <>
            {words.map((word, index) => (
              <View
                key={word.id}
                style={[styles.wordCard, { backgroundColor: cardColor }]}
              >
                <View style={styles.wordNumber}>
                  <Text style={styles.wordNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.wordContent}>
                  <Text style={[styles.wordZh, { color: textColor }]}>
                    {word.wordZh}
                  </Text>
                  <Text style={[styles.wordPinyin, { color: subtextColor }]}>
                    {word.wordPinyin}
                  </Text>
                  <Text style={[styles.wordEn, { color: subtextColor }]}>
                    {word.wordEn}
                  </Text>
                </View>
                {word.isLearned && (
                  <View style={styles.learnedBadge}>
                    <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                  </View>
                )}
              </View>
            ))}
            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {/* Practice Button */}
      {words.length > 0 && (
        <TouchableOpacity
          style={[styles.practiceButton, { backgroundColor: list.color }]}
          onPress={handlePractice}
        >
          <Ionicons name="play" size={20} color="#fff" />
          <Text style={styles.practiceButtonText}>Practice List</Text>
        </TouchableOpacity>
      )}
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
    paddingBottom: 20,
  },
  backButton: {
    marginBottom: 12,
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
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  statsText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  publicText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  wordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
  },
  wordNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  wordNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7c3aed',
  },
  wordContent: {
    flex: 1,
  },
  wordZh: {
    fontSize: 18,
    fontWeight: '600',
  },
  wordPinyin: {
    fontSize: 14,
    marginTop: 2,
  },
  wordEn: {
    fontSize: 13,
    marginTop: 2,
  },
  learnedBadge: {
    marginLeft: 8,
  },
  practiceButton: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  practiceButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
});
