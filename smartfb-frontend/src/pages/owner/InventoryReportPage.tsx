import { InventoryReportDashboard } from '@modules/report/components/InventoryReportDashboard';
import { PageMeta } from '@shared/components/common/PageMeta';

export default function InventoryReportPage() {
  return (
    <>
      <PageMeta
        title="Báo cáo kho"
        description="Theo dõi tồn kho, hàng sắp hết hạn và hao hụt nguyên liệu theo chi nhánh."
      />
      <InventoryReportDashboard />
    </>
  );
}
