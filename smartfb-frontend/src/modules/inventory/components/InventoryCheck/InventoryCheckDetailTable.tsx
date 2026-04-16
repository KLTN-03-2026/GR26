/**
 * @author Đào Thu Thiên
 * @description Bảng nhập số lượng thực tế cho kiểm kho - Lưu khi nhấn Enter hoặc blur
 * @created 2026-04-16
 */

import { useState, useCallback } from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@shared/components/ui/table';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { Textarea } from '@shared/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@shared/components/ui/dialog';
import { cn } from '@shared/utils/cn';
import type { InventoryCheckDetail } from '../../types/inventoryCheck.types';
import { DEVIATION_THRESHOLD_PERCENT } from '../../types/inventoryCheck.types';

interface InventoryCheckDetailTableProps {
    details: InventoryCheckDetail[];
    isLoading: boolean;
    isSubmitting?: boolean;
    savingItemIds?: Set<string>;
    readOnly?: boolean;
    onSaveDetail: (itemId: string, actualQuantity: number, note?: string) => void;
    onSubmit?: () => void;
    canSubmit?: boolean;
}

const formatQuantity = (value: number, unit: string) => {
    const formatted = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 4 }).format(value);
    return `${formatted} ${unit}`;
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
};

const getDeviationInfo = (detail: InventoryCheckDetail) => {
    if (detail.actualQuantity === null || detail.systemQuantity === 0) {
        return { text: '—', className: '', percent: 0, isExceed: false };
    }
    const deviation = detail.actualQuantity - detail.systemQuantity;
    const percent = (deviation / detail.systemQuantity) * 100;
    const isExceed = Math.abs(percent) > DEVIATION_THRESHOLD_PERCENT;
    return {
        text: `${deviation > 0 ? '+' : ''}${deviation.toFixed(4)} (${percent.toFixed(2)}%)`,
        className: deviation > 0 ? 'text-emerald-600' : deviation < 0 ? 'text-red-600' : 'text-text-secondary',
        isExceed,
    };
};

