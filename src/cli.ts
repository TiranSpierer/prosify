#!/usr/bin/env node
import { cac } from 'cac';
import { resolve } from 'path';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { build } from './build.js';
import { startDevServer } from './dev-server.js';

const cli = cac('prosify');

cli
  .command('build', 'Build static documentation site')
  .option('--docs <path>', 'Docs source directory', { default: './docs' })
  .option('--config <path>', 'Config file path')
  .option('--out <path>', 'Output directory', { default: './dist/docs' })
  .option('--base <url>', 'Base URL for llms.txt links')
  .option('--base-path <path>', 'URL path prefix (e.g. /docs) for subpath deployments')
  .action(async (options) => {
    await build({
      docsDir: resolve(options.docs),
      outDir: resolve(options.out),
      configPath: options.config,
      baseUrl: options.base,
      basePath: options.basePath,
    });
  });

cli
  .command('dev', 'Start development server with hot reload')
  .option('--docs <path>', 'Docs source directory', { default: './docs' })
  .option('--config <path>', 'Config file path')
  .option('--out <path>', 'Output directory', { default: './dist/docs' })
  .option('--port <number>', 'Server port', { default: 3333 })
  .option('--open', 'Open browser on start')
  .action(async (options) => {
    await startDevServer({
      docsDir: resolve(options.docs),
      outDir: resolve(options.out),
      configPath: options.config,
      port: Number(options.port),
      open: options.open,
    });
  });

cli
  .command('init', 'Initialize a new docs project')
  .option('--docs <path>', 'Docs directory to create', { default: './docs' })
  .action((options) => {
    const docsDir = resolve(options.docs);

    if (existsSync(docsDir)) {
      console.log(`\x1b[33m⚠\x1b[0m  Directory already exists: ${docsDir}`);
    } else {
      mkdirSync(docsDir, { recursive: true });
    }

    const configPath = resolve('docs.json');
    if (!existsSync(configPath)) {
      writeFileSync(configPath, JSON.stringify({
        name: 'My Project',
        description: 'Project documentation.',
        url: 'https://example.com/docs',
        navigation: [
          { group: 'Getting Started', pages: ['introduction', 'installation'] },
          { group: 'Guides', pages: ['configuration'] },
        ],
        theme: { primary: '#3b82f6' },
      }, null, 2) + '\n');
      console.log(`\x1b[32m✓\x1b[0m Created ${configPath}`);
    }

    const introPath = resolve(docsDir, 'introduction.md');
    if (!existsSync(introPath)) {
      writeFileSync(introPath, `---
title: Introduction
description: Welcome to the project documentation.
---

# Introduction

Welcome to the documentation. This is your first page.

## Getting Started

Edit this file at \`docs/introduction.md\` to get started.

:::tip
You can use callouts to highlight important information.
:::

## Next Steps

- Edit \`docs.json\` to configure navigation and site metadata
- Add more \`.md\` files to the docs directory
- Run \`prosify dev\` to preview your changes
`);
      console.log(`\x1b[32m✓\x1b[0m Created ${introPath}`);
    }

    const installPath = resolve(docsDir, 'installation.md');
    if (!existsSync(installPath)) {
      writeFileSync(installPath, `---
title: Installation
description: How to install and set up the project.
---

# Installation

## Requirements

- Node.js 18 or later

## Install

\`\`\`bash
npm install prosify
\`\`\`

## Build

\`\`\`bash
npx prosify build
\`\`\`

Your static docs will be generated in \`dist/docs/\`.

## Development

\`\`\`bash
npx prosify dev
\`\`\`

This starts a local server with hot reload at \`http://localhost:3333\`.
`);
      console.log(`\x1b[32m✓\x1b[0m Created ${installPath}`);
    }

    const configDirPath = resolve(docsDir, 'configuration.md');
    if (!existsSync(configDirPath)) {
      writeFileSync(configDirPath, `---
title: Configuration
description: All configuration options for the docs site.
---

# Configuration

Prosify is configured via a \`docs.json\` file in your project root.

## Site Metadata

| Field | Type | Description |
|-------|------|-------------|
| \`name\` | string | Site name shown in header and llms.txt |
| \`description\` | string | Site description for meta tags and llms.txt |
| \`url\` | string | Base URL for generated llms.txt links |
| \`logo\` | string | Path to logo image |

## Navigation

\`\`\`json
{
  "navigation": [
    {
      "group": "Getting Started",
      "pages": ["introduction", "installation"]
    }
  ]
}
\`\`\`

Pages are referenced by their filename without the \`.md\` extension.

## Theme

\`\`\`json
{
  "theme": {
    "primary": "#3b82f6",
    "dark": true
  }
}
\`\`\`

:::note
If no \`docs.json\` exists, prosify auto-discovers markdown files and generates navigation alphabetically.
:::
`);
      console.log(`\x1b[32m✓\x1b[0m Created ${configDirPath}`);
    }

    console.log(`\n  Run \x1b[36mprosify dev\x1b[0m to preview your docs.\n`);
  });

cli.help();
cli.version('0.1.1');
cli.parse();
