---
title: "Phase 07: Practice and Quiz Features"
description: "Implement flashcards, multiple choice, listening, and typing quizzes"
---

# Phase 07: Practice and Quiz Features

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [phase-06-vocabulary-management.md](./phase-06-vocabulary-management.md)
- Codebase: `src/app/(protected)/practice/page.tsx`, `src/app/(protected)/quiz/page.tsx`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Description:** Build practice modes including flashcards, multiple choice quiz, listening quiz, and pinyin typing quiz.
- **Estimated Effort:** 5-6 days

## Key Insights
- Use react-native-reanimated for flashcard flip
- Implement spaced repetition tracking
- Audio playback for listening quiz
- Text input validation for typing quiz
- Track practice sessions for stats

## Requirements

### Functional Requirements
- Flashcard mode with flip animation
- Multiple choice quiz (Chinese → English)
- Listening quiz (audio → English)
- Pinyin typing quiz
- Progress tracking per mode
- SRS (spaced repetition) support

### Technical Requirements
- react-native-reanimated for animations
- expo-speech or expo-audio for TTS
- Gesture handling for card swipes
- Progress persistence

## Related Code Files
- `src/components/practice/FlashCard.tsx`
- `src/components/quiz/MultipleChoiceQuiz.tsx`
- `src/components/quiz/ListeningQuiz.tsx`
- `src/components/quiz/TypePinyinQuiz.tsx`

## Implementation Steps

### Step 1: Create Practice Hook
Create `hooks/usePractice.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { VocabularyItem, PracticeSession } from '@/lib/types';

interface UsePracticeReturn {
  dueWords: VocabularyItem[];
  isLoading: boolean;
  error: string | null;
  recordAttempt: (wordId: string, correct: boolean, mode: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function usePractice(): UsePracticeReturn {
  const [dueWords, setDueWords] = useState<VocabularyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDueWords = useCallback(async () => {
    try {
      setIsLoading(true);
      const words = await apiClient.get<VocabularyItem[]>('/api/practice/due-words');
      setDueWords(words);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load practice words');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDueWords();
  }, [fetchDueWords]);

  const recordAttempt = async (wordId: string, correct: boolean, mode: string) => {
    await apiClient.post('/api/word-attempts', {
      vocabulary_id: wordId,
      correct,
      mode,
    });
  };

  return {
    dueWords,
    isLoading,
    error,
    recordAttempt,
    refresh: fetchDueWords,
  };
}
```

### Step 2: Create Flashcard Component
Create `components/practice/FlashCard.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
} from 'react-native-reanimated';
import { Volume2, RotateCw } from 'lucide-react-native';
import { Button } from '@/components/ui/button';
import { useSpeech } from '@/hooks/useSpeech';
import type { VocabularyItem } from '@/lib/types';

interface FlashCardProps {
  word: VocabularyItem;
  onResult: (correct: boolean) => void;
}

export function FlashCard({ word, onResult }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const rotateY = useSharedValue(0);
  const { speak } = useSpeech();

  const handleFlip = () => {
    rotateY.value = withSpring(isFlipped ? 0 : 180, { damping: 15 });
    setIsFlipped(!isFlipped);
  };

  const frontAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(rotateY.value, [0, 180], [0, 180])}deg` },
    ],
    opacity: interpolate(rotateY.value, [0, 90, 180], [1, 0, 0]),
  }));

  const backAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: `${interpolate(rotateY.value, [0, 180], [180, 360])}deg` },
    ],
    opacity: interpolate(rotateY.value, [0, 90, 180], [0, 0, 1]),
  }));

  return (
    <View className="flex-1 justify-center p-4">
      <View className="h-96 relative">
        {/* Front */}
        <Animated.View
          style={[frontAnimatedStyle]}
          className="absolute inset-0 bg-white rounded-2xl shadow-lg p-8 items-center justify-center backface-hidden"
        >
          <Text className="text-6xl font-bold text-gray-900 mb-4">
            {word.word_chinese_simplified}
          </Text>
          <TouchableOpacity
            onPress={() => speak(word.word_chinese_simplified)}
            className="p-3 bg-purple-100 rounded-full"
          >
            <Volume2 size={24} color="#7c3aed" />
          </TouchableOpacity>
          <Text className="text-gray-400 mt-8">Tap to flip</Text>
        </Animated.View>

        {/* Back */}
        <Animated.View
          style={[backAnimatedStyle]}
          className="absolute inset-0 bg-purple-600 rounded-2xl shadow-lg p-8 items-center justify-center backface-hidden"
        >
          <Text className="text-3xl font-bold text-white mb-2">
            {word.pinyin}
          </Text>
          <Text className="text-xl text-purple-100 mb-6">
            {word.word_english}
          </Text>
          {word.notes && (
            <Text className="text-sm text-purple-200 text-center">
              {word.notes}
            </Text>
          )}
        </Animated.View>
      </View>

      {!isFlipped ? (
        <Button onPress={handleFlip} variant="outline" className="mt-8">
          <RotateCw size={20} className="mr-2" />
          Show Answer
        </Button>
      ) : (
        <View className="mt-8 space-y-3">
          <Text className="text-center text-gray-600 mb-4">How well did you know this?</Text>
          <View className="flex-row space-x-3">
            <Button
              onPress={() => onResult(false)}
              variant="destructive"
              className="flex-1"
            >
              Again
            </Button>
            <Button
              onPress={() => onResult(true)}
              className="flex-1"
            >
              Good
            </Button>
          </View>
        </View>
      )}
    </View>
  );
}
```

### Step 3: Create Practice Screen
Create `app/(tabs)/practice.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { usePractice } from '@/hooks/usePractice';
import { FlashCard } from '@/components/practice/FlashCard';
import { MultipleChoiceQuiz } from '@/components/quiz/MultipleChoiceQuiz';
import { ListeningQuiz } from '@/components/quiz/ListeningQuiz';
import { TypePinyinQuiz } from '@/components/quiz/TypePinyinQuiz';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

