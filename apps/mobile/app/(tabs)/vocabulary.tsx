import { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import type { VocabularyItem } from '@/lib/types';

export default function VocabularyScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuthStore();
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'learning' | 'mastered'>('all');

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  const loadWords = async () => {
    if (!isAuthenticated) return;
    try {
      const response = await apiClient.get<{ items: VocabularyItem[]; total: number; hasMore: boolean }>('/api/vocabulary');
      setWords(response.items || []);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
      setWords([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWords();
    setRefreshing(false);
  };

  useEffect(() => {
    loadWords();
  }, [isAuthenticated]);

  const filteredWords = words.filter((word) => {
    const matchesSearch =
      word.wordZh.includes(searchQuery) ||
      word.wordEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.wordPinyin.toLowerCase().includes(searchQuery.toLowerCase());

    if (filter === 'all') return matchesSearch;
    if (filter === 'learning') return matchesSearch && !word.isLearned;
    if (filter === 'mastered') return matchesSearch && word.isLearned;
    return matchesSearch;
  });

  const renderItem = ({ item }: { item: VocabularyItem }) => (
    <View style={[styles.wordCard, { backgroundColor: cardColor }]}>
      <View style={styles.wordHeader}>
        <View style={styles.wordContent}>
          <Text style={[styles.chineseText, { color: textColor }]}>
            {item.wordZh}
          </Text>
          <Text style={styles.pinyinText}>{item.wordPinyin}</Text>
          <Text style={[styles.englishText, { color: subtextColor }]}>
            {item.wordEn}
          </Text>
          {item.exampleSentence && (
            <Text style={[styles.exampleText, { color: subtextColor }]}>
              "{item.exampleSentence}"
            </Text>
          )}
        </View>
        <View
          style={[
            styles.badge,
            { backgroundColor: item.isLearned ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)' },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              { color: item.isLearned ? '#10b981' : '#f59e0b' },
            ]}
          >
            {item.isLearned ? 'Mastered' : 'Learning'}
          </Text>
        </View>
      </View>
    </View>
  );

  // Guest view - prompt to login
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Vocabulary</Text>
          <Text style={styles.headerSubtitle}>Sign in to view your words</Text>
        </View>

        {/* Login Prompt */}
        <View style={styles.guestContainer}>
          <View style={[styles.guestCard, { backgroundColor: cardColor }]}>
            <Ionicons name="book-outline" size={64} color="#7c3aed" />
            <Text style={[styles.guestTitle, { color: textColor }]}>
              Your Vocabulary Collection
            </Text>
            <Text style={[styles.guestSubtitle, { color: subtextColor }]}>
              Sign in to see all the words you have saved and track your learning progress
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/signup')}
              style={styles.signupLink}
            >
              <Text style={[styles.signupText, { color: subtextColor }]}>
                Don&apos;t have an account? <Text style={{ color: '#7c3aed', fontWeight: '600' }}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Authenticated view
  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Vocabulary</Text>
        <Text style={styles.headerSubtitle}>
          {words.length} words saved
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInput, { backgroundColor: cardColor }]}>
          <Ionicons name="search" size={20} color={subtextColor} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search words..."
            placeholderTextColor={subtextColor}
            style={[styles.input, { color: textColor }]}
          />
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <View style={styles.filterRow}>
          {(['all', 'learning', 'mastered'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterButton,
                {
                  backgroundColor:
                    filter === f
                      ? '#7c3aed'
                      : cardColor,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      filter === f
                        ? '#fff'
                        : textColor,
                  },
                ]}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Word List */}
      <FlatList
        data={filteredWords}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="book-outline"
              size={48}
              color={isDark ? '#4b5563' : '#9ca3af'}
            />
            <Text style={[styles.emptyText, { color: subtextColor }]}>
              {searchQuery
                ? 'No words match your search'
                : 'No words yet. Start capturing photos!'}
            </Text>
          </View>
        }
      />
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  // Guest styles
  guestContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  guestCard: {
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  loginButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signupLink: {
    marginTop: 16,
  },
  signupText: {
    fontSize: 14,
  },
  // Authenticated styles
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
  },
  filterContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    padding: 16,
    paddingBottom: 100,
  },
  wordCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  wordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  wordContent: {
    flex: 1,
  },
  chineseText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  pinyinText: {
    fontSize: 16,
    color: '#7c3aed',
    marginTop: 4,
  },
  englishText: {
    fontSize: 14,
    marginTop: 4,
  },
  exampleText: {
    fontSize: 13,
    fontStyle: 'italic',
    marginTop: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
  },
});
