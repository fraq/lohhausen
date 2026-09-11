import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolveRoute } from '../src/routes.js';

const assets = new Map([
  ['/styles.css', ['../public/styles.css', 'text/css; charset=utf-8']],
  ['/favicon.svg', ['../public/favicon.svg', 'image/svg+xml']],
  ['/src/app.js', ['../src/app.js', 'text/javascript; charset=utf-8']],
  ['/src/model.js', ['../src/model.js', 'text/javascript; charset=utf-8']],
  ['/src/routes.js', ['../src/routes.js', 'text/javascript; charset=utf-8']],
  ['/src/i18n.js', ['../src/i18n.js', 'text/javascript; charset=utf-8']],
  ['/src/locales/en.js', ['../src/locales/en.js', 'text/javascript; charset=utf-8']],
  ['/src/locales/de.js', ['../src/locales/de.js', 'text/javascript; charset=utf-8']],
  ['/src/locales/fr.js', ['../src/locales/fr.js', 'text/javascript; charset=utf-8']],
  ['/src/locales/extra.js', ['../src/locales/extra.js', 'text/javascript; charset=utf-8']],
  ['/src/locales/cockpit.js', ['../src/locales/cockpit.js', 'text/javascript; charset=utf-8']],
  ['/src/causal.js', ['../src/causal.js', 'text/javascript; charset=utf-8']],
  ['/src/debrief.js', ['../src/debrief.js', 'text/javascript; charset=utf-8']],
  ['/src/counterfactual.js', ['../src/counterfactual.js', 'text/javascript; charset=utf-8']],
  ['/src/scenarios.js', ['../src/scenarios.js', 'text/javascript; charset=utf-8']],
  ['/src/visuals.js', ['../src/visuals.js', 'text/javascript; charset=utf-8']],
  ['/tests/browser-checks.js', ['../tests/browser-checks.js', 'text/javascript; charset=utf-8']],
]);
const page = ['../public/index.html', 'text/html; charset=utf-8'];
const port = Number(process.env.PORT || 4173);
const server = createServer(async (request, response) => {
  if (!['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  const pathname = new URL(request.url, 'http://localhost').pathname;
  const route = resolveRoute(pathname) ? page : assets.get(pathname);
  if (!route) {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Не найдено');
    return;
  }
  try {
    const body = await readFile(fileURLToPath(new URL(route[0], import.meta.url)));
    response.writeHead(200, {
      'Content-Type': route[1], 'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Файл пока недоступен');
  }
});
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE' ? `Порт ${port} занят. Запустите с другим PORT.` : error.message);
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => console.log(`Лоххаузен: http://127.0.0.1:${port}`));
