import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';

interface Course {
  id: string;
  name: string;
  description?: string;
  difficultyLevel: number;
  subscriberCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  wordCount: number;
  creatorName?: string;
  isSubscribed?: boolean;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'HSK 1',
  2: 'HSK 2',
  3: 'HSK 3',
  4: 'HSK 4',
  5: 'HSK 5',
  6: 'HSK 6',
};

const DIFFICULTY_COLORS: Record<number, string> = {
  1: '#10b981',
  2: '#34d399',
  3: '#f59e0b',
  4: '#f97316',
  5: '#ef4444',
  6: '#8b5cf6',
};

export default function CoursesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState<number | null>(null);

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';
  const inputBg = isDark ? '#262626' : '#f3f4f6';
  const borderColor = isDark ? '#374151' : '#e5e7eb';

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (difficulty) params.set('difficulty', difficulty.toString());
      if (search) params.set('q', search);

      const data = await apiClient.get<{ courses: Course[] }>(`/api/courses?${params}`);
      setCourses(data.courses || []);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
    } finally {
      setLoading(false);
    }
  }, [difficulty, search]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleSubscribe = async (courseId: string) => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    try {
      await apiClient.post(`/api/courses/${courseId}/subscribe`, {});
      fetchCourses();
    } catch (error) {
      Alert.alert('Error', 'Failed to subscribe');
    }
  };

  const renderStars = (rating: number | null) => {
    if (!rating) return null;
    const fullStars = Math.floor(rating);
    return (
      <View style={styles.stars}>
        {[...Array(5)].map((_, i) => (
          <Ionicons
            key={i}
            name={i < fullStars ? 'star' : 'star-outline'}
            size={14}
            color="#f59e0b"
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Courses</Text>
        <Text style={styles.headerSubtitle}>Learn from curated vocabulary</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <View style={styles.searchContainer}>
          <View style={[styles.searchInput, { backgroundColor: inputBg, borderColor }]}>
            <Ionicons name="search" size={20} color={subtextColor} />
            <TextInput
              style={[styles.searchText, { color: textColor }]}
              placeholder="Search courses..."
              placeholderTextColor={subtextColor}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={fetchCourses}
            />
          </View>
        </View>

        {/* Difficulty Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContainer}
        >
          <TouchableOpacity
            style={[styles.filterChip, !difficulty && styles.filterChipActive]}
            onPress={() => setDifficulty(null)}
          >
            <Text style={[styles.filterText, !difficulty && styles.filterTextActive]}>All</Text>
          </TouchableOpacity>
          {[1, 2, 3, 4, 5, 6].map((level) => (
            <TouchableOpacity
              key={level}
              style={[
                styles.filterChip,
                difficulty === level && { backgroundColor: DIFFICULTY_COLORS[level] },
              ]}
              onPress={() => setDifficulty(difficulty === level ? null : level)}
            >
              <Text
                style={[
                  styles.filterText,
                  difficulty === level && styles.filterTextActive,
                ]}
              >
                HSK {level}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Course List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7c3aed" />
          </View>
        ) : courses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="book" size={64} color={subtextColor} />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No courses found</Text>
            <Text style={[styles.emptySubtitle, { color: subtextColor }]}>
              Be the first to create a course!
            </Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => Alert.alert('Coming Soon', 'Course creation will be available soon')}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.createFirstText}>Create Course</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.courseList}>
            {courses.map((course) => (
              <TouchableOpacity
                key={course.id}
                style={[styles.courseCard, { backgroundColor: cardColor }]}
                onPress={() => router.push(`/course/${course.id}`)}
              >
                <View style={styles.courseHeader}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      { backgroundColor: `${DIFFICULTY_COLORS[course.difficultyLevel]}20` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: DIFFICULTY_COLORS[course.difficultyLevel] },
                      ]}
                    >
                      {DIFFICULTY_LABELS[course.difficultyLevel]}
                    </Text>
                  </View>
                  {course.isSubscribed && (
                    <View style={styles.subscribedBadge}>
                      <Text style={styles.subscribedText}>Subscribed</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.courseName, { color: textColor }]} numberOfLines={1}>
                  {course.name}
                </Text>

                {course.description && (
                  <Text style={[styles.courseDesc, { color: subtextColor }]} numberOfLines={2}>
                    {course.description}
                  </Text>
                )}

                <View style={styles.courseStats}>
                  <View style={styles.stat}>
                    <Ionicons name="book-outline" size={14} color={subtextColor} />
                    <Text style={[styles.statText, { color: subtextColor }]}>
                      {course.wordCount} words
                    </Text>
                  </View>
                  <View style={styles.stat}>
                    <Ionicons name="people-outline" size={14} color={subtextColor} />
                    <Text style={[styles.statText, { color: subtextColor }]}>
                      {course.subscriberCount}
                    </Text>
                  </View>
                </View>

                {course.ratingAvg && (
                  <View style={styles.ratingContainer}>
                    {renderStars(course.ratingAvg)}
                    <Text style={[styles.ratingText, { color: subtextColor }]}>
                      ({course.ratingCount})
                    </Text>
                  </View>
                )}

                {course.creatorName && (
                  <Text style={[styles.creatorText, { color: subtextColor }]}>
                    by {course.creatorName}
                  </Text>
                )}

                {!course.isSubscribed && (
                  <TouchableOpacity
                    style={styles.subscribeButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleSubscribe(course.id);
                    }}
                  >
                    <Text style={styles.subscribeText}>Subscribe</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            ))}
            <View style={{ height: 40 }} />
          </View>
        )}
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
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchText: {
    flex: 1,
    fontSize: 16,
  },
  filterScroll: {
    maxHeight: 50,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#374151',
  },
  filterChipActive: {
    backgroundColor: '#7c3aed',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9ca3af',
  },
  filterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    paddingVertical: 48,
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
    marginBottom: 24,
  },
  createFirstButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
  },
  createFirstText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  courseList: {
    padding: 16,
    gap: 12,
  },
  courseCard: {
    borderRadius: 16,
    padding: 16,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subscribedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  subscribedText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '600',
  },
  courseName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  courseDesc: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  courseStats: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingText: {
    fontSize: 13,
  },
  creatorText: {
    fontSize: 13,
    marginTop: 8,
  },
  subscribeButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 12,
  },
  subscribeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
