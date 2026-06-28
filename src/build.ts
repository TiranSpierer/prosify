import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync, statSync } from 'fs';
import { resolve, relative, join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fg from 'fast-glob';
import matter from 'gray-matter';
import type { Page, ProsifyConfig, NavGroup, BuildOptions } from './types.js';
import { loadConfig } from './config.js';
import { createMarkdownRenderer } from './markdown.js';
import { generateLlmsTxt, generateLlmsFullTxt } from './llms.js';
import { buildSearchIndex } from './search.js';
import { renderPage, renderHomepage } from './template.js';
import { toSlug, titleFromSlug, readingTime, stripFrontmatter } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THEME_DIR = resolve(__dirname, '../theme');

export async function build(options: BuildOptions): Promise<void> {
  const startTime = Date.now();
  const { docsDir, outDir, configPath, baseUrl } = options;

  const config = loadConfig(configPath, docsDir);
  if (baseUrl) config.url = baseUrl;

  const mdFiles = await fg('**/*.md', { cwd: resolve(docsDir), ignore: ['node_modules/**'] });
  if (mdFiles.length === 0) {
    console.error('No markdown files found in', docsDir);
    process.exit(1);
  }

  const renderer = await createMarkdownRenderer();

  const pages: Page[] = mdFiles.map((file) => {
    const filePath = resolve(docsDir, file);
    const raw = readFileSync(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(raw);
    const slug = toSlug(file);

    const headings = renderer.extractHeadings(content);
    const htmlContent = renderer.render(content);

    const title = frontmatter.title || headings.find((h) => h.level === 1)?.text || titleFromSlug(slug);
    const description = frontmatter.description || '';

    let lastUpdated: Date | undefined;
    try { lastUpdated = statSync(filePath).mtime; } catch {}

    return {
      slug,
      filePath,
      frontmatter,
      title,
      description,
      rawContent: raw,
      htmlContent,
      headings: headings.filter((h) => h.level >= 2),
      readingTime: readingTime(content),
      lastUpdated,
    };
  });

  const navigation = resolveNavigation(config, pages);
  const orderedPages = getOrderedPages(navigation, pages);

  // Create output directory
  mkdirSync(resolve(outDir), { recursive: true });
  mkdirSync(resolve(outDir, 'assets'), { recursive: true });

  // Write HTML pages
  for (let i = 0; i < orderedPages.length; i++) {
    const page = orderedPages[i];
    const prevPage = i > 0 ? orderedPages[i - 1] : undefined;
    const nextPage = i < orderedPages.length - 1 ? orderedPages[i + 1] : undefined;

    const html = renderPage({ page, config, pages: orderedPages, navigation, prevPage, nextPage });
    const pageDir = resolve(outDir, page.slug);
    mkdirSync(pageDir, { recursive: true });
    writeFileSync(join(pageDir, 'index.html'), html);

    // Write .md file (frontmatter stripped)
    const mdContent = stripFrontmatter(page.rawContent);
    writeFileSync(resolve(outDir, `${page.slug}.md`), mdContent);
  }

  // Write homepage
  const homepage = renderHomepage(config, orderedPages, navigation);
  writeFileSync(resolve(outDir, 'index.html'), homepage);

  // Write llms.txt
  const llmsTxt = generateLlmsTxt(config, orderedPages);
  writeFileSync(resolve(outDir, 'llms.txt'), llmsTxt);

  // Write llms-full.txt
  if (config.llms?.full !== false) {
    const excluded = new Set(config.llms?.exclude || []);
    const includedPages = orderedPages.filter((p) => !excluded.has(p.slug));
    const llmsFullTxt = generateLlmsFullTxt(config, includedPages);
    writeFileSync(resolve(outDir, 'llms-full.txt'), llmsFullTxt);
  }

  // Write search index
  const searchEntries = buildSearchIndex(orderedPages);
  writeFileSync(resolve(outDir, 'assets/search-index.json'), JSON.stringify(searchEntries));

  // Copy theme assets
  copyFileSync(resolve(THEME_DIR, 'styles.css'), resolve(outDir, 'assets/style.css'));
  copyFileSync(resolve(THEME_DIR, 'script.js'), resolve(outDir, 'assets/script.js'));

  // Write 404
  writeFileSync(resolve(outDir, '404.html'), render404(config));

  const elapsed = Date.now() - startTime;
  console.log(`\x1b[32m✓\x1b[0m Built ${orderedPages.length} pages in ${elapsed}ms → ${outDir}`);
}

function resolveNavigation(config: ProsifyConfig, pages: Page[]): NavGroup[] {
  if (config.navigation?.length) {
    return config.navigation;
  }

  // Auto-generate: group by directory, or single group
  const grouped = new Map<string, string[]>();
  for (const page of pages) {
    const parts = page.slug.split('/');
    const group = parts.length > 1 ? titleFromSlug(parts[0]) : 'Docs';
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(page.slug);
  }

  return Array.from(grouped.entries()).map(([group, slugs]) => ({
    group,
    pages: slugs.sort(),
  }));
}

function getOrderedPages(navigation: NavGroup[], pages: Page[]): Page[] {
  const ordered: Page[] = [];
  const seen = new Set<string>();

  for (const group of navigation) {
    for (const slug of group.pages) {
      const page = pages.find((p) => p.slug === slug);
      if (page && !seen.has(slug)) {
        ordered.push(page);
        seen.add(slug);
      }
    }
  }

  // Add any pages not in navigation
  for (const page of pages) {
    if (!seen.has(page.slug)) {
      ordered.push(page);
    }
  }

  return ordered;
}

function render404(config: ProsifyConfig): string {
  const primary = config.theme?.primary || '#3b82f6';
  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not Found - ${config.name}</title>
  <link rel="stylesheet" href="/assets/style.css">
  <style>:root { --color-primary: ${primary}; }</style>
</head>
<body>
  <div class="home" style="text-align:center;padding-top:15vh">
    <h1 style="font-size:4rem;opacity:.3">404</h1>
    <p style="margin-top:1rem;color:var(--color-text-muted)">Page not found</p>
    <a href="/" style="display:inline-block;margin-top:2rem;color:var(--color-primary)">← Back to docs</a>
  </div>
  <script src="/assets/script.js"></script>
</body>
</html>`;
}
