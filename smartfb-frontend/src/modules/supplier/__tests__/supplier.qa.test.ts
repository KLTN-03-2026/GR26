import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';

describe('QA supplier module', () => {
  test('giu dung contract nha cung cap', () => {
    assertModuleContract({
      moduleName: 'supplier',
      expectedSubdirs: ['components', 'hooks', 'services', 'types'],
      serviceFiles: ['services/supplierService.ts'],
      typeFiles: ['types/supplier.types.ts'],
    });
  });
});
