import type { Page, SearchEntry } from './types.js';

export function buildSearchIndex(pages: Page[]): SearchEntry[] {
  return pages.map((page) => ({
    id: page.slug,
    title: page.title,
    description: page.description,
    body: page.rawContent
      .replace(/^---[\s\S]*?---\n/, '')
      .replace(/#{1,6}\s/g, '')
      .replace(/[*_`~\[\]()]/g, '')
      .replace(/\n{2,}/g, '\n')
      .slice(0, 5000),
    slug: page.slug,
  }));
}
