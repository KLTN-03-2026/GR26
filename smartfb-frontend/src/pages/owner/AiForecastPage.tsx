import { AiForecastContent } from '@modules/forecast/components/AiForecastContent';
import { PageMeta } from '@shared/components/common/PageMeta';

export default function AiForecastPage() {
  return (
    <>
      <PageMeta
        title="Dự báo tồn kho AI"
        description="Xem dự báo tiêu thụ nguyên liệu 7 ngày tới và gợi ý nhập hàng theo chi nhánh."
      />
      <AiForecastContent />
    </>
  );
}
