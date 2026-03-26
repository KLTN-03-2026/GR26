# 🤖 GitHub Copilot — Project Rules & Conventions
## SmartF&B Frontend

> **Đây là file hướng dẫn bắt buộc cho GitHub Copilot.**
> Copilot phải đọc và tuân theo TOÀN BỘ các quy tắc trong file này trước khi sinh code.
> Không được đề xuất code vi phạm bất kỳ quy tắc nào dưới đây.

---

## 🧱 Tech Stack (bắt buộc dùng, không thay thế)

```
React 18 + TypeScript (strict mode)
Vite
React Router DOM v6
shadcn/ui + Tailwind CSS
Zustand           → global UI/auth state
TanStack Query    → server state, caching, fetching
React Hook Form   → form state
Zod               → schema validation
Axios             → HTTP client
Socket.io client  → realtime
Lucide React      → icons
```

---

## 📁 Quy tắc tổ chức thư mục

### 1. Không được tạo file ở sai vị trí

| Loại file | Đặt ở đâu |
|-----------|-----------|
| Page component | `src/pages/[role]/TênPage.tsx` |
| Module component | `src/modules/[module]/components/` |
| Shared component | `src/shared/components/common/` |
| shadcn component | `src/shared/components/ui/` — KHÔNG sửa |
| Custom hook | `src/modules/[module]/hooks/` hoặc `src/shared/hooks/` |
| API service | `src/modules/[module]/services/` |
| Zustand store | `src/modules/[module]/stores/` |
| TypeScript types | `src/modules/[module]/types/` |
| Shared types | `src/shared/types/` |
| Constants | `src/shared/constants/` |
| Utilities | `src/shared/utils/` |

### 2. Quy tắc đặt tên file

```
Component:     PascalCase.tsx          → BranchCard.tsx
Hook:          camelCase.ts            → useBranches.ts
Service:       camelCase.ts            → branchService.ts
Store:         camelCase.ts            → authStore.ts
Types:         camelCase.types.ts      → branch.types.ts
Constants:     camelCase.ts            → queryKeys.ts
Utils:         camelCase.ts            → formatCurrency.ts
Page:          PascalCase + "Page.tsx" → BranchesPage.tsx
```

### 3. Quy tắc import — LUÔN dùng path alias

```typescript
// ✅ ĐÚNG — dùng alias
import { Button } from '@shared/components/ui/button';
import { useBranches } from '@modules/branch/hooks/useBranches';
import { ROUTES } from '@shared/constants/routes';

// ❌ SAI — relative path dài
import { Button } from '../../../shared/components/ui/button';
```

### 4. Không import chéo giữa modules

```typescript
// ❌ SAI — module order không được import từ module staff
// src/modules/order/hooks/useOrder.ts
import { useStaff } from '@modules/staff/hooks/useStaff'; // KHÔNG

// ✅ ĐÚNG — nếu cần shared data, dùng shared/ hoặc truyền qua props
```

---

## 📝 Quy tắc viết code TypeScript

### 1. Luôn khai báo kiểu — không dùng `any`

```typescript
// ❌ SAI
const handleData = (data: any) => { ... }

// ✅ ĐÚNG
const handleData = (data: Branch) => { ... }
```

### 2. Interface cho props component

```typescript
// ✅ ĐÚNG — luôn khai báo interface Props
interface BranchCardProps {
  branch: Branch;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export const BranchCard = ({ branch, onEdit, onDelete, isLoading = false }: BranchCardProps) => {
  // ...
};
```

### 3. Export named, không dùng default export cho component

```typescript
// ❌ SAI
export default function BranchCard() { ... }

// ✅ ĐÚNG
export const BranchCard = () => { ... }

// Ngoại lệ duy nhất: Page components (React Router lazy load)
export default BranchesPage;
```

### 4. Zod schema đi kèm form

```typescript
// ✅ Mỗi form có schema Zod riêng trong cùng file hoặc types/
const branchSchema = z.object({
  name: z.string().min(1, 'Tên chi nhánh không được để trống'),
  phone: z.string().regex(/^0\d{9}$/, 'Số điện thoại không hợp lệ'),
  address: z.string().min(5, 'Địa chỉ quá ngắn'),
});

type BranchFormValues = z.infer<typeof branchSchema>;
```

### 5. Enum và constants — không hardcode string

```typescript
// ❌ SAI
if (user.role === 'owner') { ... }

// ✅ ĐÚNG
import { ROLES } from '@shared/constants/roles';
if (user.role === ROLES.OWNER) { ... }
```

---

## 🎨 Quy tắc viết Component

### 1. Cấu trúc chuẩn của một component

