import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';

describe('QA admin module', () => {
  test('giu dung contract cac phan admin SaaS', () => {
    assertModuleContract({
      moduleName: 'admin',
      expectedSubdirs: ['billing', 'components', 'constants', 'dashboard', 'layout', 'plans', 'tenants'],
      serviceFiles: [
        'billing/services/adminBillingService.ts',
        'dashboard/services/adminDashboardService.ts',
        'plans/services/adminPlanService.ts',
        'tenants/services/adminTenantService.ts',
      ],
      typeFiles: [
        'billing/types/adminBilling.types.ts',
        'dashboard/types/adminDashboard.types.ts',
        'plans/types/adminPlan.types.ts',
        'tenants/types/adminTenant.types.ts',
      ],
    });
  });
});
