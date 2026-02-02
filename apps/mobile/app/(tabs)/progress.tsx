import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';

const { width } = Dimensions.get('window');

interface Stats {
  currentStreak: number;
  longestStreak: number;
  totalWords: number;
  learnedWords: number;
  totalPracticeSessions: number;
  lastPracticeDate: string | null;
  wordsPerDay: Array<{ date: string; count: number }>;
  dueToday: number;
  masteredThisWeek: number;
  averageEaseFactor: number;
  hskDistribution: Record<string, number>;
  reviewForecast: Array<{ date: string; count: number }>;
}

interface ActivityData {
  date: string;
  wordsReviewed: number;
}

interface DetailedStats {
  wordsByState: { new: number; learning: number; reviewing: number; mastered: number };
}

const HSK_COLORS: Record<string, string> = {
  hsk1: '#10b981',
  hsk2: '#34d399',
  hsk3: '#f59e0b',
  hsk4: '#f97316',
  hsk5: '#ef4444',
  hsk6: '#8b5cf6',
  unclassified: '#6b7280',
};

const HSK_LABELS: Record<string, string> = {
  hsk1: 'HSK 1',
  hsk2: 'HSK 2',
  hsk3: 'HSK 3',
  hsk4: 'HSK 4',
  hsk5: 'HSK 5',
  hsk6: 'HSK 6',
  unclassified: 'Other',
};

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [detailedStats, setDetailedStats] = useState<DetailedStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  const loadData = async () => {
    if (!isAuthenticated) return;
    try {
      const [statsRes, activityRes, detailedRes] = await Promise.all([
        apiClient.get<Stats>('/api/stats'),
        apiClient.get<{ activity: ActivityData[] }>('/api/stats/activity?days=84'),
        apiClient.get<DetailedStats>('/api/stats/detailed'),
      ]);

      setStats(statsRes);
      setActivityData(activityRes.activity || []);
      setDetailedStats(detailedRes);
    } catch (error) {
      console.error('Failed to load progress:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="trending-up" size={64} color="#7c3aed" />
        <Text style={[styles.emptyTitle, { color: textColor }]}>Sign in to view progress</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: subtextColor }}>Loading...</Text>
      </View>
    );
  }

  if (!stats || stats.totalWords === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Progress</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="trending-up" size={64} color={isDark ? '#374151' : '#9ca3af'} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>No progress yet</Text>
          <Text style={[styles.emptySubtitle, { color: subtextColor }]}>
            Start building your vocabulary by analyzing photos
          </Text>
          <TouchableOpacity style={styles.captureButton} onPress={() => router.push('/capture-modal')}>
            <Text style={styles.captureButtonText}>Capture Photo</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const masteryRate = stats.totalWords > 0
    ? Math.round((stats.learnedWords / stats.totalWords) * 100)
    : 0;

  const maxForecast = Math.max(...stats.reviewForecast.map((d) => d.count), 1);
  const totalHskWords = Object.values(stats.hskDistribution).reduce((a, b) => a + b, 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: bgColor }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Progress</Text>
      </View>

      {/* Due Today CTA */}
      {stats.dueToday > 0 && (
        <View style={[styles.ctaCard, { backgroundColor: cardColor }]}>
          <View style={styles.ctaContent}>
            <View style={styles.ctaIcon}>
              <Ionicons name="time" size={24} color="#7c3aed" />
            </View>
            <View style={styles.ctaText}>
              <Text style={[styles.ctaTitle, { color: textColor }]}>
                {stats.dueToday} words due for review
              </Text>
              <Text style={[styles.ctaSubtitle, { color: subtextColor }]}>
                Keep your streak alive!
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.practiceButton} onPress={() => router.push('/(tabs)/practice')}>
            <Text style={styles.practiceButtonText}>Practice</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <StatCard
          icon="flame"
          label="Current Streak"
          value={stats.currentStreak}
          subvalue={`Best: ${stats.longestStreak} days`}
          color="#f59e0b"
          isDark={isDark}
        />
        <StatCard
          icon="time"
          label="Due Today"
          value={stats.dueToday}
          subvalue="Words to review"
          color="#7c3aed"
          isDark={isDark}
        />
        <StatCard
          icon="book"
          label="Total Words"
          value={stats.totalWords}
          subvalue="In your vocabulary"
          color="#3b82f6"
          isDark={isDark}
        />
        <StatCard
          icon="school"
          label="Mastered"
          value={stats.learnedWords}
          subvalue={`${masteryRate}% of total`}
          color="#10b981"
          isDark={isDark}
        />
      </View>

      {/* Mastery Progress */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="trending-up" size={20} color="#7c3aed" />
            <Text style={[styles.cardTitle, { color: textColor }]}>Mastery Progress</Text>
          </View>
          <Text style={[styles.cardValue, { color: '#7c3aed' }]}>{masteryRate}%</Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
          <View style={[styles.progressFill, { width: `${masteryRate}%` }]} />
        </View>
        <View style={styles.progressLabels}>
          <Text style={{ color: subtextColor }}>{stats.learnedWords} mastered</Text>
          <Text style={{ color: subtextColor }}>{stats.totalWords - stats.learnedWords} learning</Text>
        </View>
      </View>

      {/* HSK Distribution */}
      {totalHskWords > 0 && (
        <View style={[styles.card, { backgroundColor: cardColor }]}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="bar-chart" size={20} color="#10b981" />
            <Text style={[styles.cardTitle, { color: textColor }]}>HSK Level Distribution</Text>
          </View>
          <View style={styles.hskList}>
            {Object.entries(stats.hskDistribution)
              .filter(([_, count]) => count > 0)
              .map(([level, count]) => {
                const percentage = Math.round((count / totalHskWords) * 100);
                return (
                  <View key={level} style={styles.hskItem}>
                    <View style={styles.hskHeader}>
                      <Text style={{ color: textColor }}>{HSK_LABELS[level]}</Text>
                      <Text style={{ color: subtextColor }}>
                        {count} ({percentage}%)
                      </Text>
                    </View>
                    <View style={[styles.hskBar, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
                      <View
                        style={[styles.hskFill, { backgroundColor: HSK_COLORS[level], width: `${percentage}%` }]}
                      />
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      )}

      {/* Review Forecast */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.cardTitleRow}>
          <Ionicons name="calendar" size={20} color="#06b6d4" />
          <Text style={[styles.cardTitle, { color: textColor }]}>Review Forecast (7 Days)</Text>
        </View>
        <View style={styles.forecastContainer}>
          {stats.reviewForecast.map((day, index) => {
            const height = maxForecast > 0 ? (day.count / maxForecast) * 80 : 0;
            const date = new Date(day.date);
            const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
            const isToday = index === 0;

            return (
              <View key={day.date} style={styles.forecastItem}>
                <Text style={[styles.forecastCount, { color: textColor }]}>{day.count}</Text>
                <View style={[styles.forecastBarContainer, { height: 80 }]}>
                  <View
                    style={[
                      styles.forecastBar,
                      {
                        height: Math.max(height, 4),
                        backgroundColor: isToday ? '#7c3aed' : '#06b6d4',
                        opacity: isToday ? 1 : 0.6,
                      },
                    ]}
                  />
                </View>
                <Text style={[styles.forecastDay, { color: isToday ? '#7c3aed' : subtextColor }]}>
                  {dayName}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Practice Sessions */}
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleRow}>
            <Ionicons name="fitness" size={20} color="#7c3aed" />
            <Text style={[styles.cardTitle, { color: textColor }]}>Practice Sessions</Text>
          </View>
          <Text style={[styles.cardValue, { color: '#7c3aed' }]}>{stats.totalPracticeSessions}</Text>
        </View>
        <Text style={{ color: subtextColor }}>
          You've completed {stats.totalPracticeSessions} practice sessions
        </Text>
      </View>

      {/* Streak Message */}
      {stats.currentStreak > 0 && (
        <View style={[styles.motivationCard, { backgroundColor: isDark ? '#1a1a1a' : '#fef3c7' }]}>
          <Text style={styles.motivationEmoji}>
            {stats.currentStreak >= 30 ? '🏆' : stats.currentStreak >= 7 ? '🎉' : '🔥'}
          </Text>
          <Text style={[styles.motivationText, { color: textColor }]}>
            {stats.currentStreak === 1
              ? 'Great start! Keep practicing tomorrow!'
              : stats.currentStreak < 7
                ? `${stats.currentStreak} day streak! You're building momentum!`
                : stats.currentStreak < 30
                  ? `${stats.currentStreak} days! You're on fire!`
                  : `${stats.currentStreak} days! You're a dedication champion!`}
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  subvalue,
  color,
  isDark,
}: {
  icon: string;
  label: string;
  value: number;
  subvalue: string;
  color: string;
  isDark: boolean;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc' }]}>
      <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: isDark ? '#9ca3af' : '#6b7280' }]}>{label}</Text>
      <Text style={[styles.statSubvalue, { color: isDark ? '#6b7280' : '#9ca3af' }]}>{subvalue}</Text>
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
    color: '#ffffff',
  },
  ctaCard: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  ctaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ctaIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(124, 58, 237, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  ctaText: {
    flex: 1,
  },
  ctaTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  ctaSubtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  practiceButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  practiceButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (width - 56) / 2,
    padding: 16,
    borderRadius: 16,
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
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  statSubvalue: {
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  hskList: {
    gap: 12,
  },
  hskItem: {
    gap: 4,
  },
  hskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hskBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  hskFill: {
    height: '100%',
    borderRadius: 3,
  },
  forecastContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  forecastItem: {
    flex: 1,
    alignItems: 'center',
  },
  forecastCount: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  forecastBarContainer: {
    width: '80%',
    justifyContent: 'flex-end',
  },
  forecastBar: {
    width: '100%',
    borderRadius: 4,
  },
  forecastDay: {
    fontSize: 11,
    marginTop: 4,
  },
  motivationCard: {
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  motivationEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  motivationText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  captureButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
  },
  captureButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 16,
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