```tsx
// src/modules/branch/components/BranchCard.tsx

import { type FC } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@shared/components/ui/button';
import { StatusBadge } from '@shared/components/common/StatusBadge';
import { cn } from '@shared/utils/cn';
import type { Branch } from '../types/branch.types';

// 1. Interface props — luôn đặt trước component
interface BranchCardProps {
  branch: Branch;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// 2. Component — named export
export const BranchCard: FC<BranchCardProps> = ({ branch, onEdit, onDelete }) => {
  // 3. Hooks đầu tiên
  // 4. Derived state / computed values
  // 5. Event handlers
  const handleDelete = () => {
    onDelete(branch.id);
  };

  // 6. Return JSX
  return (
    <div className={cn('rounded-lg border p-4', branch.status === 'inactive' && 'opacity-50')}>
      <h3 className="font-semibold">{branch.name}</h3>
      <StatusBadge status={branch.status} />
      <div className="mt-2 flex gap-2">
        <Button variant="ghost" size="sm" onClick={() => onEdit(branch.id)}>
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={handleDelete}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
```

### 2. Dùng `cn()` để merge Tailwind class

```typescript
// ✅ ĐÚNG
import { cn } from '@shared/utils/cn';
<div className={cn('base-class', isActive && 'active-class', className)} />

// ❌ SAI
<div className={`base-class ${isActive ? 'active-class' : ''}`} />
```

### 3. Không viết logic trong JSX — tách ra biến

```tsx
// ❌ SAI — logic phức tạp trong JSX
return (
  <div>
    {branches.filter(b => b.status === 'active').sort((a, b) => a.name.localeCompare(b.name)).map(...)}
  </div>
);

// ✅ ĐÚNG — tách ra biến
const activeBranches = branches
  .filter(b => b.status === 'active')
  .sort((a, b) => a.name.localeCompare(b.name));

return (
  <div>
    {activeBranches.map(...)}
  </div>
);
```

---

## 🔄 Quy tắc Data Fetching (TanStack Query)

### 1. Pattern chuẩn cho query hook

```typescript
// src/modules/branch/hooks/useBranches.ts

import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants/queryKeys';
import { branchService } from '../services/branchService';
import type { BranchListParams } from '../types/branch.types';

/**
 * Lấy danh sách chi nhánh với filter và pagination.
 * Tự động refetch khi params thay đổi.
 */
export const useBranches = (params?: BranchListParams) => {
  return useQuery({
    queryKey: QUERY_KEYS.branches.list(params),
    queryFn: () => branchService.getList(params),
    staleTime: 5 * 60 * 1000, // 5 phút
  });
};
```

### 2. Pattern chuẩn cho mutation hook

```typescript
// src/modules/branch/hooks/useCreateBranch.ts

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@shared/constants/queryKeys';
import { branchService } from '../services/branchService';
import { useToast } from '@shared/hooks/useToast';
import type { CreateBranchPayload } from '../types/branch.types';

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (payload: CreateBranchPayload) => branchService.create(payload),
    onSuccess: () => {
      // Invalidate để refetch danh sách
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.branches.all });
      toast({ title: 'Tạo chi nhánh thành công', variant: 'success' });
    },
    onError: (error) => {
      toast({ title: 'Có lỗi xảy ra', description: error.message, variant: 'destructive' });
    },
  });
};
```

### 3. Service chỉ gọi API — không có logic

```typescript
// src/modules/branch/services/branchService.ts

import { api } from '@lib/axios';
import type { Branch, CreateBranchPayload, BranchListParams } from '../types/branch.types';
import type { ApiResponse, PaginatedResult } from '@shared/types/api.types';

export const branchService = {
  getList: (params?: BranchListParams) =>
    api.get<PaginatedResult<Branch>>('/branches', { params }).then(r => r.data),

  getById: (id: string) =>
    api.get<ApiResponse<Branch>>(`/branches/${id}`).then(r => r.data),

  create: (payload: CreateBranchPayload) =>
    api.post<ApiResponse<Branch>>('/branches', payload).then(r => r.data),

  update: (id: string, payload: Partial<CreateBranchPayload>) =>
    api.put<ApiResponse<Branch>>(`/branches/${id}`, payload).then(r => r.data),

  toggle: (id: string) =>
    api.put<ApiResponse<Branch>>(`/branches/${id}/toggle`).then(r => r.data),
};
```

---

## 💬 Quy tắc Comments

### 1. Comment bằng tiếng Việt cho business logic

```typescript
// ✅ ĐÚNG — giải thích nghiệp vụ bằng tiếng Việt
// Nhân viên chỉ thấy chi nhánh được phân công, owner thấy tất cả
const visibleBranches = isOwner ? allBranches : assignedBranches;
```

### 2. JSDoc cho function/hook public

```typescript
/**
 * Hook kiểm tra quyền hạn của người dùng hiện tại.
 * Dùng để ẩn/hiện UI theo role và permission.
 *
 * @example
 * const { isOwner, can } = usePermission();
 * if (can('delete', 'staff')) { ... }
 */
export const usePermission = () => { ... };
```

### 3. Không comment những thứ hiển nhiên

