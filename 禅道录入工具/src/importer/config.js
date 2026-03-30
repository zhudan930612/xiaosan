import fs from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_CONFIG = {
  baseUrl: '',
  account: '',
  password: '',
  workloadWorkbookPath: './工作量.xlsx',
  memberWorkbookPath: './人员映射.xlsx',
  outputDir: './output',
  productId: null,
  autoCreateExecution: true,
};

function stripUtf8Bom(text) {
  return text.replace(/^\uFEFF/, '');
}

export async function loadConfig(configPath) {
  const absoluteConfigPath = path.resolve(configPath);
  const configDirectory = path.dirname(absoluteConfigPath);
  const rawText = await fs.readFile(absoluteConfigPath, 'utf8');
  const parsed = JSON.parse(stripUtf8Bom(rawText));
  const merged = { ...DEFAULT_CONFIG, ...parsed };

  return {
    ...merged,
    configPath: absoluteConfigPath,
    configDirectory,
    workloadWorkbookPath: path.resolve(configDirectory, merged.workloadWorkbookPath),
    memberWorkbookPath: path.resolve(configDirectory, merged.memberWorkbookPath),
    outputDir: path.resolve(configDirectory, merged.outputDir),
  };
}

export async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

export { DEFAULT_CONFIG };
