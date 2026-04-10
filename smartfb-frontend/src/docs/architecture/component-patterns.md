# 🧩 SmartF&B Frontend — Component Patterns Reference
> Tài liệu tra cứu nhanh các pattern chuẩn cho component, form, dialog, table.
> AI đọc file này khi cần tạo component mới để sinh ra code đúng chuẩn ngay lần đầu.

---

## 📐 PATTERN 1: Trang danh sách chuẩn (List Page)

```tsx
// src/pages/owner/BranchesPage.tsx
import { useState } from 'react';
import { useDebounce } from '@shared/hooks/useDebounce';
import { usePermission } from '@shared/hooks/usePermission';
import { PageWrapper } from '@shared/components/layout/PageWrapper';
import { SearchBar } from '@shared/components/common/SearchBar';
import { DataTable } from '@shared/components/common/DataTable';
import { LoadingSpinner } from '@shared/components/common/LoadingSpinner';
import { ErrorState } from '@shared/components/common/ErrorState';
import { EmptyState } from '@shared/components/common/EmptyState';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { CreateBranchDialog } from '@modules/branch/components/CreateBranchDialog';
import { branchColumns } from '@modules/branch/components/branchColumns';
import { RoleGuard } from '@/routes/RoleGuard';
import { ROLES } from '@shared/constants/roles';

export default function BranchesPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, isError } = useBranches({ search: debouncedSearch });

  if (isLoading) return <LoadingSpinner />;
  if (isError)   return <ErrorState message="Không thể tải danh sách chi nhánh" />;

  return (
    <PageWrapper
      title="Quản lý chi nhánh"
      description="Danh sách các chi nhánh trong chuỗi"
    >
      <div className="flex items-center justify-between gap-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Tìm theo tên, mã chi nhánh..."
          className="max-w-sm"
        />
        <RoleGuard roles={[ROLES.OWNER]}>
          <CreateBranchDialog />
        </RoleGuard>
      </div>

      {!data?.items.length ? (
        <EmptyState
          message="Chưa có chi nhánh nào"
          description="Nhấn 'Thêm chi nhánh' để bắt đầu"
        />
      ) : (
        <DataTable
          data={data.items}
          columns={branchColumns}
          pagination={{
            total: data.total,
            page: data.page,
            limit: data.limit,
          }}
        />
      )}
    </PageWrapper>
  );
}
```

---

## 📐 PATTERN 2: Dialog tạo/sửa chuẩn (Create/Edit Dialog)

```tsx
// src/modules/branch/components/CreateBranchDialog.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger
} from '@shared/components/ui/dialog';
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@shared/components/ui/form';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import { useCreateBranch } from '../hooks/useCreateBranch';

// 1. Zod schema — validation
const branchSchema = z.object({
  name:    z.string().min(1, 'Tên chi nhánh không được để trống'),
  address: z.string().min(5, 'Địa chỉ quá ngắn'),
  phone:   z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ'),
});

type BranchFormValues = z.infer<typeof branchSchema>;

export const CreateBranchDialog = () => {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateBranch();

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: '', address: '', phone: '' },
  });

  const onSubmit = (values: BranchFormValues) => {
    mutate(values, {
      onSuccess: () => {
        setOpen(false);
        form.reset(); // Reset sau khi đóng dialog
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Thêm chi nhánh</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm chi nhánh mới</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên chi nhánh</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Chi nhánh Quận 1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số điện thoại</FormLabel>
                  <FormControl>
                    <Input placeholder="0901234567" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
```

---

## 📐 PATTERN 3: Dialog tạo + sửa dùng chung (Unified Create/Edit)

```tsx
// Khi cùng 1 form dùng cho cả tạo mới lẫn chỉnh sửa
interface BranchDialogProps {
  editItem?: Branch;        // undefined = tạo mới; có giá trị = chỉnh sửa
  trigger?: React.ReactNode; // Custom trigger button
}

export const BranchDialog = ({ editItem, trigger }: BranchDialogProps) => {
  const [open, setOpen] = useState(false);
  const isEdit = !!editItem;

  const { mutate: create, isPending: isCreating } = useCreateBranch();
  const { mutate: update, isPending: isUpdating } = useUpdateBranch();
  const isPending = isCreating || isUpdating;

  const form = useForm<BranchFormValues>({
    resolver: zodResolver(branchSchema),
    // Pre-fill khi chỉnh sửa
    values: editItem
      ? { name: editItem.name, address: editItem.address, phone: editItem.phone }
      : { name: '', address: '', phone: '' },
  });

  const onSubmit = (values: BranchFormValues) => {
    if (isEdit) {
      update({ id: editItem.id, ...values }, { onSuccess: () => setOpen(false) });
    } else {
      create(values, { onSuccess: () => { setOpen(false); form.reset(); } });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button>{isEdit ? 'Chỉnh sửa' : 'Thêm mới'}</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? `Chỉnh sửa: ${editItem.name}` : 'Thêm chi nhánh mới'}
          </DialogTitle>
        </DialogHeader>
        {/* Form content */}
      </DialogContent>
    </Dialog>
  );
};
```

