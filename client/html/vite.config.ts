import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import type { Connect, HtmlTagDescriptor, Plugin } from 'vite';
import { defineConfig } from 'vitest/config';
import { APP_NAME } from './app.config';

// SPEC section 8: nothing loads from a third party, ever. data: is for the marker and hand-stroke images in tokens.css.
export const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "base-uri 'none'",
  "form-action 'none'",
].join('; ');

const FIXTURE = process.env.RECLAIM_FIXTURE_DIR ?? resolve(import.meta.dirname, 'fake');
const DATA_FILE = /^(manifest|status|snapshot-v\d+\.[0-9a-f]+)\.json$/;

const MANIFEST = JSON.stringify({
  id: './',
  name: APP_NAME,
  short_name: APP_NAME,
  description: 'How much will be left, and what is going to take it.',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#EEEFEA',
  theme_color: '#EEEFEA',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
});

/** Dev and preview only: invented data, never written into dist. Snapshots are no-store, as the box must serve them. */
const serveFixture: Connect.NextHandleFunction = (req, res, next) => {
  const name = (req.url ?? '').split('?')[0].replace(/^\/+/, '');
  const file = resolve(FIXTURE, name);
  if (!DATA_FILE.test(name) || !existsSync(file) || !statSync(file).isFile()) return next();
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');
  res.end(readFileSync(file));
};

/** Names the app, adds the CSP, and writes a shell-only service worker. dist holds no data, so nothing private can ship in it. */
function appShell(): Plugin {
  return {
    name: 'app-shell',
    configureServer(server) {
      server.middlewares.use(serveFixture);
      server.middlewares.use('/manifest.webmanifest', (_req, res) => {
        res.setHeader('Content-Type', 'application/manifest+json');
        res.end(MANIFEST);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveFixture);
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const tags: HtmlTagDescriptor[] = [{ tag: 'link', attrs: { rel: 'manifest', href: './manifest.webmanifest' }, injectTo: 'head' }];
        // Dev needs Vite's inline scripts, so the policy applies to builds only.
        if (!ctx.server) tags.unshift({ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' });
        // Preloading the figure faces keeps the hero from reflowing when they arrive.
        for (const f of Object.keys(ctx.bundle ?? {})) {
          if (/Vollkorn.*\.woff2$/.test(f)) tags.push({ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `./${f}`, crossorigin: true }, injectTo: 'head' });
        }
        return { html: html.replaceAll('__APP_NAME__', APP_NAME), tags };
      },
    },
    generateBundle: {
      order: 'post',
      handler(_opts, bundle) {
        this.emitFile({ type: 'asset', fileName: 'manifest.webmanifest', source: MANIFEST });
        const statics = readdirSync(resolve(import.meta.dirname, 'public'));
        const shell = [...new Set([...Object.keys(bundle), ...statics, 'manifest.webmanifest'])].filter((f) => !DATA_FILE.test(f) && f !== 'sw.js' && f !== 'OFL-fonts.txt');
        const hash = createHash('sha256').update(shell.sort().join()).digest('hex').slice(0, 10);
        const template = readFileSync(resolve(import.meta.dirname, 'src/sw.template.js'), 'utf8');
        const source = template.replace('__CACHE__', `shell-${hash}`).replace('__SHELL__', JSON.stringify(shell.map((f) => `./${f}`)));
        this.emitFile({ type: 'asset', fileName: 'sw.js', source });
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [react(), appShell()],
  build: { assetsInlineLimit: 0, sourcemap: false },
  test: { environment: 'node', include: ['src/**/*.test.ts'], testTimeout: 60000 },
});
