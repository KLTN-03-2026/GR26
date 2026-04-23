import { NavLink } from 'react-router-dom';
import { LineChart, PackageSearch, Users2 } from 'lucide-react';
import { ROUTES } from '@shared/constants/routes';
import { cn } from '@shared/utils/cn';

const reportTabs = [
  {
    label: 'Doanh thu',
    path: ROUTES.OWNER.REPORT_REVENUE,
    icon: LineChart,
  },
  {
    label: 'Kho hàng',
    path: ROUTES.OWNER.REPORT_INVENTORY,
    icon: PackageSearch,
  },
  {
    label: 'Nhân sự',
    path: ROUTES.OWNER.REPORT_HR,
    icon: Users2,
  },
] as const;

/**
 * Thanh chuyển nhanh giữa các nhóm báo cáo của Owner.
 */
export const ReportNavigationTabs = () => {
  return (
    <nav className="flex gap-2 overflow-x-auto rounded-card border border-border bg-card p-2 shadow-card">
      {reportTabs.map((tab) => {
        const Icon = tab.icon;

        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) =>
              cn(
                'flex h-10 shrink-0 items-center gap-2 rounded-card px-3 text-sm font-semibold transition-colors',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:bg-hover-light hover:text-text-primary',
              )
            }
          >
            <Icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
};
