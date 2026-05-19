import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';

describe('QA account module', () => {
  test('giu dung contract module/service/type', () => {
    assertModuleContract({
      moduleName: 'account',
      expectedSubdirs: ['components', 'hooks', 'services', 'types'],
      serviceFiles: ['services/accountService.ts'],
      typeFiles: ['types/account.types.ts'],
    });
  });
});
