import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import { supabase } from '@/lib/supabase-client';
import type { VocabularyStats, WordOfDay } from '@/lib/types';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated, user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [wordOfDay, setWordOfDay] = useState<WordOfDay | null>(null);

  const loadData = async () => {
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping data load');
      return;
    }

    try {
      // Debug: Check session
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('Session exists:', !!sessionData.session);
      console.log('Token exists:', !!sessionData.session?.access_token);

      const [statsRes, wordRes] = await Promise.all([
        apiClient.get<VocabularyStats>('/api/stats'),
        apiClient.get<WordOfDay>('/api/word-of-day'),
      ]);

      setStats(statsRes);
      setWordOfDay(wordRes);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

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
            {user?.email?.split('@')[0]}
          </Text>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <Ionicons name="person-circle" size={44} color="#7c3aed" />
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <StatCard
          value={stats?.totalWords || 0}
          label="Words"
          icon="book"
          color="#7c3aed"
          isDark={isDark}
        />
        <StatCard
          value={stats?.streakDays || 0}
          label="Day Streak"
          icon="flame"
          color="#f59e0b"
          isDark={isDark}
        />
        <StatCard
          value={stats?.dueToday || 0}
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
            icon="list"
            label="Words"
            color="#f59e0b"
            onPress={() => router.push('/(tabs)/vocabulary')}
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
});
