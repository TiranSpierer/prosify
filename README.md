# prosify

Static documentation site generator with `llms.txt` and per-page `.md` URLs baked in.

Point it at a folder of markdown files, get a beautiful docs site that's readable by both humans and AI.

## Features

- **AI-first** — auto-generates `llms.txt`, `llms-full.txt`, and per-page `.md` endpoints
- **Zero config** — works with just a `docs/` folder. Add `docs.json` for navigation/theming
- **Beautiful out of the box** — dark/light theme, responsive sidebar, syntax highlighting
- **Search** — client-side full-text search (Ctrl+K)
- **Markdown extensions** — callouts (`:::tip`, `:::warning`), task lists, code highlighting via Shiki
- **Static output** — deploy anywhere (nginx, Express, Vercel, Netlify, S3, GitHub Pages)
- **Fast** — builds in <500ms for typical docs, hot reload in dev mode
- **Tiny** — ~5KB client JS, no framework dependency

## Quick Start

```bash
npx prosify init
npx prosify dev
```

## Install

```bash
npm install prosify
```

## Usage

### Build

```bash
npx prosify build
```

Generates static files in `dist/docs/`:

```
dist/docs/
├── index.html              # Homepage
├── llms.txt                # LLM index
├── llms-full.txt           # All docs concatenated
├── introduction/index.html # HTML page
├── introduction.md         # Raw markdown (no frontmatter)
├── assets/
│   ├── style.css
│   ├── script.js
│   └── search-index.json
```

### Development

```bash
npx prosify dev
```

Starts a local server at `http://localhost:3333` with hot reload.

### CLI Options

```
prosify build [options]
  --docs <path>    Docs source directory (default: ./docs)
  --config <path>  Config file path (default: ./docs.json)
  --out <path>     Output directory (default: ./dist/docs)
  --base <url>     Base URL for llms.txt links

prosify dev [options]
  --port <number>  Server port (default: 3333)
  --open           Open browser on start

prosify init
  --docs <path>    Docs directory to create (default: ./docs)
```

## Configuration

Create a `docs.json` in your project root:

```json
{
  "name": "My Project",
  "description": "Project documentation.",
  "url": "https://mysite.com/docs",
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["introduction", "installation"]
    },
    {
      "group": "Guides",
      "pages": ["configuration", "deployment"]
    }
  ],
  "theme": {
    "primary": "#3b82f6"
  }
}
```

If no `docs.json` exists, prosify auto-discovers all `.md` files and generates navigation alphabetically.

## Page Frontmatter

Each markdown file can have optional YAML frontmatter:

```yaml
---
title: Getting Started
description: How to install and configure the project.
order: 1
---
```

- `title` — page title (falls back to first H1, then filename)
- `description` — used in `llms.txt` and HTML meta tags

## Markdown Extensions

### Callouts

```markdown
:::tip Title
Helpful tip here.
:::

:::warning
Be careful about this.
:::

:::note
Informational note.
:::

:::danger
Critical warning.
:::
```

### Code Blocks

Syntax highlighted via Shiki with 20+ languages. Supports dual theme (light/dark).

### Task Lists

```markdown
- [x] Completed item
- [ ] Pending item
```

## Integration

### Express

```js
app.use('/docs', express.static('dist/docs'));
```

### Nginx

```nginx
location /docs/ {
    alias /var/www/dist/docs/;
    try_files $uri $uri/index.html =404;
}
```

### Vercel

```json
{ "rewrites": [{ "source": "/docs/(.*)", "destination": "/docs/$1/index.html" }] }
```

### package.json

```json
{
  "scripts": {
    "docs:build": "prosify build",
    "docs:dev": "prosify dev"
  }
}
```

## Programmatic API

```ts
import { build, loadConfig } from 'prosify';

const config = loadConfig('./docs.json');
await build({
  docsDir: './docs',
  outDir: './dist/docs',
});
```

## How llms.txt Works

The build automatically generates `/llms.txt` following the [llmstxt.org](https://llmstxt.org) specification:

```markdown
# My Project

> Project documentation.

## Getting Started

- [Introduction](https://mysite.com/docs/introduction.md): Welcome to the project.
- [Installation](https://mysite.com/docs/installation.md): How to install.
```

Every page is also available as raw markdown by appending `.md` to the URL — no server logic needed, it's a real file.

## License

MIT
