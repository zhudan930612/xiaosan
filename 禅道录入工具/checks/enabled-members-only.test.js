import test from 'node:test';
import assert from 'node:assert/strict';
import { parseWorkloadSheetRows } from '../src/importer/workbook.js';

test('parseWorkloadSheetRows only keeps enabled members', () => {
  const memberMap = new Map([
    ['周宏亮', { role: '前端2', zentaoDisplayName: '周宏亮', enabled: true }],
  ]);

  const rows = parseWorkloadSheetRows({
    memberMap,
    rows: [
      {
        需求名称: '示例需求',
        曾凡圆: 4,
        周宏亮: 6,
        袁崇轩: 2,
      },
    ],
  });

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].allocations, [{ personName: '周宏亮', hours: 6 }]);
});
