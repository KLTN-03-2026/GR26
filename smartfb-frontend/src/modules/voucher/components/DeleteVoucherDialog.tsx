/**
 * @author Đào Thu Thiên
 * @description Dialog xác nhận xóa voucher
 * @created 2026-04-16
 */

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@shared/components/ui/dialog';
import { Button } from '@shared/components/ui/button';
import { useDeleteVoucher } from '../hooks/useDeleteVoucher';

interface DeleteVoucherDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    voucherId: string;
    voucherCode: string;
    onSuccess?: () => void;
}

export const DeleteVoucherDialog = ({
    open,
    onOpenChange,
    voucherId,
    voucherCode,
    onSuccess,
}: DeleteVoucherDialogProps) => {
    const { mutate, isPending } = useDeleteVoucher();

    const handleDelete = () => {
        mutate(voucherId, {
            onSuccess: (response) => {
                if (response.success) {
                    onOpenChange(false);
                    onSuccess?.();
                }
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-gray-900">
                        Xóa voucher
                    </DialogTitle>
                    <DialogDescription>
                        Bạn có chắc chắn muốn xóa voucher <span className="font-semibold">{voucherCode}</span>?
                        <br />
                        Hành động này không thể hoàn tác.
                    </DialogDescription>
                </DialogHeader>

                <DialogFooter className="border-t pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                        Huỷ
                    </Button>
                    <Button
                        onClick={handleDelete}
                        disabled={isPending}
                        className="bg-red-500 hover:bg-red-600"
                    >
                        {isPending ? 'Đang xóa...' : 'Xóa voucher'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};