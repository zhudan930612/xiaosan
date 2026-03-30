import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import XLSX from 'xlsx';
import { buildImportPlan } from '../src/importer/index.js';
import { parseCliArgs } from '../src/cli.js';
import { loadConfig } from '../src/importer/config.js';
import { createPreviewReport } from '../src/importer/preview.js';
import { parseMemberSheetRows, parseWorkloadSheetRows, readMemberWorkbook, readWorkloadWorkbook } from '../src/importer/workbook.js';
import {
  decodeHtmlEntities,
  extractDataTableRows,
  findItemByName,
  normalizeBaseUrl,
  parseLegacyMembers,
  parseLegacyStories,
  resolveUserAccount,
  ZenTaoClient,
} from '../src/importer/zentao-client.js';

test('buildImportPlan sums story hours and creates role-prefixed tasks', () => {
  const workloadRows = [
    {
      requirementName: '灾害信息员系统-系统监控\\安全漏洞修复',
      allocations: [
        { personName: '曾凡圆', hours: 4 },
        { personName: '徐大圣', hours: 4 },
      ],
    },
  ];

  const memberMap = new Map([
    ['曾凡圆', { role: '后端1', zentaoDisplayName: '曾凡圆', enabled: true }],
    ['徐大圣', { role: '后端2', zentaoDisplayName: '徐大圣', enabled: true }],
  ]);

  const plan = buildImportPlan({ workloadRows, memberMap });

  assert.equal(plan.stories.length, 1);
  assert.equal(plan.stories[0].title, '灾害信息员系统-系统监控\\安全漏洞修复');
  assert.equal(plan.stories[0].estimate, 8);
  assert.deepEqual(
    plan.tasks.map((task) => ({ title: task.title, assignee: task.assigneeName, estimate: task.estimate, taskType: task.taskType })),
    [
      { title: '【后端1】灾害信息员系统-系统监控\\安全漏洞修复', assignee: '曾凡圆', estimate: 4, taskType: 'devel' },
      { title: '【后端2】灾害信息员系统-系统监控\\安全漏洞修复', assignee: '徐大圣', estimate: 4, taskType: 'devel' },
    ],
  );
});

test('buildImportPlan skips rows without any allocations', () => {
  const memberMap = new Map([
    ['曾凡圆', { role: '后端1', zentaoDisplayName: '曾凡圆', enabled: true }],
  ]);

  const plan = buildImportPlan({
    workloadRows: [
      { requirementName: '示例需求-请修改', allocations: [] },
    ],
    memberMap,
  });

  assert.equal(plan.stories.length, 0);
  assert.equal(plan.tasks.length, 0);
});

test('buildImportPlan rejects duplicate requirement names after trim', () => {
  const memberMap = new Map([
    ['曾凡圆', { role: '后端1', zentaoDisplayName: '曾凡圆', enabled: true }],
  ]);

  assert.throws(
    () => buildImportPlan({
      workloadRows: [
        { requirementName: '需求A', allocations: [{ personName: '曾凡圆', hours: 4 }] },
        { requirementName: ' 需求A ', allocations: [{ personName: '曾凡圆', hours: 2 }] },
      ],
      memberMap,
    }),
    /重复的需求名称/,
  );
});

test('parseMemberSheetRows keeps only enabled members', () => {
  const memberMap = parseMemberSheetRows([
    { 人员姓名: '曾凡圆', 角色: '后端1', 禅道显示名: '曾凡圆', 是否启用: '是' },
    { 人员姓名: '历史成员', 角色: '后端4', 禅道显示名: '历史成员', 是否启用: '否' },
  ]);

  assert.equal(memberMap.has('曾凡圆'), true);
  assert.equal(memberMap.has('历史成员'), false);
});

test('parseWorkloadSheetRows ignores disabled or unknown personnel columns', () => {
  const rows = parseWorkloadSheetRows({
    rows: [
      { 需求名称: '需求A', 未知成员: 4, 曾凡圆: 8 },
    ],
    memberMap: new Map([
      ['曾凡圆', { role: '后端1', zentaoDisplayName: '曾凡圆', enabled: true }],
    ]),
  });

  assert.equal(rows.length, 1);
  assert.deepEqual(rows[0].allocations, [{ personName: '曾凡圆', hours: 8 }]);
});

test('createPreviewReport summarizes stories tasks and totals', () => {
  const report = createPreviewReport({
    projectName: '风险科技-Sprint178',
    plan: {
      stories: [{ title: '需求A', estimate: 8 }],
      tasks: [{ title: '【后端1】需求A', assigneeName: '曾凡圆', estimate: 8 }],
    },
  });

  assert.match(report, /项目名称: 风险科技-Sprint178/);
  assert.match(report, /需求总数: 1/);
  assert.match(report, /任务总数: 1/);
  assert.match(report, /需求A/);
  assert.match(report, /【后端1】需求A/);
});

