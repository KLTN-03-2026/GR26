import type {
  AuthProfile,
  AuthResponseContext,
  AuthState,
  AuthUser,
  BackendAuthResponse,
} from './auth.types';

/**
 * State và actions của auth store.
 */
export interface AuthStore extends AuthState {
  setAuthSession: (authResponse: BackendAuthResponse, context?: AuthResponseContext) => void;
  clearAuthSession: () => void;
  updateUser: (updates: Partial<AuthUser>) => void;
  updateBranchContext: (branchId: string | null) => void;
  setHydrated: (hasHydrated: boolean) => void;
}

/**
 * Dữ liệu thực sự cần persist xuống localStorage.
 * Không lưu `user` và `isAuthenticated` vì đều suy ra được từ `session`.
 */
export interface PersistedAuthState {
  profile: AuthProfile | null;
  session: AuthStore['session'];
}

/**
 * Shape legacy để migrate dữ liệu cũ đã từng lưu nguyên `user`.
 */
export interface LegacyPersistedAuthState extends Partial<PersistedAuthState> {
  isAuthenticated?: boolean;
  user?: AuthUser | null;
}
