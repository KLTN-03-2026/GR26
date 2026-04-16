/**
 * @author Đào Thu Thiên
 * @description Dialog tạo phiếu kiểm kho mới
 * @created 2026-04-16
 */

import { useState } from 'react';
import { ClipboardList, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@shared/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@shared/components/ui/form';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@shared/components/ui/select';
import { Button } from '@shared/components/ui/button';
import { useCreateInventoryCheck } from '../../hooks/useCreateInventoryCheck';

const createCheckSchema = z.object({
    branchId: z.string().min(1, 'Vui lòng chọn chi nhánh'),
});

type CreateCheckFormValues = z.infer<typeof createCheckSchema>;

interface CreateInventoryCheckDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onSuccess?: () => void;
    trigger?: React.ReactNode;
    branchOptions: Array<{ id: string; name: string }>;
    defaultBranchId?: string;
}

export const CreateInventoryCheckDialog = ({
    open: controlledOpen,
    onOpenChange,
    onSuccess,
    trigger,
    branchOptions,
    defaultBranchId,
}: CreateInventoryCheckDialogProps) => {
    const [internalOpen, setInternalOpen] = useState(false);
    const { mutate: createCheck, isPending } = useCreateInventoryCheck();

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const form = useForm<CreateCheckFormValues>({
        resolver: zodResolver(createCheckSchema),
        defaultValues: {
            branchId: defaultBranchId ?? '',
        },
    });

    const handleOpenChange = (next: boolean) => {
        if (!next) {
            setTimeout(() => form.reset(), 300);
        }
        if (isControlled) {
            onOpenChange?.(next);
        } else {
            setInternalOpen(next);
        }
    };

    const handleSubmit = (values: CreateCheckFormValues) => {
        createCheck(
            { branchId: values.branchId },
            {
                onSuccess: () => {
                    handleOpenChange(false);
                    form.reset();
                    onSuccess?.();
                },
            }
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {!isControlled && (
                <DialogTrigger asChild>
                    {trigger ?? (
                        <Button type="button" variant="outline" className="gap-2">
                            <Plus className="h-4 w-4" />
                            Tạo phiếu kiểm kho
                        </Button>
                    )}
                </DialogTrigger>
            )}

            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ClipboardList className="h-5 w-5 text-primary" />
                        Tạo phiếu kiểm kho mới
                    </DialogTitle>
                    <DialogDescription>
                        Tạo phiếu kiểm kho để bắt đầu quá trình kiểm kê. Hệ thống sẽ tự động chốt số lượng tồn kho hiện tại.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-2">
                        <FormField
                            control={form.control}
                            name="branchId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Chi nhánh kiểm kho *</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Chọn chi nhánh" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {branchOptions.map((branch) => (
                                                <SelectItem key={branch.id} value={branch.id}>
                                                    {branch.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isPending}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? 'Đang tạo...' : 'Tạo phiếu kiểm kho'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};