---
title: "Phase 08: Dashboard and Progress Tracking"
description: "Implement home dashboard, statistics, and progress visualization"
---

# Phase 08: Dashboard and Progress Tracking

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [phase-07-practice-and-quiz-features.md](./phase-07-practice-and-quiz-features.md)
- Codebase: `src/components/dashboard/DashboardHome.tsx`, `src/app/(protected)/progress/page.tsx`

## Overview
- **Priority:** P1
- **Status:** Pending
- **Description:** Build the home dashboard with statistics overview, activity tracking, and progress visualization.
- **Estimated Effort:** 3-4 days

## Key Insights
- Use react-native-chart-kit for charts
- Implement activity heatmap
- Show streak information prominently
- Word of the day feature
- Quick action buttons

## Requirements

### Functional Requirements
- Statistics overview cards
- Activity heatmap
- Learning streak display
- Word of the day
- Quick capture button
- Progress charts

### Technical Requirements
- Chart library integration
- Date manipulation
- Stats API integration
- Responsive layouts

## Related Code Files
- `src/components/dashboard/DashboardHome.tsx`
- `src/components/dashboard/stats-overview-cards.tsx`
- `src/components/dashboard/activity-heatmap.tsx`
- `src/components/word-of-day/word-of-day-card.tsx`

## Implementation Steps

### Step 1: Create Stats Hook
Create `hooks/useStats.ts`:
```typescript
import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api-client';
import type { UserStats, WordOfDay } from '@/lib/types';

interface UseStatsReturn {
  stats: UserStats | null;
  wordOfDay: WordOfDay | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useStats(): UseStatsReturn {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [wordOfDay, setWordOfDay] = useState<WordOfDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsRes, wordRes] = await Promise.all([
        apiClient.get<UserStats>('/api/stats'),
        apiClient.get<WordOfDay>('/api/word-of-day'),
      ]);
      setStats(statsRes);
      setWordOfDay(wordRes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    stats,
    wordOfDay,
    isLoading,
    error,
    refresh: fetchData,
  };
}
```

### Step 2: Create Home Screen
Create `app/(tabs)/index.tsx`:
```tsx
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Camera, BookOpen, Flame, Target } from 'lucide-react-native';
import { useStats } from '@/hooks/useStats';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { router } from 'expo-router';

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <Card className="flex-1 p-4 mr-3">
      <View className={`w-10 h-10 rounded-full items-center justify-center mb-2`} style={{ backgroundColor: `${color}20` }}>
        <Icon size={20} color={color} />
      </View>
      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-xs text-gray-500">{label}</Text>
    </Card>
  );
}

export default function HomeScreen() {
  const { stats, wordOfDay, isLoading } = useStats();

  return (
    <ScrollView className="flex-1 bg-gray-50">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Dashboard</Text>

        {/* Quick Actions */}
        <View className="flex-row mb-6">
          <TouchableOpacity
            onPress={() => router.push('/capture')}
            className="flex-1 bg-purple-600 rounded-xl p-4 mr-3"
          >
            <Camera size={24} color="white" />
            <Text className="text-white font-semibold mt-2">Capture</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/practice')}
            className="flex-1 bg-blue-600 rounded-xl p-4"
          >
            <BookOpen size={24} color="white" />
            <Text className="text-white font-semibold mt-2">Practice</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        {stats && (
          <View className="flex-row mb-6">
            <StatCard
              icon={BookOpen}
              label="Words"
              value={stats.total_words_learned}
              color="#7c3aed"
            />
            <StatCard
              icon={Flame}
              label="Streak"
              value={stats.current_streak}
              color="#f59e0b"
            />
            <StatCard
              icon={Target}
              label="Sessions"
              value={stats.total_practice_sessions}
              color="#10b981"
            />
          </View>
        )}

        {/* Word of the Day */}
        {wordOfDay && (
          <Card className="p-6 mb-6">
            <Text className="text-sm text-purple-600 font-semibold mb-2">
              Word of the Day
            </Text>
            <Text className="text-3xl font-bold text-gray-900 mb-1">
              {wordOfDay.word_chinese_simplified}
            </Text>
            <Text className="text-lg text-purple-600 mb-1">
              {wordOfDay.pinyin}
            </Text>
            <Text className="text-gray-600">
              {wordOfDay.word_english}
            </Text>
            {wordOfDay.example_sentence && (
              <Text className="text-gray-500 mt-3 italic">
                "{wordOfDay.example_sentence}"
              </Text>
            )}
          </Card>
        )}

        {/* Daily Goal */}
        <Card className="p-6">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900">Daily Goal</Text>
            <Text className="text-purple-600 font-semibold">3/10 words</Text>
          </View>
          <Progress value={30} />
          <Text className="text-gray-500 text-sm mt-2">
            Practice 7 more words to reach your daily goal
          </Text>
        </Card>
      </View>
    </ScrollView>
  );
}
```

## Todo List
- [ ] Create useStats hook
- [ ] Build home dashboard screen
- [ ] Create stat cards component
- [ ] Implement word of the day display
- [ ] Add quick action buttons
- [ ] Create progress charts
- [ ] Add activity heatmap
- [ ] Test on both platforms

## Success Criteria
- [ ] Dashboard loads stats correctly
- [ ] Word of day displays
- [ ] Quick actions navigate correctly
- [ ] Progress bars show accurate data
- [ ] Streak displays correctly

## Next Steps
After completing this phase, proceed to [Phase 09: Courses, Stories, and Games](./phase-09-courses-stories-and-games.md).
