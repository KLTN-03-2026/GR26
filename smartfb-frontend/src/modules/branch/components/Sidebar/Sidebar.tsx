import { menuConfig, type MenuItem } from '@/data';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { BrandLogo } from '@shared/components/layout/BrandLogo';
import { ROUTES } from '@shared/constants/routes';
import { usePermission } from '@shared/hooks/usePermission';
import { hasAccess } from '@shared/utils/accessControl';
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
  const { isOwner, permissions, userRole } = usePermission();
  const user = useAuthStore((state) => state.user);
  const clearAuthSession = useAuthStore((state) => state.clearAuthSession);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const branchFallbackLabel = isOwner ? 'Tất cả chi nhánh' : 'Chưa chọn chi nhánh';
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
    return items
      .filter((item) => {
        return hasAccess(
          { role: userRole, permissions },
          {
            roles: item.roles,
            requiredPermissions: item.requiredPermissions ? [...item.requiredPermissions] : undefined,
          }
        );
      })
      .map((item) => ({
        ...item,
        children: item.children?.filter((child) => {
          return hasAccess(
            { role: userRole, permissions },
            {
              roles: child.roles,
              requiredPermissions: child.requiredPermissions ? [...child.requiredPermissions] : undefined,
            }
          );
        }),
      }));
  };

  const handleLogout = () => {
    clearAuthSession();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-sidebar shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="flex items-center gap-2 border-b border-border px-6 py-4">
        <BrandLogo iconClassName="h-9 w-9" textClassName="text-xl" />
      </div>

      <div className="px-3 py-3 ">
        <div className="relative">
          <button
            onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
            onBlur={() => setTimeout(() => setIsBranchDropdownOpen(false), 200)}
            className={cn(
              'w-full flex items-center gap-2 rounded-full border px-3 py-2 transition-all duration-150',
              'text-sm font-medium',
              isBranchDropdownOpen
                ? 'border-primary bg-primary-light shadow-card'
                : 'border-border bg-card hover:border-primary hover:shadow-card'
            )}
          >
            <span className="flex-1 truncate text-left text-text-primary">
              {selectedBranch?.name || branchFallbackLabel}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-text-secondary transition-transform duration-200',
                isBranchDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {isBranchDropdownOpen && (
            <div className="absolute left-0 right-0 z-50 mt-2 max-h-64 overflow-y-auto rounded-xl border border-border bg-card py-2 shadow-card">
              {isOwner ? (
                <>
                  <button
                    onClick={() => {
                      onBranchChange?.('all');
                      setIsBranchDropdownOpen(false);
                    }}
                    className={cn(
                      'w-full text-left px-4 py-2.5 text-sm transition-colors duration-150',
                      !selectedBranchId || selectedBranchId === 'all'
                        ? 'bg-primary-light font-semibold text-primary'
                        : 'text-text-primary hover:bg-hover-light'
                    )}
                  >
                    Tất cả chi nhánh
                  </button>

                  {branches.length > 0 && (
                    <div className="my-1 border-t border-border" />
                  )}
                </>
              ) : null}

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
                      ? 'bg-primary-light font-semibold text-primary'
                      : 'text-text-primary hover:bg-hover-light'
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
                              key={`${child.title}-${child.path ?? 'no-path'}`}
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

      <div className="space-y-3 border-t border-border p-4">
        <button className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 font-semibold text-white transition-colors duration-150 hover:bg-primary-hover">
          <Package className="w-4 h-4" />
          <span>Nâng cấp Pro</span>
        </button>

        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light font-semibold text-primary">
            {userInitials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{userDisplayName}</p>
            <span className="inline-flex rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-medium capitalize text-primary">
              {userRole}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
