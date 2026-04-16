/**
 * @author Đào Thu Thiên
 * @description Component chính quản lý kiểm kho
 * @created 2026-04-16
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { useInventoryCheckList } from '../../hooks/useInventoryCheckList';
import { useInventoryCheckDetail } from '../../hooks/useInventoryCheckDetail';
import { useUpdateCheckDetail } from '../../hooks/useUpdateCheckDetail';
import { useSubmitInventoryCheck } from '../../hooks/useSubmitInventoryCheck';
import { useCancelInventoryCheck } from '../../hooks/useCancelInventoryCheck';
import { useDeviationReport } from '../../hooks/useDeviationReport';
import { CreateInventoryCheckDialog } from './CreateInventoryCheckDialog';
import { InventoryCheckSessionList } from './InventoryCheckSessionList';
import { InventoryCheckDetailTable } from './InventoryCheckDetailTable';
import { DeviationReportDialog } from './DeviationReportDialog';
import { Button } from '@shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@shared/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';
import type { InventoryCheckDetail } from '../../types/inventoryCheck.types';

type ViewMode = 'list' | 'detail';

export const InventoryCheckManagement = () => {
    const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
    const { data: branchList = [] } = useBranches();
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [isDeviationReportOpen, setIsDeviationReportOpen] = useState(false);
    const [savingItemIds, setSavingItemIds] = useState<Set<string>>(new Set());
    const [localDetails, setLocalDetails] = useState<InventoryCheckDetail[]>([]);

    // Lấy danh sách phiếu
    const { data: sessionsData, isLoading: isListLoading, refetch: refetchList } = useInventoryCheckList({
        branchId: currentBranchId || undefined,
    });

    // Lấy chi tiết phiếu
    const {
        session,
        details,
        isLoading: isDetailLoading,
        refetch: refetchDetail,
    } = useInventoryCheckDetail(selectedSessionId || '');

    // Đồng bộ local details khi details thay đổi
    useEffect(() => {
        if (details.length > 0) {
            setLocalDetails(details);
        }
    }, [details]);

    const { mutate: updateDetail } = useUpdateCheckDetail(selectedSessionId || '');
    const { mutate: submitCheck, isPending: isSubmitting } = useSubmitInventoryCheck(selectedSessionId || '');
    const { mutate: cancelCheck } = useCancelInventoryCheck(selectedSessionId || '');
    const { data: deviationReport, refetch: refetchReport } = useDeviationReport(selectedSessionId || '');

    const branchOptions = branchList.map((branch) => ({
        id: branch.id,
        name: branch.name,
    }));

    const sessions = sessionsData?.data ?? [];

    const handleViewDetail = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        setViewMode('detail');
        setSavingItemIds(new Set());
    };

    const handleBackToList = () => {
        setViewMode('list');
        setSelectedSessionId(null);
        refetchList();
    };

    // Lưu chi tiết kiểm kho
    const handleSaveDetail = useCallback((itemId: string, actualQuantity: number, note?: string) => {
        setSavingItemIds((prev) => new Set(prev).add(itemId));

        // Cập nhật local ngay lập tức
        setLocalDetails(prev => prev.map(d =>
            d.itemId === itemId
                ? {
                    ...d,
                    actualQuantity,
                    note: note || d.note,
                    deviationQuantity: actualQuantity - d.systemQuantity,
                    deviationValue: (actualQuantity - d.systemQuantity) * d.costPerUnit
                }
                : d
        ));

        updateDetail(
            {
                itemId,
                data: {
                    actualQuantity,
                    note: note || '',
                },
            },
            {
                onSuccess: () => {
                    refetchDetail();
                },
                onSettled: () => {
                    setSavingItemIds((prev) => {
                        const next = new Set(prev);
                        next.delete(itemId);
                        return next;
                    });
                },
            }
        );
    }, [updateDetail, refetchDetail]);

    const handleSubmit = () => {
        submitCheck(
            { notes: session?.notes },
            {
                onSuccess: () => {
                    refetchDetail();
                    refetchList();
                },
            }
        );
    };

    // 🔧 SỬA LỖI 2: Thêm debug và xử lý lỗi cho handleCancel
    const handleCancel = (sessionId: string) => {
        console.log('handleCancel called with sessionId:', sessionId);

        if (!sessionId) {
            console.error('sessionId is undefined or empty');
            return;
        }

        cancelCheck(
            { reason: 'Hủy phiếu kiểm kho' },
            {
                onSuccess: () => {
                    console.log('Cancel success for session:', sessionId);
                    refetchList();
                    if (selectedSessionId === sessionId) {
                        handleBackToList();
                    }
                },
                onError: (error) => {
                    console.error('Cancel failed:', error);
                },
            }
        );
    };

    const handleViewDeviationReport = () => {
        refetchReport();
        setIsDeviationReportOpen(true);
    };

    // Kiểm tra xem đã nhập đủ số lượng chưa (dùng localDetails hoặc details)
    const currentDetails = localDetails.length > 0 ? localDetails : details;
    const allQuantitiesFilled = currentDetails.every((d) => d.actualQuantity !== null);
    const canSubmitForm = allQuantitiesFilled && session?.status === 'DRAFT';
    const canViewReport = session?.status === 'SUBMITTED' || session?.status === 'APPROVED';

    return (
        <div className="space-y-4">
            {viewMode === 'list' ? (
                <>
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-text-primary">Phiếu kiểm kho</h2>
                        <CreateInventoryCheckDialog
                            branchOptions={branchOptions}
                            defaultBranchId={currentBranchId || undefined}
                            onSuccess={refetchList}
                            trigger={
                                <Button type="button" className="gap-2">
                                    Tạo phiếu kiểm kho
                                </Button>
                            }
                        />
                    </div>
                    <InventoryCheckSessionList
                        sessions={sessions}
                        isLoading={isListLoading}
                        onViewDetail={handleViewDetail}
                        onCancel={handleCancel}
                        canCancel
                    />
                </>
            ) : (
                <>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="sm" onClick={handleBackToList}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Quay lại danh sách
                        </Button>
                        <h2 className="text-lg font-semibold text-text-primary">
                            Kiểm kho - {session?.branchName}
                        </h2>
                        {canViewReport && (
                            <Button variant="outline" size="sm" onClick={handleViewDeviationReport}>
                                Xem báo cáo lệch
                            </Button>
                        )}
                    </div>

                    <Tabs defaultValue="check" className="mt-4">
                        <TabsList>
                            <TabsTrigger value="check">Nhập số lượng</TabsTrigger>
                            {canViewReport && (
                                <TabsTrigger value="report">Báo cáo lệch</TabsTrigger>
                            )}
                        </TabsList>
                        <TabsContent value="check" className="mt-4">
                            <InventoryCheckDetailTable
                                details={currentDetails}
                                isLoading={isDetailLoading}
                                isSubmitting={isSubmitting}
                                savingItemIds={savingItemIds}
                                readOnly={session?.status !== 'DRAFT'}
                                onSaveDetail={handleSaveDetail}
                                onSubmit={handleSubmit}
                                canSubmit={canSubmitForm}
                            />
                        </TabsContent>
                        {canViewReport && (
                            <TabsContent value="report" className="mt-4">
                                <div className="rounded-card border border-border bg-card p-6">
                                    <pre className="text-sm">
                                        {JSON.stringify(deviationReport, null, 2)}
                                    </pre>
                                </div>
                            </TabsContent>
                        )}
                    </Tabs>
                </>
            )}

            <DeviationReportDialog
                open={isDeviationReportOpen}
                onOpenChange={setIsDeviationReportOpen}
                report={deviationReport || null}
                isLoading={false}
            />
        </div>
    );
};