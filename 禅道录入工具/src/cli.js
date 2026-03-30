import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { fileURLToPath } from 'node:url';
import { ensureDirectory, loadConfig } from './importer/config.js';
import { buildImportPlan } from './importer/index.js';
import { createPreviewReport } from './importer/preview.js';
import { buildDefaultMemberRows, buildDefaultWorkloadRows, readMemberWorkbook, readWorkloadWorkbook, writeWorkbook } from './importer/workbook.js';
import { ZenTaoClient, indexStoriesByTitle, resolveUserAccount } from './importer/zentao-client.js';

export function parseCliArgs(argv) {
  const result = {
    projectName: '',
    dryRun: false,
    autoConfirm: false,
    tasksOnly: false,
    configPath: path.resolve('config.json'),
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--project' && argv[index + 1]) {
      result.projectName = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === '--config' && argv[index + 1]) {
      result.configPath = path.resolve(argv[index + 1]);
      index += 1;
      continue;
    }

    if (value === '--dry-run') {
      result.dryRun = true;
      continue;
    }

    if (value === '--tasks-only') {
      result.tasksOnly = true;
      continue;
    }

    if (value === '--yes') {
      result.autoConfirm = true;
    }
  }

  return result;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function ensureToolArtifacts(config) {
  await ensureDirectory(path.dirname(config.workloadWorkbookPath));
  await ensureDirectory(path.dirname(config.memberWorkbookPath));
  await ensureDirectory(path.resolve(config.configDirectory, 'templates'));
  await ensureDirectory(config.outputDir);

  const memberRows = buildDefaultMemberRows();
  const templateRows = buildDefaultWorkloadRows(memberRows);

  if (!(await fileExists(config.memberWorkbookPath))) {
    writeWorkbook(config.memberWorkbookPath, memberRows, '成员映射');
  }

  const templatePath = path.resolve(config.configDirectory, 'templates', '禅道导入模板.xlsx');
  if (!(await fileExists(templatePath))) {
    writeWorkbook(templatePath, templateRows, '工作量模板');
  }

  if (!(await fileExists(config.workloadWorkbookPath))) {
    writeWorkbook(config.workloadWorkbookPath, templateRows, '工作量');
  }
}

function buildResultText(result) {
  const lines = [
    `项目名称: ${result.projectName}`,
    `模式: ${result.mode}`,
    `需求成功: ${result.createdStories.length}`,
    `任务成功: ${result.createdTasks.length}`,
    `失败记录: ${result.failures.length}`,
    '',
  ];

  if (result.failures.length > 0) {
    lines.push('失败明细:');
    for (const failure of result.failures) {
      lines.push(`- ${failure.stage} | ${failure.name} | ${failure.reason}`);
    }
  }

  return lines.join('\n');
}

async function promptForMissingProjectName(projectName) {
  if (projectName) return projectName;
  const rl = readline.createInterface({ input, output });
  try {
    return (await rl.question('请输入禅道项目名称: ')).trim();
  } finally {
    rl.close();
  }
}

async function confirmImport(autoConfirm) {
  if (autoConfirm) return true;
  const rl = readline.createInterface({ input, output });
  try {
    const answer = (await rl.question('确认开始正式导入吗？输入 y 继续: ')).trim().toLowerCase();
    return answer === 'y' || answer === 'yes';
  } finally {
    rl.close();
  }
}

function buildTimestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function writeTextWithFallback(preferredPath, content) {
  try {
    await fs.writeFile(preferredPath, content, 'utf8');
    return preferredPath;
  } catch (error) {
    if (!['EPERM', 'EBUSY', 'EACCES'].includes(error.code)) {
      throw error;
    }

    const parsed = path.parse(preferredPath);
    const fallbackPath = path.join(parsed.dir, `${parsed.name}-${buildTimestamp()}${parsed.ext}`);
    await fs.writeFile(fallbackPath, content, 'utf8');
    return fallbackPath;
  }
}

async function writeJsonWithFallback(preferredPath, value) {
  return writeTextWithFallback(preferredPath, JSON.stringify(value, null, 2));
}

async function writeOutputFiles(config, previewReport, result) {
  await ensureDirectory(config.outputDir);
  const previewPath = await writeTextWithFallback(path.join(config.outputDir, 'preview.txt'), previewReport);

  const filePaths = { previewPath };

  if (result) {
    filePaths.resultJsonPath = await writeJsonWithFallback(path.join(config.outputDir, 'import-result.json'), result);
    filePaths.resultTextPath = await writeTextWithFallback(path.join(config.outputDir, 'import-result.txt'), buildResultText(result));
  }

  return filePaths;
}

