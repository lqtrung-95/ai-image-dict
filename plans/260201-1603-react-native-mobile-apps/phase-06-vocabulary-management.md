---
title: "Phase 06: Vocabulary Management"
description: "Implement vocabulary list, collections, and word detail views"
---

# Phase 06: Vocabulary Management

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [phase-05-photo-capture-and-ai-analysis.md](./phase-05-photo-capture-and-ai-analysis.md)
- Codebase: `src/app/(protected)/vocabulary/page.tsx`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Description:** Build vocabulary list screen, word detail view, collections management, and search functionality.
- **Estimated Effort:** 4-5 days

## Key Insights
- Use FlatList for performant scrolling
- Implement pull-to-refresh
- Add search with debouncing
- Support filtering by collection
- Word detail in modal or separate screen

## Requirements

### Functional Requirements
- List all saved vocabulary words
- Search words by Chinese, Pinyin, or English
- Filter by collections
- Word detail view with full information
- Add/remove words from collections
- Delete words

### Technical Requirements
- FlatList with pagination
- Search with debounce
- Modal for word detail
- Optimistic updates

## Related Code Files
- `src/app/(protected)/vocabulary/page.tsx`
- `src/components/vocabulary/VocabularyCard.tsx`
- `src/app/api/vocabulary/route.ts`

## Implementation Steps

### Step 1: Create Vocabulary Hook
Create `hooks/useVocabulary.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { VocabularyItem, Collection } from '@/lib/types';

interface UseVocabularyReturn {
  words: VocabularyItem[];
  collections: Collection[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCollection: string | null;
  setSelectedCollection: (id: string | null) => void;
  refresh: () => Promise<void>;
  deleteWord: (id: string) => Promise<void>;
  addToCollection: (wordId: string, collectionId: string) => Promise<void>;
}

export function useVocabulary(): UseVocabularyReturn {
  const [words, setWords] = useState<VocabularyItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [wordsRes, collectionsRes] = await Promise.all([
        apiClient.get<VocabularyItem[]>('/api/vocabulary'),
        apiClient.get<Collection[]>('/api/collections'),
      ]);
      setWords(wordsRes);
      setCollections(collectionsRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load vocabulary');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const deleteWord = async (id: string) => {
    await apiClient.delete(`/api/vocabulary/${id}`);
    setWords((prev) => prev.filter((w) => w.id !== id));
  };

  const addToCollection = async (wordId: string, collectionId: string) => {
    await apiClient.put(`/api/vocabulary/${wordId}`, { collection_id: collectionId });
  };

  const filteredWords = words.filter((word) => {
    const matchesSearch =
      searchQuery === '' ||
      word.word_chinese_simplified.includes(searchQuery) ||
      word.pinyin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      word.word_english.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCollection =
      selectedCollection === null || word.collection_id === selectedCollection;

    return matchesSearch && matchesCollection;
  });

  return {
    words: filteredWords,
    collections,
    isLoading,
    error,
    searchQuery,
    setSearchQuery,
    selectedCollection,
    setSelectedCollection,
    refresh: fetchData,
    deleteWord,
    addToCollection,
  };
}
```

### Step 2: Create Vocabulary Screen
Create `app/(tabs)/vocabulary.tsx`:
```tsx
import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { Search, Filter, X, Volume2 } from 'lucide-react-native';
import { useVocabulary } from '@/hooks/useVocabulary';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { SkeletonCard } from '@/components/ui/skeleton';
import { useSpeech } from '@/hooks/useSpeech';
import type { VocabularyItem } from '@/lib/types';

function WordCard({ word, onPress }: { word: VocabularyItem; onPress: () => void }) {
  const { speak } = useSpeech();

  return (
    <TouchableOpacity onPress={onPress}>
      <Card className="p-4 mb-3">
        <View className="flex-row justify-between items-start">
          <View className="flex-1">
            <Text className="text-2xl font-bold text-gray-900">{word.word_chinese_simplified}</Text>
            <Text className="text-lg text-purple-600">{word.pinyin}</Text>
            <Text className="text-gray-600">{word.word_english}</Text>
          </View>
          <TouchableOpacity
            onPress={() => speak(word.word_chinese_simplified)}
            className="p-2 bg-purple-100 rounded-full"
          >
            <Volume2 size={20} color="#7c3aed" />
          </TouchableOpacity>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function VocabularyScreen() {
  const {
    words,
    collections,
    isLoading,
    refresh,
    searchQuery,
    setSearchQuery,
    selectedCollection,
    setSelectedCollection,
  } = useVocabulary();
  const [selectedWord, setSelectedWord] = useState<VocabularyItem | null>(null);

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 p-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">My Vocabulary</Text>

        {/* Search */}
        <View className="flex-row items-center bg-white rounded-lg px-4 py-2 mb-4 border border-gray-200">
          <Search size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-gray-900"
            placeholder="Search words..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>

        {/* Collection Filter */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: 'All' }, ...collections]}
          keyExtractor={(item) => item.id || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => setSelectedCollection(item.id)}
              className={`mr-2 px-4 py-2 rounded-full ${
                selectedCollection === item.id
                  ? 'bg-purple-600'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <Text
                className={
                  selectedCollection === item.id ? 'text-white' : 'text-gray-700'
                }
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          className="mb-4"
        />

        {/* Word List */}
        <FlatList
          data={words}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WordCard word={item} onPress={() => setSelectedWord(item)} />
          )}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-gray-500">No words found</Text>
            </View>
          }
        />
      </View>

      {/* Word Detail Modal */}
      <Modal
        isVisible={!!selectedWord}
        onClose={() => setSelectedWord(null)}
        title={selectedWord?.word_chinese_simplified}
      >
        {selectedWord && (
          <View>
            <Text className="text-xl text-purple-600 mb-2">{selectedWord.pinyin}</Text>
            <Text className="text-gray-700 mb-4">{selectedWord.word_english}</Text>
            {selectedWord.notes && (
              <Text className="text-gray-500 text-sm mb-4">{selectedWord.notes}</Text>
            )}
            <Button onPress={() => setSelectedWord(null)}>Close</Button>
          </View>
        )}
      </Modal>
    </View>
  );
}
```

## Todo List
- [ ] Create useVocabulary hook
- [ ] Build vocabulary list screen
- [ ] Implement search with debounce
- [ ] Add collection filtering
- [ ] Create word card component
- [ ] Build word detail modal
- [ ] Add pull-to-refresh
- [ ] Implement delete word
- [ ] Add to collection functionality
- [ ] Test on both platforms

## Success Criteria
- [ ] Vocabulary list displays correctly
- [ ] Search filters words in real-time
- [ ] Collection filter works
- [ ] Word detail shows all information
- [ ] Pull-to-refresh works
- [ ] Delete word updates list

## Next Steps
After completing this phase, proceed to [Phase 07: Practice and Quiz Features](./phase-07-practice-and-quiz-features.md).
