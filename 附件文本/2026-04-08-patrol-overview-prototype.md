# Patrol Overview Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a non-editable but interactive HTML prototype for the "巡查统揽" big-screen flow, including the home entry card, patrol overview topic page, right-side drilldown drawer, and project detail page.

**Architecture:** Reuse the existing big-screen HTML prototype structure and visual language, then replace the patrol placeholder content with a dedicated multi-page prototype flow. Keep everything in a single standalone HTML file with CSS and vanilla JavaScript for view switching, drawer open/close, and tab/filter interactions.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript

---

## File Structure

- Create: `功能规划/巡查统揽原型设计.html`
- Create: `docs/superpowers/plans/2026-04-08-patrol-overview-prototype.md`
- Reference only: `功能规划/大屏巡查数据模块原型设计.html`
- Reference only: `功能规划/巡查统揽原型设计方案.md`
- Reference only: `功能规划/大屏巡查数据模块设计.md`

## Task 1: Build the HTML skeleton and shared visual shell

**Files:**
- Create: `功能规划/巡查统揽原型设计.html`

- [ ] **Step 1: Copy the reusable page shell pattern from the existing big-screen prototype**

Reuse these sections in the new file:

```html
<body>
  <div class="screen-frame">
    <div class="topbar">...</div>
    <main class="screen-page active" id="page-home">...</main>
    <main class="screen-page" id="page-patrol">...</main>
    <main class="screen-page" id="page-project-detail">...</main>
  </div>
  <aside class="side-drawer" id="townDrawer">...</aside>
  <script>...</script>
</body>
```

- [ ] **Step 2: Define shared CSS tokens and panel styles**

Add CSS for the existing visual language:

```css
:root {
  --bg-0: #071522;
  --bg-1: rgba(10, 31, 46, 0.88);
  --panel-border: rgba(113, 242, 255, 0.38);
  --panel-glow: rgba(88, 240, 255, 0.16);
  --text-main: #eafcff;
  --text-sub: #7fb6c7;
  --cyan: #72f6ff;
  --green: #39d98a;
  --yellow: #ffbe3b;
  --orange: #ff8b3d;
  --red: #ff5b78;
}
```

- [ ] **Step 3: Add page containers for the three main views**

Create:
- home page
- patrol topic page
- project detail page

Use IDs:

```html
<section class="screen-page active" id="page-home"></section>
<section class="screen-page" id="page-patrol"></section>
<section class="screen-page" id="page-project-detail"></section>
```

## Task 2: Build the home page patrol entry area

**Files:**
- Modify: `功能规划/巡查统揽原型设计.html`

- [ ] **Step 1: Add the four-overview cards row**

Include:
- 实时统揽
- 备案统揽
- 巡查统揽
- 组织统揽

The patrol card should contain:

```html
<button class="overview-card is-patrol" data-action="open-patrol-topic">
  <div class="overview-title">巡查统揽</div>
  <div class="overview-metrics">
    <div><strong>92.4%</strong><span>本周巡查覆盖率</span></div>
    <div><strong>84.7%</strong><span>本周隐患整改率</span></div>
    <div><strong>318</strong><span>本周巡查次数</span></div>
    <div><strong>23</strong><span>待整改隐患数</span></div>
  </div>
</button>
```

- [ ] **Step 2: Add the rest of the home layout to preserve the existing big-screen feel**

Include:
- left chart panel
- center map panel
- right distribution panel
- lower chart/list panels

These can stay prototype-grade but must visually match the existing system.

- [ ] **Step 3: Wire the patrol card click into page navigation**

Use JavaScript:

```js
document.querySelectorAll('[data-action="open-patrol-topic"]').forEach((node) => {
  node.addEventListener('click', () => showPage('page-patrol'));
});
```

## Task 3: Build the patrol overview topic page

**Files:**
- Modify: `功能规划/巡查统揽原型设计.html`

- [ ] **Step 1: Add the topic page header and filters**

Include:
- back button
- refresh button
- time tabs: 今日 / 本周 / 近7日 / 本月
- street select
- organization select

- [ ] **Step 2: Add the first-row core KPI cards**

Build six cards:
- 巡查次数
- 巡查覆盖率
- 隐患总数
- 隐患整改率
- 待整改隐患数
- 停工整改工程数

- [ ] **Step 3: Add the left ranking panel**

Ranking switch options:
- 按巡查覆盖率
- 按巡查次数
- 按隐患数
- 按整改率
- 按停工整改工程数

Each row must be clickable:

```html
<button class="rank-row" data-drawer="town" data-town="赵巷镇">...</button>
```

- [ ] **Step 4: Add the right trend analysis panel**

Provide two toggle groups:
- trend scope: 一周 / 一个月
- trend mode: 工程状态趋势 / 巡查执行趋势

