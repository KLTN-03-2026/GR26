import type { BranchDetail } from '../data/branchDetails';

export type BranchStatus = 'active' | 'inactive';

export type BranchFilters = {
  search: string;
  status: BranchStatus | 'all';
  location: string | 'all';
};

export type BranchListItem = BranchDetail & {
  revenueDisplay: string;
};

export type PaginationState = {
  page: number;
  pageSize: number;
  total: number;
};

// Activity log types
export type ActivityActionType = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'activate' 
  | 'deactivate';

export type ActivityLog = {
  id: string;
  userId: string;
  userName: string;
  action: ActivityActionType;
  branchId?: string;
  branchName?: string;
  timestamp: string;
  description: string;
};

// Form wizard types
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type WorkingHours = {
  enabled: boolean;
  openTime: string;
  closeTime: string;
};

export type WorkingSchedule = {
  [key in DayOfWeek]: WorkingHours;
};

export type IntegrationPlatform = 'grabfood' | 'shopeefood';

export type IntegrationSettings = {
  [key in IntegrationPlatform]: boolean;
};

export type TableSetupOption = 'copy-from-branch' | 'use-template' | 'setup-later';
export type MenuSetupOption = 'copy-menu' | 'import-excel' | 'empty-menu';

// Step 1: Thông tin cơ bản
export type Step1BasicInfoData = {
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  managerId: string;
  taxCode: string;
  notes: string;
  image?: File | null;
};

// Step 2: Vận hành
export type Step2OperationsData = {
  workingSchedule: WorkingSchedule;
  integrations: IntegrationSettings;
};

// Step 3: Xác nhận
export type Step3ConfirmationData = {
  tableSetupOption: TableSetupOption;
  copyTableFromBranchId?: string;
  menuSetupOption: MenuSetupOption;
  copyMenuFromBranchId?: string;
  importMenuFile?: File | null;
};

// Combined form data
export type CreateBranchFormData = Step1BasicInfoData & Step2OperationsData & Step3ConfirmationData;

// Form values type (all fields optional for partial form updates)
export type CreateBranchFormValues = Partial<CreateBranchFormData>;
