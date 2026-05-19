import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';

describe('QA pos-session module', () => {
  test('giu dung contract ca POS', () => {
    assertModuleContract({
      moduleName: 'pos-session',
      expectedSubdirs: ['components', 'hooks', 'services', 'types'],
      serviceFiles: ['services/posSessionService.ts'],
      typeFiles: ['types/posSession.types.ts'],
    });
  });
});
