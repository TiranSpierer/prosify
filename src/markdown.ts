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

function createContainerPlugin(md: MarkdownIt, name: string) {
  container(md, name, {
    render(tokens: any[], idx: number) {
      const token = tokens[idx];
      if (token.nesting === 1) {
        const customTitle = token.info.trim().slice(name.length).trim();
        const title = customTitle || name.charAt(0).toUpperCase() + name.slice(1);
        return `<div class="callout callout-${name}">\n<p class="callout-title">${title}</p>\n`;
      }
      return '</div>\n';
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
      if (lang && hl.getLoadedLanguages().includes(lang)) {
        return hl.codeToHtml(code, {
          lang,
          themes: { light: 'github-light', dark: 'github-dark' },
        });
      }
      return `<pre class="shiki"><code>${code.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] || c))}</code></pre>`;
    },
  });

  md.use(anchor, {
    permalink: anchor.permalink.linkInsideHeader({
      symbol: '#',
      placement: 'before',
      ariaHidden: true,
      class: 'header-anchor',
    }),
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
