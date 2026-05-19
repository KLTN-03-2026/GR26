import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';

describe('QA subscription module', () => {
  test('giu dung contract subscription/gia han goi', () => {
    assertModuleContract({
      moduleName: 'subscription',
      expectedSubdirs: ['components', 'hooks', 'services', 'types'],
      serviceFiles: ['services/subscriptionService.ts'],
      typeFiles: ['types/subscription.types.ts', 'components/subscriptionGate.types.ts'],
    });
  });
});