type PracticeMode = 'flashcard' | 'multiple_choice' | 'listening' | 'typing';

export default function PracticeScreen() {
  const { dueWords, isLoading, recordAttempt, refresh } = usePractice();
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center">
        <Text>Loading practice words...</Text>
      </View>
    );
  }

  if (dueWords.length === 0) {
    return (
      <View className="flex-1 justify-center items-center p-4">
        <Text className="text-xl font-semibold text-gray-900 mb-2">
          All caught up!
        </Text>
        <Text className="text-gray-500 text-center">
          No words due for review. Check back later or add more words.
        </Text>
      </View>
    );
  }

  if (!selectedMode) {
    return (
      <View className="flex-1 bg-gray-50 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Practice Mode
        </Text>
        <Text className="text-gray-500 mb-6">
          {dueWords.length} words due for review
        </Text>

        <TouchableOpacity onPress={() => setSelectedMode('flashcard')}>
          <Card className="p-6 mb-4">
            <Text className="text-lg font-semibold text-gray-900">Flashcards</Text>
            <Text className="text-gray-500">Traditional flip card practice</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSelectedMode('multiple_choice')}>
          <Card className="p-6 mb-4">
            <Text className="text-lg font-semibold text-gray-900">Multiple Choice</Text>
            <Text className="text-gray-500">Select the correct translation</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSelectedMode('listening')}>
          <Card className="p-6 mb-4">
            <Text className="text-lg font-semibold text-gray-900">Listening</Text>
            <Text className="text-gray-500">Hear and identify the word</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setSelectedMode('typing')}>
          <Card className="p-6">
            <Text className="text-lg font-semibold text-gray-900">Type Pinyin</Text>
            <Text className="text-gray-500">Type the correct pinyin</Text>
          </Card>
        </TouchableOpacity>
      </View>
    );
  }

  const currentWord = dueWords[currentIndex];
  const isLastWord = currentIndex === dueWords.length - 1;

  const handleResult = async (correct: boolean) => {
    await recordAttempt(currentWord.id, correct, selectedMode);

    if (isLastWord) {
      // Show completion screen
      setSelectedMode(null);
      setCurrentIndex(0);
      refresh();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4 flex-row justify-between items-center">
        <Button variant="ghost" onPress={() => setSelectedMode(null)}>
          Exit
        </Button>
        <Text className="text-gray-600">
          {currentIndex + 1} / {dueWords.length}
        </Text>
      </View>

      {selectedMode === 'flashcard' && (
        <FlashCard word={currentWord} onResult={handleResult} />
      )}
      {selectedMode === 'multiple_choice' && (
        <MultipleChoiceQuiz word={currentWord} allWords={dueWords} onResult={handleResult} />
      )}
      {selectedMode === 'listening' && (
        <ListeningQuiz word={currentWord} onResult={handleResult} />
      )}
      {selectedMode === 'typing' && (
        <TypePinyinQuiz word={currentWord} onResult={handleResult} />
      )}
    </View>
  );
}
```

## Todo List
- [ ] Create usePractice hook
- [ ] Build FlashCard component with flip animation
- [ ] Create MultipleChoiceQuiz component
- [ ] Create ListeningQuiz component
- [ ] Create TypePinyinQuiz component
- [ ] Build practice mode selection screen
- [ ] Implement progress tracking
- [ ] Add completion screen
- [ ] Test all quiz modes
- [ ] Verify SRS updates

## Success Criteria
- [ ] Flashcards flip smoothly
- [ ] Multiple choice generates valid options
- [ ] Listening quiz plays audio
- [ ] Typing quiz validates pinyin
- [ ] Progress saves after each word
- [ ] Completion shows stats

## Next Steps
After completing this phase, proceed to [Phase 08: Dashboard and Progress](./phase-08-dashboard-and-progress.md).
