import { RevenueReportDashboard } from '@modules/report/components/RevenueReportDashboard';
import { PageMeta } from '@shared/components/common/PageMeta';

export default function RevenuePage() {
  return (
    <>
      <PageMeta
        title="Báo cáo doanh thu"
        description="Xem KPI doanh thu, biểu đồ theo giờ, top món bán chạy và tỷ trọng thanh toán của từng chi nhánh trong SmartF&B."
      />
      <RevenueReportDashboard />
    </>
  );
}
