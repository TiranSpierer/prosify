import type { Page, ProsifyConfig, NavGroup } from './types.js';
import { stripFrontmatter } from './utils.js';

export function generateLlmsTxt(config: ProsifyConfig, pages: Page[]): string {
  const lines: string[] = [];

  lines.push(`# ${config.name}`);
  lines.push('');
  if (config.description) {
    lines.push(`> ${config.description}`);
    lines.push('');
  }

  const baseUrl = (config.url || '').replace(/\/$/, '');

  if (config.navigation?.length) {
    for (const group of config.navigation) {
      lines.push(`## ${group.group}`);
      lines.push('');
      for (const pageSlug of group.pages) {
        const page = pages.find((p) => p.slug === pageSlug);
        if (!page) continue;
        const url = `${baseUrl}/${page.slug}.md`;
        const desc = page.description ? `: ${page.description}` : '';
        lines.push(`- [${page.title}](${url})${desc}`);
      }
      lines.push('');
    }
  } else {
    lines.push('## Docs');
    lines.push('');
    for (const page of pages) {
      const url = `${baseUrl}/${page.slug}.md`;
      const desc = page.description ? `: ${page.description}` : '';
      lines.push(`- [${page.title}](${url})${desc}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function generateLlmsFullTxt(config: ProsifyConfig, pages: Page[]): string {
  const lines: string[] = [];

  lines.push(`# ${config.name}`);
  lines.push('');
  if (config.description) {
    lines.push(`> ${config.description}`);
    lines.push('');
  }

  for (const page of pages) {
    lines.push('---');
    lines.push('');
    lines.push(stripFrontmatter(page.rawContent).trim());
    lines.push('');
  }

  return lines.join('\n');
}
