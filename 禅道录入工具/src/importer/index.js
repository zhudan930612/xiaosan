function normalizeRequirementName(value) {
  return String(value ?? '').trim();
}

export function buildImportPlan({ workloadRows, memberMap }) {
  const stories = [];
  const tasks = [];
  const seenRequirementNames = new Set();

  for (const row of workloadRows) {
    const requirementName = normalizeRequirementName(row.requirementName);
    if (!requirementName) {
      continue;
    }

    if (!row.allocations || row.allocations.length === 0) {
      continue;
    }

    if (seenRequirementNames.has(requirementName)) {
      throw new Error(`发现重复的需求名称: ${requirementName}`);
    }
    seenRequirementNames.add(requirementName);

    let totalEstimate = 0;

    for (const allocation of row.allocations) {
      const member = memberMap.get(allocation.personName);
      totalEstimate += allocation.hours;
      const taskType = String(member.role || '').includes('测试') ? 'test' : 'devel';
      tasks.push({
        storyTitle: requirementName,
        title: `【${member.role}】${requirementName}`,
        assigneeName: allocation.personName,
        assigneeDisplayName: member.zentaoDisplayName || allocation.personName,
        estimate: allocation.hours,
        taskType,
      });
    }

    stories.push({
      title: requirementName,
      estimate: totalEstimate,
    });
  }

  return { stories, tasks };
}
