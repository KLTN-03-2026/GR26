import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';
import { expectInvalid, expectValid } from '@/test/qa/schemaAssertions';
import { createAddonSchema } from '@modules/menu/schemas/addon.schema';
import { createCategorySchema } from '@modules/menu/schemas/category.schema';
import { createMenuSchema } from '@modules/menu/schemas/menu.schema';
import {
  buildBranchConfigMap,
  buildMenuQueryParams,
  mergeBranchMenuItems,
} from '@modules/menu/utils/menuManagement';
import type { BranchMenuItemConfig, MenuItem } from '@modules/menu/types/menu.types';

const validMenu = {
  name: 'Ca phe sua',
  category: 'cat-1',
  price: 25000,
  unit: 'ly',
  imageFile: undefined,
  isSyncDelivery: false,
};

describe('QA menu module', () => {
  test('giu dung contract menu service/type/schema', () => {
    assertModuleContract({
      moduleName: 'menu',
      expectedSubdirs: ['components', 'constants', 'hooks', 'schemas', 'services', 'types', 'utils'],
      serviceFiles: ['services/menuService.ts'],
      typeFiles: ['types/menu.types.ts'],
    });
  });

  test('validation menu: happy path va cac rang buoc so/text', () => {
    expectValid(createMenuSchema, validMenu);
    expectInvalid(createMenuSchema, { ...validMenu, name: '' }, 'khong duoc de trong|không được để trống');
    expectInvalid(createMenuSchema, { ...validMenu, name: 'a'.repeat(256) }, '255');
    expectInvalid(createMenuSchema, { ...validMenu, category: '' }, 'danh muc|danh mục');
    expectInvalid(createMenuSchema, { ...validMenu, price: -1 }, 'khong duoc am|không được âm');
    expectInvalid(createMenuSchema, { ...validMenu, price: 100000001 }, '100.000.000');
    expectInvalid(createMenuSchema, { ...validMenu, price: 1000.123 }, 'thập phân');
    expectInvalid(createMenuSchema, { ...validMenu, price: '25000' });
    expectInvalid(createMenuSchema, { ...validMenu, name: '   ' }, 'khong duoc de trong|không được để trống');
    expectInvalid(createMenuSchema, { ...validMenu, unit: 'a'.repeat(31) }, '30');
  });

  test('validation category/addon: chan gia tri bien va sai type', () => {
    expectValid(createCategorySchema, { name: 'Do uong', description: '', displayOrder: 1 });
    expectInvalid(createCategorySchema, { name: '   ', description: '', displayOrder: 1 }, 'khong duoc de trong|không được để trống');
    expectInvalid(createCategorySchema, { name: 'Do uong', description: 'a'.repeat(501), displayOrder: 1 }, '500');
    expectInvalid(createCategorySchema, { name: 'Do uong', description: '', displayOrder: -1 }, 'khong duoc am|không được âm');
    expectInvalid(createCategorySchema, { name: 'Do uong', description: '', displayOrder: 1.2 }, 'so nguyen|số nguyên');

    expectValid(createAddonSchema, { name: 'Tran chau', extraPrice: 5000 });
    expectInvalid(createAddonSchema, { name: '   ', extraPrice: 5000 }, 'khong duoc de trong|không được để trống');
    expectInvalid(createAddonSchema, { name: 'Tran chau', extraPrice: -0.01 }, 'khong duoc am|không được âm');
    expectInvalid(createAddonSchema, { name: 'Tran chau', extraPrice: 100000001 }, '100.000.000');
    expectInvalid(createAddonSchema, { name: 'Tran chau', extraPrice: 5000.123 }, 'thập phân');
  });

  test('business logic: merge cau hinh mon theo chi nhanh dung gia va trang thai', () => {
    const menuItems: MenuItem[] = [
      {
        id: 'item-1',
        name: 'Latte',
        category: 'cat-1',
        price: 30000,
        gpPercent: 60,
        image: '',
        status: 'selling',
        soldCount: 0,
        createdAt: 1,
        isActive: true,
      },
    ];
    const config: BranchMenuItemConfig = {
      itemId: 'item-1',
      itemName: 'Latte',
      branchId: 'branch-1',
      basePrice: 30000,
      branchPrice: 35000,
      effectivePrice: 35000,
      isAvailable: false,
    };

    const result = mergeBranchMenuItems({
      globalMenuItems: menuItems,
      branchConfigMap: buildBranchConfigMap([config]),
      selectedBranchId: 'branch-1',
      selectedBranchName: 'Quan 1',
    });

    assert.equal(result[0].price, 35000);
    assert.equal(result[0].status, 'hidden');
    assert.equal(buildMenuQueryParams('').search, undefined);
    assert.equal(buildMenuQueryParams('latte').search, 'latte');
  });

  test('validation edge cases: chan extra fields o schema menu/addon/category', () => {
    expectInvalid(createMenuSchema, { ...validMenu, unknown: true });
    expectInvalid(createAddonSchema, { name: 'Tran chau', extraPrice: 5000, unknown: true });
    expectInvalid(createCategorySchema, { name: 'Do uong', description: '', displayOrder: 1, unknown: true });
  });
});
