import { useAuthStore } from '@modules/auth/stores/authStore';
import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { getRoleHomePage } from '@shared/utils/getRoleHomePage';

interface PublicRouteProps {
  children: ReactNode;
}

const EMPTY_PERMISSIONS: string[] = [];

/**
 * Guard cho các route công khai như đăng nhập và đăng ký.
 * Nếu đã có phiên đăng nhập thì chuyển người dùng về trang chính theo role.
 */
export const PublicRoute = ({ children }: PublicRouteProps) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const currentRole = useAuthStore((state) => state.user?.role ?? state.session?.role);
  const permissions =
    useAuthStore((state) => state.session?.permissions) ?? EMPTY_PERMISSIONS;

  if (isAuthenticated && currentRole) {
    return <Navigate to={getRoleHomePage(currentRole, permissions)} replace />;
  }

  return <>{children}</>;
};
