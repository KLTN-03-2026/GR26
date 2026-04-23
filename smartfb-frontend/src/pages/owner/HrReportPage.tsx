import { HrReportDashboard } from '@modules/report/components/HrReportDashboard';
import { PageMeta } from '@shared/components/common/PageMeta';

export default function HrReportPage() {
  return (
    <>
      <PageMeta
        title="Báo cáo nhân sự"
        description="Theo dõi chấm công, chi phí nhân sự và vi phạm ca làm theo tháng."
      />
      <HrReportDashboard />
    </>
  );
}
