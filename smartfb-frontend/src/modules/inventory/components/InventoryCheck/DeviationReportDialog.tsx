/**
 * @author Đào Thu Thiên
 * @description Dialog hiển thị báo cáo lệch kho
 * @created 2026-04-16
 */

import { FileText } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@shared/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@shared/components/ui/table';
import { Button } from '@shared/components/ui/button';
import type { DeviationReport } from '../../types/inventoryCheck.types';

const Badge = ({ children, variant }: { children: React.ReactNode; variant?: 'outline' | 'destructive' }) => {
    const variantClass = variant === 'destructive'
        ? 'bg-red-100 text-red-700'
        : 'border border-amber-500 text-amber-600 bg-transparent';
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variantClass}`}>
            {children}
        </span>
    );
};

interface DeviationReportDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    report: DeviationReport | null;
    isLoading: boolean;
}

const formatDate = (dateString: string) => {
    try {
        return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch {
        return dateString;
    }
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const formatNumber = (value: number, unit: string) => {
    const formatted = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);
    return `${formatted} ${unit}`;
};

export const DeviationReportDialog = ({
    open,
    onOpenChange,
    report,
    isLoading,
}: DeviationReportDialogProps) => {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Báo cáo lệch kho
                    </DialogTitle>
                    <DialogDescription>
                        Danh sách nguyên liệu có chênh lệch sau khi kiểm kho
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex h-48 items-center justify-center">
                        <div className="spinner spinner-md" />
                    </div>
                ) : !report ? (
                    <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center">
                        <p className="text-base font-semibold text-text-primary">Không có dữ liệu báo cáo</p>
                    </div>
                ) : report.deviations.length === 0 ? (
                    <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center">
                        <p className="text-base font-semibold text-green-600">✅ Không có chênh lệch</p>
                        <p className="mt-2 text-sm text-text-secondary">
                            Tất cả nguyên liệu đều khớp với số lượng trong hệ thống.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Thông tin chung */}
                        <div className="rounded-card border border-border bg-cream/50 p-4">
                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <p className="text-sm text-text-secondary">Mã phiếu</p>
                                    <p className="font-mono text-sm font-semibold">
                                        {report.sessionId.slice(-8).toUpperCase()}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Chi nhánh</p>
                                    <p className="font-medium">{report.session.branchName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Ngày kiểm</p>
                                    <p>{formatDate(report.session.checkDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Người kiểm</p>
                                    <p>{report.checkedByName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-text-secondary">Tổng giá trị lệch</p>
                                    <p className="text-lg font-bold text-red-600">
                                        {formatCurrency(report.totalDeviationValue)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bảng danh sách lệch */}
                        <div className="overflow-hidden rounded-card border border-border bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nguyên liệu</TableHead>
                                        <TableHead>Đơn vị</TableHead>
                                        <TableHead>Tồn hệ thống</TableHead>
                                        <TableHead>Thực tế</TableHead>
                                        <TableHead>Chênh lệch</TableHead>
                                        <TableHead>%</TableHead>
                                        <TableHead>Giá trị lệch</TableHead>
                                        <TableHead>Ghi chú</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {report.deviations.map((item) => (
                                        <TableRow key={item.itemId}>
                                            <TableCell className="font-medium">{item.itemName}</TableCell>
                                            <TableCell>{item.unit}</TableCell>
                                            <TableCell>{formatNumber(item.systemQuantity, item.unit)}</TableCell>
                                            <TableCell>{formatNumber(item.actualQuantity, item.unit)}</TableCell>
                                            <TableCell className={item.deviationQuantity > 0 ? 'text-emerald-600' : 'text-red-600'}>
                                                {item.deviationQuantity > 0 ? '+' : ''}
                                                {formatNumber(item.deviationQuantity, item.unit)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={Math.abs(item.deviationPercentage) > 10 ? 'destructive' : 'outline'}>
                                                    {item.deviationPercentage > 0 ? '+' : ''}
                                                    {item.deviationPercentage.toFixed(2)}%
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(item.deviationValue)}
                                            </TableCell>
                                            <TableCell className="max-w-[200px] text-sm text-text-secondary">
                                                {item.note || '—'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Đóng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};