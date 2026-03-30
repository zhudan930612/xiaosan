import XLSX from 'xlsx';

function normalizeCell(value) {
  if (value == null) return '';
  return String(value).trim();
}

function readFirstSheetRows(filePath) {
  const workbook = XLSX.readFile(filePath);
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    return [];
  }
  return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { defval: '' });
}

export function parseMemberSheetRows(rows) {
  const memberMap = new Map();

  for (const row of rows) {
    if (normalizeCell(row['是否启用']) !== '是') {
      continue;
    }

    const personName = normalizeCell(row['人员姓名']);
    if (!personName) {
      continue;
    }

    memberMap.set(personName, {
      role: normalizeCell(row['角色']),
      zentaoDisplayName: normalizeCell(row['禅道显示名']),
      enabled: true,
    });
  }

  return memberMap;
}

export function parseWorkloadSheetRows({ rows, memberMap }) {
  return rows
    .filter((row) => normalizeCell(row['需求名称']))
    .map((row) => {
      const requirementName = normalizeCell(row['需求名称']);
      const allocations = [];

      for (const [columnName, rawValue] of Object.entries(row)) {
        if (columnName === '需求名称') {
          continue;
        }

        if (!memberMap.has(columnName)) {
          continue;
        }

        const normalizedValue = normalizeCell(rawValue);
        if (!normalizedValue || Number(normalizedValue) === 0) {
          continue;
        }

        const hours = Number(normalizedValue);
        if (Number.isNaN(hours) || hours < 0) {
          throw new Error(`人员列 ${columnName} 的工时不是有效数字: ${rawValue}`);
        }

        allocations.push({
          personName: columnName,
          hours,
        });
      }

      return { requirementName, allocations };
    });
}

export function readMemberWorkbook(filePath) {
  return parseMemberSheetRows(readFirstSheetRows(filePath));
}

export function readWorkloadWorkbook({ filePath, memberMap }) {
  return parseWorkloadSheetRows({
    rows: readFirstSheetRows(filePath),
    memberMap,
  });
}

export function writeWorkbook(filePath, rows, sheetName = 'Sheet1') {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filePath);
}

export function buildDefaultMemberRows() {
  return [
    { 人员姓名: '曾凡圆', 角色: '后端1', 禅道显示名: '曾凡圆', 是否启用: '是' },
    { 人员姓名: '徐大圣', 角色: '后端2', 禅道显示名: '徐大圣', 是否启用: '是' },
    { 人员姓名: '陈宇豪', 角色: '后端3', 禅道显示名: '陈宇豪', 是否启用: '是' },
    { 人员姓名: '蔡智旭', 角色: '前端1', 禅道显示名: '蔡智旭', 是否启用: '是' },
    { 人员姓名: '周宏亮', 角色: '前端2', 禅道显示名: '周宏亮', 是否启用: '是' },
    { 人员姓名: '袁崇轩', 角色: '前端3', 禅道显示名: '袁崇轩', 是否启用: '是' },
    { 人员姓名: '王天虹', 角色: '测试', 禅道显示名: '王天虹', 是否启用: '是' },
  ];
}

export function buildDefaultWorkloadRows(memberRows) {
  const templateRow = { 需求名称: '示例需求-请修改' };
  for (const memberRow of memberRows) {
    templateRow[memberRow['人员姓名']] = '';
  }
  return [templateRow];
}
