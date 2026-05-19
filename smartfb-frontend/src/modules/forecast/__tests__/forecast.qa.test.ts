import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';

describe('QA forecast module', () => {
  test('giu dung contract du bao AI', () => {
    assertModuleContract({
      moduleName: 'forecast',
      expectedSubdirs: ['components', 'hooks', 'services'],
      serviceFiles: ['services/forecastService.ts'],
      typeFiles: ['types.ts'],
    });
  });
});