test('readMemberWorkbook and readWorkloadWorkbook load xlsx files from disk', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zentao-import-'));
  const memberPath = path.join(tempDir, '人员映射.xlsx');
  const workloadPath = path.join(tempDir, '工作量.xlsx');

  const memberWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(memberWorkbook, XLSX.utils.json_to_sheet([
    { 人员姓名: '曾凡圆', 角色: '后端1', 禅道显示名: '曾凡圆', 是否启用: '是' },
  ]), 'Sheet1');
  XLSX.writeFile(memberWorkbook, memberPath);

  const workloadWorkbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workloadWorkbook, XLSX.utils.json_to_sheet([
    { 需求名称: '需求A', 曾凡圆: 4 },
  ]), 'Sheet1');
  XLSX.writeFile(workloadWorkbook, workloadPath);

  const memberMap = readMemberWorkbook(memberPath);
  const workloadRows = readWorkloadWorkbook({ filePath: workloadPath, memberMap });

  assert.equal(memberMap.get('曾凡圆').role, '后端1');
  assert.equal(workloadRows[0].requirementName, '需求A');
  assert.equal(workloadRows[0].allocations[0].personName, '曾凡圆');
  assert.equal(workloadRows[0].allocations[0].hours, 4);
});

test('normalizeBaseUrl appends /zentao when omitted', () => {
  assert.equal(normalizeBaseUrl('http://example.com:8004'), 'http://example.com:8004/zentao');
  assert.equal(normalizeBaseUrl('http://example.com:8004/zentao'), 'http://example.com:8004/zentao');
});

test('decodeHtmlEntities decodes html-escaped strings', () => {
  assert.equal(decodeHtmlEntities('&quot;风险科技&amp;测试&quot;'), '"风险科技&测试"');
});

test('extractDataTableRows parses zui dtable rows from html', () => {
  const html = '<div zui-create-dtable="{&quot;cols&quot;:[],&quot;data&quot;:[{&quot;id&quot;:&quot;1285&quot;,&quot;name&quot;:&quot;风险科技-Sprint178&quot;}]}"></div>';
  const rows = extractDataTableRows(html);

  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, '风险科技-Sprint178');
});

test('parseLegacyMembers converts execution member json to account list', () => {
  const users = parseLegacyMembers('{"wangdouliang":"W:王窦亮","zhouhongliang":"Z:周宏亮"}');

  assert.deepEqual(users, [
    { account: 'wangdouliang', name: '王窦亮', realname: '王窦亮' },
    { account: 'zhouhongliang', name: '周宏亮', realname: '周宏亮' },
  ]);
});

test('parseLegacyStories converts execution story json to exact title index data', () => {
  const stories = parseLegacyStories('{"16578":"16578:其他-需求沟通 (优先级:3,预计工时:16)"}');

  assert.deepEqual(stories, [
    { id: 16578, title: '其他-需求沟通', name: '其他-需求沟通', rawLabel: '16578:其他-需求沟通 (优先级:3,预计工时:16)' },
  ]);
});

test('findProjectByName falls back to nearby project scan when list pages miss wait projects', async () => {
  const client = new ZenTaoClient({ baseUrl: 'http://example.com', account: 'demo', password: 'secret', fetchImpl: async () => { throw new Error('not used'); } });
  client.listProjects = async () => [{ id: 1285, name: '风险科技-Sprint178', model: 'scrum' }];
  client.scanNearbyProjectsByName = async (projectName) => ({ id: 1289, name: projectName, executionId: 1290, model: 'scrum' });

  const project = await client.findProjectByName('测试123');

  assert.deepEqual(project, { id: 1289, name: '测试123', executionId: 1290, model: 'scrum' });
});

test('resolveProductId falls back to existing story view when execution story page misses product link', async () => {
  const client = new ZenTaoClient({ baseUrl: 'http://example.com', account: 'demo', password: 'secret', fetchImpl: async () => { throw new Error('not used'); } });
  client.listProjectStories = async (_projectId, executionId) => {
    assert.equal(executionId, 1286);
    return [{ id: 16544, title: '需求A' }];
  };
  client.request = async (pathOrUrl) => {
    if (pathOrUrl === '/execution-story-1286.html') {
      return {
        response: { status: 200 },
        text: '<html><body><a href="/zentao/story-create-40-0-0-0-771-0-0-0--story.html">提研发需求</a></body></html>',
      };
    }

    if (pathOrUrl === '/story-view-16544.html') {
      return {
        response: { status: 200 },
        text: '<html><body><a href="/zentao/product-view-13.html">其他小项目</a></body></html>',
      };
    }

    throw new Error(`unexpected request: ${pathOrUrl}`);
  };

  const productId = await client.resolveProductId({ executionId: 1286 });

  assert.equal(productId, 13);
});

