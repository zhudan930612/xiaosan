export function createPreviewReport({ projectName, plan }) {
  const lines = [
    `项目名称: ${projectName}`,
    `需求总数: ${plan.stories.length}`,
    `任务总数: ${plan.tasks.length}`,
    '',
    '需求预览:',
  ];

  for (const story of plan.stories) {
    lines.push(`- ${story.title} | 预计工时: ${story.estimate}`);
  }

  lines.push('', '任务预览:');

  for (const task of plan.tasks) {
    lines.push(`- ${task.title} | 负责人: ${task.assigneeName} | 预计工时: ${task.estimate}`);
  }

  return lines.join('\n');
}
