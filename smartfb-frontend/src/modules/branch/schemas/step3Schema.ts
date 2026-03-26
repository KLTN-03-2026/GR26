import { z } from 'zod';

/**
 * Zod schema validation cho Step 3: Xác nhận
 */
export const step3Schema = z.object({
  tableSetupOption: z.enum(['copy-from-branch', 'use-template', 'setup-later']),
  copyTableFromBranchId: z.string().optional(),
  menuSetupOption: z.enum(['copy-menu', 'import-excel', 'empty-menu']),
  copyMenuFromBranchId: z.string().optional(),
  importMenuFile: z.any().optional(),
}).refine(
  (data) => {
    if (data.tableSetupOption === 'copy-from-branch' && !data.copyTableFromBranchId) {
      return false;
    }
    return true;
  },
  {
    message: 'Vui lòng chọn chi nhánh để sao chép bàn',
    path: ['copyTableFromBranchId'],
  }
).refine(
  (data) => {
    if (data.menuSetupOption === 'copy-menu' && !data.copyMenuFromBranchId) {
      return false;
    }
    return true;
  },
  {
    message: 'Vui lòng chọn chi nhánh để sao chép menu',
    path: ['copyMenuFromBranchId'],
  }
);

export type Step3FormValues = z.infer<typeof step3Schema>;
