import test from 'node:test';
import assert from 'node:assert/strict';
import { indexStoriesByTitle } from '../src/importer/zentao-client.js';
import { parseCliArgs } from '../src/cli.js';

test('indexStoriesByTitle builds a lookup map by exact title', () => {
  const index = indexStoriesByTitle([
    { id: 101, title: '需求A' },
    { id: 102, title: '需求B' },
  ]);

  assert.equal(index.get('需求A').id, 101);
  assert.equal(index.get('需求B').id, 102);
});

test('parseCliArgs supports tasks-only mode', () => {
  const args = parseCliArgs(['--project', '风险科技-Sprint178', '--tasks-only']);

  assert.equal(args.projectName, '风险科技-Sprint178');
  assert.equal(args.tasksOnly, true);
});
