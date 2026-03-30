import crypto from 'node:crypto';

function trimString(value) {
  return String(value ?? '').trim();
}

export function normalizeBaseUrl(baseUrl) {
  const normalized = String(baseUrl || '').trim().replace(/\/+$/, '');
  if (!normalized) return '';
  if (/\/zentao$/i.test(normalized)) return normalized;
  return `${normalized}/zentao`;
}

export function decodeHtmlEntities(text) {
  return String(text ?? '')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, '\'')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function buildCookieHeader(cookieJar) {
  return Array.from(cookieJar.entries())
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

function storeCookies(cookieJar, response) {
  const cookieValues = typeof response.headers.getSetCookie === 'function' ? response.headers.getSetCookie() : [];
  for (const item of cookieValues) {
    const cookiePair = item.split(';')[0];
    const separator = cookiePair.indexOf('=');
    if (separator > 0) {
      cookieJar.set(cookiePair.slice(0, separator), cookiePair.slice(separator + 1));
    }
  }
}

function md5(value) {
  return crypto.createHash('md5').update(value).digest('hex');
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function toAbsoluteUrl(baseUrl, pathOrUrl) {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  if (String(pathOrUrl).startsWith('/')) return `${baseUrl}${pathOrUrl}`;
  const root = new URL(`${baseUrl}/`);
  return new URL(pathOrUrl, root).toString();
}

function extractTitle(text) {
  const titleMatch = String(text ?? '').match(/<title>(.*?)<\/title>/i);
  return trimString(titleMatch?.[1] || '');
}

function parseProjectNameFromPageTitle(title) {
  const normalized = trimString(title);
  const patterns = [
    /^(.*?)-建任务\s*-\s*禅道$/i,
    /^(.*?)-任务列表\s*-\s*禅道$/i,
    /^(.*?)-研发需求列表\s*-\s*禅道$/i,
    /^(.*?)-项目概况\s*-\s*禅道$/i,
  ];

  for (const pattern of patterns) {
    const matched = normalized.match(pattern);
    if (matched?.[1]) return trimString(matched[1]);
  }

  return '';
}

function extractTextFromLegacyLabel(label) {
  const raw = trimString(label);
  const colonIndex = raw.indexOf(':');
  return colonIndex >= 0 ? trimString(raw.slice(colonIndex + 1)) : raw;
}

function extractLegacyStoryTitle(label) {
  const raw = extractTextFromLegacyLabel(label);
  const suffixIndex = raw.lastIndexOf(' (优先级:');
  return suffixIndex >= 0 ? trimString(raw.slice(0, suffixIndex)) : raw;
}

function extractMatchedId(text, pattern, errorMessage) {
  const matched = String(text ?? '').match(pattern);
  if (!matched?.[1]) throw new Error(errorMessage);
  return Number(matched[1]);
}

function tryExtractMatchedId(text, pattern) {
  const matched = String(text ?? '').match(pattern);
  if (!matched?.[1]) return null;
  return Number(matched[1]);
}

function extractAttrValue(html, attrName) {
  const marker = `${attrName}="`;
  const start = html.indexOf(marker);
  if (start < 0) return '';
  const valueStart = start + marker.length;
  const end = html.indexOf('"', valueStart);
  if (end < 0) return '';
  return html.slice(valueStart, end);
}

function extractDataArrayText(encodedText) {
  const marker = '&quot;data&quot;:[';
  const start = encodedText.indexOf(marker);
  if (start < 0) return '[]';

  const decoded = decodeHtmlEntities(encodedText.slice(start + '&quot;data&quot;:'.length));
  let depth = 0;
  let inString = false;
  let escaped = false;
  let end = -1;

  for (let index = 0; index < decoded.length; index += 1) {
    const char = decoded[index];
    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === '[') depth += 1;
    if (char === ']') {
      depth -= 1;
      if (depth === 0) {
        end = index + 1;
        break;
      }
    }
  }

  if (end < 0) return '[]';
  return decoded.slice(0, end);
}

export function extractDataTableRows(html) {
  const encodedConfig = extractAttrValue(String(html ?? ''), 'zui-create-dtable');
  if (!encodedConfig) return [];
  const arrayText = extractDataArrayText(encodedConfig);
  return tryParseJson(arrayText) || [];
}

export function parseLegacyMembers(text) {
  const payload = typeof text === 'string' ? tryParseJson(text) : text;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];

  return Object.entries(payload).map(([account, label]) => ({
    account,
    name: extractTextFromLegacyLabel(label),
    realname: extractTextFromLegacyLabel(label),
  }));
}

