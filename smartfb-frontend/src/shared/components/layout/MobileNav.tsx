import { type FC, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  Table,
  ChefHat,
  MoreHorizontal,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { ROUTES } from '@shared/constants/routes';
import { cn } from '@shared/utils/cn';
import { menuConfig } from '@data/menuConfig';
import { BrandLogo } from './BrandLogo';

/**
 * Bottom Navigation cho mobile - 5 action chính
 * Hiển thị cố định ở đáy màn hình trên mobile
 */

interface MobileNavProps {
  onOpenFullMenu: () => void;
}

// 5 menu items chính cho bottom nav
const BOTTOM_NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutDashboard, path: ROUTES.OWNER.DASHBOARD },
  { label: 'Đơn hàng', icon: ClipboardList, path: ROUTES.OWNER.ORDERS },
  { label: 'Bàn', icon: Table, path: ROUTES.OWNER.TABLES },
  { label: 'Thực đơn', icon: ChefHat, path: ROUTES.OWNER.MENU },
  { label: 'Thêm', icon: MoreHorizontal, path: null, action: 'open-menu' },
];

export const MobileNav: FC<MobileNavProps> = ({ onOpenFullMenu }) => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 z-40 md:hidden safe-area-bottom">
      <div className="grid grid-cols-5 h-full">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const isActive = item.path && location.pathname === item.path;

          if (item.action === 'open-menu' || !item.path) {
            return (
              <button
                key="more"
                onClick={onOpenFullMenu}
                className="flex flex-col items-center justify-center gap-0.5 text-slate-500 hover:text-orange-500 transition-colors"
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path!}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 transition-colors',
                isActive
                  ? 'text-orange-500'
                  : 'text-slate-500 hover:text-orange-500'
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
 * Chỉ hiển thị trên mobile khi bấm nút hamburger hoặc "Thêm" ở bottom nav
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isBranchDropdownOpen, setIsBranchDropdownOpen] = useState(false);

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);

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
          'fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-over Sidebar với animation smooth */}
      <div
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-white z-50 md:hidden',
          'transform transition-all duration-300 ease-out',
          'shadow-2xl',
          open ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Header với close button */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
            <BrandLogo iconClassName="h-9 w-9" textClassName="text-lg" />
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
              aria-label="Đóng menu"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Branch Selector */}
          <div className="px-3 py-3 shrink-0">
            <div className="relative">
              <button
                onClick={() => setIsBranchDropdownOpen(!isBranchDropdownOpen)}
                onBlur={() => setTimeout(() => setIsBranchDropdownOpen(false), 200)}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 rounded-full border transition-all duration-150',
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
                      onClose();
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
                        onClose();
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

          {/* Navigation Menu */}
          <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
            {menuConfig.map((section) => {
              const filteredItems = section.items.filter((item) => {
                if (!item.roles) return true;
                return item.roles.includes('owner');
              });
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
                                  ? 'text-slate-600 hover:bg-slate-100 hover:text-orange-500'
                                  : 'text-orange-500'
                              )}
                            >
                              <span className="flex-1 text-left">{item.title}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-slate-500" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              )}
                            </button>
                            {isExpanded && (
                              <div className="mt-1 space-y-1 pl-4">
                                {item.children!.map((child) => {
                                  const isChildPathActive = location.pathname === child.path;
                                  return (
                                    <Link
                                      key={child.path}
                                      to={child.path!}
                                      onClick={onClose}
                                      className={cn(
                                        'flex items-center gap-3 px-2 py-2.5 rounded-lg transition-colors duration-150',
                                        'font-medium tracking-wide ml-4',
                                        !isChildPathActive
                                          ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                                          : 'bg-orange-500 text-white'
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
                              ? 'text-slate-600 hover:bg-slate-100 hover:text-orange-500'
                              : 'text-orange-500'
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
