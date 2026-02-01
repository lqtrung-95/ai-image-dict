---
title: "Phase 09: Courses, Stories, and Games"
description: "Implement courses, stories reader, and vocabulary games"
---

# Phase 09: Courses, Stories, and Games

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [phase-08-dashboard-and-progress.md](./phase-08-dashboard-and-progress.md)
- Codebase: `src/app/(protected)/courses/page.tsx`, `src/app/(protected)/stories/page.tsx`, `src/app/(protected)/games/page.tsx`

## Overview
- **Priority:** P2
- **Status:** Pending
- **Description:** Build courses catalog, story reader, and vocabulary games (matching, quiz).
- **Estimated Effort:** 4-5 days

## Key Insights
- Courses are curated vocabulary collections
- Stories provide reading practice with vocabulary
- Games make learning engaging
- All use existing API endpoints

## Requirements

### Functional Requirements
- Course catalog with filtering
- Course detail with word list
- Story reader with vocabulary highlights
- Matching game
- Quiz game with scoring

### Technical Requirements
- FlatList for courses/stories
- ScrollView for story content
- Game state management
- Score tracking

## Related Code Files
- `src/app/(protected)/courses/page.tsx`
- `src/app/(protected)/stories/page.tsx`
- `src/app/(protected)/games/page.tsx`
- `src/app/(protected)/games/components/matching-game.tsx`
- `src/app/(protected)/games/components/quiz-game.tsx`

## Implementation Steps

### Step 1: Create Courses Screen
Create `app/courses/index.tsx`:
```tsx
import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { apiClient } from '@/lib/api-client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react-native';
import type { Course } from '@/lib/types';
import { router } from 'expo-router';

export default function CoursesScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const data = await apiClient.get<Course[]>('/api/courses');
      setCourses(data);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-4">Courses</Text>

        <View className="flex-row items-center bg-white rounded-lg px-4 py-2 mb-4 border border-gray-200">
          <Search size={20} color="#9ca3af" />
          <Input
            className="flex-1 ml-2 border-0"
            placeholder="Search courses..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredCourses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => router.push(`/courses/${item.id}`)}>
              <Card className="p-4 mb-3">
                <Text className="text-lg font-semibold text-gray-900">{item.title}</Text>
                <Text className="text-gray-500 text-sm mt-1">{item.description}</Text>
                <View className="flex-row mt-3">
                  <Text className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
                    {item.level}
                  </Text>
                  <Text className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded ml-2">
                    {item.word_count} words
                  </Text>
                </View>
              </Card>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
}
```

### Step 2: Create Games Screen
Create `app/games/index.tsx`:
```tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { Card } from '@/components/ui/card';
import { Gamepad2, Brain, Shuffle } from 'lucide-react-native';
import { router } from 'expo-router';

export default function GamesScreen() {
  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold text-gray-900 mb-6">Games</Text>

      <TouchableOpacity onPress={() => router.push('/games/matching')}>
        <Card className="p-6 mb-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-purple-100 rounded-full items-center justify-center">
              <Shuffle size={24} color="#7c3aed" />
            </View>
            <View className="ml-4">
              <Text className="text-lg font-semibold text-gray-900">Matching</Text>
              <Text className="text-gray-500">Match Chinese words with meanings</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/games/quiz')}>
        <Card className="p-6">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center">
              <Brain size={24} color="#2563eb" />
            </View>
            <View className="ml-4">
              <Text className="text-lg font-semibold text-gray-900">Quiz Challenge</Text>
              <Text className="text-gray-500">Test your knowledge</Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    </View>
  );
}
```

## Todo List
- [ ] Create courses list screen
- [ ] Create course detail screen
- [ ] Create stories list screen
- [ ] Create story reader screen
- [ ] Create games menu screen
- [ ] Implement matching game
- [ ] Implement quiz game
- [ ] Add game scoring
- [ ] Test all features

## Success Criteria
- [ ] Courses display and filter correctly
- [ ] Stories render with highlights
- [ ] Matching game works
- [ ] Quiz game tracks score
- [ ] Navigation between screens works

## Next Steps
Proceed to [Phase 10: Settings and Profile](./phase-10-settings-and-profile.md).