export function parseLegacyStories(text) {
  const payload = typeof text === 'string' ? tryParseJson(text) : text;
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return [];

  return Object.entries(payload).map(([id, label]) => ({
    id: Number(id),
    title: extractLegacyStoryTitle(label),
    name: extractLegacyStoryTitle(label),
    rawLabel: trimString(label),
  }));
}

function extractLegacyResult(text) {
  const payload = tryParseJson(text);
  if (!payload || typeof payload !== 'object') return null;
  if ('result' in payload || 'locate' in payload || 'message' in payload) return payload;
  return null;
}

function formatLegacyMessage(message) {
  if (message == null) return '';
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.map((item) => formatLegacyMessage(item)).filter(Boolean).join('；');
  if (typeof message === 'object') {
    return Object.values(message).map((item) => formatLegacyMessage(item)).filter(Boolean).join('；');
  }

  return String(message);
}

function buildLegacyFormHeaders({ origin, referer }) {
  return {
    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json, text/javascript, */*; q=0.01',
    Referer: referer,
    Origin: origin,
  };
}

function buildLegacyFormError(actionLabel, responseText) {
  const title = extractTitle(responseText);
  if (title) {
    return new Error(`${actionLabel}失败，禅道返回了表单页面：${title}`);
  }

  const preview = trimString(responseText).slice(0, 200);
  return new Error(`${actionLabel}失败，禅道返回了未知页面内容：${preview}`);
}

function dedupeItems(items) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const id = trimString(item?.id);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    result.push(item);
  }
  return result;
}

function parseProductIdFromStoryView(text) {
  return (
    tryExtractMatchedId(text, /product-view-(\d+)\.html/i)
    || tryExtractMatchedId(text, /product-ajaxGetDropMenu-(\d+)-/i)
  );
}

function parseProductIdFromExecutionStory(text, executionId) {
  return tryExtractMatchedId(text, new RegExp(`/story-create-(\\d+)-0-0-0-${executionId}-0-0-0--story\\.html`, 'i'));
}

function parseProductIdsFromExecutionLinkStory(text) {
  const ids = new Set();
  for (const matched of String(text ?? '').matchAll(/&quot;product&quot;:&quot;(\d+)&quot;/g)) {
    if (matched[1]) ids.add(Number(matched[1]));
  }

  return Array.from(ids);
}

export function findItemByName(items, expectedName) {
  const normalizedName = trimString(expectedName);
  return items.find((item) => trimString(item?.name) === normalizedName || trimString(item?.title) === normalizedName) || null;
}

export function indexStoriesByTitle(stories) {
  const index = new Map();
  for (const story of stories) {
    const key = trimString(story?.title || story?.name);
    if (key) index.set(key, story);
  }
  return index;
}

export function resolveUserAccount(users, displayName) {
  const normalizedName = trimString(displayName);
  const matched = users.find((user) => trimString(user?.realname) === normalizedName || trimString(user?.name) === normalizedName);
  return matched?.account || null;
}

export class ZenTaoClient {
  constructor({ baseUrl, account, password, fetchImpl = fetch }) {
    this.baseUrl = normalizeBaseUrl(baseUrl);
    this.origin = new URL(this.baseUrl).origin;
    this.account = account;
    this.password = password;
    this.fetchImpl = fetchImpl;
    this.cookieJar = new Map();
    this.loggedIn = false;
  }

  async request(pathOrUrl, { method = 'GET', headers = {}, body } = {}) {
    const url = toAbsoluteUrl(this.baseUrl, pathOrUrl);
    const requestHeaders = { ...headers };
    const cookieHeader = buildCookieHeader(this.cookieJar);
    if (cookieHeader) requestHeaders.Cookie = cookieHeader;

    const response = await this.fetchImpl(url, {
      method,
      headers: requestHeaders,
      body,
      redirect: 'manual',
    });

    storeCookies(this.cookieJar, response);
    const text = await response.text();
    return { url, response, text };
  }

  async login() {
    await this.request('/');

    const loginReferer = `${this.baseUrl}/user-login-L3plbnRhby8=.html`;
    const randomResponse = await this.request('/user-refreshRandom.json', {
      headers: {
        Referer: loginReferer,
        Origin: this.origin,
      },
    });

    if (randomResponse.response.status !== 200) {
      throw new Error(`获取登录随机串失败：${randomResponse.response.status}`);
    }

    const verifyRand = trimString(randomResponse.text);
    if (!verifyRand) {
      throw new Error('获取登录随机串失败：返回值为空');
    }

    const encryptedPassword = md5(md5(this.password) + verifyRand);
    const loginForm = new URLSearchParams({
      account: this.account,
      password: encryptedPassword,
      passwordStrength: '1',
      referer: '/zentao/',
      verifyRand,
      keepLogin: '0',
      captcha: '',
    });

    const loginResponse = await this.request('/user-login.html', {
      method: 'POST',
      headers: buildLegacyFormHeaders({ origin: this.origin, referer: loginReferer }),
      body: loginForm.toString(),
    });

    const loginResult = extractLegacyResult(loginResponse.text);
    if (!loginResult || loginResult.result !== 'success') {
      throw new Error(`登录禅道失败：${loginResult?.message || '账号、密码或路由不兼容'}`);
    }

    this.loggedIn = true;
  }

  async listProjects() {
    const pages = ['/my-project.html', '/project-browse.html'];
    const allProjects = [];

    for (const pagePath of pages) {
      const page = await this.request(pagePath);
      allProjects.push(...extractDataTableRows(page.text));
    }

    return dedupeItems(allProjects).map((item) => ({
      ...item,
      id: Number(item.id),
      name: trimString(item.name),
    }));
  }

  async findProjectByName(projectName) {
    const projects = await this.listProjects();
    const matched = findItemByName(projects, projectName);
    if (matched) return matched;

    return this.scanNearbyProjectsByName(projectName, projects);
  }

  async lookupProjectById(projectId) {
    const projectIndex = await this.request(`/project-index-${projectId}.html`);
    if (projectIndex.response.status === 404) return null;

    let executionId = null;
    let projectName = '';

    if (projectIndex.response.status === 302) {
      const location = projectIndex.response.headers.get('location') || '';
      const executionMatch = location.match(/execution-task-(\d+)\.html/i);
      if (!executionMatch?.[1]) return null;
      executionId = Number(executionMatch[1]);
    } else {
      const pageTitle = extractTitle(projectIndex.text);
      projectName = parseProjectNameFromPageTitle(pageTitle);
      const executionMatch = projectIndex.text.match(/execution-task-(\d+)\.html/i);
      if (executionMatch?.[1]) executionId = Number(executionMatch[1]);
    }

    if (!executionId) return null;

    if (!projectName) {
      const taskCreatePage = await this.request(`/task-create-${executionId}-0-0.html`);
      projectName = parseProjectNameFromPageTitle(extractTitle(taskCreatePage.text));
    }

    if (!projectName) return null;

    return {
      id: Number(projectId),
      name: projectName,
      executionId,
      model: 'scrum',
    };
  }

  async scanNearbyProjectsByName(projectName, knownProjects = []) {
    const targetName = trimString(projectName);
    const numericIds = knownProjects
      .map((item) => Number(item.id))
      .filter((value) => Number.isFinite(value));

    const maxKnownId = numericIds.length > 0 ? Math.max(...numericIds) : 0;
    const startId = Math.max(1, maxKnownId - 50);
    const endId = maxKnownId + 120;
    let fallbackMatch = null;

    for (let projectId = endId; projectId >= startId; projectId -= 1) {
      const candidate = await this.lookupProjectById(projectId);
      if (!candidate) continue;
      if (trimString(candidate.name) !== targetName) continue;
      if (candidate.executionId && candidate.id !== candidate.executionId) return candidate;
      fallbackMatch = candidate;
    }

    return fallbackMatch;
  }

  async resolveExecutionId(projectId) {
    const result = await this.request(`/project-index-${projectId}.html`);
    if (result.response.status === 302) {
      const location = result.response.headers.get('location') || '';
      return extractMatchedId(location, /execution-task-(\d+)\.html/i, '未能从项目跳转地址中识别 executionID');
    }

    return extractMatchedId(result.text, /execution-task-(\d+)\.html/i, '未能从项目页面中识别 executionID');
  }

  async listUsers(executionId) {
    const result = await this.request(`/execution-ajaxGetMembers-${executionId}-.json`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json, text/plain, */*',
        Referer: `${this.baseUrl}/task-create-${executionId}-0-0.html`,
      },
    });

    if (result.response.status !== 200) {
      throw new Error(`获取执行成员失败：${result.response.status}`);
    }

    return parseLegacyMembers(result.text);
  }

  async listProjectStories(projectId, executionId = null) {
    const resolvedExecutionId = executionId || await this.resolveExecutionId(projectId);
    const result = await this.request(`/story-ajaxGetExecutionStories-${resolvedExecutionId}-0-all-0-0--full-active.json`, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        Accept: 'application/json, text/plain, */*',
        Referer: `${this.baseUrl}/task-create-${resolvedExecutionId}-0-0.html`,
      },
    });

    if (result.response.status !== 200) {
      throw new Error(`获取执行需求失败：${result.response.status}`);
    }

    return parseLegacyStories(result.text);
  }

  async findOrCreateExecution({ projectId, projectName }) {
    const knownProject = await this.lookupProjectById(projectId);
    const executionId = knownProject?.executionId || await this.resolveExecutionId(projectId);
    return { id: executionId, name: projectName };
  }

  async resolveProductId({ executionId }) {
    const existingStories = await this.listProjectStories(0, executionId);
    const firstStory = existingStories.find((story) => Number.isFinite(Number(story?.id)));
    if (firstStory?.id) {
      const storyViewPage = await this.request(`/story-view-${firstStory.id}.html`);
      const productIdFromStory = parseProductIdFromStoryView(storyViewPage.text);
      if (productIdFromStory) return productIdFromStory;
    }

    const page = await this.request(`/execution-story-${executionId}.html`);
    const productIdFromExecution = parseProductIdFromExecutionStory(page.text, executionId);
    if (productIdFromExecution) return productIdFromExecution;

    const linkStoryPage = await this.request(`/execution-linkStory-${executionId}.html`);
    const productIds = parseProductIdsFromExecutionLinkStory(linkStoryPage.text);
    if (productIds.length === 1) return productIds[0];

    throw new Error('无法识别产品 ID，请先在该项目下手动创建 1 条需求，或在 config.json 中填写 productId');
  }

  async createStory({ executionId, title, estimate, productId = null }) {
    const resolvedProductId = productId || await this.resolveProductId({ executionId });
    const storyPath = `/story-create-${resolvedProductId}-0-0-0-${executionId}-0-0-0--story.html`;
    const referer = `${this.baseUrl}${storyPath}`;

    const body = new URLSearchParams({
      product: String(resolvedProductId),
      module: '0',
      category: 'feature',
      title,
      pri: '3',
      estimate: String(estimate),
      spec: '',
      verify: '',
      source: '',
      keywords: '',
      needNotReview: '1',
      fileList: '[]',
      type: 'story',
      status: 'active',
      project: '',
    });

    const result = await this.request(storyPath, {
      method: 'POST',
      headers: buildLegacyFormHeaders({ origin: this.origin, referer }),
      body: body.toString(),
    });

    const payload = extractLegacyResult(result.text);
    if (!payload) throw buildLegacyFormError('创建需求', result.text);
    if (payload.result !== 'success') throw new Error(`创建需求失败：${formatLegacyMessage(payload.message) || title}`);

    const stories = await this.listProjectStories(0, executionId);
    const matched = stories.find((story) => trimString(story.title) === trimString(title));
    if (!matched) throw new Error(`需求创建后未能在执行中找到：${title}`);
    return matched;
  }

  async createTask({ executionId, storyId, title, assigneeAccount, estimate, type = 'devel' }) {
    const taskPath = `/task-create-${executionId}-0-0.html`;
    const referer = `${this.baseUrl}${taskPath}`;

    const body = new URLSearchParams({
      execution: String(executionId),
      type,
      module: '0',
      story: String(storyId),
      assignedTo: assigneeAccount,
      name: title,
      pri: '3',
      estimate: String(estimate),
      consumed: '0',
      left: String(estimate),
      desc: '',
      parent: '0',
    });

    const result = await this.request(taskPath, {
      method: 'POST',
      headers: buildLegacyFormHeaders({ origin: this.origin, referer }),
      body: body.toString(),
    });

    const payload = extractLegacyResult(result.text);
    if (!payload) throw buildLegacyFormError('创建任务', result.text);
    if (payload.result !== 'success') throw new Error(`创建任务失败：${formatLegacyMessage(payload.message) || title}`);

    return { id: null, locate: payload.locate || '' };
  }
}
