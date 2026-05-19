import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';

describe('QA expense module', () => {
  test('giu dung contract thu chi', () => {
    assertModuleContract({
      moduleName: 'expense',
      expectedSubdirs: ['components', 'hooks', 'services', 'types'],
      serviceFiles: ['services/expenseService.ts'],
      typeFiles: ['types/expense.types.ts'],
    });
  });
});
