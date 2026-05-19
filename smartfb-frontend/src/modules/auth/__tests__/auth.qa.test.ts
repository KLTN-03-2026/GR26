import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';
import { ROLES } from '@shared/constants/roles';
import { hasAccess, hasAnyPermission } from '@shared/utils/accessControl';

describe('QA auth module', () => {
  test('giu dung contract auth store/service/type', () => {
    assertModuleContract({
      moduleName: 'auth',
      expectedSubdirs: ['components', 'hooks', 'services', 'stores', 'types', 'utils'],
      serviceFiles: ['services/authService.ts'],
      typeFiles: ['types/auth.types.ts', 'types/authStore.types.ts'],
    });
  });

  test('authorization: admin va owner vuot qua permission chi tiet khi dung role', () => {
    assert.equal(hasAccess({ role: ROLES.ADMIN }, { roles: [ROLES.ADMIN] }), true);
    assert.equal(hasAccess({ role: ROLES.OWNER }, { requiredPermissions: ['MENU_VIEW'] }), true);
  });

  test('authorization: staff can permission va bi chan khi sai role', () => {
    assert.equal(
      hasAccess({ role: ROLES.STAFF, permissions: ['ORDER_VIEW'] }, { requiredPermissions: ['ORDER_VIEW'] }),
      true
    );
    assert.equal(
      hasAccess({ role: ROLES.STAFF, permissions: ['ORDER_VIEW'] }, { requiredPermissions: ['REPORT_VIEW'] }),
      false
    );
    assert.equal(hasAccess({ role: ROLES.STAFF }, { roles: [ROLES.OWNER] }), false);
  });

  test('authorization edge cases: danh sach permission rong va thieu token duoc route guard xu ly o component', () => {
    assert.equal(hasAnyPermission([], undefined), true);
    assert.equal(hasAnyPermission([], []), true);
    assert.equal(hasAnyPermission([], ['MENU_VIEW']), false);
  });
});
