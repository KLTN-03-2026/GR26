import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { AuthStore } from '../types/authStore.types';
import {
  AUTH_STORAGE_KEY,
  buildAuthProfile,
  buildAuthSession,
  buildAuthUser,
  cleanupLegacyAuthStorage,
  mergePersistedAuthState,
  partializePersistedAuthState,
} from '../utils/authStore.utils';

/**
 * Store xác thực dùng chung cho toàn app.
 * Quản lý session, profile, user hiện tại và branch context đang thao tác.
 */
export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      profile: null,
      session: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuthSession: (authResponse, context = {}) =>
        set((state) => {
          cleanupLegacyAuthStorage();

          // Lấy permissions cũ làm fallback để tránh mất quyền UI
          // nếu token mới không chứa đầy đủ claims như mong đợi.
          const nextSession = buildAuthSession(authResponse, state.session?.permissions ?? []);
          const nextProfile = buildAuthProfile(context, state.profile, state.user);

          // `user` luôn được dựng lại từ `session + profile`
          // để không phải persist trùng dữ liệu trong localStorage.
          const nextUser = buildAuthUser(nextSession, nextProfile);

          return {
            profile: nextProfile,
            session: nextSession,
            user: nextUser,
            isAuthenticated: true,
          };
        }),

      clearAuthSession: () => {
        cleanupLegacyAuthStorage();

        set({
          user: null,
          profile: null,
          session: null,
          isAuthenticated: false,
        });
      },

      updateUser: (updates) =>
        set((state) => {
          if (!state.user) {
            return {};
          }

          const nextProfile = buildAuthProfile(
            {
              email: updates.email,
              fullName: updates.fullName,
              phone: updates.phone,
            },
            state.profile,
            state.user
          );

          return {
            profile: nextProfile,
            user: {
              ...state.user,
              ...updates,
            },
          };
        }),

      updateBranchContext: (branchId) =>
        set((state) => {
          if (!state.user || !state.session) {
            return {};
          }

          return {
            user: {
              ...state.user,
              branchId,
            },
            session: {
              ...state.session,
              branchId,
            },
          };
        }),

      setHydrated: (hasHydrated) =>
        set({
          hasHydrated,
        }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: partializePersistedAuthState,
      merge: mergePersistedAuthState,
      onRehydrateStorage: () => (state) => {
        cleanupLegacyAuthStorage();
        state?.setHydrated(true);
      },
    }
  )
);
