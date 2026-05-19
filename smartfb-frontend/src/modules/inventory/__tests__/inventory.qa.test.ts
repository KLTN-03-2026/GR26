import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';

describe('QA inventory module', () => {
  test('giu dung contract kho', () => {
    assertModuleContract({
      moduleName: 'inventory',
      expectedSubdirs: ['components', 'hooks', 'services', 'types'],
      serviceFiles: ['services/inventoryService.ts'],
      typeFiles: ['types/inventory.types.ts', 'types/inventoryCheck.types.ts'],
    });
  });
});
