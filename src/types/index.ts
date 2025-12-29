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
}

export interface VocabularyItem {
  id: string;
  userId: string;
  detectedObjectId?: string;
  collectionId?: string;
  wordZh: string;
  wordPinyin: string;
  wordEn: string;
  exampleSentence?: string;
  isLearned: boolean;
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
  objects: Array<{
    id: string;
    en: string;
    zh: string;
    pinyin: string;
    confidence: number;
    category: string;
  }>;
  colors: VocabularyWord[];
  actions: VocabularyWord[];
}

export interface ApiError {
  error: string;
  code?: string;
}