---

## 📐 PATTERN 4: Confirm Dialog trước khi xóa/vô hiệu hóa

```tsx
import { ConfirmDialog } from '@shared/components/common/ConfirmDialog';

// Dùng trong Table action column:
const [deleteId, setDeleteId] = useState<string | null>(null);
const { mutate: toggle } = useToggleBranch();

<>
  <Button
    variant="ghost"
    size="sm"
    onClick={() => setDeleteId(branch.id)}
  >
    Vô hiệu hóa
  </Button>

  <ConfirmDialog
    open={!!deleteId}
    onOpenChange={() => setDeleteId(null)}
    title="Vô hiệu hóa chi nhánh?"
    description="Chi nhánh sẽ không thể nhận đơn mới. Dữ liệu lịch sử vẫn được giữ nguyên."
    confirmLabel="Vô hiệu hóa"
    confirmVariant="destructive"
    onConfirm={() => {
      if (deleteId) toggle(deleteId, { onSuccess: () => setDeleteId(null) });
    }}
  />
</>
```

---

## 📐 PATTERN 5: DataTable với columns definition

```tsx
// src/modules/branch/components/branchColumns.tsx
import type { ColumnDef } from '@tanstack/react-table';
import { StatusBadge } from '@shared/components/common/StatusBadge';
import { Button } from '@shared/components/ui/button';
import type { Branch } from '../types/branch.types';

// Columns tách ra file riêng — không đặt trong Page
export const branchColumns: ColumnDef<Branch>[] = [
  {
    accessorKey: 'name',
    header: 'Tên chi nhánh',
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        <p className="text-sm text-muted-foreground">{row.original.code}</p>
      </div>
    ),
  },
  {
    accessorKey: 'phone',
    header: 'Số điện thoại',
  },
  {
    accessorKey: 'status',
    header: 'Trạng thái',
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.status}
        map={{
          active:   { label: 'Hoạt động', variant: 'default' },
          inactive: { label: 'Ngừng',     variant: 'secondary' },
        }}
      />
    ),
  },
  {
    id: 'actions',
    header: () => <div className="text-right">Thao tác</div>,
    cell: ({ row }) => <BranchActionsCell branch={row.original} />, // Tách component riêng
  },
];
```

---

## 📐 PATTERN 6: StatusBadge chuẩn

```tsx
// src/shared/components/common/StatusBadge.tsx
import { Badge, type BadgeProps } from '@shared/components/ui/badge';

interface StatusMap {
  label: string;
  variant: BadgeProps['variant'];
}

interface StatusBadgeProps {
  status: string;
  map: Record<string, StatusMap>;
  className?: string;
}

export const StatusBadge = ({ status, map, className }: StatusBadgeProps) => {
  const config = map[status] ?? { label: status, variant: 'outline' as const };
  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};

// Dùng:
<StatusBadge
  status={order.status}
  map={{
    pending:    { label: 'Chờ xử lý',   variant: 'outline' },
    processing: { label: 'Đang làm',    variant: 'default' },
    completed:  { label: 'Hoàn tất',    variant: 'secondary' },
    cancelled:  { label: 'Đã hủy',      variant: 'destructive' },
  }}
/>
```

---

## 📐 PATTERN 7: Skeleton Loading cho Table

```tsx
// Dùng Skeleton thay vì spinner cho list — UX tốt hơn
import { Skeleton } from '@shared/components/ui/skeleton';

const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full rounded-md" />
    ))}
  </div>
);

// Trong Page:
if (isLoading) return <TableSkeleton rows={5} />;
```

---

## 📐 PATTERN 8: Search với Debounce

```tsx
import { useState } from 'react';
import { useDebounce } from '@shared/hooks/useDebounce';
import { Input } from '@shared/components/ui/input';
import { Search } from 'lucide-react';

// Trong Page component:
const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 300); // Delay 300ms

// Chỉ pass debouncedSearch vào query hook:
const { data } = useBranches({ search: debouncedSearch });

// UI:
<div className="relative max-w-sm">
  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
  <Input
    value={search}
    onChange={e => setSearch(e.target.value)}
    placeholder="Tìm kiếm..."
    className="pl-9"
  />
</div>
```

---

## 📐 PATTERN 9: Image Upload với Preview

