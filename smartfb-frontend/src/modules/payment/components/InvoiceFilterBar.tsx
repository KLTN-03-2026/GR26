import { Search } from 'lucide-react';
import { Input } from '@shared/components/ui/input';

interface InvoiceFilterBarProps {
  invoiceKeyword: string;
  onInvoiceKeywordChange: (value: string) => void;
}

/**
 * Thanh lọc đơn giản cho danh sách hóa đơn thu.
 * Invoice được sinh tự động sau thanh toán, nên FE chỉ cần ô tra cứu theo mã.
 */
export const InvoiceFilterBar = ({
  invoiceKeyword,
  onInvoiceKeywordChange,
}: InvoiceFilterBarProps) => {
  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Tra cứu hóa đơn thu</h2>
        </div>

      </div>

      <div className="relative w-full md:max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
        <Input
          value={invoiceKeyword}
          onChange={(event) => onInvoiceKeywordChange(event.target.value)}
          placeholder="Tìm theo mã hóa đơn thu"
          className="pl-10"
        />
      </div>
    </div>
  );
};
