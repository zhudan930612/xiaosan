# ZenTao Excel Import Tool Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a double-click Windows tool that reads a standard Excel workload sheet plus a personnel-mapping sheet, previews the import plan, and then creates ZenTao stories and tasks for a named project.

**Architecture:** Use a small Node.js CLI as the core runtime because Python is unavailable in the current environment. Keep business logic testable and separate from transport concerns: one layer parses Excel and builds an import plan, another layer talks to ZenTao APIs, and a thin CLI wrapper handles prompts, preview, and file output. Preserve the user-facing workflow from the approved spec even if the internal implementation uses APIs rather than browser automation.

**Tech Stack:** Node.js 24, built-in `node:test`, built-in `fetch`, `xlsx` for workbook read/write.

---

### Task 1: Bootstrap the Node tool and first failing tests

**Files:**
- Create: `e:\AI知识库\小型工程管理系统\package.json`
- Create: `e:\AI知识库\小型工程管理系统\src\importer\index.js`
- Create: `e:\AI知识库\小型工程管理系统\test\import-plan.test.js`

- [ ] **Step 1: Write the failing test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildImportPlan } from '../src/importer/index.js';

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
    plan.tasks.map((task) => ({ title: task.title, assignee: task.assigneeName, estimate: task.estimate })),
    [
      { title: '【后端1】灾害信息员系统-系统监控\\安全漏洞修复', assignee: '曾凡圆', estimate: 4 },
      { title: '【后端2】灾害信息员系统-系统监控\\安全漏洞修复', assignee: '徐大圣', estimate: 4 },
    ],
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/import-plan.test.js`
Expected: FAIL because `buildImportPlan` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```js
export function buildImportPlan({ workloadRows, memberMap }) {
  const stories = [];
  const tasks = [];

  for (const row of workloadRows) {
    let totalEstimate = 0;

    for (const allocation of row.allocations) {
      const member = memberMap.get(allocation.personName);
      totalEstimate += allocation.hours;
      tasks.push({
        storyTitle: row.requirementName,
        title: `【${member.role}】${row.requirementName}`,
        assigneeName: allocation.personName,
        assigneeDisplayName: member.zentaoDisplayName || allocation.personName,
        estimate: allocation.hours,
      });
    }

    stories.push({
      title: row.requirementName,
      estimate: totalEstimate,
    });
  }

  return { stories, tasks };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/import-plan.test.js`
Expected: PASS with 1 passing test.

- [ ] **Step 5: Commit**

```bash
git add package.json src/importer/index.js test/import-plan.test.js
git commit -m "feat: bootstrap zentao importer core plan builder"
```

### Task 2: Add workbook parsing with failing tests first

**Files:**
- Create: `e:\AI知识库\小型工程管理系统\src\importer\workbook.js`
- Modify: `e:\AI知识库\小型工程管理系统\src\importer\index.js`
- Modify: `e:\AI知识库\小型工程管理系统\test\import-plan.test.js`
- Create: `e:\AI知识库\小型工程管理系统\test\fixtures\README.md`

- [ ] **Step 1: Write the failing tests**

```js
test('parseWorkloadSheet rejects unknown personnel columns', async () => {
  await assert.rejects(
    () => parseWorkloadSheet({
      rows: [
        { 需求名称: '需求A', 未知成员: 4 },
      ],
      memberMap: new Map(),
    }),
    /未在人员映射表中启用/,
  );
});

test('parseMemberSheet keeps only enabled members', () => {
  const memberMap = parseMemberSheet([
    { 人员姓名: '曾凡圆', 角色: '后端1', 禅道显示名: '曾凡圆', 是否启用: '是' },
    { 人员姓名: '历史成员', 角色: '后端4', 禅道显示名: '历史成员', 是否启用: '否' },
  ]);

  assert.equal(memberMap.has('曾凡圆'), true);
  assert.equal(memberMap.has('历史成员'), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/import-plan.test.js`
Expected: FAIL because workbook parsing helpers are missing.

- [ ] **Step 3: Write minimal implementation**

Implement helpers that:

```js
export function parseMemberSheet(rows) {
  const memberMap = new Map();

  for (const row of rows) {
    if (String(row['是否启用'] || '').trim() !== '是') continue;
    const personName = String(row['人员姓名'] || '').trim();
    memberMap.set(personName, {
      role: String(row['角色'] || '').trim(),
      zentaoDisplayName: String(row['禅道显示名'] || '').trim(),
      enabled: true,
    });
  }

  return memberMap;
}

export function parseWorkloadSheet({ rows, memberMap }) {
  return rows
    .filter((row) => String(row['需求名称'] || '').trim())
    .map((row) => {
      const requirementName = String(row['需求名称']).trim();
      const allocations = [];

      for (const [columnName, value] of Object.entries(row)) {
        if (columnName === '需求名称') continue;
        if (!memberMap.has(columnName)) {
          throw new Error(`人员列 ${columnName} 未在人员映射表中启用`);
        }
        if (value === '' || value == null || Number(value) === 0) continue;
        allocations.push({ personName: columnName, hours: Number(value) });
      }

      return { requirementName, allocations };
    });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/import-plan.test.js`
Expected: PASS with parsing coverage added.

- [ ] **Step 5: Commit**

```bash
git add src/importer/workbook.js src/importer/index.js test/import-plan.test.js test/fixtures/README.md
git commit -m "feat: add workbook parsing for workload and member mapping"
```

### Task 3: Add ZenTao API client and dry-run CLI

**Files:**
- Create: `e:\AI知识库\小型工程管理系统\src\importer\config.js`
- Create: `e:\AI知识库\小型工程管理系统\src\importer\zentao-client.js`
- Create: `e:\AI知识库\小型工程管理系统\src\cli.js`
- Modify: `e:\AI知识库\小型工程管理系统\test\import-plan.test.js`

- [ ] **Step 1: Write the failing test**

```js
test('createPreviewReport summarizes stories, tasks, and totals', () => {
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
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/import-plan.test.js`
Expected: FAIL because preview/report helpers are missing.

- [ ] **Step 3: Write minimal implementation**

Implement:

- `loadConfig()` from `config.json`
- `createPreviewReport()` returning text preview
- `ZenTaoClient` with token login and placeholder methods:
  - `login()`
  - `findProjectByName(projectName)`
  - `findOrCreateExecution(projectId)`
  - `findUsers()`
  - `createStory()`
  - `createTask()`
- `src/cli.js` dry-run mode that:
  - reads config
  - reads both workbooks
  - builds plan
  - writes preview to `output/preview.txt`
  - prints preview

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/import-plan.test.js`
Expected: PASS with preview generation covered.

- [ ] **Step 5: Commit**

```bash
git add src/importer/config.js src/importer/zentao-client.js src/cli.js test/import-plan.test.js
git commit -m "feat: add preview CLI and zentao client scaffolding"
```

### Task 4: Finish import flow, batch entry point, templates, and docs

**Files:**
- Create: `e:\AI知识库\小型工程管理系统\导入禅道.bat`
- Create: `e:\AI知识库\小型工程管理系统\templates\禅道导入模板.xlsx`
- Create: `e:\AI知识库\小型工程管理系统\人员映射.xlsx`
- Create: `e:\AI知识库\小型工程管理系统\config.json`
- Create: `e:\AI知识库\小型工程管理系统\README_禅道导入工具.md`
- Modify: `e:\AI知识库\小型工程管理系统\src\cli.js`
- Modify: `e:\AI知识库\小型工程管理系统\src\importer\zentao-client.js`

- [ ] **Step 1: Write the failing test**

```js
test('buildImportPlan preserves story-to-task linkage for later API submission', () => {
  const memberMap = new Map([
    ['曾凡圆', { role: '后端1', zentaoDisplayName: '曾凡圆', enabled: true }],
  ]);

  const plan = buildImportPlan({
    workloadRows: [
      { requirementName: '需求A', allocations: [{ personName: '曾凡圆', hours: 4 }] },
    ],
    memberMap,
  });

  assert.equal(plan.tasks[0].storyTitle, '需求A');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/import-plan.test.js`
Expected: FAIL if the linkage is not preserved end-to-end.

- [ ] **Step 3: Write minimal implementation**

Finish the real import path:

- prompt for project name and confirm import after preview
- ensure `output/` exists
- resolve user assignment by ZenTao display name
- create stories first, cache `storyTitle -> storyId`
- create tasks second with linked `storyId`
- emit `output/import-result.json` and `output/import-result.txt`
- add `导入禅道.bat` that runs `node src/cli.js`
- generate default `config.json`, `人员映射.xlsx`, and `templates/禅道导入模板.xlsx`
- document the exact usage steps in `README_禅道导入工具.md`

- [ ] **Step 4: Run verification to verify it passes**

Run: `node --test`
Expected: PASS with all tests green.

Run: `node src/cli.js --dry-run --project 风险科技-Sprint178`
Expected: preview file created under `output/` and console shows parsed totals.

- [ ] **Step 5: Commit**

```bash
git add 导入禅道.bat templates/禅道导入模板.xlsx 人员映射.xlsx config.json README_禅道导入工具.md src/cli.js src/importer/zentao-client.js output
 git commit -m "feat: deliver double-click zentao import tool"
```
