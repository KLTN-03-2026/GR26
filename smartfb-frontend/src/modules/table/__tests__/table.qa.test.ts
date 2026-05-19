import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { assertModuleContract } from '@/test/qa/moduleContract';
import { buildTablePresentationData } from '@modules/table/utils/tablePresentation';

describe('QA table module', () => {
  test('giu dung contract so do the/ban', () => {
    assertModuleContract({
      moduleName: 'table',
      expectedSubdirs: ['components', 'hooks', 'services', 'types', 'utils'],
      serviceFiles: ['services/tableService.ts'],
      typeFiles: ['types/table.types.ts'],
    });
  });

  test('business logic: tinh thong ke trang thai ban va zone', () => {
    const result = buildTablePresentationData({
      branches: [{ id: 'b1', name: 'Quan 1' }],
      zones: [{ id: 'z1', name: 'Tang 1', branchId: 'b1', floorNumber: 1 }],
      currentBranchId: 'b1',
      tables: [
        {
          id: 't1',
          name: 'A1',
          branchId: 'b1',
          branchName: 'Quan 1',
          zoneId: 'z1',
          zoneName: 'Tang 1',
          status: 'active',
          usageStatus: 'available',
          shape: 'square',
          capacity: 2,
          positionX: 0,
          positionY: 0,
          createdAt: '2026-05-16T00:00:00.000Z',
          updatedAt: '2026-05-16T00:00:00.000Z',
        },
        {
          id: 't2',
          name: 'A2',
          branchId: 'b1',
          branchName: 'Quan 1',
          zoneId: 'z1',
          zoneName: 'Tang 1',
          status: 'active',
          usageStatus: 'occupied',
          shape: 'round',
          capacity: 4,
          positionX: 1,
          positionY: 1,
          createdAt: '2026-05-16T00:00:00.000Z',
          updatedAt: '2026-05-16T00:00:00.000Z',
        },
      ],
    });

    assert.equal(result.tableStats.totalTables, 2);
    assert.equal(result.tableStats.availableTables, 1);
    assert.equal(result.tableStats.occupiedTables, 1);
    assert.equal(result.zonesWithStats[0].tableCount, 2);
  });
});
