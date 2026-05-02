import { useAuthStore } from '@modules/auth/stores/authStore';
import { type FC } from 'react';
import { Bell, Menu } from 'lucide-react';

interface HeaderProps {
  title: string;
  showHamburger?: boolean;
  onHamburgerClick?: () => void;
}

export const Header: FC<HeaderProps> = ({
  title,
  showHamburger = false,
  onHamburgerClick,
}) => {
  const user = useAuthStore((state) => state.user);
  const userName = user?.fullName || user?.email || 'Bạn';

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-border bg-card/90 px-4 backdrop-blur-md md:px-6 lg:px-8">
      {/* Left Section - Hamburger + Title */}
      <div className="flex min-w-0 items-center gap-3">
        {/* Hamburger Button - hiển thị cho mobile và tablet */}
        {showHamburger && (
          <button
            onClick={onHamburgerClick}
            className="flex h-10 w-10 items-center justify-center rounded-lg transition-colors hover:bg-hover-light lg:hidden"
            aria-label="Mở menu điều hướng"
          >
            <Menu className="h-5 w-5 text-text-secondary" />
          </button>
        )}

        {/* Page Title */}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold text-text-primary md:text-xl lg:text-2xl">
            {title}
          </h1>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
        {/* Greeting - ẩn trên mobile rất nhỏ */}
        <p className="hidden text-sm font-medium text-text-secondary md:block">
          Xin chào, {userName}! 👋
        </p>

        {/* Notification Bell */}
        <button className="relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-hover-light">
          <Bell className="h-5 w-5 text-text-secondary" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger-text" />
        </button>
      </div>
    </header>
  );
};
