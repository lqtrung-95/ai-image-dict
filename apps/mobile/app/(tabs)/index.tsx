import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { useVocabularyStore } from '@/stores/vocabulary-store';
import { apiClient } from '@/lib/api-client';
import type { WordOfDay } from '@/lib/types';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, user: authUser, setProfile } = useAuthStore();
  const { stats, fetchStats } = useVocabularyStore();
  const [user, setUser] = useState<{ email: string; displayName?: string; avatarUrl?: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [wordOfDay, setWordOfDay] = useState<WordOfDay | null>(null);

  const loadProfile = async () => {
    if (!isAuthenticated || !authUser) return;

    try {
      const profileData = await apiClient.get<{ profile: { display_name: string; avatar_url: string } }>('/api/user/profile');
      const profile = {
        displayName: profileData.profile?.display_name || '',
        avatarUrl: profileData.profile?.avatar_url || '',
      };
      setUser({
        email: authUser.email,
        ...profile,
      });
      // Update auth store as well so other components get the update
      setProfile(profile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setUser({ email: authUser.email });
    }
  };

  const loadData = async (forceRefresh = false) => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [_, wordRes] = await Promise.all([
        fetchStats(forceRefresh), // Use shared store
        apiClient.get<{ word: { id: string; word_zh: string; word_pinyin: string; word_en: string; example_sentence?: string } }>('/api/word-of-day'),
      ]);

      // Map snake_case API response to WordOfDay type
      if (wordRes.word) {
        setWordOfDay({
          id: wordRes.word.id,
          wordZh: wordRes.word.word_zh,
          pinyin: wordRes.word.word_pinyin,
          wordEn: wordRes.word.word_en,
          exampleSentence: wordRes.word.example_sentence,
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProfile(), loadData(true)]);
    setRefreshing(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadProfile();
      loadData(false); // Use cache if available
    }
  }, [isAuthenticated]);

  // Refresh data when screen comes into focus (e.g., after saving a word)
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        loadProfile();
        // Only fetch if cache is stale (older than 5 minutes)
        const lastFetched = useVocabularyStore.getState().lastFetched.stats;
        const shouldFetch = !lastFetched || Date.now() - lastFetched > 5 * 60 * 1000;
        if (shouldFetch) {
          loadData(false);
        }
      }
    }, [isAuthenticated])
  );

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  // Guest/Trial Home Screen
  if (!isAuthenticated) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: bgColor }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroGradient}>
            <View style={styles.heroContent}>
              <View style={styles.logoContainer}>
                <Ionicons name="camera" size={40} color="#fff" />
              </View>
              <Text style={styles.heroTitle}>
                Learn Chinese{'\n'}Through Photos
              </Text>
              <Text style={styles.heroSubtitle}>
                Snap a photo, discover vocabulary, master Chinese naturally
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/capture-modal')}
                style={styles.heroButton}
              >
                <Ionicons name="sparkles" size={20} color="#7c3aed" />
                <Text style={styles.heroButtonText}>Try Free Analysis</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={[styles.section, { backgroundColor: bgColor }]}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            How It Works
          </Text>

          <View style={styles.featuresGrid}>
            <FeatureCard
              icon="camera"
              title="Take a Photo"
              description="Capture anything around you"
              isDark={isDark}
            />
            <FeatureCard
              icon="scan"
              title="AI Analysis"
              description="Our AI detects objects instantly"
              isDark={isDark}
            />
            <FeatureCard
              icon="book"
              title="Learn Words"
              description="Get Chinese, Pinyin & English"
              isDark={isDark}
            />
            <FeatureCard
              icon="trophy"
              title="Track Progress"
              description="Build your vocabulary library"
              isDark={isDark}
            />
          </View>
        </View>

        {/* Word of the Day - Preview */}
        {wordOfDay && (
          <View style={[styles.section, { backgroundColor: bgColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>
              Word of the Day
            </Text>
            <View style={[styles.wordCard, { backgroundColor: cardColor }]}>
              <Text style={styles.chineseText}>{wordOfDay.wordZh}</Text>
              <Text style={styles.pinyinText}>{wordOfDay.pinyin}</Text>
              <Text style={[styles.englishText, { color: subtextColor }]}>
                {wordOfDay.wordEn}
              </Text>
            </View>
          </View>
        )}

        {/* Sign Up CTA */}
        <View style={[styles.ctaSection, { backgroundColor: cardColor }]}>
          <Text style={[styles.ctaTitle, { color: textColor }]}>
            Ready to start learning?
          </Text>
          <Text style={[styles.ctaSubtitle, { color: subtextColor }]}>
            Create a free account to save words and track your progress
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/signup')}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaButtonText}>Create Free Account</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(auth)/login')}
            style={styles.loginLink}
          >
            <Text style={[styles.loginText, { color: subtextColor }]}>
              Already have an account? <Text style={{ color: '#7c3aed', fontWeight: '600' }}>Sign In</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    );
  }

  // Authenticated Home Screen
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello!</Text>
          <Text style={[styles.userEmail, { color: subtextColor }]}>
            {user?.displayName || user?.email?.split('@')[0] || 'Guest'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => router.push('/settings')}
        >
          {user?.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.headerAvatar} />
          ) : (
            <Ionicons name="person-circle" size={44} color="#7c3aed" />
          )}
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7c3aed" />
          <Text style={[styles.loadingText, { color: subtextColor }]}>
            Loading your stats...
          </Text>
        </View>
      ) : (
        <>
          {/* Stats Cards */}
          <View style={styles.statsContainer}>
            <StatCard
              value={stats?.totalWords ?? 0}
              label="Words"
              icon="book"
              color="#7c3aed"
              isDark={isDark}
            />
            <StatCard
              value={stats?.currentStreak ?? 0}
              label="Day Streak"
              icon="flame"
              color="#f59e0b"
              isDark={isDark}
            />
            <StatCard
              value={stats?.dueToday ?? 0}
              label="Due Today"
              icon="time"
              color="#10b981"
              isDark={isDark}
            />
          </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Quick Actions
        </Text>
        <View style={styles.actionsRow}>
          <ActionButton
            icon="camera"
            label="Capture"
            color="#7c3aed"
            onPress={() => router.push('/capture-modal')}
            isDark={isDark}
          />
          <ActionButton
            icon="school"
            label="Practice"
            color="#10b981"
            onPress={() => router.push('/(tabs)/practice')}
            isDark={isDark}
          />
          <ActionButton
            icon="bookmark"
            label="Lists"
            color="#f59e0b"
            onPress={() => router.push('/(tabs)/lists')}
            isDark={isDark}
          />
        </View>
      </View>

      {/* Word of the Day */}
      {wordOfDay && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Word of the Day
          </Text>
          <View style={[styles.wordCardLarge, { backgroundColor: cardColor }]}>
            <Text style={styles.chineseTextLarge}>{wordOfDay.wordZh}</Text>
            <Text style={styles.pinyinTextLarge}>{wordOfDay.pinyin}</Text>
            <Text style={[styles.englishTextLarge, { color: subtextColor }]}>
              {wordOfDay.wordEn}
            </Text>
            {wordOfDay.exampleSentence && (
              <Text style={[styles.exampleText, { color: subtextColor }]}>
                "{wordOfDay.exampleSentence}"
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Empty State - No Vocabulary */}
      {!isLoading && stats && stats.totalWords === 0 && (
        <View style={[styles.emptyStateCard, { backgroundColor: cardColor }]}>
          <View style={styles.emptyStateIcon}>
            <Ionicons name="camera-outline" size={48} color="#7c3aed" />
          </View>
          <Text style={[styles.emptyStateTitle, { color: textColor }]}>
            Start Your Journey
          </Text>
          <Text style={[styles.emptyStateDesc, { color: subtextColor }]}>
            Take your first photo to discover Chinese vocabulary. Our AI will identify objects and teach you their names.
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/capture-modal')}
            style={styles.emptyStateButton}
          >
            <Ionicons name="camera" size={20} color="#fff" />
            <Text style={styles.emptyStateButtonText}>Take First Photo</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Review Prompt */}
      {stats && stats.dueToday > 0 && (
        <View style={[styles.reviewCard, { backgroundColor: cardColor }]}>
          <View style={styles.reviewContent}>
            <View>
              <Text style={[styles.reviewCount, { color: textColor }]}>
                {stats.dueToday}
              </Text>
              <Text style={[styles.reviewLabel, { color: subtextColor }]}>
                words to review
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/practice')}
              style={styles.reviewButton}
            >
              <Text style={styles.reviewButtonText}>Review Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* All Caught Up - No Due Words */}
      {!isLoading && stats && stats.totalWords > 0 && stats.dueToday === 0 && (
        <View style={[styles.caughtUpCard, { backgroundColor: cardColor }]}>
          <View style={styles.caughtUpIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#10b981" />
          </View>
          <Text style={[styles.caughtUpTitle, { color: textColor }]}>
            All Caught Up!
          </Text>
          <Text style={[styles.caughtUpDesc, { color: subtextColor }]}>
            You have no words to review right now. Great job staying on top of your practice!
          </Text>
          <TouchableOpacity
            onPress={() => router.push('/games')}
            style={styles.caughtUpButton}
          >
            <Ionicons name="game-controller" size={20} color="#fff" />
            <Text style={styles.caughtUpButtonText}>Play Games</Text>
          </TouchableOpacity>
        </View>
      )}

        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, isDark }: any) {
  return (
    <View style={[styles.featureCard, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc' }]}>
      <View style={styles.featureIcon}>
        <Ionicons name={icon} size={24} color="#7c3aed" />
      </View>
      <Text style={[styles.featureTitle, { color: isDark ? '#fff' : '#000' }]}>
        {title}
      </Text>
      <Text style={[styles.featureDesc, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
        {description}
      </Text>
    </View>
  );
}

// Stat Card Component
function StatCard({ value, label, icon, color, isDark }: any) {
  return (
    <View style={[styles.statCard, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc' }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>
        {label}
      </Text>
    </View>
  );
}

// Action Button Component
function ActionButton({ icon, label, color, onPress, isDark }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.actionButton}>
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon} size={24} color="#fff" />
      </View>
      <Text style={[styles.actionLabel, { color: isDark ? '#fff' : '#000' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Hero Section (Guest)
  heroSection: {
    height: 420,
  },
  heroGradient: {
    flex: 1,
    backgroundColor: '#7c3aed',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  heroContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
  },
  heroButtonText: {
    color: '#7c3aed',
    fontSize: 16,
    fontWeight: '600',
  },
  // Section
  section: {
    padding: 20,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Word Card (Guest)
  wordCard: {
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
  },
  chineseText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 8,
  },
  pinyinText: {
    fontSize: 18,
    color: '#a78bfa',
    marginBottom: 8,
  },
  englishText: {
    fontSize: 16,
  },
  // CTA Section
  ctaSection: {
    margin: 20,
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  ctaSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  ctaButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
    width: '100%',
    alignItems: 'center',
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginLink: {
    marginTop: 16,
  },
  loginText: {
    fontSize: 14,
  },
  // Authenticated Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  // Loading
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  // Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    alignItems: 'center',
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  // Word Card (Authenticated)
  wordCardLarge: {
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
  },
  chineseTextLarge: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 8,
  },
  pinyinTextLarge: {
    fontSize: 20,
    color: '#a78bfa',
    marginBottom: 8,
  },
  englishTextLarge: {
    fontSize: 16,
    marginBottom: 12,
  },
  exampleText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  // Review Card
  reviewCard: {
    margin: 20,
    marginTop: 8,
    padding: 20,
    borderRadius: 20,
  },
  reviewContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reviewCount: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  reviewLabel: {
    fontSize: 14,
    marginTop: 2,
  },
  reviewButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
  },
  reviewButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  // Empty State - No Vocabulary
  emptyStateCard: {
    margin: 20,
    marginTop: 8,
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyStateButton: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Caught Up State
  caughtUpCard: {
    margin: 20,
    marginTop: 8,
    padding: 28,
    borderRadius: 24,
    alignItems: 'center',
  },
  caughtUpIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  caughtUpTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  caughtUpDesc: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  caughtUpButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    gap: 8,
  },
  caughtUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