test('resolveProductId falls back to execution link-story page when execution has no stories yet', async () => {
  const client = new ZenTaoClient({ baseUrl: 'http://example.com', account: 'demo', password: 'secret', fetchImpl: async () => { throw new Error('not used'); } });
  client.listProjectStories = async (_projectId, executionId) => {
    assert.equal(executionId, 1290);
    return [];
  };
  client.request = async (pathOrUrl) => {
    if (pathOrUrl === '/execution-story-1290.html') {
      return {
        response: { status: 200 },
        text: '<html><body><a href="/zentao/story-create-40-0-0-0-771-0-0-0--story.html">提研发需求</a></body></html>',
      };
    }

    if (pathOrUrl === '/execution-linkStory-1290.html') {
      return {
        response: { status: 200 },
        text: '<div>&quot;data&quot;:[{&quot;id&quot;:&quot;1&quot;,&quot;product&quot;:&quot;13&quot;},{&quot;id&quot;:&quot;2&quot;,&quot;product&quot;:&quot;13&quot;}]</div>',
      };
    }

    throw new Error(`unexpected request: ${pathOrUrl}`);
  };

  const productId = await client.resolveProductId({ executionId: 1290 });

  assert.equal(productId, 13);
});

test('createStory includes needNotReview hidden field used by ZenTao 21.3 story form', async () => {
  const client = new ZenTaoClient({ baseUrl: 'http://example.com', account: 'demo', password: 'secret', fetchImpl: async () => { throw new Error('not used'); } });
  let requestBody = '';
  client.resolveProductId = async () => 13;
  client.request = async (_pathOrUrl, options = {}) => {
    requestBody = options.body || '';
    return { text: '{"result":"success"}', response: { status: 200 } };
  };
  client.listProjectStories = async () => [{ id: 2001, title: '需求A' }];

  await client.createStory({ executionId: 1290, title: '需求A', estimate: 2 });

  assert.match(requestBody, /(?:^|&)needNotReview=1(?:&|$)/);
});

test('createStory exposes readable validation messages when ZenTao returns field error objects', async () => {
  const client = new ZenTaoClient({ baseUrl: 'http://example.com', account: 'demo', password: 'secret', fetchImpl: async () => { throw new Error('not used'); } });
  client.resolveProductId = async () => 13;
  client.request = async () => ({
    text: '{"result":"fail","message":{"reviewer":"『评审人』不能为空。"}}',
    response: { status: 200 },
  });

  await assert.rejects(
    () => client.createStory({ executionId: 1290, title: '需求A', estimate: 2 }),
    /评审人/,
  );
});

test('findItemByName matches exact names from collection', () => {
  const item = findItemByName([
    { id: 1, name: '风险科技-Sprint177' },
    { id: 2, name: '风险科技-Sprint178' },
  ], '风险科技-Sprint178');

  assert.equal(item.id, 2);
});

test('resolveUserAccount prefers realname and falls back to name', () => {
  const account = resolveUserAccount([
    { account: 'zfy', realname: '曾凡圆' },
    { account: 'xds', name: '徐大圣' },
  ], '徐大圣');

  assert.equal(account, 'xds');
});

test('parseCliArgs reads project flags and dry-run switches', () => {
  const args = parseCliArgs(['--project', '风险科技-Sprint178', '--dry-run', '--yes']);

  assert.equal(args.projectName, '风险科技-Sprint178');
  assert.equal(args.dryRun, true);
  assert.equal(args.autoConfirm, true);
});

test('loadConfig resolves relative paths against config file directory', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zentao-config-'));
  const configPath = path.join(tempDir, 'config.json');

  await fs.writeFile(configPath, JSON.stringify({
    baseUrl: 'http://example.com',
    account: 'demo',
    password: 'secret',
    workloadWorkbookPath: './工作量.xlsx',
    memberWorkbookPath: './人员映射.xlsx',
    outputDir: './output'
  }), 'utf8');

  const config = await loadConfig(configPath);

  assert.equal(config.baseUrl, 'http://example.com');
  assert.equal(config.workloadWorkbookPath, path.join(tempDir, '工作量.xlsx'));
  assert.equal(config.memberWorkbookPath, path.join(tempDir, '人员映射.xlsx'));
  assert.equal(config.outputDir, path.join(tempDir, 'output'));
});

test('loadConfig accepts utf8 bom files', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zentao-config-bom-'));
  const configPath = path.join(tempDir, 'config.json');
  await fs.writeFile(configPath, '\uFEFF{"baseUrl":"http://example.com"}', 'utf8');

  const config = await loadConfig(configPath);

  assert.equal(config.baseUrl, 'http://example.com');
});
