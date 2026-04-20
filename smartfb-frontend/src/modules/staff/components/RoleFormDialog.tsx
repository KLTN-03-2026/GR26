import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useCreateRole } from '@modules/staff/hooks/useCreateRole';
import { roleSchema, type RoleFormValues } from '@modules/staff/schemas/roleSchema';
import { Button } from '@shared/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@shared/components/ui/dialog';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Textarea } from '@shared/components/ui/textarea';

interface RoleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (roleId: string) => void;
}

/**
 * Dialog tạo role mới để owner cấu hình permission.
 */
export const RoleFormDialog = ({
  open,
  onOpenChange,
  onCreated,
}: RoleFormDialogProps) => {
  const { mutate: createRole, isPending } = useCreateRole();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen);

    if (!nextOpen) {
      reset();
    }
  };

  const handleFormSubmit = (values: RoleFormValues) => {
    createRole(
      {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
      },
      {
        onSuccess: (roleId) => {
          onCreated?.(roleId);
          handleClose(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Tạo vai trò mới</DialogTitle>
          <DialogDescription>
            Vai trò là lớp trung gian mà backend dùng để gán quyền rồi mới gán cho nhân viên.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="role-name">Tên vai trò</Label>
            <Input id="role-name" placeholder="Ví dụ: CASHIER, BARISTA, SHIFT_LEAD" {...register('name')} />
            {errors.name ? <p className="text-xs text-red-500">{errors.name.message}</p> : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="role-description">Mô tả</Label>
            <Textarea
              id="role-description"
              rows={4}
              placeholder="Mô tả ngắn phạm vi trách nhiệm của vai trò này"
              {...register('description')}
            />
            {errors.description ? (
              <p className="text-xs text-red-500">{errors.description.message}</p>
            ) : null}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => handleClose(false)}>
              Hủy
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang tạo...' : 'Tạo vai trò'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
