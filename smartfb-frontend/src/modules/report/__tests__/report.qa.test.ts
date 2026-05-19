import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';

describe('QA report module', () => {
  test('giu dung contract bao cao', () => {
    assertModuleContract({
      moduleName: 'report',
      expectedSubdirs: ['components', 'hooks', 'services', 'types'],
      serviceFiles: ['services/reportService.ts'],
      typeFiles: ['types/report.types.ts'],
    });
  });
});
