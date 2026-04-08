import { ROLES, type Role } from '@shared/constants/roles';
import type {
  AuthProfile,
  AuthResponseContext,
  AuthSession,
  AuthUser,
  BackendAuthResponse,
} from '../types/auth.types';
import type {
  AuthStore,
  LegacyPersistedAuthState,
  PersistedAuthState,
} from '../types/authStore.types';

export const AUTH_STORAGE_KEY = 'smartfnb-auth';

const LEGACY_AUTH_STORAGE_KEYS = [
  'access_token',
  'refresh_token',
  'tenant_id',
  'auth-storage',
  'user',
  'token',
] as const;

type JwtPayload = {
  sub?: unknown;
  tenantId?: unknown;
  role?: unknown;
  permissions?: unknown;
  branchId?: unknown;
};

type DecodedAccessTokenClaims = {
  userId?: string;
  tenantId?: string;
  role?: string;
  permissions?: string[];
  branchId?: string | null;
};

const isStringArray = (value: unknown): value is string[] => {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * Chuẩn hóa role backend về enum role frontend đang dùng.
 */
export const normalizeRole = (role: string): Role => {
  switch (role.trim().toLowerCase()) {
    case ROLES.ADMIN:
      return ROLES.ADMIN;
    case ROLES.OWNER:
      return ROLES.OWNER;
    default:
      return ROLES.STAFF;
  }
};

const decodeBase64Url = (value: string): string => {
  const normalizedValue = value.replace(/-/g, '+').replace(/_/g, '/');
  const paddedValue = normalizedValue.padEnd(Math.ceil(normalizedValue.length / 4) * 4, '=');
  return window.atob(paddedValue);
};

const extractOptionalString = (value: unknown): string | undefined => {
  if (!isNonEmptyString(value)) {
    return undefined;
  }

  return value;
};

const extractOptionalNullableString = (value: unknown): string | null | undefined => {
  if (value === null) {
    return null;
  }

  if (!isNonEmptyString(value)) {
    return undefined;
  }

  return value;
};

/**
 * Decode access token để lấy lại claims nghiệp vụ đang thực sự có trong JWT.
 * FE ưu tiên dữ liệu này sau các luồng login / refresh / đổi chi nhánh
 * để tránh session trong store bị lệch so với token mới nhất.
 */
export const extractAuthClaimsFromAccessToken = (
  accessToken: string
): DecodedAccessTokenClaims | null => {
  try {
    const [, payloadSegment] = accessToken.split('.');

    if (!payloadSegment) {
      return null;
    }

    const parsedPayload = JSON.parse(decodeBase64Url(payloadSegment)) as JwtPayload;

    return {
      userId: extractOptionalString(parsedPayload.sub),
      tenantId: extractOptionalString(parsedPayload.tenantId),
      role: extractOptionalString(parsedPayload.role),
      permissions: isStringArray(parsedPayload.permissions)
        ? parsedPayload.permissions
        : undefined,
      branchId: extractOptionalNullableString(parsedPayload.branchId),
    };
  } catch {
    return null;
  }
};

/**
 * Đọc permissions từ access token để UI có thể dùng ngay cho RBAC
 * mà không cần gọi thêm profile endpoint.
 */
export const extractPermissionsFromAccessToken = (
  accessToken: string,
  fallbackPermissions: string[]
): string[] => {
  return extractAuthClaimsFromAccessToken(accessToken)?.permissions ?? fallbackPermissions;
};

/**
 * Chuyển payload auth từ backend sang session chuẩn hóa của frontend.
 */
export const buildAuthSession = (
  authResponse: BackendAuthResponse,
  fallbackPermissions: string[]
): AuthSession => {
  // Luôn ưu tiên claims trong access token vì đây là nguồn sự thật
  // mà mọi request nghiệp vụ thực tế sẽ sử dụng sau refresh.
  const decodedClaims = extractAuthClaimsFromAccessToken(authResponse.accessToken);
  const normalizedRole = normalizeRole(decodedClaims?.role ?? authResponse.role);

  return {
    accessToken: authResponse.accessToken,
    refreshToken: authResponse.refreshToken,
    tokenType: authResponse.tokenType,
    expiresIn: authResponse.expiresIn,
    expiresAt: new Date(Date.now() + authResponse.expiresIn * 1000).toISOString(),
    userId: decodedClaims?.userId ?? authResponse.userId,
    tenantId: decodedClaims?.tenantId ?? authResponse.tenantId,
    role: normalizedRole,
    branchId: decodedClaims?.branchId ?? authResponse.branchId ?? null,
    permissions: decodedClaims?.permissions ?? fallbackPermissions,
  };
};

/**
 * Ghép session với context đã biết từ form FE để giữ lại email, tên và số điện thoại.
 */
export const buildAuthUser = (
  session: AuthSession,
  context: AuthResponseContext
): AuthUser => {
  return {
    id: session.userId,
    email: context.email ?? '',
    fullName: context.fullName ?? '',
    phone: context.phone,
    role: session.role,
    tenantId: session.tenantId,
    branchId: session.branchId,
  };
};

/**
 * Tách phần profile thật sự cần persist khỏi context/user hiện tại.
 */
export const buildAuthProfile = (
  context: AuthResponseContext,
  fallbackProfile?: AuthProfile | null,
  fallbackUser?: AuthUser | null
): AuthProfile => {
  return {
    email: context.email ?? fallbackProfile?.email ?? fallbackUser?.email ?? '',
    fullName:
      context.fullName ?? fallbackProfile?.fullName ?? fallbackUser?.fullName ?? '',
    phone: context.phone ?? fallbackProfile?.phone ?? fallbackUser?.phone,
  };
};

/**
 * Lấy profile từ user legacy để migrate localStorage cũ.
 */
export const extractProfileFromUser = (user?: AuthUser | null): AuthProfile | null => {
  if (!user) {
    return null;
  }

  return {
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
  };
};

/**
 * Xóa các key auth cũ đã từng được lưu rời rạc để localStorage chỉ còn 1 nguồn dữ liệu.
 */
export const cleanupLegacyAuthStorage = () => {
  if (typeof window === 'undefined') {
    return;
  }

  LEGACY_AUTH_STORAGE_KEYS.forEach((storageKey) => {
    window.localStorage.removeItem(storageKey);
  });
};

/**
 * Dựng lại state auth từ dữ liệu persist.
 * Mục tiêu là chỉ persist `session + profile`, còn `user` luôn được rebuild.
 */
export const mergePersistedAuthState = (
  persistedState: unknown,
  currentState: AuthStore
): AuthStore => {
  const nextPersistedState = (persistedState ?? {}) as LegacyPersistedAuthState;
  const nextProfile =
    nextPersistedState.profile ??
    extractProfileFromUser(nextPersistedState.user) ??
    currentState.profile;
  const nextSession = nextPersistedState.session ?? currentState.session;

  return {
    ...currentState,
    ...nextPersistedState,
    profile: nextProfile ?? null,
    session: nextSession ?? null,
    user:
      nextSession && nextProfile
        ? buildAuthUser(nextSession, nextProfile)
        : nextSession
          ? buildAuthUser(nextSession, {})
          : null,
    isAuthenticated: Boolean(nextSession),
  };
};

/**
 * Chỉ persist phần state tối thiểu để tránh trùng lặp trong localStorage.
 */
export const partializePersistedAuthState = (
  state: AuthStore
): PersistedAuthState => {
  return {
    profile: state.profile,
    session: state.session,
  };
};
