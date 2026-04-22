/**
 * Kiểm kho dựa trên /inventory/adjust.
 * Không cần session backend — FE load tồn kho hiện tại, user nhập thực tế,
 * khi xác nhận sẽ gọi POST /inventory/adjust cho từng item có chênh lệch.
 */

import { useState, useCallback, useMemo } from 'react';
import { ClipboardCheck, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@modules/auth/stores/authStore';
import { useAdjustStock } from '@modules/inventory/hooks/useAdjustStock';
import { useInventoryBalances } from '@modules/inventory/hooks/useInventoryBalances';
import { useToast } from '@shared/hooks/useToast';
import { queryKeys } from '@shared/constants/queryKeys';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@shared/components/ui/button';
import { InventoryCheckDetailTable } from './InventoryCheckDetailTable';
import type { InventoryCheckDetail } from '../../types/inventoryCheck.types';
import type { InventoryBalance } from '../../types/inventory.types';
import { DEVIATION_THRESHOLD_PERCENT, isDeviationExceedThreshold } from '../../types/inventoryCheck.types';

/** Chuyển balance tồn kho thành dòng kiểm kho khởi tạo */
const balanceToCheckDetail = (balance: InventoryBalance): InventoryCheckDetail => ({
  id: balance.id,
  sessionId: 'local',
  itemId: balance.itemId,
  itemName: balance.itemName ?? balance.itemId.slice(0, 8),
  unit: balance.unit ?? '',
  systemQuantity: balance.quantity,
  actualQuantity: null,
  deviationQuantity: null,
  deviationValue: null,
  costPerUnit: 0,
  note: undefined,
});

const formatDate = (date: Date) =>
  date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

/** Lọc tồn kho theo chi nhánh hiện tại và loại bỏ item trùng để tránh nhập lặp. */
const getBranchBalances = (
  balances: InventoryBalance[],
  branchId: string | null,
): InventoryBalance[] => {
  if (!branchId) {
    return [];
  }

  const seen = new Set<string>();
  return balances.filter((balance) => {
    if (balance.branchId !== branchId || seen.has(balance.itemId)) {
      return false;
    }

    seen.add(balance.itemId);
    return true;
  });
};

export const InventoryCheckManagement = () => {
  const currentBranchId = useAuthStore((state) => state.user?.branchId ?? null);
  const queryClient = useQueryClient();
  const { success, error } = useToast();
  const { mutateAsync: adjustStock } = useAdjustStock({
    showSuccessToast: false,
    showErrorToast: false,
  });

  // Tải tồn kho hiện tại của chi nhánh
  const { data: balanceResult, isLoading: isLoadingBalances, refetch: refetchBalances } = useInventoryBalances();
  // Trạng thái phiên kiểm kho FE-only
  const [isCheckActive, setIsCheckActive] = useState(false);
  const [localDetails, setLocalDetails] = useState<InventoryCheckDetail[]>([]);
  const [savingItemIds, setSavingItemIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Chỉ lấy tồn kho của chi nhánh hiện tại, loại bỏ duplicate itemId
  const branchBalances = useMemo<InventoryBalance[]>(
    () => getBranchBalances(balanceResult?.data ?? [], currentBranchId),
    [balanceResult?.data, currentBranchId],
  );

  /**
   * Đồng bộ snapshot tồn kho mới nhất cho chi nhánh hiện tại trước khi bắt đầu hoặc làm mới kiểm kho.
   */
  const loadLatestBranchBalances = useCallback(async () => {
    const latestResult = await refetchBalances();
    const latestBalances = latestResult.data?.data ?? balanceResult?.data ?? [];
    return getBranchBalances(latestBalances, currentBranchId);
  }, [balanceResult?.data, currentBranchId, refetchBalances]);

  // Bắt đầu phiên kiểm kho mới — snapshot tồn kho hiện tại
  const handleStartCheck = useCallback(async () => {
    if (!currentBranchId) {
      error('Chưa chọn chi nhánh', 'Vui lòng chọn chi nhánh trước khi thực hiện kiểm kho.');
      return;
    }

    const latestBalances = await loadLatestBranchBalances();
    const details = latestBalances.map(balanceToCheckDetail);
    setLocalDetails(details);
    setSavingItemIds(new Set());
    setIsCheckActive(true);
  }, [currentBranchId, error, loadLatestBranchBalances]);

  // Hủy phiên kiểm kho — xóa trạng thái FE
  const handleCancelCheck = useCallback(() => {
    setIsCheckActive(false);
    setLocalDetails([]);
    setSavingItemIds(new Set());
  }, []);

  // Làm mới tồn hệ thống cho các dòng chưa nhập số lượng thực tế
  const handleRefreshSystemQuantity = useCallback(async () => {
    const latestBalances = await loadLatestBranchBalances();

    setLocalDetails((prev) =>
      prev.map((detail) => {
        const freshBalance = latestBalances.find((balance) => balance.itemId === detail.itemId);
        if (!freshBalance || detail.actualQuantity !== null) {
          return detail;
        }

        return { ...detail, systemQuantity: freshBalance.quantity };
      }),
    );
  }, [loadLatestBranchBalances]);

  // Cập nhật số lượng thực tế cho một item — chỉ thay đổi local state
  const handleSaveDetail = useCallback((itemId: string, actualQuantity: number, note?: string) => {
    setSavingItemIds((prev) => new Set(prev).add(itemId));

    setLocalDetails((prev) =>
      prev.map((d) => {
        if (d.itemId !== itemId) return d;
        const deviationQuantity = actualQuantity - d.systemQuantity;
        const deviationValue = deviationQuantity * d.costPerUnit;
        return {
          ...d,
          actualQuantity,
          deviationQuantity,
          deviationValue,
          note: note ?? d.note,
        };
      }),
    );

    // Xóa saving state sau 1 frame (chỉ UI feedback, không gọi API)
    requestAnimationFrame(() => {
      setSavingItemIds((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    });
  }, []);

  // Xác nhận kiểm kho — gọi /inventory/adjust cho mỗi item có chênh lệch
  const handleSubmit = useCallback(async () => {
    // Kiểm tra tất cả đã nhập chưa
    const missing = localDetails.filter((d) => d.actualQuantity === null);
    if (missing.length > 0) {
      error('Chưa nhập đủ', `Còn ${missing.length} nguyên liệu chưa nhập số lượng thực tế.`);
      return;
    }

    // Kiểm tra item lệch >10% phải có ghi chú
    const needNote = localDetails.filter(
      (d) => isDeviationExceedThreshold(d) && !d.note?.trim(),
    );
    if (needNote.length > 0) {
      error(
        'Thiếu ghi chú',
        `${needNote.length} nguyên liệu lệch >${DEVIATION_THRESHOLD_PERCENT}% cần nhập ghi chú lý do.`,
      );
      return;
    }

    // Lấy các item thực sự thay đổi
    const changed = localDetails.filter(
      (d) => d.actualQuantity !== null && d.actualQuantity !== d.systemQuantity,
    );

    if (changed.length === 0) {
      success('Không có chênh lệch', 'Số lượng thực tế khớp với hệ thống. Không cần điều chỉnh.');
      handleCancelCheck();
      return;
    }

    setIsSubmitting(true);
    const today = formatDate(new Date());
    let successCount = 0;
    let failCount = 0;

    try {
      // Gọi tuần tự để tránh quá tải backend
      for (const detail of changed) {
        try {
          const reason = detail.note?.trim()
            ? `Kiểm kho ${today} — ${detail.note.trim()}`
            : `Kiểm kho ${today}`;

          await adjustStock({
            itemId: detail.itemId,
            newQuantity: detail.actualQuantity!,
            reason,
          });
          successCount++;
        } catch {
          failCount++;
        }
      }
    } finally {
      setIsSubmitting(false);
    }

    if (failCount === 0) {
      success(
        'Kiểm kho hoàn tất',
        `Đã điều chỉnh tồn kho cho ${successCount} nguyên liệu.`,
      );
      // Invalidate để cập nhật lại bảng tồn kho
      void queryClient.invalidateQueries({ queryKey: queryKeys.inventory.balances.all });
      handleCancelCheck();
    } else {
      error(
        'Một số điều chỉnh thất bại',
        `${successCount} thành công, ${failCount} thất bại. Kiểm tra kết nối và thử lại.`,
      );
    }
  }, [adjustStock, error, handleCancelCheck, localDetails, queryClient, success]);

  const allFilled = localDetails.length > 0 && localDetails.every((d) => d.actualQuantity !== null);
  const changedCount = localDetails.filter(
    (d) => d.actualQuantity !== null && d.actualQuantity !== d.systemQuantity,
  ).length;
  const handleStartCheckClick = useCallback(() => {
    void handleStartCheck();
  }, [handleStartCheck]);
  const handleRefreshClick = useCallback(() => {
    void handleRefreshSystemQuantity();
  }, [handleRefreshSystemQuantity]);
  const handleSubmitClick = useCallback(() => {
    void handleSubmit();
  }, [handleSubmit]);

  // ── Chưa bắt đầu kiểm ──
  if (!isCheckActive) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Kiểm kho</h2>
            <p className="mt-0.5 text-sm text-text-secondary">
              So sánh tồn kho thực tế với hệ thống và điều chỉnh chênh lệch.
            </p>
          </div>
          <Button
            type="button"
            onClick={handleStartCheckClick}
            disabled={isLoadingBalances || branchBalances.length === 0}
            className="gap-2"
          >
            <ClipboardCheck className="h-4 w-4" />
            Bắt đầu kiểm kho
          </Button>
        </div>

        {!currentBranchId && (
          <div className="rounded-card border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Vui lòng chọn chi nhánh trước khi thực hiện kiểm kho.
          </div>
        )}

        {currentBranchId && branchBalances.length === 0 && !isLoadingBalances && (
          <div className="rounded-card border border-dashed border-border bg-card px-6 py-12 text-center">
            <p className="text-base font-semibold text-text-primary">Chưa có tồn kho tại chi nhánh này</p>
            <p className="mt-2 text-sm text-text-secondary">
              Nhập kho nguyên liệu trước rồi quay lại kiểm kho.
            </p>
          </div>
        )}

        {isLoadingBalances && (
          <div className="flex h-48 items-center justify-center">
            <div className="spinner spinner-md" />
          </div>
        )}
      </div>
    );
  }

  // ── Đang kiểm kho ──
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">
            Đang kiểm kho — {localDetails.length} nguyên liệu
          </h2>
          <p className="mt-0.5 text-sm text-text-secondary">
            Nhập số lượng thực tế đếm được. Hệ thống sẽ điều chỉnh tồn kho sau khi xác nhận.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRefreshClick}
            disabled={isSubmitting}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            Làm mới
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancelCheck}
            disabled={isSubmitting}
          >
            Hủy kiểm
          </Button>
          <Button
            type="button"
            onClick={handleSubmitClick}
            disabled={!allFilled || isSubmitting}
            className="gap-2"
          >
            <ClipboardCheck className="h-4 w-4" />
            {isSubmitting
              ? 'Đang điều chỉnh...'
              : changedCount > 0
                ? `Xác nhận (${changedCount} thay đổi)`
                : 'Xác nhận kiểm kho'}
          </Button>
        </div>
      </div>

      {/* Bảng nhập thực tế */}
      <InventoryCheckDetailTable
        details={localDetails}
        isLoading={false}
        isSubmitting={isSubmitting}
        savingItemIds={savingItemIds}
        readOnly={false}
        onSaveDetail={handleSaveDetail}
      />
    </div>
  );
};
