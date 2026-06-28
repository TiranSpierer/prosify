(function() {
  'use strict';

  var BASE = window.__PROSIFY_BASE__ || '';

  // ---------------------------------------------------------------
  // Theme
  // ---------------------------------------------------------------
  const html = document.documentElement;
  const stored = localStorage.getItem('prosify-theme');
  if (stored) html.setAttribute('data-theme', stored);
  else if (window.matchMedia('(prefers-color-scheme: light)').matches) html.setAttribute('data-theme', 'light');

  const themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      html.setAttribute('data-theme', next);
      localStorage.setItem('prosify-theme', next);
    });
  }

  // ---------------------------------------------------------------
  // Mobile menu
  // ---------------------------------------------------------------
  const menuToggle = document.querySelector('.menu-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && !menuToggle.contains(e.target)) {
        sidebar.classList.remove('open');
      }
    });
  }

  // ---------------------------------------------------------------
  // Code blocks — add header with language label + copy button
  // ---------------------------------------------------------------
  document.querySelectorAll('.prose .shiki, .prose pre').forEach((block) => {
    if (block.closest('.code-block-container')) return;
    if (block.tagName === 'PRE' && block.closest('.shiki')) return;

    const container = document.createElement('div');
    container.className = 'code-block-container';

    // Determine language
    var lang = '';
    if (block.classList.contains('shiki')) {
      // Shiki blocks have classes like "shiki github-dark" and a data-lang or we can check the code element
      var codeEl = block.querySelector('code');
      if (codeEl) {
        var langClass = Array.from(codeEl.classList).find(function(c) { return c.startsWith('language-'); });
        if (langClass) lang = langClass.replace('language-', '');
      }
    } else {
      var codeChild = block.querySelector('code');
      if (codeChild) {
        var lc = Array.from(codeChild.classList).find(function(c) { return c.startsWith('language-'); });
        if (lc) lang = lc.replace('language-', '');
      }
    }

    // Also check data-language attribute (set by our markdown renderer)
    if (!lang && block.dataset && block.dataset.language) {
      lang = block.dataset.language;
    }

    // Build header
    var header = document.createElement('div');
    header.className = 'code-block-header';

    var langSpan = document.createElement('span');
    langSpan.className = 'code-lang';
    langSpan.textContent = lang || 'code';
    header.appendChild(langSpan);

    var copyBtn = document.createElement('button');
    copyBtn.className = 'code-copy-btn';
    copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>';
    copyBtn.addEventListener('click', function() {
      var code = block.querySelector('code');
      var text = code ? code.textContent : block.textContent;
      navigator.clipboard.writeText(text).then(function() {
        copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg><span>Copied!</span>';
        copyBtn.classList.add('copied');
        setTimeout(function() {
          copyBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>Copy</span>';
          copyBtn.classList.remove('copied');
        }, 2000);
      });
    });
    header.appendChild(copyBtn);

    block.parentNode.insertBefore(container, block);
    container.appendChild(header);
    container.appendChild(block);
  });

  // ---------------------------------------------------------------
  // Page actions dropdown
  // ---------------------------------------------------------------
  var pageActionsBtn = document.querySelector('.page-actions-btn');
  var pageActionsDropdown = document.querySelector('.page-actions-dropdown');

  if (pageActionsBtn && pageActionsDropdown) {
    pageActionsBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      pageActionsDropdown.classList.toggle('open');
    });

    document.addEventListener('click', function(e) {
      if (!pageActionsDropdown.contains(e.target)) {
        pageActionsDropdown.classList.remove('open');
      }
    });

    // Copy page as text
    var copyPageBtn = document.querySelector('[data-action="copy-page"]');
    if (copyPageBtn) {
      copyPageBtn.addEventListener('click', function() {
        var prose = document.querySelector('.prose');
        if (prose) {
          navigator.clipboard.writeText(prose.innerText).then(function() {
            showPageActionFeedback(copyPageBtn, 'Copied!');
          });
        }
        pageActionsDropdown.classList.remove('open');
      });
    }

    // Copy as Markdown
    var copyMdBtn = document.querySelector('[data-action="copy-markdown"]');
    if (copyMdBtn) {
      copyMdBtn.addEventListener('click', function() {
        var mdLink = document.querySelector('link[rel="alternate"][type="text/markdown"]');
        if (mdLink) {
          fetch(mdLink.href).then(function(r) { return r.text(); }).then(function(md) {
            navigator.clipboard.writeText(md).then(function() {
              showPageActionFeedback(copyMdBtn, 'Copied!');
            });
          });
        }
        pageActionsDropdown.classList.remove('open');
      });
    }

    // Open as Markdown
    var openMdBtn = document.querySelector('[data-action="open-markdown"]');
    if (openMdBtn) {
      openMdBtn.addEventListener('click', function() {
        var mdLink = document.querySelector('link[rel="alternate"][type="text/markdown"]');
        if (mdLink) {
          window.open(mdLink.href, '_blank');
        }
        pageActionsDropdown.classList.remove('open');
      });
    }
  }

  function showPageActionFeedback(btn, text) {
    var span = btn.querySelector('span');
    var original = span.textContent;
    span.textContent = text;
    setTimeout(function() { span.textContent = original; }, 1500);
  }

  // ---------------------------------------------------------------
  // Scroll spy for TOC
  // ---------------------------------------------------------------
  const tocLinks = document.querySelectorAll('.toc-link');
  if (tocLinks.length > 0) {
    const headings = [];
    tocLinks.forEach((link) => {
      const id = link.getAttribute('href')?.slice(1);
      const el = id && document.getElementById(id);
      if (el) headings.push({ el, link });
    });

    let ticking = false;
    function updateToc() {
      let active = headings[0];
      const scrollTop = window.scrollY + 100;
      for (const h of headings) {
        if (h.el.getBoundingClientRect().top + window.scrollY <= scrollTop) active = h;
      }
      tocLinks.forEach((l) => l.classList.remove('active'));
      if (active) active.link.classList.add('active');
      ticking = false;
    }

    window.addEventListener('scroll', function() {
      if (!ticking) {
        requestAnimationFrame(updateToc);
        ticking = true;
      }
    }, { passive: true });
    updateToc();
  }

  // ---------------------------------------------------------------
  // Search
  // ---------------------------------------------------------------
  let searchIndex = null;
  let MiniSearch = null;
  const searchModal = document.querySelector('.search-modal');
  const searchInput = document.querySelector('.search-input');
  const searchResults = document.querySelector('.search-results');
  const searchTrigger = document.querySelector('.search-trigger');

  function openSearch() {
    if (!searchModal) return;
    searchModal.setAttribute('aria-hidden', 'false');
    searchInput?.focus();
    loadSearchIndex();
  }

  function closeSearch() {
    if (!searchModal) return;
    searchModal.setAttribute('aria-hidden', 'true');
    if (searchInput) searchInput.value = '';
    if (searchResults) searchResults.innerHTML = '';
  }

  if (searchTrigger) searchTrigger.addEventListener('click', openSearch);
  document.querySelector('.search-backdrop')?.addEventListener('click', closeSearch);

  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
    if (e.key === 'Escape') closeSearch();
  });

  async function loadSearchIndex() {
    if (searchIndex) return;
    try {
      const [indexData, ms] = await Promise.all([
        fetch(BASE + '/assets/search-index.json').then((r) => r.json()),
        import('https://cdn.jsdelivr.net/npm/minisearch@7/dist/es/index.min.js').then((m) => m.default || m),
      ]);
      MiniSearch = ms;
      searchIndex = new MiniSearch({ fields: ['title', 'description', 'body'], storeFields: ['title', 'description', 'slug'], searchOptions: { prefix: true, fuzzy: 0.2 } });
      searchIndex.addAll(indexData);
    } catch (e) {
      console.error('Failed to load search index:', e);
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.trim();
      if (!q || !searchIndex) {
        searchResults.innerHTML = q ? '<div class="search-empty">Loading...</div>' : '';
        return;
      }
      const results = searchIndex.search(q, { limit: 8 });
      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-empty">No results found</div>';
        return;
      }
      searchResults.innerHTML = results.map((r) =>
        `<a href="${BASE}/${r.slug}" class="search-result"><div class="search-result-title">${escapeHtml(r.title)}</div>${r.description ? `<div class="search-result-desc">${escapeHtml(r.description)}</div>` : ''}</a>`
      ).join('');
    });
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ---------------------------------------------------------------
  // Hot reload (dev mode)
  // ---------------------------------------------------------------
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    try {
      const ws = new WebSocket(`ws://${location.host}/__prosify_ws`);
      ws.onmessage = (e) => { if (e.data === 'reload') location.reload(); };
      ws.onclose = () => setTimeout(() => location.reload(), 1000);
    } catch (e) {}
  }
})();
