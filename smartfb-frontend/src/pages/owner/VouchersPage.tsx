/**
 * @author Đào Thu Thiên
 * @description Page quản lý voucher - chủ quán
 * @created 2026-04-16
 */

import { useMemo, useState } from 'react';
import { Tag, TicketCheck, TicketX } from 'lucide-react';
import { VoucherFilterBar } from '@modules/voucher/components/VoucherFilterBar/VoucherFilterBar';
import { VoucherTable } from '@modules/voucher/components/VoucherTable/VoucherTable';
import { CreateVoucherDialog } from '@modules/voucher/components/CreateVoucherDialog';
import { useVoucherFilters } from '@modules/voucher/hooks/useVoucherFilters';
import { useVouchers } from '@modules/voucher/hooks/useVouchers';
import type { VoucherListItem } from '@modules/voucher/types/voucher.types';
import { Button } from '@shared/components/ui/button';

interface StatCardProps {
    icon: React.ReactNode;
    iconBg: string;
    label: string;
    value: string;
    valueColor?: string;
}

const StatCard = ({ icon, iconBg, label, value, valueColor = 'text-text-primary' }: StatCardProps) => (
    <div className="card">
        <div className="mb-1 flex items-center gap-2 text-sm text-text-secondary">
            <div className={`flex h-10 w-10 items-center justify-center rounded-card ${iconBg}`}>
                {icon}
            </div>
            <span className="font-medium text-text-primary">{label}</span>
        </div>
        <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
    </div>
);

// Helper: format discount display
const formatDiscountDisplay = (discountType: string, discountValue: number): string => {
    if (discountType === 'PERCENT') {
        return `${discountValue}%`;
    }
    return `${discountValue.toLocaleString('vi-VN')}đ`;
};

// Helper: format period display
const formatPeriodDisplay = (startDate: string, endDate: string): string => {
    const start = new Date(startDate).toLocaleDateString('vi-VN');
    const end = new Date(endDate).toLocaleDateString('vi-VN');
    return `${start} - ${end}`;
};

// Helper: format condition display
const formatConditionDisplay = (minOrderValue: number | null): string => {
    if (!minOrderValue || minOrderValue === 0) return 'Không';
    return `Đơn tối thiểu ${minOrderValue.toLocaleString('vi-VN')}đ`;
};

// Helper: determine status (có thể override dựa vào thời gian)
const determineStatus = (status: string, startDate: string, endDate: string): 'ACTIVE' | 'INACTIVE' | 'EXPIRED' => {
    if (status === 'INACTIVE') return 'INACTIVE';
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start) return 'EXPIRED'; // Chưa bắt đầu -> coi như chưa có hiệu lực
    if (now > end) return 'EXPIRED';
    return 'ACTIVE';
};

export default function VouchersPage() {
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const { data, isLoading, isError, refetch } = useVouchers();

    const vouchersData = useMemo<VoucherListItem[]>(() => {
        if (!data) return [];
        return data.map((voucher) => {
            const effectiveStatus = determineStatus(voucher.status, voucher.startDate, voucher.endDate);
            return {
                ...voucher,
                status: effectiveStatus,
                discountDisplay: formatDiscountDisplay(voucher.discountType, voucher.discountValue),
                periodDisplay: formatPeriodDisplay(voucher.startDate, voucher.endDate),
                conditionDisplay: formatConditionDisplay(voucher.minOrderValue),
            };
        });
    }, [data, refreshKey]);

    const {
        filters,
        pagination,
        vouchers,
        totalItems,
        hasActiveFilters,
        updateFilter,
        clearFilters,
        updatePage,
        totalPages,
    } = useVoucherFilters(vouchersData);

    const totalVouchers = vouchersData.length;
    const activeVouchers = vouchersData.filter(v => v.status === 'ACTIVE').length;
    const expiredVouchers = vouchersData.filter(v => v.status === 'EXPIRED').length;

    const handleRefresh = () => {
        refetch();
        setRefreshKey(prev => prev + 1);
    };

    if (isLoading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <div className="spinner spinner-md" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="py-12 text-center">
                <p className="mb-4 font-medium text-red-600">Không thể xử lý voucher, vui lòng thử lại sau</p>
                <Button onClick={handleRefresh}>Thử lại</Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-8">
            <div className="grid grid-cols-3 gap-4">
                <StatCard
                    icon={<Tag className="h-5 w-5 text-primary" />}
                    iconBg="bg-primary-light"
                    label="Tổng voucher"
                    value={String(totalVouchers).padStart(2, '0')}
                />
                <StatCard
                    icon={<TicketCheck className="h-5 w-5 text-success-text" />}
                    iconBg="bg-success-light"
                    label="Đang hoạt động"
                    value={String(activeVouchers).padStart(2, '0')}
                    valueColor="text-success-text"
                />
                <StatCard
                    icon={<TicketX className="h-5 w-5 text-warning-text" />}
                    iconBg="bg-warning-light"
                    label="Hết hạn"
                    value={String(expiredVouchers).padStart(2, '0')}
                    valueColor="text-warning-text"
                />
            </div>

            <div className="space-y-4 rounded-card border border-border bg-card p-4 shadow-card">
                <VoucherFilterBar
                    filters={filters}
                    onSearchChange={(value) => updateFilter('search', value)}
                    onStatusChange={(value) => updateFilter('status', value)}
                    onClearFilters={clearFilters}
                    hasActiveFilters={hasActiveFilters}
                    onAddVoucher={() => setShowCreateDialog(true)}
                />

                <VoucherTable
                    vouchers={vouchers}
                    currentPage={pagination.page}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    onPageChange={updatePage}
                />
            </div>

            <CreateVoucherDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={handleRefresh}
            />
        </div>
    );
}