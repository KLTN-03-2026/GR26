import { type FC, useState } from 'react';
import { Bell, ChevronDown } from 'lucide-react';
import { cn } from '@shared/utils/cn';

interface HeaderProps {
  title: string;
  branches?: { id: string; name: string }[];
  selectedBranchId?: string;
  onBranchChange?: (branchId: string) => void;
}

export const Header: FC<HeaderProps> = ({
  title,
  branches = [],
  selectedBranchId,
  onBranchChange,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Mock user name - will get from auth store later
  const userName = 'Orlando';

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

  return (
    <header className="h-16 bg-white/80 backdrop-blur-sm border-b border-slate-200 px-8 flex items-center justify-between shrink-0">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {/* Greeting */}
        <p className="text-sm font-medium text-slate-600">
          Xin chào, {userName}! 👋
        </p>

        {/* Branch Selector - Always show */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
            className={cn(
              'flex items-center gap-2 px-5 py-2.5 max-w-3xs min-w-[20px] rounded-full border-2 transition-all duration-150',
              'text-sm font-medium ',
              isDropdownOpen
                ? 'bg-slate-50 border-slate-400 shadow-sm'
                : 'bg-white border-slate-300 hover:border-slate-400 hover:shadow-sm'
            )}
          >
            <span className="text-slate-700 truncate  flex-1 text-left">
              {selectedBranch?.name || 'Tất cả chi nhánh'}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-500 transition-transform duration-200',
                isDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
              {/* Option "Tất cả chi nhánh" */}
              <button
                onClick={() => {
                  onBranchChange?.('all');
                  setIsDropdownOpen(false);
                }}
                className={cn(
                  'w-full text-left px-4 py-2.5 text-sm transition-colors duration-150',
                  !selectedBranchId || selectedBranchId === 'all'
                    ? 'bg-orange-50 text-orange-600 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                Tất cả chi nhánh
              </button>

              {branches.length > 0 && (
                <div className="border-t border-slate-100 my-1" />
              )}

              {/* Danh sách các chi nhánh */}
              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => {
                    onBranchChange?.(branch.id);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm truncate transition-colors duration-150',
                    selectedBranchId === branch.id
                      ? 'bg-orange-50 text-orange-600 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {branch.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notification Bell */}
        <button className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors duration-150">
          <Bell className="w-5 h-5 text-slate-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
      </div>
    </header>
  );
};