```typescript
// ❌ SAI — comment thừa
// Tăng count lên 1
setCount(count + 1);

// ✅ ĐÚNG — chỉ comment khi cần giải thích WHY
// Delay 300ms để animation đóng dialog hoàn tất trước khi reset form
setTimeout(() => form.reset(), 300);
```

### 4. TODO phải có tên và issue

```typescript
// ✅ ĐÚNG
// TODO(@hoang): Thêm real-time update khi tồn kho thay đổi — #issue-42

// ❌ SAI
// TODO: fix later
```

---

## 🗺️ Quy tắc quản lý Plan (bắt buộc)

> **Mỗi feature hoặc task đều phải có file plan tương ứng trong `src/docs/plans/`**

### Vòng đời của một plan

```
1. Bắt đầu làm task
   → Tạo file: src/docs/plans/[tên-task].md
   → Status: 🔄 IN PROGRESS

2. Đang làm, cập nhật tiến độ
   → Update checklist trong file plan
   → Ghi chú vấn đề gặp phải nếu có

3. Hoàn thành task
   → Update status: ✅ DONE
   → Ghi ngày hoàn thành
```

### Template file plan

```markdown
# Plan: [Tên tính năng]

**Status:** 🔄 IN PROGRESS | ✅ DONE | ⏸️ BLOCKED
**Ngày bắt đầu:** DD/MM/YYYY
**Ngày hoàn thành:** DD/MM/YYYY (điền khi xong)
**Assignee:** @tên

## Mô tả
[Mô tả ngắn gọn feature/task này làm gì]

## Files sẽ tạo/sửa
- [ ] `src/modules/branch/components/BranchForm.tsx` — tạo mới
- [ ] `src/modules/branch/hooks/useCreateBranch.ts` — tạo mới
- [ ] `src/pages/owner/BranchesPage.tsx` — sửa thêm nút tạo mới

## Checklist
- [ ] Tạo types
- [ ] Tạo service
- [ ] Tạo mutation hook
- [ ] Tạo form component
- [ ] Integrate vào page
- [ ] Test thủ công
- [ ] Xử lý error states
- [ ] Xử lý loading states

## Ghi chú / Vấn đề
- [ghi chú nếu có]
```

---

## ⚠️ Những điều KHÔNG được làm

```typescript
// ❌ 1. Không dùng any
const data: any = fetchData();

// ❌ 2. Không gọi API trực tiếp trong component
const MyComponent = () => {
  useEffect(() => {
    axios.get('/api/branches'); // KHÔNG — dùng service + hook
  }, []);
};

// ❌ 3. Không dùng index làm key khi list có thể thay đổi thứ tự
branches.map((b, index) => <BranchCard key={index} />); // KHÔNG
branches.map((b) => <BranchCard key={b.id} />);         // ĐÚNG

// ❌ 4. Không sửa file trong shared/components/ui/ (shadcn generated)

// ❌ 5. Không hardcode URL API
fetch('http://localhost:8080/api/branches'); // KHÔNG — dùng axios instance

// ❌ 6. Không đặt business logic trong JSX render

// ❌ 7. Không dùng relative import dài hơn 2 cấp
import x from '../../../something'; // KHÔNG — dùng alias @/
```

---

## ✅ Checklist trước khi commit code

```
□ Không có lỗi TypeScript (tsc --noEmit)
□ Không có lỗi ESLint
□ Đặt file đúng vị trí theo cấu trúc thư mục
□ Dùng path alias thay vì relative path dài
□ Tất cả props có type khai báo
□ Loading state và error state được xử lý
□ Không có console.log để debug
□ Cập nhật file plan tương ứng trong src/docs/plans/
```

---

## 📋 Quick Reference — Patterns hay dùng

### Trang danh sách chuẩn

```tsx
// Pattern cho một trang danh sách
export default function BranchesPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { data, isLoading, isError } = useBranches({ search: debouncedSearch });
  const { isOwner } = usePermission();

  if (isLoading) return <LoadingSpinner />;
  if (isError) return <ErrorState />;

  return (
    <PageWrapper title="Quản lý chi nhánh">
      <div className="flex items-center justify-between">
        <SearchBar value={search} onChange={setSearch} />
        {isOwner && <CreateBranchDialog />}
      </div>
      <DataTable data={data?.items ?? []} columns={branchColumns} />
    </PageWrapper>
  );
}
```

### Dialog tạo/sửa chuẩn

```tsx
// Pattern cho dialog form
export const CreateBranchDialog = () => {
  const [open, setOpen] = useState(false);
  const { mutate, isPending } = useCreateBranch();
  const form = useForm<BranchFormValues>({ resolver: zodResolver(branchSchema) });

  const onSubmit = (values: BranchFormValues) => {
    mutate(values, { onSuccess: () => setOpen(false) });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Thêm chi nhánh</Button>
      </DialogTrigger>
      <DialogContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* form fields */}
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang lưu...' : 'Lưu'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
```
