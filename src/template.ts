import type { Page, ProsifyConfig, NavGroup, Heading } from './types.js';
import { escapeHtml } from './utils.js';

interface RenderOptions {
  page: Page;
  config: ProsifyConfig;
  pages: Page[];
  navigation: NavGroup[];
  prevPage?: Page;
  nextPage?: Page;
}

function getBase(config: ProsifyConfig): string {
  const b = config.basePath || '';
  return b.endsWith('/') ? b.slice(0, -1) : b;
}

function renderSidebar(navigation: NavGroup[], currentSlug: string, pages: Page[], base: string): string {
  let html = '';
  for (const group of navigation) {
    html += `<div class="nav-group">`;
    html += `<h3 class="nav-group-title">${escapeHtml(group.group)}</h3>`;
    html += `<ul class="nav-list">`;
    for (const slug of group.pages) {
      const page = pages.find((p) => p.slug === slug);
      if (!page) continue;
      const active = page.slug === currentSlug ? ' active' : '';
      html += `<li><a href="${base}/${page.slug}" class="nav-link${active}">${escapeHtml(page.title)}</a></li>`;
    }
    html += `</ul></div>`;
  }
  return html;
}

function renderToc(headings: Heading[]): string {
  if (headings.length === 0) return '';
  let html = '<nav class="toc"><h4 class="toc-title">On this page</h4><ul>';
  for (const h of headings) {
    const indent = h.level === 3 ? ' class="toc-indent"' : '';
    html += `<li${indent}><a href="#${h.id}" class="toc-link">${escapeHtml(h.text)}</a></li>`;
  }
  html += '</ul></nav>';
  return html;
}

function renderPrevNext(prev: Page | undefined, next: Page | undefined, base: string): string {
  if (!prev && !next) return '';
  let html = '<nav class="prev-next">';
  if (prev) {
    html += `<a href="${base}/${prev.slug}" class="prev-next-link prev"><span class="prev-next-label">← Previous</span><span class="prev-next-title">${escapeHtml(prev.title)}</span></a>`;
  } else {
    html += '<span></span>';
  }
  if (next) {
    html += `<a href="${base}/${next.slug}" class="prev-next-link next"><span class="prev-next-label">Next →</span><span class="prev-next-title">${escapeHtml(next.title)}</span></a>`;
  }
  html += '</nav>';
  return html;
}

function renderPageActions(): string {
  return `<div class="page-actions">
      <button class="page-actions-btn" aria-label="Page actions">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
      </button>
      <div class="page-actions-dropdown">
        <button data-action="copy-page">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          <span>Copy page</span>
        </button>
        <button data-action="copy-markdown">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span>Copy as Markdown</span>
        </button>
        <button data-action="open-markdown">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span>Open as Markdown</span>
        </button>
      </div>
    </div>`;
}

function renderThemeStyles(config: ProsifyConfig): string {
  const primary = config.theme?.primary || '#6366f1';
  const accentLight = config.theme?.accentLight || primary;
  const accentDark = config.theme?.accentDark || primary;
  return `:root { --color-primary: ${primary}; --color-primary-light: ${primary}18; --color-accent-light: ${accentLight}; --color-accent-dark: ${accentDark}; }`;
}

export function renderPage(options: RenderOptions): string {
  const { page, config, pages, navigation, prevPage, nextPage } = options;
  const siteName = escapeHtml(config.name);
  const pageTitle = escapeHtml(page.title);
  const base = getBase(config);
  const siteUrl = config.url ? config.url.replace(/\/$/, '') : '';

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle} - ${siteName}</title>
  <meta name="description" content="${escapeHtml(page.description || config.description || '')}">
  <link rel="alternate" type="text/markdown" href="${base}/${page.slug}.md">
  <link rel="stylesheet" href="${base}/assets/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${renderThemeStyles(config)}</style>
</head>
<body>
  <div class="layout">
    <header class="header">
      <button class="menu-toggle" aria-label="Toggle menu">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
      </button>
      <a href="${base}/" class="site-title">${config.logo ? `<img src="${config.logo}" alt="" class="site-logo">` : ''}${siteName}</a>
      <div class="header-actions">
        <button class="search-trigger" aria-label="Search" title="Search (Ctrl+K)">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <span class="search-shortcut">⌘K</span>
        </button>
        <button class="theme-toggle" aria-label="Toggle theme">
          <svg class="icon-sun" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          <svg class="icon-moon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
        </button>
      </div>
    </header>

    <aside class="sidebar">
      ${renderSidebar(navigation, page.slug, pages, base)}
    </aside>

    <main class="content">
      <article class="article">
        <div class="article-header">
          <div class="article-header-text">
            <h1>${pageTitle}</h1>
            ${page.readingTime ? `<span class="reading-time">${page.readingTime} min read</span>` : ''}
          </div>
          ${renderPageActions()}
        </div>
        <div class="prose">
          ${page.htmlContent}
        </div>
        ${renderPrevNext(prevPage, nextPage, base)}
      </article>
    </main>

    <aside class="aside">
      ${renderToc(page.headings)}
    </aside>
  </div>

  <!-- LLM-friendly: machine-readable reference to llms.txt -->
  <blockquote class="llm-info" aria-hidden="true">
    This documentation is available in machine-readable format at <a href="${base}/llms.txt">${siteUrl}${base}/llms.txt</a>
  </blockquote>

  <div class="search-modal" role="dialog" aria-hidden="true">
    <div class="search-backdrop"></div>
    <div class="search-dialog">
      <div class="search-input-wrapper">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input type="search" class="search-input" placeholder="Search documentation..." autocomplete="off">
        <kbd class="search-esc">Esc</kbd>
      </div>
      <div class="search-results"></div>
    </div>
  </div>

  ${config.footer ? `<footer class="footer">${escapeHtml(config.footer)}</footer>` : ''}

  <script>window.__PROSIFY_BASE__="${base}";</script>
  <script src="${base}/assets/script.js"></script>
</body>
</html>`;
}

export function renderHomepage(config: ProsifyConfig, pages: Page[], navigation: NavGroup[]): string {
  const siteName = escapeHtml(config.name);
  const desc = escapeHtml(config.description || '');
  const base = getBase(config);
  const siteUrl = config.url ? config.url.replace(/\/$/, '') : '';

  let navHtml = '';
  for (const group of navigation) {
    navHtml += `<div class="home-group"><h2>${escapeHtml(group.group)}</h2><ul>`;
    for (const slug of group.pages) {
      const page = pages.find((p) => p.slug === slug);
      if (!page) continue;
      navHtml += `<li><a href="${base}/${page.slug}">${escapeHtml(page.title)}</a>${page.description ? `<p>${escapeHtml(page.description)}</p>` : ''}</li>`;
    }
    navHtml += '</ul></div>';
  }

  return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${siteName}</title>
  <meta name="description" content="${desc}">
  <link rel="stylesheet" href="${base}/assets/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${renderThemeStyles(config)}</style>
</head>
<body>
  <div class="home">
    <header class="home-header">
      <h1>${siteName}</h1>
      ${desc ? `<p class="home-desc">${desc}</p>` : ''}
    </header>
    <div class="home-nav">
      ${navHtml}
    </div>
  </div>

  <!-- LLM-friendly: machine-readable reference to llms.txt -->
  <blockquote class="llm-info" aria-hidden="true">
    This documentation is available in machine-readable format at <a href="${base}/llms.txt">${siteUrl}${base}/llms.txt</a>
  </blockquote>

  <script>window.__PROSIFY_BASE__="${base}";</script>
  <script src="${base}/assets/script.js"></script>
</body>
</html>`;
}
