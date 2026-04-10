export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  status?: 'active' | 'inactive';
}

/**
 * Mock branches dùng cho branch selector (combobox) ở Header
 */
export const mockBranches: Branch[] = [
  {
    id: 'branch-1',
    name: 'Chi nhánh Quận 1',
    address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
    phone: '0901234567',
    status: 'active',
  },
  {
    id: 'branch-2',
    name: 'Chi nhánh Quận 3',
    address: '456 Võ Văn Tần, Quận 3, TP.HCM',
    phone: '0901234568',
    status: 'active',
  },
  {
    id: 'branch-3',
    name: 'Chi nhánh Bình Thạnh',
    address: '789 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    phone: '0901234569',
    status: 'active',
  },
];
