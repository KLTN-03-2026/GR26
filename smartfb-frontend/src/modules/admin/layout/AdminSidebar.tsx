import { ADMIN_NAV_GROUPS } from '@modules/admin/constants/adminNav';
import { BrandLogo } from '@shared/components/layout/BrandLogo';
import { cn } from '@shared/utils/cn';
import { ShieldCheck } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

interface AdminSidebarProps {
  onNavigate?: () => void;
}

const isNavItemActive = (pathname: string, itemPath: string): boolean => {
  if (itemPath === '/admin') {
    return pathname === itemPath;
  }

  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
};

/**
 * Sidebar riêng cho admin SaaS.
 * Không dùng menu Owner/Staff vì admin quản trị nền tảng, không vận hành chi nhánh.
 */
export const AdminSidebar = ({ onNavigate }: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    navigate(path);
    onNavigate?.();
  };

  return (
    <aside className="flex h-full w-admin-sidebar flex-col border-r border-admin-gray-200 bg-admin-surface">
      <div className="flex h-[72px] items-center border-b border-admin-gray-200 px-6">
        <BrandLogo iconClassName="h-9 w-9" textClassName="text-xl text-admin-gray-900" />
      </div>

      <div className="border-b border-admin-gray-200 px-5 py-4">
        <div className="flex items-start gap-3 rounded-lg border border-admin-brand-100 bg-admin-brand-25 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-admin-brand-500 text-white">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-admin-gray-900">Admin SaaS</p>
            <p className="mt-1 text-xs leading-5 text-admin-gray-500">
              Quản trị tenant, gói dịch vụ và billing toàn hệ thống.
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-6">
          {ADMIN_NAV_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-xs font-semibold uppercase tracking-wide text-admin-gray-500">
                {group.title}
              </p>
              <div className="mt-2 space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavItemActive(location.pathname, item.path);

                  return (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => handleNavigate(item.path)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                        isActive
                          ? 'bg-admin-brand-50 text-admin-brand-600'
                          : 'text-admin-gray-700 hover:bg-admin-gray-50 hover:text-admin-gray-900'
                      )}
                    >
                      <Icon
                        className={cn(
                          'h-5 w-5 shrink-0',
                          isActive ? 'text-admin-brand-600' : 'text-admin-gray-500'
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold">{item.title}</span>
                        <span className="mt-0.5 block truncate text-xs font-normal text-admin-gray-500">
                          {item.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
};
