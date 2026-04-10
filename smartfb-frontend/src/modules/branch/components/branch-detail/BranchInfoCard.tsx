import { Building2, CalendarDays, MapPin, Pencil, Phone } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import type { Branch } from '@modules/branch/types/branch.types';

interface BranchInfoCardProps {
  branch: Branch;
  onEdit?: () => void;
}

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const getStatusMeta = (status: Branch['status']) =>
  status === 'ACTIVE'
    ? {
        label: 'Đang hoạt động',
        badgeClassName: 'bg-emerald-100 text-emerald-700',
      }
    : {
        label: 'Ngừng hoạt động',
        badgeClassName: 'bg-amber-100 text-amber-700',
      };

/**
 * Card hiển thị thông tin chi nhánh dựa trên response thực tế từ backend.
 */
export const BranchInfoCard = ({ branch, onEdit }: BranchInfoCardProps) => {
  const statusMeta = getStatusMeta(branch.status);

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-white shadow-card">
      <div className="flex flex-col gap-4 border-b border-border px-6 py-5 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            <Building2 className="h-3.5 w-3.5" />
            Tổng quan
          </div>
          <div>
            <h2 className="text-2xl font-bold text-text-primary">{branch.name}</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Mã chi nhánh: <span className="font-medium text-text-primary">{branch.code}</span>
            </p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-sm font-medium ${statusMeta.badgeClassName}`}>
            {statusMeta.label}
          </span>
        </div>
        {onEdit && (
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="gap-2 self-start"
          >
            <Pencil className="h-4 w-4" />
            Chỉnh sửa
          </Button>
        )}
      </div>

      <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
            <MapPin className="h-4 w-4 text-primary" />
            Địa chỉ
          </div>
          <p className="text-base font-medium text-text-primary">
            {branch.address || 'Chưa cập nhật địa chỉ'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Phone className="h-4 w-4 text-primary" />
            Điện thoại
          </div>
          <p className="text-base font-medium text-text-primary">
            {branch.phone || 'Chưa cập nhật số điện thoại'}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
            <CalendarDays className="h-4 w-4 text-primary" />
            Ngày tạo
          </div>
          <p className="text-base font-medium text-text-primary">
            {formatDateTime(branch.createdAt)}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-muted/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-text-primary">
            <Building2 className="h-4 w-4 text-primary" />
            Mã tenant
          </div>
          <p className="break-all text-sm font-medium text-text-primary">
            {branch.tenantId}
          </p>
        </div>
      </div>
    </div>
  );
};
