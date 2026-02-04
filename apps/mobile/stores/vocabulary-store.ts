import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '@/lib/api-client';
import type { VocabularyItem, VocabularyStats } from '@/lib/types';

interface VocabularyState {
  // Data
  vocabulary: VocabularyItem[];
  dueWords: VocabularyItem[];
  stats: VocabularyStats | null;

  // Cache metadata
  lastFetched: {
    vocabulary: number | null;
    dueWords: number | null;
    stats: number | null;
  };

  // Loading states
  isLoading: {
    vocabulary: boolean;
    dueWords: boolean;
    stats: boolean;
  };

  // Actions
  setVocabulary: (vocabulary: VocabularyItem[]) => void;
  setDueWords: (dueWords: VocabularyItem[]) => void;
  setStats: (stats: VocabularyStats) => void;

  // Fetch actions (with caching)
  fetchVocabulary: (forceRefresh?: boolean) => Promise<VocabularyItem[]>;
  fetchDueWords: (forceRefresh?: boolean) => Promise<VocabularyItem[]>;
  fetchStats: (forceRefresh?: boolean) => Promise<VocabularyStats | null>;

  // Optimistic updates
  addVocabularyItem: (item: VocabularyItem) => void;
  removeVocabularyItem: (id: string) => void;

  // Clear cache
  clearCache: () => void;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useVocabularyStore = create<VocabularyState>()(
  persist(
    (set, get) => ({
      // Initial state
      vocabulary: [],
      dueWords: [],
      stats: null,
      lastFetched: {
        vocabulary: null,
        dueWords: null,
        stats: null,
      },
      isLoading: {
        vocabulary: false,
        dueWords: false,
        stats: false,
      },

      // Setters
      setVocabulary: (vocabulary) => set({ vocabulary, lastFetched: { ...get().lastFetched, vocabulary: Date.now() } }),
      setDueWords: (dueWords) => set({ dueWords, lastFetched: { ...get().lastFetched, dueWords: Date.now() } }),
      setStats: (stats) => set({ stats, lastFetched: { ...get().lastFetched, stats: Date.now() } }),

      // Fetch with caching
      fetchVocabulary: async (forceRefresh = false) => {
        const { lastFetched, vocabulary, isLoading } = get();

        // Return cached data if fresh and not forcing refresh
        if (!forceRefresh && lastFetched.vocabulary && Date.now() - lastFetched.vocabulary < CACHE_DURATION) {
          return vocabulary;
        }

        // Prevent duplicate requests
        if (isLoading.vocabulary) return vocabulary;

        set({ isLoading: { ...isLoading, vocabulary: true } });

        try {
          const response = await apiClient.get<{ items: VocabularyItem[]; total: number; hasMore: boolean }>('/api/vocabulary');
          const items = response.items || [];
          set({
            vocabulary: items,
            lastFetched: { ...lastFetched, vocabulary: Date.now() },
            isLoading: { ...isLoading, vocabulary: false },
          });
          return items;
        } catch (error) {
          console.error('[VocabularyStore] Failed to fetch vocabulary:', error);
          set({ isLoading: { ...isLoading, vocabulary: false } });
          return vocabulary;
        }
      },

      fetchDueWords: async (forceRefresh = false) => {
        const { lastFetched, dueWords, isLoading } = get();

        // Return cached data if fresh and not forcing refresh
        if (!forceRefresh && lastFetched.dueWords && Date.now() - lastFetched.dueWords < CACHE_DURATION) {
          return dueWords;
        }

        // Prevent duplicate requests
        if (isLoading.dueWords) return dueWords;

        set({ isLoading: { ...isLoading, dueWords: true } });

        try {
          const response = await apiClient.get<{
            items: VocabularyItem[];
            dueCount: number;
            newCount: number;
            total: number;
          }>('/api/practice/due-words?limit=50');

          const items = response.items || [];
          set({
            dueWords: items,
            lastFetched: { ...lastFetched, dueWords: Date.now() },
            isLoading: { ...isLoading, dueWords: false },
          });
          return items;
        } catch (error) {
          console.error('[VocabularyStore] Failed to fetch due words:', error);
          set({ isLoading: { ...isLoading, dueWords: false } });
          return dueWords;
        }
      },

      fetchStats: async (forceRefresh = false) => {
        const { lastFetched, stats, isLoading } = get();

        // Return cached data if fresh and not forcing refresh
        if (!forceRefresh && lastFetched.stats && Date.now() - lastFetched.stats < CACHE_DURATION) {
          return stats;
        }

        // Prevent duplicate requests
        if (isLoading.stats) return stats;

        set({ isLoading: { ...isLoading, stats: true } });

        try {
          const response = await apiClient.get<VocabularyStats>('/api/stats');
          set({
            stats: response,
            lastFetched: { ...lastFetched, stats: Date.now() },
            isLoading: { ...isLoading, stats: false },
          });
          return response;
        } catch (error) {
          console.error('[VocabularyStore] Failed to fetch stats:', error);
          set({ isLoading: { ...isLoading, stats: false } });
          return stats;
        }
      },

      // Optimistic updates
      addVocabularyItem: (item) => {
        const { vocabulary, dueWords, stats } = get();

        // Add to vocabulary list if not already present
        const exists = vocabulary.some((v) => v.id === item.id);
        if (!exists) {
          set({ vocabulary: [item, ...vocabulary] });
        }

        // Add to due words if not already present
        const dueExists = dueWords.some((v) => v.id === item.id);
        if (!dueExists && !item.isLearned) {
          set({ dueWords: [item, ...dueWords] });
        }

        // Update stats
        if (stats) {
          set({
            stats: {
              ...stats,
              totalWords: stats.totalWords + 1,
              dueToday: stats.dueToday + 1,
            },
          });
        }
      },

      removeVocabularyItem: (id) => {
        const { vocabulary, dueWords, stats } = get();

        set({
          vocabulary: vocabulary.filter((v) => v.id !== id),
          dueWords: dueWords.filter((v) => v.id !== id),
        });

        if (stats) {
          set({
            stats: {
              ...stats,
              totalWords: Math.max(0, stats.totalWords - 1),
            },
          });
        }
      },

      // Clear cache (useful on logout)
      clearCache: () => {
        set({
          vocabulary: [],
          dueWords: [],
          stats: null,
          lastFetched: {
            vocabulary: null,
            dueWords: null,
            stats: null,
          },
        });
      },
    }),
    {
      name: 'vocabulary-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist data, not loading states
      partialize: (state) => ({
        vocabulary: state.vocabulary,
        dueWords: state.dueWords,
        stats: state.stats,
        lastFetched: state.lastFetched,
      }),
    }
  )
);
