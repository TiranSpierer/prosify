(function() {
  'use strict';

  var BASE = window.__PROSIFY_BASE__ || '';

  // Theme
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

  // Mobile menu
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

  // Code copy buttons
  document.querySelectorAll('.shiki, pre').forEach((block) => {
    if (block.closest('.code-wrapper')) return;
    const wrapper = document.createElement('div');
    wrapper.className = 'code-wrapper';
    block.parentNode.insertBefore(wrapper, block);
    wrapper.appendChild(block);

    const btn = document.createElement('button');
    btn.className = 'copy-btn';
    btn.textContent = 'Copy';
    btn.addEventListener('click', () => {
      const code = block.querySelector('code')?.textContent || block.textContent;
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
      });
    });
    wrapper.appendChild(btn);
  });

  // Scroll spy for TOC
  const tocLinks = document.querySelectorAll('.toc-link');
  if (tocLinks.length > 0) {
    const headings = [];
    tocLinks.forEach((link) => {
      const id = link.getAttribute('href')?.slice(1);
      const el = id && document.getElementById(id);
      if (el) headings.push({ el, link });
    });

    function updateToc() {
      let active = headings[0];
      for (const h of headings) {
        if (h.el.getBoundingClientRect().top <= 100) active = h;
      }
      tocLinks.forEach((l) => l.classList.remove('active'));
      if (active) active.link.classList.add('active');
    }
    window.addEventListener('scroll', updateToc, { passive: true });
    updateToc();
  }

  // Search
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

  // Hot reload (dev mode)
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    try {
      const ws = new WebSocket(`ws://${location.host}/__prosify_ws`);
      ws.onmessage = (e) => { if (e.data === 'reload') location.reload(); };
      ws.onclose = () => setTimeout(() => location.reload(), 1000);
    } catch (e) {}
  }
})();
