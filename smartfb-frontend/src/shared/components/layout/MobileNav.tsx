import { type FC, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Table,
  ChefHat,
  CreditCard,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { STAFF_ROUTE_PERMISSIONS } from '@shared/constants/permissions';
import { ROLES } from '@shared/constants/roles';
import { hasAccess } from '@shared/utils/accessControl';
import { ROUTES } from '@shared/constants/routes';
import { cn } from '@shared/utils/cn';
import { menuConfig } from '@data/menuConfig';
import { usePermission } from '@shared/hooks/usePermission';
import { BrandLogo } from './BrandLogo';

/**
 * Bottom Navigation cho mobile - 5 action chính
 * Hiển thị cố định ở đáy màn hình trên mobile
 */

interface MobileNavProps {
  onOpenFullMenu: () => void;
}

interface BottomNavRouteItem {
  label: string;
  icon: FC<{ className?: string }>;
  ownerLabel: string;
  staffLabel: string;
  ownerIcon: FC<{ className?: string }>;
  staffIcon: FC<{ className?: string }>;
  ownerPath: string;
  staffPath: string;
  staffPermissions: readonly string[];
}

interface BottomNavActionItem {
  label: string;
  icon: FC<{ className?: string }>;
  path: null;
  action: 'open-menu';
}

type BottomNavItem = BottomNavRouteItem | BottomNavActionItem;

interface ResolvedBottomNavItem {
  label: string;
  icon: FC<{ className?: string }>;
  path: string | null;
  action?: 'open-menu';
}

const isBottomNavActionItem = (
  item: BottomNavItem | ResolvedBottomNavItem
): item is BottomNavActionItem => {
  return 'action' in item && item.action === 'open-menu';
};

// 5 menu items chính cho bottom nav
const BOTTOM_NAV_ITEMS: readonly BottomNavItem[] = [
  {
    label: 'Dashboard',
    icon: LayoutDashboard,
    ownerLabel: 'Dashboard',
    staffLabel: 'Dashboard',
    ownerIcon: LayoutDashboard,
    staffIcon: LayoutDashboard,
    ownerPath: ROUTES.OWNER.DASHBOARD,
    staffPath: ROUTES.STAFF.DASHBOARD,
    staffPermissions: STAFF_ROUTE_PERMISSIONS.DASHBOARD,
  },
  {
    label: 'Order',
    icon: ClipboardList,
    ownerLabel: 'Đơn hàng',
    staffLabel: 'Đơn hàng',
    ownerIcon: ClipboardList,
    staffIcon: ClipboardList,
    ownerPath: ROUTES.POS_MANAGEMENT,
    staffPath: ROUTES.POS_MANAGEMENT,
    staffPermissions: STAFF_ROUTE_PERMISSIONS.POS_MANAGEMENT,
  },
  {
    label: 'Bàn',
    icon: Table,
    ownerLabel: 'Bàn',
    staffLabel: 'Bàn',
    ownerIcon: Table,
    staffIcon: Table,
    ownerPath: ROUTES.OWNER.TABLES,
    staffPath: ROUTES.STAFF.TABLES,
    staffPermissions: STAFF_ROUTE_PERMISSIONS.TABLES,
  },
  {
    label: 'Thanh toán',
    icon: ChefHat,
    ownerLabel: 'Kho',
    staffLabel: 'Thanh toán',
    ownerIcon: ChefHat,
    staffIcon: CreditCard,
    ownerPath: ROUTES.OWNER.INVENTORY,
    staffPath: ROUTES.POS_PAYMENT,
    staffPermissions: STAFF_ROUTE_PERMISSIONS.POS_PAYMENT,
  },
  { label: 'Thêm', icon: MoreHorizontal, path: null, action: 'open-menu' },
];

export const MobileNav: FC<MobileNavProps> = ({ onOpenFullMenu }) => {
  const location = useLocation();
  const { permissions, userRole } = usePermission();

  const primaryItems: ResolvedBottomNavItem[] = BOTTOM_NAV_ITEMS.filter((item) => {
    if (isBottomNavActionItem(item)) {
      return true;
    }

    if (userRole === ROLES.OWNER) {
      return true;
    }

    return hasAccess(
      { role: userRole, permissions },
      {
        roles: [ROLES.STAFF],
        requiredPermissions: [...item.staffPermissions],
      }
    );
  }).map((item) => {
    if (isBottomNavActionItem(item)) {
      return item;
    }

    return {
      ...item,
      icon: userRole === ROLES.OWNER ? item.ownerIcon : item.staffIcon,
      label: userRole === ROLES.OWNER ? item.ownerLabel : item.staffLabel,
      path: userRole === ROLES.OWNER ? item.ownerPath : item.staffPath,
    };
  });

  return (
    <nav className="safe-area-bottom fixed bottom-0 left-0 right-0 z-40 h-16 border-t border-border bg-card md:hidden">
      <div className="grid grid-cols-5 h-full">
        {primaryItems.map((item) => {
          const isActive = item.path && location.pathname === item.path;

          if (isBottomNavActionItem(item) || !item.path) {
            return (
              <button
                key="more"
                onClick={onOpenFullMenu}
                className="flex flex-col items-center justify-center gap-0.5 text-text-secondary transition-colors hover:text-primary"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 transition-colors',
                isActive ? 'text-primary' : 'text-text-secondary hover:text-primary'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

/**
 * Slide-over Sidebar - Menu đầy đủ trượt từ trái
 * Hiển thị trên mobile và tablet khi bấm nút hamburger hoặc "Thêm" ở bottom nav
 */
interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  branches?: { id: string; name: string }[];
  selectedBranchId?: string;
  onBranchChange?: (branchId: string) => void;
}

export const MobileSidebar: FC<MobileSidebarProps> = ({
  open,
  onClose,
  branches = [],
  selectedBranchId,
  onBranchChange,
}) => {
  const location = useLocation();
  const { isOwner, permissions, userRole } = usePermission();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const branchFallbackLabel = isOwner ? 'Tất cả chi nhánh' : 'Chưa chọn chi nhánh';

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

  return (
    <>
      {/* Overlay với animation fade */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Sidebar với animation smooth */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-[calc(100vw-1rem)] max-w-80 bg-card lg:hidden',
          'transform transition-all duration-300 ease-out',
          'shadow-2xl',
          open ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header với close button */}
          <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3">
            <BrandLogo iconClassName="h-9 w-9" textClassName="text-lg" />
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-hover-light"
              aria-label="Đóng menu"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Branch Selector */}
          <div className="px-3 py-3 shrink-0">
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
                          onClose();
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
                        onClose();
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

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {menuConfig.map((section) => {
              const filteredItems = section.items
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
                        requiredPermissions: child.requiredPermissions
                          ? [...child.requiredPermissions]
                          : undefined,
                      }
                    );
                  }),
                }));
              if (filteredItems.length === 0) return null;

              return (
                <div key={section.title} className="mb-4">
                  <div className="space-y-1">
                    {filteredItems.map((item) => {
                      const isActive = location.pathname === item.path;
                      const isExpanded = expandedItems.has(item.title);
                      const hasChildren = item.children && item.children.length > 0;
                      const isChildActive = item.children?.some(
                        (child) => location.pathname === child.path
                      );

                      if (hasChildren) {
                        return (
                          <div key={item.title}>
                            <button
                              onClick={() => toggleItem(item.title)}
                              className={cn(
                                'w-full flex items-center justify-between px-2 py-2.5 rounded-lg transition-colors duration-150',
                                'text-sm font-medium tracking-wide',
                                !isActive && !isChildActive
                                  ? 'text-text-secondary hover:bg-hover-light hover:text-primary'
                                  : 'text-primary'
                              )}
                            >
                              <span className="flex-1 text-left">{item.title}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-text-secondary" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-text-secondary" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="mt-1 space-y-1 pl-4">
                                {item.children!.map((child) => {
                                  const isChildPathActive = location.pathname === child.path;
                                  return (
                                    <Link
                                      key={`${child.title}-${child.path ?? 'no-path'}`}
                                      to={child.path!}
                                      onClick={onClose}
                                      className={cn(
                                        'flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors duration-150',
                                        'font-medium tracking-wide ml-4',
                                        !isChildPathActive
                                          ? 'text-text-secondary hover:bg-hover-light hover:text-text-primary'
                                          : 'bg-primary text-white'
                                      )}
                                    >
                                      {child.icon && (
                                        <child.icon className="w-4 h-4 shrink-0" />
                                      )}
                                      <span className="text-xs">{child.title}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.title}
                          to={item.path!}
                          onClick={onClose}
                          className={cn(
                            'flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors duration-150',
                            'text-sm font-medium tracking-wide',
                            !isActive
                              ? 'text-text-secondary hover:bg-hover-light hover:text-primary'
                              : 'text-primary'
                          )}
                        >
                          {item.icon && <item.icon className="w-4 h-4 shrink-0" />}
                          <span>{item.title}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>
      </div>
    </>
  );
};