async function runImport({ client, config, projectName, plan, tasksOnly }) {
  await client.login();
  const project = await client.findProjectByName(projectName);
  if (!project) throw new Error(`未找到项目：${projectName}`);

  const execution = await client.findOrCreateExecution({
    projectId: project.id,
    projectName,
    autoCreateExecution: config.autoCreateExecution,
  });

  const users = await client.listUsers(execution.id);
  const createdStories = [];
  const createdTasks = [];
  const failures = [];
  const storyIdByTitle = new Map();

  if (tasksOnly) {
    const existingStories = await client.listProjectStories(project.id, execution.id);
    const storyIndex = indexStoriesByTitle(existingStories);
    for (const story of plan.stories) {
      const matched = storyIndex.get(story.title);
      if (matched?.id) {
        storyIdByTitle.set(story.title, matched.id);
      } else {
        failures.push({ stage: 'story-lookup', name: story.title, reason: '未找到已存在的需求，无法只导任务' });
      }
    }
  } else {
    const productId = config.productId ? Number(config.productId) : await client.resolveProductId({ executionId: execution.id });
    for (const story of plan.stories) {
      try {
        const createdStory = await client.createStory({
          executionId: execution.id,
          productId,
          title: story.title,
          estimate: story.estimate,
        });
        const storyId = createdStory?.id || createdStory?.story || createdStory?.data?.id;
        storyIdByTitle.set(story.title, storyId);
        createdStories.push({ title: story.title, id: storyId });
      } catch (error) {
        failures.push({ stage: 'story', name: story.title, reason: error.message });
      }
    }
  }

  for (const task of plan.tasks) {
    try {
      const assigneeAccount = resolveUserAccount(users, task.assigneeDisplayName);
      if (!assigneeAccount) throw new Error(`未找到负责人账号：${task.assigneeDisplayName}`);

      const storyId = storyIdByTitle.get(task.storyTitle);
      if (!storyId) throw new Error(`未找到对应需求 ID：${task.storyTitle}`);

      const createdTask = await client.createTask({
        executionId: execution.id || project.id,
        storyId,
        title: task.title,
        assigneeAccount,
        estimate: task.estimate,
        type: task.taskType || 'devel',
      });

      createdTasks.push({ title: task.title, id: createdTask?.id || null });
    } catch (error) {
      failures.push({ stage: 'task', name: task.title, reason: error.message });
    }
  }

  return {
    projectName,
    mode: tasksOnly ? '只导任务' : '需求+任务',
    createdStories,
    createdTasks,
    failures,
  };
}

export async function main(argv = process.argv.slice(2)) {
  const args = parseCliArgs(argv);
  const config = await loadConfig(args.configPath);
  await ensureToolArtifacts(config);

  const projectName = await promptForMissingProjectName(args.projectName);
  if (!projectName) throw new Error('项目名称不能为空');

  const memberMap = readMemberWorkbook(config.memberWorkbookPath);
  const workloadRows = readWorkloadWorkbook({ filePath: config.workloadWorkbookPath, memberMap });
  const plan = buildImportPlan({ workloadRows, memberMap });
  const previewReport = createPreviewReport({ projectName, plan });

  const outputFiles = await writeOutputFiles(config, previewReport);
  console.log(previewReport);
  console.log(`\n导入模式: ${args.tasksOnly ? '只导任务' : '需求+任务'}`);
  console.log(`预览文件已生成: ${outputFiles.previewPath}`);

  if (args.dryRun) return;

  const confirmed = await confirmImport(args.autoConfirm);
  if (!confirmed) {
    console.log('已取消正式导入。');
    return;
  }

  const client = new ZenTaoClient({
    baseUrl: config.baseUrl,
    account: config.account,
    password: config.password,
  });

  const result = await runImport({ client, config, projectName, plan, tasksOnly: args.tasksOnly });
  const resultFiles = await writeOutputFiles(config, previewReport, result);
  console.log(buildResultText(result));
  console.log(`\n结果文件已生成: ${resultFiles.resultTextPath}`);
}

const currentFilePath = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFilePath) {
  main().catch((error) => {
    console.error(`执行失败: ${error.message}`);
    process.exitCode = 1;
  });
}
