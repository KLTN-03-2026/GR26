/**
 * @author Đào Thu Thiên
 * @description Table hiển thị danh sách voucher
 * @created 2026-04-16
 */

import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from '@shared/components/ui/table';
import type { VoucherListItem } from '../../types/voucher.types';
import { VoucherRow } from './VoucherRow';
import { VoucherTablePagination } from './VoucherTablePagination';

interface VoucherTableProps {
    vouchers: VoucherListItem[];
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export const VoucherTable = ({
    vouchers,
    currentPage,
    totalPages,
    totalItems = 0,
    onPageChange,
    isLoading = false,
}: VoucherTableProps) => {
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="spinner spinner-md" />
            </div>
        );
    }

    if (vouchers.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Không tìm thấy voucher nào</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-lg">
                <Table>
                    <TableHeader className="border-0">
                        <TableRow className="hover:bg-cream border-b-0">
                            <TableHead>MÃ VOUCHER</TableHead>
                            <TableHead>TÊN CHƯƠNG TRÌNH</TableHead>
                            <TableHead>GIÁ TRỊ GIẢM</TableHead>
                            <TableHead>THỜI GIAN ÁP DỤNG</TableHead>
                            <TableHead>ĐIỀU KIỆN</TableHead>
                            <TableHead>TRẠNG THÁI</TableHead>
                            <TableHead className="text-right">HÀNH ĐỘNG</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {vouchers.map((voucher) => (
                            <VoucherRow key={voucher.id} voucher={voucher} />
                        ))}
                    </TableBody>
                </Table>
            </div>

            <VoucherTablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={onPageChange}
            />
        </div>
    );
};