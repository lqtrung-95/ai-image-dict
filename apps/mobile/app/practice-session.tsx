import { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
  Image,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { apiClient } from '@/lib/api-client';
import type { VocabularyItem } from '@/lib/types';

type QuizMode = 'flashcard' | 'multiple-choice' | 'listening';
type Rating = 1 | 2 | 3 | 4;

interface PracticeWord extends VocabularyItem {
  options?: string[];
}

export default function PracticeSessionScreen() {
  const { mode } = useLocalSearchParams<{ mode: QuizMode }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [words, setWords] = useState<PracticeWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [stats, setStats] = useState({ correct: 0, incorrect: 0 });

  const flipAnim = useState(new Animated.Value(0))[0];

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  const loadWords = useCallback(async () => {
    try {
      const response = await apiClient.get<{
        items: VocabularyItem[];
        dueCount: number;
        newCount: number;
        total: number;
      }>('/api/practice/due-words?limit=20');

      console.log('[Practice] Loaded words:', response.items?.length);
      console.log('[Practice] First word sample:', response.items?.[0]);

      let practiceWords: PracticeWord[] = response.items || [];

      // Generate options for multiple choice
      if (mode === 'multiple-choice') {
        practiceWords = practiceWords.map((word) => ({
          ...word,
          options: generateOptions(word, practiceWords),
        }));
      }

      setWords(practiceWords);
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load practice words:', error);
      Alert.alert('Error', 'Failed to load practice words');
      router.back();
    }
  }, [mode]);

  useEffect(() => {
    loadWords();
  }, [loadWords]);

  const generateOptions = (correct: VocabularyItem, allWords: VocabularyItem[]): string[] => {
    const options = [correct.wordEn];
    const otherWords = allWords.filter((w) => w.id !== correct.id);

    while (options.length < 4 && otherWords.length > 0) {
      const randomIndex = Math.floor(Math.random() * otherWords.length);
      const option = otherWords[randomIndex].wordEn;
      if (!options.includes(option)) {
        options.push(option);
      }
      otherWords.splice(randomIndex, 1);
    }

    // Shuffle options
    return options.sort(() => Math.random() - 0.5);
  };

  const flipCard = () => {
    if (showAnswer) {
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
    setShowAnswer(!showAnswer);
  };

  const [showFeedback, setShowFeedback] = useState<{rating: Rating, visible: boolean} | null>(null);

  const handleRate = async (rating: Rating) => {
    const currentWord = words[currentIndex];

    if (!currentWord?.id) {
      Alert.alert('Error', 'Word ID not found');
      return;
    }

    // Show feedback
    setShowFeedback({ rating, visible: true });
    setTimeout(() => setShowFeedback(null), 600);

    try {
      await apiClient.post('/api/word-attempts', {
        vocabularyItemId: currentWord.id,
        quizMode: mode,
        rating,
        isCorrect: rating >= 3,
      });
    } catch (error: any) {
      console.error('[handleRate] Failed:', error);
    }

    if (rating >= 3) {
      setStats((s) => ({ ...s, correct: s.correct + 1 }));
    } else {
      setStats((s) => ({ ...s, incorrect: s.incorrect + 1 }));
    }

    if (currentIndex < words.length - 1) {
      setCurrentIndex((i) => i + 1);
      setShowAnswer(false);
      setSelectedOption(null);
      setIsCorrect(null);
      flipAnim.setValue(0);
    } else {
      setSessionComplete(true);
    }
  };

  const handleOptionSelect = (option: string) => {
    const currentWord = words[currentIndex];
    const correct = option === currentWord.wordEn;

    setSelectedOption(option);
    setIsCorrect(correct);

    // Auto-advance after a delay
    setTimeout(() => {
      handleRate(correct ? 3 : 1);
    }, 1000);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: subtextColor }}>Loading...</Text>
      </View>
    );
  }

  if (words.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="checkmark-circle" size={64} color="#10b981" />
          <Text style={[styles.emptyTitle, { color: textColor }]}>All Caught Up!</Text>
          <Text style={[styles.emptySubtitle, { color: subtextColor }]}>
            You have no words to review right now.
          </Text>
        </View>
      </View>
    );
  }

  if (sessionComplete) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>
        </View>
        <View style={styles.completeContainer}>
          <Ionicons name="trophy" size={80} color="#f59e0b" />
          <Text style={[styles.completeTitle, { color: textColor }]}>Session Complete!</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.correct}</Text>
              <Text style={[styles.statLabel, { color: subtextColor }]}>Correct</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNumber, { color: '#ef4444' }]}>{stats.incorrect}</Text>
              <Text style={[styles.statLabel, { color: subtextColor }]}>Incorrect</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.doneButton} onPress={() => router.back()}>
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={textColor} />
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { backgroundColor: isDark ? '#333' : '#e5e7eb' }]}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={[styles.progressText, { color: subtextColor }]}>
            {currentIndex + 1} / {words.length}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {mode === 'flashcard' && (
          <TouchableOpacity activeOpacity={1} onPress={flipCard} style={styles.cardContainer}>
            <View style={[styles.flashcard, { backgroundColor: cardColor }]}>
              {/* Front of card - Chinese */}
              <Animated.View
                style={[
                  styles.cardFace,
                  styles.cardFaceFront,
                  {
                    opacity: flipAnim.interpolate({
                      inputRange: [0, 0.5],
                      outputRange: [1, 0],
                    }),
                  },
                ]}
              >
                <View style={styles.cardContent}>
                  <Text style={styles.chineseText}>{currentWord.wordZh}</Text>
                  <Text style={styles.pinyinText}>{currentWord.wordPinyin}</Text>
                  <View style={styles.tapHintContainer}>
                    <Ionicons name="sync" size={16} color={subtextColor} />
                    <Text style={[styles.tapHint, { color: subtextColor }]}>Tap to flip</Text>
                  </View>
                </View>
              </Animated.View>

              {/* Back of card - English + Image */}
              <Animated.View
                style={[
                  styles.cardFace,
                  styles.cardFaceBack,
                  {
                    opacity: flipAnim.interpolate({
                      inputRange: [0.5, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ]}
              >
                <View style={styles.cardContent}>
                  <Text style={[styles.backLabel, { color: subtextColor }]}>Meaning</Text>
                  <Text style={[styles.englishText, { color: textColor }]}>{currentWord.wordEn}</Text>

                  {currentWord.exampleSentence && (
                    <>
                      <Text style={[styles.backLabel, { color: subtextColor, marginTop: 20 }]}>Example</Text>
                      <Text style={[styles.exampleText, { color: textColor }]}>
                        "{currentWord.exampleSentence}"
                      </Text>
                    </>
                  )}

                  {currentWord.photoUrl ? (
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: currentWord.photoUrl, cache: 'force-cache' }}
                        style={styles.wordImage}
                        resizeMode="cover"
                        onError={(e) => console.log('[Image] Load error:', e.nativeEvent.error)}
                        onLoad={() => console.log('[Image] Loaded successfully')}
                      />
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <Ionicons name="image-outline" size={40} color={isDark ? '#333' : '#ddd'} />
                      <Text style={[styles.placeholderText, { color: subtextColor }]}>No image</Text>
                      <Text style={[styles.debugText, { color: subtextColor }]}>
                        ID: {currentWord.id?.substring(0, 8)}...
                      </Text>
                    </View>
                  )}

                  <View style={styles.tapHintContainer}>
                    <Ionicons name="sync" size={16} color={subtextColor} />
                    <Text style={[styles.tapHint, { color: subtextColor }]}>Tap to flip back</Text>
                  </View>
                </View>
              </Animated.View>
            </View>
          </TouchableOpacity>
        )}

        {mode === 'multiple-choice' && (
          <View style={styles.mcContainer}>
            <View style={[styles.questionCard, { backgroundColor: cardColor }]}>
              <Text style={styles.chineseText}>{currentWord.wordZh}</Text>
              <Text style={styles.pinyinText}>{currentWord.wordPinyin}</Text>
            </View>
            <View style={styles.optionsContainer}>
              {currentWord.options?.map((option, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleOptionSelect(option)}
                  disabled={selectedOption !== null}
                  style={[
                    styles.optionButton,
                    {
                      backgroundColor:
                        selectedOption === option
                          ? isCorrect
                            ? 'rgba(16, 185, 129, 0.2)'
                            : 'rgba(239, 68, 68, 0.2)'
                          : cardColor,
                      borderColor:
                        selectedOption === option
                          ? isCorrect
                            ? '#10b981'
                            : '#ef4444'
                          : 'transparent',
                    },
                  ]}
                >
                  <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                  {selectedOption === option && (
                    <Ionicons
                      name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={isCorrect ? '#10b981' : '#ef4444'}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {mode === 'listening' && (
          <View style={styles.listeningContainer}>
            <TouchableOpacity
              style={[styles.speakButton, { backgroundColor: cardColor }]}
              onPress={() => {
                Speech.speak(currentWord.wordZh, {
                  language: 'zh-CN',
                  pitch: 1.0,
                  rate: 0.8,
                });
              }}
            >
              <Ionicons name="volume-high" size={48} color="#7c3aed" />
              <Text style={[styles.speakButtonText, { color: subtextColor }]}>
                Tap to hear the word
              </Text>
            </TouchableOpacity>

            {!showAnswer ? (
              <TouchableOpacity style={styles.revealButton} onPress={flipCard}>
                <Text style={styles.revealButtonText}>Show Answer</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.answerCard, { backgroundColor: cardColor }]}>
                <Text style={styles.chineseText}>{currentWord.wordZh}</Text>
                <Text style={styles.pinyinText}>{currentWord.wordPinyin}</Text>
                <Text style={[styles.englishText, { color: textColor }]}>{currentWord.wordEn}</Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Rating Buttons (Flashcard & Listening only) */}
      {(mode === 'flashcard' || (mode === 'listening' && showAnswer)) && (
        <View style={styles.ratingContainer}>
          <TouchableOpacity
            onPress={() => handleRate(1)}
            style={[styles.ratingButton, { backgroundColor: '#ef4444' }]}
          >
            <Text style={styles.ratingText}>Again</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRate(2)}
            style={[styles.ratingButton, { backgroundColor: '#f59e0b' }]}
          >
            <Text style={styles.ratingText}>Hard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRate(3)}
            style={[styles.ratingButton, { backgroundColor: '#3b82f6' }]}
          >
            <Text style={styles.ratingText}>Good</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRate(4)}
            style={[styles.ratingButton, { backgroundColor: '#10b981' }]}
          >
            <Text style={styles.ratingText}>Easy</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Rating Feedback Overlay */}
      {showFeedback?.visible && (
        <View style={styles.feedbackOverlay}>
          <View style={[styles.feedbackBadge, { backgroundColor: showFeedback.rating >= 3 ? '#10b981' : '#ef4444' }]}>
            <Ionicons name={showFeedback.rating >= 3 ? 'checkmark-circle' : 'close-circle'} size={32} color="#fff" />
            <Text style={styles.feedbackText}>
              {showFeedback.rating >= 3 ? 'Correct!' : 'Keep practicing!'}
            </Text>
          </View>
        </View>
      )}
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
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  // Flashcard styles
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  flashcard: {
    borderRadius: 24,
    minHeight: 420,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cardFace: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 24,
  },
  cardFaceFront: {
    zIndex: 2,
  },
  cardFaceBack: {
    zIndex: 1,
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  chineseText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  pinyinText: {
    fontSize: 24,
    color: '#a78bfa',
    marginTop: 12,
  },
  backLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  englishText: {
    fontSize: 28,
    fontWeight: '600',
  },
  tapHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
  },
  tapHint: {
    fontSize: 14,
  },
  exampleText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
    lineHeight: 22,
  },
  imageContainer: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  wordImage: {
    width: 240,
    height: 160,
    borderRadius: 16,
  },
  imagePlaceholder: {
    width: 240,
    height: 120,
    borderRadius: 16,
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  placeholderText: {
    fontSize: 14,
  },
  debugText: {
    fontSize: 10,
    marginTop: 4,
  },
  // Rating buttons
  ratingContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    paddingBottom: 40,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  ratingText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  feedbackOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 100,
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  feedbackBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  feedbackText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Multiple choice styles
  mcContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 24,
  },
  questionCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 12,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  // Listening styles
  listeningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  speakButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  speakButtonText: {
    fontSize: 14,
  },
  revealButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 24,
  },
  revealButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  answerCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  // Complete state
  completeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 40,
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#10b981',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  doneButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 24,
  },
  doneButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
