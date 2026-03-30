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
  const localConfigPath = path.resolve(configDirectory, 'config.local.json');
  const rawText = await fs.readFile(absoluteConfigPath, 'utf8');
  const parsed = JSON.parse(stripUtf8Bom(rawText));
  let localParsed = {};

  try {
    const localRawText = await fs.readFile(localConfigPath, 'utf8');
    localParsed = JSON.parse(stripUtf8Bom(localRawText));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const merged = { ...DEFAULT_CONFIG, ...parsed, ...localParsed };

  return {
    ...merged,
    configPath: absoluteConfigPath,
    configDirectory,
    localConfigPath,
    workloadWorkbookPath: path.resolve(configDirectory, merged.workloadWorkbookPath),
    memberWorkbookPath: path.resolve(configDirectory, merged.memberWorkbookPath),
    outputDir: path.resolve(configDirectory, merged.outputDir),
  };
}

export async function saveUserConfig(config, userConfig) {
  const payload = {
    baseUrl: userConfig.baseUrl || '',
    account: userConfig.account || '',
    password: userConfig.password || '',
  };

  await fs.writeFile(config.localConfigPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

export async function ensureDirectory(directoryPath) {
  await fs.mkdir(directoryPath, { recursive: true });
}

export { DEFAULT_CONFIG };
