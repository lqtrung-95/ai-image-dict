import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FREE_LIMITS } from '@/lib/monetization';

interface AuthState {
  isAuthenticated: boolean;
  trialAnalysisCount: number;
  user: { id: string; email: string; displayName?: string; avatarUrl?: string } | null;
  setAuthenticated: (user: { id: string; email: string; displayName?: string; avatarUrl?: string } | null) => void;
  setProfile: (profile: { displayName?: string; avatarUrl?: string }) => void;
  useTrial: () => boolean;
  resetTrial: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      trialAnalysisCount: 0,
      user: null,

      setAuthenticated: (user) => {
        set({
          isAuthenticated: !!user,
          user,
          // Reset trial when user logs in
          trialAnalysisCount: user ? 0 : get().trialAnalysisCount,
        });
      },

      setProfile: (profile) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: {
              ...currentUser,
              displayName: profile.displayName ?? currentUser.displayName,
              avatarUrl: profile.avatarUrl ?? currentUser.avatarUrl,
            },
          });
        }
      },

      useTrial: () => {
        const { trialAnalysisCount } = get();
        if (trialAnalysisCount < FREE_LIMITS.guestAnalyses) {
          set({
            trialAnalysisCount: trialAnalysisCount + 1,
          });
          return true;
        }
        return false;
      },

      resetTrial: () => {
        set({ trialAnalysisCount: 0 });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          trialAnalysisCount: 0,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
