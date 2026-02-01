import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';
import type { VocabularyItem } from '@/lib/types';

type QuizMode = 'flashcard' | 'multiple-choice' | 'listening';

export default function PracticeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuthStore();
  const [dueWords, setDueWords] = useState<VocabularyItem[]>([]);
  const [stats, setStats] = useState({
    totalWords: 0,
    dueToday: 0,
    streakDays: 0,
  });

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  const loadData = async () => {
    if (!isAuthenticated) return;
    try {
      const [wordsRes, statsRes] = await Promise.all([
        apiClient.get<VocabularyItem[]>('/api/practice/due-words'),
        apiClient.get<{ totalWords: number; dueToday: number; streakDays: number }>('/api/stats'),
      ]);

      setDueWords(wordsRes);
      setStats(statsRes);
    } catch (error) {
      console.error('Failed to load practice data:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAuthenticated]);

  const startPractice = (mode: QuizMode) => {
    if (dueWords.length === 0) {
      Alert.alert(
        'No Words Due',
        'You have no words to review right now. Great job!'
      );
      return;
    }
    // Navigate to practice session
    router.push({
      pathname: '/practice-session',
      params: { mode },
    });
  };

  const practiceModes = [
    {
      id: 'flashcard' as QuizMode,
      title: 'Flashcards',
      description: 'Review words with spaced repetition',
      icon: 'albums',
      color: '#7c3aed',
    },
    {
      id: 'multiple-choice' as QuizMode,
      title: 'Multiple Choice',
      description: 'Test your knowledge',
      icon: 'list',
      color: '#10b981',
    },
    {
      id: 'listening' as QuizMode,
      title: 'Listening',
      description: 'Practice pronunciation',
      icon: 'ear',
      color: '#f59e0b',
    },
  ];

  // Guest view - prompt to login
  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Practice</Text>
          <Text style={styles.headerSubtitle}>Sign in to start practicing</Text>
        </View>

        {/* Login Prompt */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.guestCard, { backgroundColor: cardColor }]}>
            <Ionicons name="school-outline" size={64} color="#7c3aed" />
            <Text style={[styles.guestTitle, { color: textColor }]}>
              Master Your Vocabulary
            </Text>
            <Text style={[styles.guestSubtitle, { color: subtextColor }]}>
              Practice with flashcards, quizzes, and listening exercises to reinforce your learning
            </Text>

            {/* Practice Modes Preview */}
            <View style={styles.previewContainer}>
              {practiceModes.map((mode) => (
                <View key={mode.id} style={styles.previewItem}>
                  <View style={[styles.previewIcon, { backgroundColor: `${mode.color}20` }]}>
                    <Ionicons name={mode.icon as any} size={20} color={mode.color} />
                  </View>
                  <Text style={[styles.previewTitle, { color: textColor }]}>{mode.title}</Text>
                  <Text style={[styles.previewDesc, { color: subtextColor }]}>{mode.description}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/login')}
              style={styles.loginButton}
            >
              <Text style={styles.loginButtonText}>Sign In to Practice</Text>
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
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  // Authenticated view
  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice</Text>
        <Text style={styles.headerSubtitle}>
          Master your vocabulary with spaced repetition
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.statValue, { color: '#7c3aed' }]}>
            {stats.dueToday}
          </Text>
          <Text style={[styles.statLabel, { color: subtextColor }]}>
            Due Today
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.statValue, { color: '#f59e0b' }]}>
            {stats.streakDays}
          </Text>
          <Text style={[styles.statLabel, { color: subtextColor }]}>
            Day Streak
          </Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.statValue, { color: '#10b981' }]}>
            {stats.totalWords}
          </Text>
          <Text style={[styles.statLabel, { color: subtextColor }]}>
            Total Words
          </Text>
        </View>
      </View>

      {/* Practice Modes */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Practice Modes
        </Text>

        {practiceModes.map((mode) => (
          <TouchableOpacity
            key={mode.id}
            onPress={() => startPractice(mode.id)}
            style={[styles.modeCard, { backgroundColor: cardColor }]}
          >
            <View style={styles.modeContent}>
              <View
                style={[
                  styles.modeIcon,
                  { backgroundColor: `${mode.color}20` },
                ]}
              >
                <Ionicons name={mode.icon as any} size={24} color={mode.color} />
              </View>
              <View style={styles.modeText}>
                <Text style={[styles.modeTitle, { color: textColor }]}>
                  {mode.title}
                </Text>
                <Text style={[styles.modeDesc, { color: subtextColor }]}>
                  {mode.description}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={subtextColor}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Start */}
      {dueWords.length > 0 && (
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            onPress={() => startPractice('flashcard')}
            style={styles.ctaButton}
          >
            <Ionicons name="play" size={20} color="white" />
            <Text style={styles.ctaButtonText}>
              Start Practice Session ({dueWords.length} words)
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
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
  content: {
    flex: 1,
    padding: 20,
  },
  // Guest styles
  guestCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  guestSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  previewContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  previewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    borderRadius: 12,
  },
  previewIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewTitle: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  previewDesc: {
    fontSize: 12,
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
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    padding: 16,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  modeCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  modeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: {
    flex: 1,
    marginLeft: 12,
  },
  modeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  modeDesc: {
    fontSize: 14,
    marginTop: 2,
  },
  ctaContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  ctaButton: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  ctaButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
