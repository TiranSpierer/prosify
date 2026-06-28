import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import container from 'markdown-it-container';
import taskLists from 'markdown-it-task-lists';
import { createHighlighter, type Highlighter } from 'shiki';
import type { Heading } from './types.js';

let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ['github-dark', 'github-light'],
      langs: [
        'javascript', 'typescript', 'json', 'bash', 'shell',
        'html', 'css', 'yaml', 'markdown', 'python', 'go',
        'rust', 'java', 'c', 'cpp', 'sql', 'graphql',
        'dockerfile', 'nginx', 'toml', 'xml', 'diff',
      ],
    });
  }
  return highlighter;
}

// SVG icons for callouts
const CALLOUT_ICONS: Record<string, string> = {
  note: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  tip: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M12 2a7 7 0 0 1 4 12.7V17H8v-2.3A7 7 0 0 1 12 2z"/></svg>',
  warning: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  danger: '<svg class="callout-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
};

function createContainerPlugin(md: MarkdownIt, name: string) {
  container(md, name, {
    render(tokens: any[], idx: number) {
      const token = tokens[idx];
      if (token.nesting === 1) {
        const customTitle = token.info.trim().slice(name.length).trim();
        const title = customTitle || name.charAt(0).toUpperCase() + name.slice(1);
        const icon = CALLOUT_ICONS[name] || CALLOUT_ICONS.note;
        return `<div class="callout callout-${name}">\n${icon}\n<div class="callout-body">\n<p class="callout-title">${title}</p>\n`;
      }
      return '</div>\n</div>\n';
    },
  });
}

export async function createMarkdownRenderer(): Promise<{
  render: (content: string) => string;
  extractHeadings: (content: string) => Heading[];
}> {
  const hl = await getHighlighter();

  const md: MarkdownIt = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    highlight(code: string, lang: string): string {
      const langLabel = lang || '';
      if (lang && hl.getLoadedLanguages().includes(lang)) {
        const highlighted = hl.codeToHtml(code, {
          lang,
          themes: { light: 'github-light', dark: 'github-dark' },
        });
        // Add data-language attribute to the shiki pre element for script.js to read
        return highlighted.replace('<pre class="shiki', `<pre data-language="${langLabel}" class="shiki`);
      }
      return `<pre data-language="${langLabel}" class="shiki"><code>${code.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c))}</code></pre>`;
    },
  });

  md.use(anchor, {
    permalink: false,
    slugify: (s: string) =>
      s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'),
  });

  md.use(taskLists, { enabled: true });

  createContainerPlugin(md, 'tip');
  createContainerPlugin(md, 'warning');
  createContainerPlugin(md, 'note');
  createContainerPlugin(md, 'danger');

  function extractHeadings(content: string): Heading[] {
    const headings: Heading[] = [];
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^(#{2,3})\s+(.+)$/);
      if (match) {
        const text = match[2].trim();
        const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
        headings.push({ id, text, level: match[1].length });
      }
    }
    return headings;
  }

  return {
    render: (content: string) => md.render(content),
    extractHeadings,
  };
}
