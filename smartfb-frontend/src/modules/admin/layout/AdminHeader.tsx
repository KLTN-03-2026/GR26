import { useAuthStore } from '@modules/auth/stores/authStore';
import { ROUTES } from '@shared/constants/routes';
import { cn } from '@shared/utils/cn';
import { Bell, LogOut, Menu, Moon, Search, Sun } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface AdminHeaderProps {
  pageTitle: string;
  onOpenMobileMenu: () => void;
}

const getInitials = (displayName: string): string => {
  const nameParts = displayName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length === 0) {
    return 'AD';
  }

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
};

/**
 * Header khu vực admin.
 * Tập trung vào thao tác quản trị SaaS: tìm kiếm nhanh, thông báo và tài khoản admin.
 */
export const AdminHeader = ({ pageTitle, onOpenMobileMenu }: AdminHeaderProps) => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuthSession = useAuthStore((state) => state.clearAuthSession);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  const displayName = user?.fullName || user?.email || 'Admin';
  const initials = getInitials(displayName);

  const handleToggleDarkMode = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    document.documentElement.classList.toggle('dark', nextMode);
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 flex h-[72px] shrink-0 items-center justify-between border-b border-admin-gray-200 bg-white/90 px-4 backdrop-blur md:px-6 xl:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-admin-gray-500 transition-colors hover:bg-admin-gray-100 hover:text-admin-gray-900 lg:hidden"
          aria-label="Mở menu admin"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="hidden text-xs font-medium uppercase tracking-wide text-admin-gray-500 sm:block">
            SmartF&amp;B SaaS Admin
          </p>
          <h1 className="truncate text-lg font-semibold text-admin-gray-900 md:text-xl">
            {pageTitle}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <label className="hidden h-11 w-[280px] items-center gap-2 rounded-lg border border-admin-gray-200 bg-admin-gray-50 px-3 text-admin-gray-500 transition-colors focus-within:border-admin-brand-500 focus-within:bg-white lg:flex">
          <Search className="h-4 w-4 shrink-0" />
          <input
            type="search"
            placeholder="Tìm tenant, gói, hóa đơn..."
            className="min-w-0 flex-1 bg-transparent text-sm text-admin-gray-900 outline-none placeholder:text-admin-gray-500"
          />
        </label>

        <button
          type="button"
          onClick={handleToggleDarkMode}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-admin-gray-200 bg-white text-admin-gray-500 transition-colors hover:bg-admin-gray-50 hover:text-admin-gray-900"
          aria-label={isDarkMode ? 'Tắt giao diện tối' : 'Bật giao diện tối'}
        >
          {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-admin-gray-200 bg-white text-admin-gray-500 transition-colors hover:bg-admin-gray-50 hover:text-admin-gray-900"
          aria-label="Thông báo admin"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-admin-error" />
        </button>

        <div className="hidden items-center gap-3 rounded-lg border border-admin-gray-200 bg-white px-2 py-1.5 md:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-admin-brand-50 text-xs font-semibold text-admin-brand-600">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="max-w-[150px] truncate text-sm font-semibold text-admin-gray-900">
              {displayName}
            </p>
            <p className="text-xs text-admin-gray-500">System admin</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-md text-admin-gray-500',
              'transition-colors hover:bg-admin-error-light hover:text-admin-error'
            )}
            aria-label="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