```tsx
import { useState, useRef } from 'react';
import { cn } from '@shared/utils/cn';

interface ImageUploadProps {
  value?: string;           // URL ảnh hiện tại
  onChange: (file: File) => void;
  className?: string;
}

export const ImageUpload = ({ value, onChange, className }: ImageUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(value ?? null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: chỉ JPG/PNG/WEBP, tối đa 2MB
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: 'Chỉ chấp nhận JPG, PNG, WEBP', variant: 'destructive' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Ảnh tối đa 2MB', variant: 'destructive' });
      return;
    }

    setPreview(URL.createObjectURL(file));
    onChange(file);
  };

  return (
    <div
      className={cn('cursor-pointer rounded-lg border-2 border-dashed p-4', className)}
      onClick={() => inputRef.current?.click()}
    >
      {preview ? (
        <img src={preview} alt="Preview" className="h-32 w-full object-cover rounded" />
      ) : (
        <div className="flex flex-col items-center text-muted-foreground">
          <span>Nhấn để chọn ảnh</span>
          <span className="text-xs">JPG, PNG, WEBP • Tối đa 2MB</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
};
```

---

## 📐 PATTERN 10: POS-specific — CartItem với Stepper

```tsx
// Đặc thù POS: thao tác nhanh, không confirm dialog cho tăng/giảm qty
interface CartItemRowProps {
  item: CartItem;
  onQtyChange: (menuItemId: string, qty: number) => void;
  onRemove: (menuItemId: string) => void;
}

export const CartItemRow = ({ item, onQtyChange, onRemove }: CartItemRowProps) => (
  <div className="flex items-center gap-3 py-2">
    <div className="flex-1 min-w-0">
      <p className="font-medium truncate">{item.name}</p>
      {item.notes && (
        <p className="text-xs text-muted-foreground truncate">{item.notes}</p>
      )}
    </div>

    {/* Qty stepper — không mở dialog, update ngay */}
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={() => {
          if (item.quantity === 1) onRemove(item.menuItemId);
          else onQtyChange(item.menuItemId, item.quantity - 1);
        }}
      >
        <Minus className="h-3 w-3" />
      </Button>
      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
      <Button
        variant="outline"
        size="icon"
        className="h-7 w-7"
        onClick={() => onQtyChange(item.menuItemId, item.quantity + 1)}
      >
        <Plus className="h-3 w-3" />
      </Button>
    </div>

    <p className="text-sm font-medium w-20 text-right">
      {formatVND(item.unitPrice * item.quantity)}
    </p>
  </div>
);
```

---

## 📐 PATTERN 11: Realtime Socket.io Hook

```typescript
// src/modules/order/hooks/useOrderRealtime.ts
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket } from '@lib/socket';
import { QUERY_KEYS } from '@shared/constants/queryKeys';

/**
 * Subscribe realtime order updates cho 1 chi nhánh.
 * Invalidate TanStack Query cache khi có thay đổi thay vì update state thủ công.
 */
export const useOrderRealtime = (branchId: string) => {
  const qc = useQueryClient();

  useEffect(() => {
    if (!branchId) return;
    const socket = getSocket();

    socket.emit('join-branch', branchId);

    socket.on('order:created', () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orders.list({ branchId }) });
    });

    socket.on('order:status-changed', (payload: { orderId: string }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orders.detail(payload.orderId) });
      qc.invalidateQueries({ queryKey: QUERY_KEYS.orders.list({ branchId }) });
    });

    socket.on('table:status-changed', () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.tables.all });
    });

    return () => {
      socket.off('order:created');
      socket.off('order:status-changed');
      socket.off('table:status-changed');
      socket.emit('leave-branch', branchId);
    };
  }, [branchId, qc]);
};
```

---

## 📐 PATTERN 12: Multi-select với Checkboxes (Branch Selector)

```tsx
// Dùng cho form nhân viên: chọn chi nhánh làm việc (có thể chọn nhiều)
import { Checkbox } from '@shared/components/ui/checkbox';
import { FormField, FormItem, FormLabel } from '@shared/components/ui/form';

// Trong StaffForm:
<FormField
  control={form.control}
  name="branchIds"
  render={() => (
    <FormItem>
      <FormLabel>Chi nhánh làm việc</FormLabel>
      <div className="space-y-2">
        {branches.map(branch => (
          <FormField
            key={branch.id}
            control={form.control}
            name="branchIds"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value?.includes(branch.id)}
                    onCheckedChange={checked => {
                      const current = field.value ?? [];
                      field.onChange(
                        checked
                          ? [...current, branch.id]
                          : current.filter(id => id !== branch.id)
                      );
                    }}
                  />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer">
                  {branch.name}
                </FormLabel>
              </FormItem>
            )}
          />
        ))}
      </div>
    </FormItem>
  )}
/>
```