export const InventoryCheckDetailTable = ({
    details,
    isLoading,
    isSubmitting = false,
    savingItemIds = new Set(),
    readOnly = false,
    onSaveDetail,
    onSubmit,
    canSubmit = false,
}: InventoryCheckDetailTableProps) => {
    const [noteDialogOpen, setNoteDialogOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<InventoryCheckDetail | null>(null);
    const [tempNote, setTempNote] = useState('');

    // Lưu giá trị tạm thời khi đang nhập
    const [tempValues, setTempValues] = useState<Record<string, string>>({});

    // Xử lý khi người dùng thay đổi input
    const handleInputChange = (itemId: string, value: string) => {
        setTempValues(prev => ({ ...prev, [itemId]: value }));
    };

    // Xử lý lưu khi nhấn Enter hoặc blur
    const handleSave = useCallback((itemId: string) => {
        const tempValue = tempValues[itemId];
        if (tempValue !== undefined) {
            const numValue = parseFloat(tempValue);
            if (!isNaN(numValue) && numValue >= 0) {
                const detail = details.find(d => d.itemId === itemId);
                onSaveDetail(itemId, numValue, detail?.note);
            }
            // Xóa giá trị tạm sau khi lưu
            setTempValues(prev => {
                const next = { ...prev };
                delete next[itemId];
                return next;
            });
        }
    }, [tempValues, details, onSaveDetail]);

    // Xử lý phím Enter
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSave(itemId);
        }
    };

    // Xử lý mở dialog ghi chú
    const handleOpenNoteDialog = (item: InventoryCheckDetail) => {
        setSelectedItem(item);
        setTempNote(item.note || '');
        setNoteDialogOpen(true);
    };

    // Xử lý lưu ghi chú
    const handleSaveNote = useCallback(() => {
        if (selectedItem && tempNote.trim()) {
            const currentQuantity = selectedItem.actualQuantity;
            if (currentQuantity !== null) {
                onSaveDetail(selectedItem.itemId, currentQuantity, tempNote);
            }
        }
        setNoteDialogOpen(false);
        setSelectedItem(null);
        setTempNote('');
    }, [selectedItem, tempNote, onSaveDetail]);

    // Lấy giá trị hiển thị cho input (ưu tiên giá trị tạm)
    const getDisplayValue = (detail: InventoryCheckDetail) => {
        if (tempValues[detail.itemId] !== undefined) {
            return tempValues[detail.itemId];
        }
        return detail.actualQuantity === null ? '' : detail.actualQuantity.toString();
    };

    if (isLoading) {
        return (
            <div className="flex h-48 items-center justify-center">
                <div className="spinner spinner-md" />
            </div>
        );
    }

    if (details.length === 0) {
        return (
            <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center">
                <p className="text-base font-semibold text-text-primary">Chưa có dữ liệu nguyên liệu</p>
                <p className="mt-2 text-sm text-text-secondary">Vui lòng tạo phiếu kiểm kho trước.</p>
            </div>
        );
    }

    const missingCount = details.filter(d => d.actualQuantity === null).length;

    return (
        <div className="space-y-4">
            {/* Thông báo nếu chưa nhập đủ */}
            {missingCount > 0 && !readOnly && (
                <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="flex items-center gap-2 text-sm text-amber-800">
                        <AlertTriangle className="h-4 w-4" />
                        Còn <strong>{missingCount}</strong> nguyên liệu chưa nhập số lượng thực tế.
                    </p>
                </div>
            )}

            <div className="overflow-hidden rounded-card border border-border bg-card shadow-card">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-cream">
                            <TableHead>Nguyên liệu</TableHead>
                            <TableHead>Đơn vị</TableHead>
                            <TableHead>Tồn hệ thống</TableHead>
                            <TableHead>Số lượng thực tế</TableHead>
                            <TableHead>Chênh lệch</TableHead>
                            <TableHead>Giá trị lệch</TableHead>
                            <TableHead>Ghi chú</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {details.map((detail) => {
                            const deviationInfo = getDeviationInfo(detail);
                            const isSaving = savingItemIds.has(detail.itemId);
                            const hasWarning = deviationInfo.isExceed && !detail.note;
                            const displayValue = getDisplayValue(detail);
                            const isDirty = tempValues[detail.itemId] !== undefined;

                            return (
                                <TableRow key={detail.id} className={cn(hasWarning && 'bg-amber-50/50', isDirty && 'bg-blue-50/50')}>
                                    <TableCell className="font-medium text-text-primary">
                                        {detail.itemName}
                                    </TableCell>
                                    <TableCell>{detail.unit}</TableCell>
                                    <TableCell>{formatQuantity(detail.systemQuantity, detail.unit)}</TableCell>
                                    <TableCell>
                                        {readOnly ? (
                                            <span>
                                                {detail.actualQuantity !== null
                                                    ? formatQuantity(detail.actualQuantity, detail.unit)
                                                    : 'Chưa nhập'}
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    step="0.0001"
                                                    value={displayValue}
                                                    onChange={(e) => handleInputChange(detail.itemId, e.target.value)}
                                                    onBlur={() => handleSave(detail.itemId)}
                                                    onKeyDown={(e) => handleKeyDown(e, detail.itemId)}
                                                    placeholder={detail.systemQuantity.toString()}
                                                    className={cn("w-32", isDirty && "border-blue-400")}
                                                    disabled={isSaving}
                                                />
                                                {isSaving && (
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                                )}
                                                {isDirty && !isSaving && (
                                                    <span className="text-xs text-blue-600">Chưa lưu</span>
                                                )}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className={deviationInfo.className}>
                                        {deviationInfo.text}
                                    </TableCell>
                                    <TableCell>
                                        {detail.deviationValue !== null
                                            ? formatCurrency(detail.deviationValue)
                                            : '—'}
                                    </TableCell>
                                    <TableCell>
                                        {detail.note ? (
                                            <span
                                                className="text-sm text-text-secondary cursor-pointer hover:text-primary line-clamp-2 max-w-[200px]"
                                                onClick={() => !readOnly && handleOpenNoteDialog(detail)}
                                            >
                                                {detail.note}
                                            </span>
                                        ) : hasWarning ? (
                                            <span
                                                className="text-sm text-amber-600 cursor-pointer hover:underline"
                                                onClick={() => handleOpenNoteDialog(detail)}
                                            >
                                                Cần nhập ghi chú
                                            </span>
                                        ) : (
                                            <span
                                                className="text-sm text-text-secondary cursor-pointer hover:text-primary"
                                                onClick={() => !readOnly && handleOpenNoteDialog(detail)}
                                            >
                                                Thêm ghi chú
                                            </span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Nút nộp phiếu */}
            {!readOnly && onSubmit && (
                <div className="flex justify-end pt-4">
                    <Button
                        type="button"
                        onClick={onSubmit}
                        disabled={!canSubmit || isSubmitting}
                        className="gap-2"
                    >
                        <CheckCircle className="h-4 w-4" />
                        {isSubmitting ? 'Đang nộp...' : 'Nộp phiếu kiểm kho'}
                    </Button>
                </div>
            )}

            {/* Dialog nhập ghi chú */}
            <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Nhập ghi chú</DialogTitle>
                        <DialogDescription>
                            {selectedItem && (() => {
                                const deviation = (selectedItem.actualQuantity || 0) - selectedItem.systemQuantity;
                                const percent = (deviation / selectedItem.systemQuantity) * 100;
                                if (Math.abs(percent) > DEVIATION_THRESHOLD_PERCENT) {
                                    return `Chênh lệch ${percent > 0 ? '+' : ''}${percent.toFixed(2)}% vượt quá ngưỡng ${DEVIATION_THRESHOLD_PERCENT}%. Vui lòng giải thích lý do.`;
                                }
                                return "Nhập ghi chú cho nguyên liệu này (không bắt buộc).";
                            })()}
                        </DialogDescription>
                    </DialogHeader>
                    <Textarea
                        value={tempNote}
                        onChange={(e) => setTempNote(e.target.value)}
                        placeholder="Ví dụ: Hàng hỏng, đổ vỡ trong quá trình bảo quản..."
                        rows={4}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>
                            Hủy
                        </Button>
                        <Button onClick={handleSaveNote} disabled={!tempNote.trim() && !selectedItem?.note}>
                            Lưu ghi chú
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};