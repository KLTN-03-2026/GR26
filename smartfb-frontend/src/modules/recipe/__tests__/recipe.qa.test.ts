import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';

describe('QA recipe module', () => {
  test('giu dung contract cong thuc', () => {
    assertModuleContract({
      moduleName: 'recipe',
      expectedSubdirs: ['components', 'hooks', 'services', 'types', 'utils'],
      serviceFiles: ['services/recipeService.ts'],
      typeFiles: ['types/recipe.types.ts'],
    });
  });
});
