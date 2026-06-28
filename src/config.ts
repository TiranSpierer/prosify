import { readFileSync, existsSync } from 'fs';
import { resolve, basename, dirname } from 'path';
import type { ProsifyConfig } from './types.js';

const DEFAULT_CONFIG: ProsifyConfig = {
  name: 'Documentation',
  description: '',
  theme: { primary: '#3b82f6', dark: true },
  llms: { full: true },
};

export function loadConfig(configPath?: string, docsDir?: string): ProsifyConfig {
  const paths = configPath
    ? [resolve(configPath)]
    : [
        resolve('docs.json'),
        resolve('prosify.json'),
        docsDir ? resolve(docsDir, 'docs.json') : '',
      ].filter(Boolean);

  for (const p of paths) {
    if (existsSync(p)) {
      const raw = readFileSync(p, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<ProsifyConfig>;
      return mergeConfig(parsed);
    }
  }

  const dirName = docsDir ? basename(resolve(docsDir)) : 'docs';
  return {
    ...DEFAULT_CONFIG,
    name: dirName.charAt(0).toUpperCase() + dirName.slice(1),
  };
}

function mergeConfig(user: Partial<ProsifyConfig>): ProsifyConfig {
  return {
    ...DEFAULT_CONFIG,
    ...user,
    theme: { ...DEFAULT_CONFIG.theme, ...user.theme },
    llms: { ...DEFAULT_CONFIG.llms, ...user.llms },
  };
}