Display both the chart shell and legend. Use mock line/area SVG or CSS chart placeholders with labels.

- [ ] **Step 5: Add the bottom street detail table**

Columns:
- 街道名称
- 在建工程数
- 正常施工
- 现场整改
- 停工整改
- 已核销
- 本周巡查次数
- 本月巡查次数
- 巡查覆盖率
- 隐患数
- 隐患整改率
- 操作

Add both “快览” and “详情” buttons.

## Task 4: Build the right-side drawer drilldown

**Files:**
- Modify: `功能规划/巡查统揽原型设计.html`

- [ ] **Step 1: Add the hidden drawer structure**

```html
<aside class="side-drawer" id="townDrawer" aria-hidden="true">
  <div class="drawer-header">...</div>
  <div class="drawer-body">...</div>
</aside>
<div class="drawer-mask" id="drawerMask"></div>
```

- [ ] **Step 2: Add drawer content sections**

Include:
- title and scope
- KPI summary cards
- state summary
- latest patrol information
- pending hazard count
- CTA button to project detail

- [ ] **Step 3: Wire row, table, and map clicks to the drawer**

Use data attributes:

```js
document.querySelectorAll('[data-drawer="town"]').forEach((node) => {
  node.addEventListener('click', () => openDrawer({
    title: node.dataset.town
  }));
});
```

- [ ] **Step 4: Add close interactions**

Support:
- top-right close button
- clicking overlay mask
- pressing `Escape`

## Task 5: Build the project detail page

**Files:**
- Modify: `功能规划/巡查统揽原型设计.html`

- [ ] **Step 1: Add the desktop detail page hero area**

Include:
- project title
- address
- town
- type tags
- current status chip
- overdue warning chip
- map mini-card

- [ ] **Step 2: Add the summary metric strip**

Include:
- 最近巡查时间
- 巡查总次数
- 待整改隐患数
- 最新备案时间

- [ ] **Step 3: Add the tabbed records area**

Tabs:
- 巡查记录
- 整改记录
- 备案记录

Default active tab: 巡查记录

- [ ] **Step 4: Add patrol records cards**

Each card should include:
- datetime
- organization
- inspector
- hazard tags
- handling status
- CTA

- [ ] **Step 5: Add rectification records cards**

Include:
- submission time
- review status
- reviewer node
- linked patrol record

- [ ] **Step 6: Add filing records cards**

Include:
- filing number
- filing date
- operation type
- risk type
- construction period

## Task 6: Implement shared interactions

**Files:**
- Modify: `功能规划/巡查统揽原型设计.html`

- [ ] **Step 1: Implement page switching**

```js
function showPage(pageId) {
  document.querySelectorAll('.screen-page').forEach((page) => {
    page.classList.toggle('active', page.id === pageId);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
```

- [ ] **Step 2: Implement the drawer open/close logic**

```js
function setDrawerOpen(open) {
  drawer.classList.toggle('is-open', open);
  drawerMask.classList.toggle('is-open', open);
}
```

- [ ] **Step 3: Implement tab toggles for topic trends**

Use button state classes:

```js
document.querySelectorAll('[data-trend-mode]').forEach((btn) => {
  btn.addEventListener('click', () => { ... });
});
```

- [ ] **Step 4: Implement tab toggles for project detail records**

Use dataset:

```js
document.querySelectorAll('[data-detail-tab]').forEach((btn) => {
  btn.addEventListener('click', () => { ... });
});
```

## Task 7: Manual verification for the static prototype

**Files:**
- Verify: `功能规划/巡查统揽原型设计.html`

- [ ] **Step 1: Open the HTML file locally and verify the home page renders**

Run:

```powershell
Get-Item 'e:\AI知识库\小型工程管理系统\功能规划\巡查统揽原型设计.html'
```

Expected:
- file exists
- HTML opens in browser without blank screen

- [ ] **Step 2: Verify interactive navigation manually**

Check:
- clicking “巡查统揽” enters the topic page
- clicking a ranking row opens the drawer
- clicking “查看详情” enters project detail
- clicking tabs switches content
- drawer closes on mask click and `Esc`

- [ ] **Step 3: Run a basic HTML parse smoke check**

Run:

```powershell
@'
from html.parser import HTMLParser
from pathlib import Path

class P(HTMLParser):
    pass

P().feed(Path(r"e:\AI知识库\小型工程管理系统\功能规划\巡查统揽原型设计.html").read_text(encoding="utf-8"))
print("HTML parse OK")
'@ | python -
```

Expected:

```text
HTML parse OK
```

## Self-Review

- Spec coverage: includes home card, patrol topic page, street/project drawer, and project detail page.
- Placeholder scan: no TODO/TBD style placeholders included.
- Type consistency: page IDs, drawer IDs, and data attribute names are defined once and reused consistently.

