import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';

describe('QA finance module', () => {
  test('giu dung contract finance UI module', () => {
    assertModuleContract({
      moduleName: 'finance',
      expectedSubdirs: ['components'],
    });
  });
});
