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
  // Mock user name - will get from auth store later
  const userName = 'Orlando';

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 md:px-8 flex items-center justify-between shrink-0">
      {/* Left Section - Hamburger + Title */}
      <div className="flex items-center gap-3">
        {/* Hamburger Button - chỉ hiển thị trên mobile */}
        {showHamburger && (
          <button
            onClick={onHamburgerClick}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5 text-slate-600" />
          </button>
        )}

        {/* Page Title */}
        <div>
          <h1 className="text-lg md:text-2xl font-bold text-slate-900">{title}</h1>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2 md:gap-4">
        {/* Greeting - ẩn trên mobile rất nhỏ */}
        <p className="hidden sm:block text-sm font-medium text-slate-600">
          Xin chào, {userName}! 👋
        </p>

        {/* Notification Bell */}
        <button className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors duration-150">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
};
