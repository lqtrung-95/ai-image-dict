import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isAuthenticated: boolean;
  hasUsedTrial: boolean;
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
      hasUsedTrial: false,
      trialAnalysisCount: 0,
      user: null,

      setAuthenticated: (user) => {
        set({
          isAuthenticated: !!user,
          user,
          // Reset trial when user logs in
          trialAnalysisCount: user ? 0 : get().trialAnalysisCount
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
            }
          });
        }
      },

      useTrial: () => {
        const { trialAnalysisCount, hasUsedTrial } = get();
        // Allow 1 free trial analysis
        if (trialAnalysisCount < 1) {
          set({
            trialAnalysisCount: trialAnalysisCount + 1,
            hasUsedTrial: true
          });
          return true;
        }
        return false;
      },

      resetTrial: () => {
        set({ trialAnalysisCount: 0, hasUsedTrial: false });
      },

      logout: () => {
        set({
          isAuthenticated: false,
          user: null,
          trialAnalysisCount: 0
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
