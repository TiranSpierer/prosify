export function toSlug(filePath: string): string {
  return filePath
    .replace(/\.md$/, '')
    .replace(/\\/g, '/')
    .replace(/\/index$/, '')
    .toLowerCase()
    .replace(/[^a-z0-9/\-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function titleFromSlug(slug: string): string {
  const last = slug.split('/').pop() || slug;
  return last
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function stripFrontmatter(content: string): string {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  return match ? match[2].replace(/^\n+/, '') : content;
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
