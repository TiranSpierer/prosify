import { createServer } from 'http';
import { resolve } from 'path';
import { watch } from 'chokidar';
import sirv from 'sirv';
import { WebSocketServer } from 'ws';
import { build } from './build.js';
import type { BuildOptions } from './types.js';

export async function startDevServer(options: BuildOptions & { port?: number; open?: boolean }): Promise<void> {
  const { port = 3333, open = false, ...buildOpts } = options;
  const outDir = resolve(buildOpts.outDir);
  const docsDir = resolve(buildOpts.docsDir);

  // Initial build
  await build(buildOpts);

  // Determine base path from config for URL stripping in dev
  const { loadConfig } = await import('./config.js');
  const config = loadConfig(buildOpts.configPath, buildOpts.docsDir);
  if (buildOpts.basePath) config.basePath = buildOpts.basePath;
  const basePath = (config.basePath || '').replace(/\/$/, '');

  // Static file server
  const serve = sirv(outDir, { single: false, dev: true, extensions: ['html'] });
  const server = createServer((req, res) => {
    if (req.url === '/__prosify_ws') return;
    // Strip basePath prefix so sirv can find files in outDir
    if (basePath && req.url?.startsWith(basePath)) {
      req.url = req.url.slice(basePath.length) || '/';
    }
    serve(req, res, () => {
      res.writeHead(404);
      res.end('Not found');
    });
  });

  // WebSocket for hot reload
  const wss = new WebSocketServer({ server, path: '/__prosify_ws' });

  function notifyClients() {
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send('reload');
    }
  }

  // Watch for changes
  let building = false;
  const watcher = watch([docsDir, buildOpts.configPath || 'docs.json'].filter(Boolean), {
    ignoreInitial: true,
    ignored: ['**/node_modules/**', outDir],
  });

  watcher.on('all', async (event, path) => {
    if (building) return;
    building = true;
    console.log(`\x1b[2m[${event}] ${path}\x1b[0m`);
    try {
      await build(buildOpts);
      notifyClients();
    } catch (e: any) {
      console.error('\x1b[31mBuild error:\x1b[0m', e.message);
    }
    building = false;
  });

  server.listen(port, () => {
    console.log(`\n  \x1b[36mprosify\x1b[0m dev server running at:\n`);
    console.log(`  → Local:   \x1b[32mhttp://localhost:${port}\x1b[0m`);
    console.log(`  → Docs:    \x1b[2m${docsDir}\x1b[0m`);
    console.log(`  → Output:  \x1b[2m${outDir}\x1b[0m\n`);

    if (open) {
      const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      import('child_process').then((cp) => cp.exec(`${cmd} http://localhost:${port}`));
    }
  });

  process.on('SIGINT', () => {
    watcher.close();
    server.close();
    process.exit(0);
  });
}
