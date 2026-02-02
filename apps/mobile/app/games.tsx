import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuthStore } from '@/stores/auth-store';
import { apiClient } from '@/lib/api-client';

const { width } = Dimensions.get('window');

type GameMode = 'menu' | 'matching' | 'quiz';

interface VocabularyItem {
  id: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
}

interface GameCard {
  id: string;
  content: string;
  type: 'chinese' | 'english';
  originalId: string;
  isFlipped: boolean;
  isMatched: boolean;
}

interface Question {
  word: VocabularyItem;
  options: string[];
  correctIndex: number;
}

export default function GamesScreen() {
  const { gameMode: initialGameMode } = useLocalSearchParams<{ gameMode?: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { isAuthenticated } = useAuthStore();
  const [gameMode, setGameMode] = useState<GameMode>(
    initialGameMode === 'matching' ? 'matching' : initialGameMode === 'quiz' ? 'quiz' : 'menu'
  );

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Ionicons name="game-controller" size={64} color="#7c3aed" />
        <Text style={[styles.emptyTitle, { color: textColor }]}>Sign in to play games</Text>
        <TouchableOpacity style={styles.loginButton} onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (gameMode === 'matching') {
    return <MatchingGame onBack={() => router.back()} isDark={isDark} />;
  }

  if (gameMode === 'quiz') {
    return <QuizGame onBack={() => router.back()} isDark={isDark} />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vocabulary Games</Text>
        <Text style={styles.headerSubtitle}>Make learning fun with interactive games</Text>
      </View>

      {/* Game Cards */}
      <View style={styles.content}>
        {/* Matching Game */}
        <TouchableOpacity
          style={[styles.gameCard, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc' }]}
          onPress={() => setGameMode('matching')}
        >
          <View style={[styles.gameIcon, { backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
            <Ionicons name="git-compare" size={28} color="#3b82f6" />
          </View>
          <View style={styles.gameInfo}>
            <Text style={[styles.gameTitle, { color: textColor }]}>Matching Game</Text>
            <Text style={[styles.gameDesc, { color: subtextColor }]}>
              Match Chinese characters with their English meanings. Test your recognition skills!
            </Text>
            <View style={[styles.playButton, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.playButtonText}>Play Now</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Quiz Game */}
        <TouchableOpacity
          style={[styles.gameCard, { backgroundColor: isDark ? '#1a1a1a' : '#f8fafc' }]}
          onPress={() => setGameMode('quiz')}
        >
          <View style={[styles.gameIcon, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
            <Ionicons name="help-circle" size={28} color="#10b981" />
          </View>
          <View style={styles.gameInfo}>
            <Text style={[styles.gameTitle, { color: textColor }]}>Quiz Mode</Text>
            <Text style={[styles.gameDesc, { color: subtextColor }]}>
              Multiple choice questions to test your vocabulary knowledge. How many can you get right?
            </Text>
            <View style={[styles.playButton, { backgroundColor: '#10b981' }]}>
              <Text style={styles.playButtonText}>Play Now</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Matching Game Component
function MatchingGame({ onBack, isDark }: { onBack: () => void; isDark: boolean }) {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [cards, setCards] = useState<GameCard[]>([]);
  const [selectedCards, setSelectedCards] = useState<number[]>([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [moves, setMoves] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';

  const fetchVocabulary = useCallback(async () => {
    try {
      const data = await apiClient.get<{ items: VocabularyItem[] }>('/api/vocabulary?limit=20');
      setVocabulary(data.items || []);
      initializeGame(data.items || []);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  const initializeGame = (items: VocabularyItem[]) => {
    if (items.length < 4) return;

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 6);

    const gameCards: GameCard[] = [];
    selected.forEach((item) => {
      gameCards.push({
        id: `zh-${item.id}`,
        content: item.wordZh,
        type: 'chinese',
        originalId: item.id,
        isFlipped: false,
        isMatched: false,
      });
      gameCards.push({
        id: `en-${item.id}`,
        content: item.wordEn,
        type: 'english',
        originalId: item.id,
        isFlipped: false,
        isMatched: false,
      });
    });

    setCards(gameCards.sort(() => Math.random() - 0.5));
    setMatchedPairs(0);
    setMoves(0);
    setGameComplete(false);
    setSelectedCards([]);
  };

  const handleCardClick = (index: number) => {
    if (isChecking || cards[index].isMatched || cards[index].isFlipped) return;
    if (selectedCards.length >= 2) return;

    const newCards = [...cards];
    newCards[index].isFlipped = true;
    setCards(newCards);

    const newSelected = [...selectedCards, index];
    setSelectedCards(newSelected);

    if (newSelected.length === 2) {
      setIsChecking(true);
      setMoves((m) => m + 1);

      const [first, second] = newSelected;
      const firstCard = newCards[first];
      const secondCard = newCards[second];

      if (firstCard.originalId === secondCard.originalId) {
        setTimeout(() => {
          newCards[first].isMatched = true;
          newCards[second].isMatched = true;
          setCards([...newCards]);
          setMatchedPairs((p) => p + 1);
          setSelectedCards([]);
          setIsChecking(false);

          if (matchedPairs + 1 === 6) {
            setGameComplete(true);
          }
        }, 500);
      } else {
        setTimeout(() => {
          newCards[first].isFlipped = false;
          newCards[second].isFlipped = false;
          setCards([...newCards]);
          setSelectedCards([]);
          setIsChecking(false);
        }, 1000);
      }
    }
  };

  const resetGame = () => {
    initializeGame(vocabulary);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: subtextColor }}>Loading...</Text>
      </View>
    );
  }

  if (vocabulary.length < 4) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.gameHeaderTitle, { color: textColor }]}>Matching Game</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="book" size={64} color={subtextColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>Not enough words</Text>
          <Text style={[styles.emptySubtitle, { color: subtextColor }]}>
            You need at least 4 words in your vocabulary to play.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.gameHeaderTitle, { color: textColor }]}>Matching Game</Text>
      </View>

      <ScrollView style={styles.gameContent} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: textColor }]}>{moves}</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Moves</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#7c3aed' }]}>{matchedPairs}/6</Text>
            <Text style={[styles.statLabel, { color: subtextColor }]}>Matched</Text>
          </View>
          <TouchableOpacity onPress={resetGame} style={styles.newGameButton}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.newGameText}>New</Text>
          </TouchableOpacity>
        </View>

        {/* Game Complete */}
        {gameComplete && (
          <View style={styles.completeCard}>
            <Ionicons name="trophy" size={48} color="#10b981" />
            <Text style={[styles.completeTitle, { color: textColor }]}>Well Done!</Text>
            <Text style={[styles.completeSubtitle, { color: subtextColor }]}>
              You completed the game in {moves} moves
            </Text>
          </View>
        )}

        {/* Cards Grid */}
        <View style={styles.cardsGrid}>
          {cards.map((card, index) => (
            <TouchableOpacity
              key={card.id}
              onPress={() => handleCardClick(index)}
              disabled={card.isMatched || isChecking}
              style={[
                styles.card,
                {
                  backgroundColor: card.isMatched
                    ? 'rgba(16, 185, 129, 0.2)'
                    : card.isFlipped
                      ? '#7c3aed'
                      : cardColor,
                  borderColor: card.isMatched
                    ? '#10b981'
                    : card.isFlipped
                      ? '#7c3aed'
                      : isDark ? '#374151' : '#e5e7eb',
                  opacity: card.isMatched ? 0.6 : 1,
                },
              ]}
            >
              {card.isFlipped || card.isMatched ? (
                <View style={styles.cardContent}>
                  <Text
                    style={[
                      styles.cardText,
                      {
                        color: card.isFlipped || card.isMatched ? '#fff' : textColor,
                        fontSize: card.type === 'chinese' ? 20 : 14,
                      },
                    ]}
                    numberOfLines={2}
                  >
                    {card.content}
                  </Text>
                  {card.isMatched && (
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" style={styles.checkIcon} />
                  )}
                </View>
              ) : (
                <View style={styles.cardContent}>
                  <Text style={[styles.cardQuestion, { color: subtextColor }]}>?</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.hintText, { color: subtextColor }]}>
          Flip cards to find matching pairs. Match Chinese with English!
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Quiz Game Component
function QuizGame({ onBack, isDark }: { onBack: () => void; isDark: boolean }) {
  const [vocabulary, setVocabulary] = useState<VocabularyItem[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [gameComplete, setGameComplete] = useState(false);
  const [answered, setAnswered] = useState(false);

  const bgColor = isDark ? '#0f0f0f' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#000000';
  const subtextColor = isDark ? '#9ca3af' : '#6b7280';
  const cardColor = isDark ? '#1a1a1a' : '#f8fafc';

  const fetchVocabulary = useCallback(async () => {
    try {
      const data = await apiClient.get<{ items: VocabularyItem[] }>('/api/vocabulary?limit=30');
      setVocabulary(data.items || []);
      generateQuestions(data.items || []);
    } catch (error) {
      console.error('Failed to load vocabulary:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVocabulary();
  }, [fetchVocabulary]);

  const generateQuestions = (items: VocabularyItem[]) => {
    if (items.length < 4) return;

    const shuffled = [...items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 10);

    const newQuestions: Question[] = selected.map((word) => {
      const otherWords = items.filter((i) => i.id !== word.id);
      const wrongAnswers = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((i) => i.wordEn);

      const options = [...wrongAnswers, word.wordEn].sort(() => Math.random() - 0.5);

      return {
        word,
        options,
        correctIndex: options.indexOf(word.wordEn),
      };
    });

    setQuestions(newQuestions);
    setCurrentQuestion(0);
    setScore(0);
    setGameComplete(false);
    setSelectedAnswer(null);
    setAnswered(false);
  };

  const handleAnswer = (index: number) => {
    if (answered) return;

    setSelectedAnswer(index);
    setAnswered(true);

    if (index === questions[currentQuestion].correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion((c) => c + 1);
      setSelectedAnswer(null);
      setAnswered(false);
    } else {
      setGameComplete(true);
    }
  };

  const resetGame = () => {
    generateQuestions(vocabulary);
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: subtextColor }}>Loading...</Text>
      </View>
    );
  }

  if (vocabulary.length < 4) {
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.gameHeaderTitle, { color: textColor }]}>Quiz Game</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="book" size={64} color={subtextColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>Not enough words</Text>
          <Text style={[styles.emptySubtitle, { color: subtextColor }]}>
            You need at least 4 words in your vocabulary to play.
          </Text>
        </View>
      </View>
    );
  }

  if (gameComplete) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <View style={[styles.container, { backgroundColor: bgColor }]}>
        <View style={styles.gameHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={textColor} />
          </TouchableOpacity>
          <Text style={[styles.gameHeaderTitle, { color: textColor }]}>Quiz Complete!</Text>
        </View>

        <ScrollView style={styles.gameContent} contentContainerStyle={styles.completeContainer}>
          <Ionicons name="trophy" size={80} color="#f59e0b" />
          <Text style={[styles.finalScore, { color: '#7c3aed' }]}>
            {score}/{questions.length}
          </Text>
          <Text style={[styles.feedbackText, { color: textColor }]}>
            {percentage >= 80
              ? 'Excellent work!'
              : percentage >= 60
                ? 'Good job! Keep practicing!'
                : 'Keep practicing to improve!'}
          </Text>
          <TouchableOpacity onPress={resetGame} style={styles.playAgainButton}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.playAgainText}>Play Again</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      {/* Header */}
      <View style={styles.gameHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.gameHeaderTitle, { color: textColor }]}>Quiz Game</Text>
      </View>

      <ScrollView style={styles.gameContent} showsVerticalScrollIndicator={false}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressHeader}>
            <Text style={[styles.progressText, { color: subtextColor }]}>
              Question {currentQuestion + 1} of {questions.length}
            </Text>
            <Text style={[styles.scoreText, { color: subtextColor }]}>Score: {score}</Text>
          </View>
          <View style={[styles.progressBar, { backgroundColor: isDark ? '#374151' : '#e5e7eb' }]}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
        </View>

        {/* Question */}
        <View style={[styles.questionCard, { backgroundColor: cardColor }]}>
          <Text style={[styles.questionLabel, { color: subtextColor }]}>What does this word mean?</Text>
          <Text style={styles.chineseText}>{question.word.wordZh}</Text>
          <Text style={styles.pinyinText}>{question.word.wordPinyin}</Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {question.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleAnswer(index)}
              disabled={answered}
              style={[
                styles.optionButton,
                {
                  backgroundColor: answered
                    ? index === question.correctIndex
                      ? 'rgba(16, 185, 129, 0.2)'
                      : selectedAnswer === index
                        ? 'rgba(239, 68, 68, 0.2)'
                        : cardColor
                    : cardColor,
                  borderColor: answered
                    ? index === question.correctIndex
                      ? '#10b981'
                      : selectedAnswer === index
                        ? '#ef4444'
                        : isDark ? '#374151' : '#e5e7eb'
                    : isDark ? '#374151' : '#e5e7eb',
                },
              ]}
            >
              <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
              {answered && index === question.correctIndex && (
                <Ionicons name="checkmark-circle" size={24} color="#10b981" />
              )}
              {answered && selectedAnswer === index && index !== question.correctIndex && (
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Next Button */}
        {answered && (
          <TouchableOpacity onPress={nextQuestion} style={styles.nextButton}>
            <Text style={styles.nextButtonText}>
              {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
            </Text>
          </TouchableOpacity>
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
    padding: 16,
    gap: 16,
  },
  gameCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  gameIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameInfo: {
    flex: 1,
    gap: 8,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  gameDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  playButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  // Game Screen Styles
  gameHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    gap: 12,
  },
  gameHeaderTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  gameContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  newGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginLeft: 'auto',
  },
  newGameText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  completeCard: {
    alignItems: 'center',
    padding: 24,
    marginBottom: 20,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  completeSubtitle: {
    fontSize: 16,
    marginTop: 4,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  card: {
    width: (width - 52) / 3,
    height: (width - 52) / 3,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  cardText: {
    textAlign: 'center',
    fontWeight: '600',
  },
  cardQuestion: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  checkIcon: {
    position: 'absolute',
    bottom: 4,
    right: 4,
  },
  hintText: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 20,
  },
  // Quiz Game Styles
  progressContainer: {
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
  },
  scoreText: {
    fontSize: 14,
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
  questionCard: {
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  questionLabel: {
    fontSize: 14,
    marginBottom: 12,
  },
  chineseText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  pinyinText: {
    fontSize: 18,
    color: '#a78bfa',
    marginTop: 4,
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#7c3aed',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  completeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  finalScore: {
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 20,
  },
  feedbackText: {
    fontSize: 18,
    marginTop: 8,
    marginBottom: 32,
  },
  playAgainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#7c3aed',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  playAgainText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  // Empty State
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
