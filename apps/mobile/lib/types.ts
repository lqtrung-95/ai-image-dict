// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: Date;
}

// Photo Analysis types
export interface PhotoAnalysis {
  id: string;
  userId: string;
  imageUrl: string;
  sceneContext: SceneContext;
  detectedObjects: DetectedObject[];
  createdAt: Date;
}

export interface SceneContext {
  description: string;
  colors: VocabularyWord[];
  actions: VocabularyWord[];
  mood?: string;
}

export interface DetectedObject {
  id: string;
  analysisId: string;
  labelEn: string;
  labelZh: string;
  pinyin: string;
  confidence: number;
  boundingBox?: BoundingBox;
  category: 'object' | 'color' | 'action';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Vocabulary types
export interface VocabularyWord {
  en: string;
  zh: string;
  pinyin: string;
  hskLevel?: number | null;
}

// Vocabulary Item - matches web API format (camelCase)
export interface VocabularyItem {
  id: string;
  userId: string;
  detectedObjectId?: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  exampleSentence?: string;
  isLearned: boolean;
  createdAt: string;
  // SRS (Spaced Repetition System) fields
  easinessFactor?: number;
  intervalDays?: number;
  nextReviewDate?: string;
  repetitions?: number;
  lastReviewedAt?: string;
  correctStreak?: number;
  hskLevel?: number;
  // Photo context
  photoUrl?: string | null;
}

// SRS types
export interface SrsState {
  easinessFactor: number;
  intervalDays: number;
  repetitions: number;
  correctStreak: number;
}

export interface WordPracticeAttempt {
  id: string;
  userId: string;
  vocabularyItemId: string;
  sessionId?: string;
  quizMode: 'flashcard' | 'multiple-choice' | 'listening' | 'pinyin';
  rating: 1 | 2 | 3 | 4;
  isCorrect: boolean;
  responseTimeMs?: number;
  createdAt: Date;
}

// Collection types
export interface Collection {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: Date;
}

// API Response types
export interface AnalysisResponse {
  id: string;
  imageUrl: string;
  sceneDescription: string;
  sceneDescriptionZh?: string;
  sceneDescriptionPinyin?: string;
  objects: Array<{
    id: string;
    en: string;
    zh: string;
    pinyin: string;
    confidence: number;
    category: string;
    hskLevel?: number | null;
    example?: { zh: string; pinyin: string; en: string } | null;
  }>;
  colors: VocabularyWord[];
  actions: VocabularyWord[];
  hskLevels?: Record<string, number | null>;
  exampleSentences?: Record<string, { zh: string; pinyin: string; en: string }>;
}

export interface ApiError {
  error: string;
  code?: string;
}

// Vocabulary Lists
export interface VocabularyList {
  id: string;
  userId: string;
  name: string;
  description?: string;
  color: string;
  isPublic: boolean;
  wordCount?: number;
  learnedCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ListVocabularyItem {
  id: string;
  listId: string;
  vocabularyItemId: string;
  addedAt: Date;
}

// Vocabulary Courses
export interface VocabularyCourse {
  id: string;
  creatorId: string;
  creatorName?: string;
  name: string;
  description?: string;
  coverImageUrl?: string;
  difficultyLevel: 1 | 2 | 3 | 4 | 5 | 6;
  isPublished: boolean;
  subscriberCount: number;
  ratingAvg: number | null;
  ratingCount: number;
  wordCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseVocabularyItem {
  id: string;
  courseId: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  exampleSentence?: string;
  hskLevel?: number;
  sortOrder: number;
  createdAt: Date;
}

export interface CourseSubscription {
  id: string;
  userId: string;
  courseId: string;
  progressPercent: number;
  wordsLearned: number;
  lastPracticedAt?: Date;
  subscribedAt: Date;
}

export interface CourseRating {
  id: string;
  userId: string;
  courseId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  review?: string;
  createdAt: Date;
}

// Vocabulary Imports
export type ImportSourceType = 'url' | 'text';
export type ImportStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface VocabularyImport {
  id: string;
  userId: string;
  sourceType: ImportSourceType;
  sourceUrl?: string;
  sourceTitle?: string;
  wordsExtracted: number;
  wordsSaved: number;
  status: ImportStatus;
  errorMessage?: string;
  createdAt: Date;
}

export interface ExtractedWord {
  zh: string;
  pinyin: string;
  en: string;
  example?: string;
  hskLevel?: number;
}

// Statistics & Progress
export type WordState = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface VocabularyStats {
  totalWords: number;
  learnedWords: number;
  dueToday: number;
  currentStreak: number;
  longestStreak: number;
  masteredThisWeek: number;
  averageEaseFactor: number;
  hskDistribution: Record<string, number>;
  reviewForecast: Array<{ date: string; count: number }>;
  wordsPerDay: Array<{ date: string; count: number }>;
}

export interface ListProgress {
  listId: string;
  name: string;
  color: string;
  totalWords: number;
  learnedWords: number;
  progressPercent: number;
}

export interface CourseProgress {
  courseId: string;
  name: string;
  totalWords: number;
  wordsLearned: number;
  progressPercent: number;
  lastPracticedAt?: Date;
}

export interface WeeklyActivity {
  date: string;
  wordsReviewed: number;
  minutesPracticed?: number;
}

// Word of the Day - matches web API format (nested snake_case)
export interface WordOfDay {
  id: string;
  wordEn: string;
  wordZh: string;
  pinyin: string;
  exampleSentence?: string;
}
