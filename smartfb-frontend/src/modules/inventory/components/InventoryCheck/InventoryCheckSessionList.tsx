/**
 * @author Đào Thu Thiên
 * @description Danh sách phiếu kiểm kho
 * @created 2026-04-16
 */

import { Eye, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Button } from '@shared/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@shared/components/ui/table';
import type { InventoryCheckSession } from '../../types/inventoryCheck.types';

const Badge = ({ children, variant }: { children: React.ReactNode; variant?: 'outline' | 'secondary' | 'destructive' | 'default' }) => {
    const variantClass = {
        outline: 'border border-amber-500 text-amber-600 bg-transparent',
        secondary: 'bg-blue-100 text-blue-700',
        destructive: 'bg-red-100 text-red-700',
        default: 'bg-green-600 text-white',
    };
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClass[variant || 'default']}`}>
            {children}
        </span>
    );
};

interface InventoryCheckSessionListProps {
    sessions: InventoryCheckSession[];
    isLoading: boolean;
    onViewDetail: (sessionId: string) => void;
    onCancel?: (sessionId: string) => void;
    canCancel?: boolean;
}

const getStatusBadge = (status: InventoryCheckSession['status']) => {
    switch (status) {
        case 'DRAFT':
            return <Badge variant="outline">Đang kiểm</Badge>;
        case 'SUBMITTED':
            return <Badge variant="secondary">Đã nộp</Badge>;
        case 'APPROVED':
            return <Badge variant="default">Đã duyệt</Badge>;
        case 'CANCELLED':
            return <Badge variant="destructive">Đã hủy</Badge>;
        default:
            return <Badge variant="outline">Không xác định</Badge>;
    }
};

const formatDate = (dateString: string) => {
    try {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch {
        return dateString;
    }
};

const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '—';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

export const InventoryCheckSessionList = ({
    sessions,
    isLoading,
    onViewDetail,
    onCancel,
    canCancel = false,
}: InventoryCheckSessionListProps) => {
    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <div className="spinner spinner-md" />
            </div>
        );
    }

    if (sessions.length === 0) {
        return (
            <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-text-secondary" />
                <p className="text-base font-semibold text-text-primary">Chưa có phiếu kiểm kho nào</p>
                <p className="mt-2 text-sm text-text-secondary">
                    Nhấn "Tạo phiếu kiểm kho" để bắt đầu kiểm kê.
                </p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-cream">
                        <TableHead>Mã phiếu</TableHead>
                        <TableHead>Chi nhánh</TableHead>
                        <TableHead>Ngày kiểm</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead>Người nộp</TableHead>
                        <TableHead>Giá trị lệch</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sessions.map((session) => (
                        <TableRow key={session.id}>
                            <TableCell className="font-mono text-sm">
                                {session.id.slice(-8).toUpperCase()}
                            </TableCell>
                            <TableCell>{session.branchName}</TableCell>
                            <TableCell>{formatDate(session.checkDate)}</TableCell>
                            <TableCell>{getStatusBadge(session.status)}</TableCell>
                            <TableCell>{session.submittedByName || '—'}</TableCell>
                            <TableCell className={session.totalDeviationValue && session.totalDeviationValue !== 0 ? 'font-medium text-red-600' : ''}>
                                {formatCurrency(session.totalDeviationValue)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onViewDetail(session.id)}
                                    >
                                        <Eye className="h-4 w-4" />
                                        Xem
                                    </Button>
                                    {canCancel && session.status === 'DRAFT' && onCancel && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                            onClick={() => onCancel(session.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Hủy
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
};