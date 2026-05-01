import { menuConfig, type MenuItem } from '@/data';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { BrandLogo } from '@shared/components/layout/BrandLogo';
import { ROUTES } from '@shared/constants/routes';
import { usePermission } from '@shared/hooks/usePermission';
import { cn } from '@shared/utils/cn';
import { ChevronDown, LogOut, Package } from 'lucide-react';
import { type FC, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CollapsibleMenuItem } from './CollapsibleMenuItem';
import { SubMenuItem } from './SubMenuItem';

/**
 * Sidebar component - menu điều hướng bên trái
 */
interface SidebarProps {
  branches?: { id: string; name: string }[];
  selectedBranchId?: string;
  onBranchChange?: (branchId: string) => void;
}

const getUserInitials = (displayName: string): string => {
  const nameParts = displayName.trim().split(/\s+/).filter(Boolean);

  if (nameParts.length === 0) {
    return 'ND';
  }

  if (nameParts.length === 1) {
    return nameParts[0].slice(0, 2).toUpperCase();
  }

  return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
};

export const Sidebar: FC<SidebarProps> = ({
  branches = [],
  selectedBranchId,
  onBranchChange,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = usePermission();
  const user = useAuthStore((state) => state.user);
  const clearAuthSession = useAuthStore((state) => state.clearAuthSession);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const userDisplayName = user?.fullName || user?.email || 'Người dùng';
  const userInitials = getUserInitials(userDisplayName);

  const toggleItem = (title: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);

      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }

      return next;
    });
  };

  const filterMenuItems = (items: MenuItem[]): MenuItem[] => {
    return items.filter((item) => {
      if (!item.roles) {
        return true;
      }

      return item.roles.includes(userRole);
    });
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 w-60 bg-white border-r border-slate-200 h-screen flex flex-col shrink-0 z-40">
      <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-100">
        <BrandLogo iconClassName="h-9 w-9" textClassName="text-xl" />
      </div>

      <div className="px-3 py-3 ">
        <div className="relative">
          <button
            onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
            onBlur={() => setTimeout(() => setIsBranchDropdownOpen(false), 200)}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2 rounded-4xl border-1 transition-all duration-150',
              'text-sm font-medium',
              isBranchDropdownOpen
                ? 'bg-slate-50 border-slate-400 shadow-sm'
                : 'bg-white border-slate-300 hover:border-slate-400 hover:shadow-sm'
            )}
          >
            <span className="text-slate-700 truncate flex-1 text-left">
              {selectedBranch?.name || 'Tất cả chi nhánh'}
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 text-slate-500 transition-transform duration-200',
                isBranchDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {isBranchDropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50 max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  onBranchChange?.('all');
                  setIsBranchDropdownOpen(false);
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

              {branches.map((branch) => (
                <button
                  key={branch.id}
                  onClick={() => {
                    onBranchChange?.(branch.id);
                    setIsBranchDropdownOpen(false);
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
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-hide">
        {menuConfig.map((section) => {
          const filteredItems = filterMenuItems(section.items);

          if (filteredItems.length === 0) {
            return null;
          }

          return (
            <div key={section.title}>
              <div className="space-y-1">
                {filteredItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  const isExpanded = expandedItems.has(item.title);
                  const hasChildren = item.children && item.children.length > 0;

                  return (
                    <div key={item.title}>
                      <CollapsibleMenuItem
                        item={item}
                        isActive={!!isActive}
                        isExpanded={isExpanded}
                        onToggle={() => toggleItem(item.title)}
                      />
                      {hasChildren && isExpanded && (
                        <div className="mt-1 space-y-1">
                          {item.children!.map((child) => (
                            <SubMenuItem
                              key={child.title}
                              item={child}
                              isActive={location.pathname === child.path}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-4 space-y-3">
        <button className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 px-4 rounded-full flex items-center justify-center gap-2 transition-colors duration-150">
          <Package className="w-4 h-4" />
          <span>Nâng cấp Pro</span>
        </button>

        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-semibold">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{userDisplayName}</p>
            <p className="text-xs text-slate-500 capitalize">{userRole}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
