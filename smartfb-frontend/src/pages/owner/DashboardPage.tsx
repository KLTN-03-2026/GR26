import { ReportsOverviewDashboard } from '@modules/report/components/ReportsOverviewDashboard';
import { PageMeta } from '@shared/components/common/PageMeta';

export default function DashboardPage() {
  return (
    <>
      <PageMeta
        title="Dashboard"
        description="Tổng quan nhanh doanh thu, đơn hàng và cảnh báo kho của chi nhánh đang chọn."
      />
      <ReportsOverviewDashboard />
    </>
  );
}
