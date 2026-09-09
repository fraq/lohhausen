import assert from 'node:assert/strict';

// Run against the actual listening process: unit tests cannot detect a stale server.
const origin = new URL(process.env.SIMULATOR_URL || 'http://127.0.0.1:4173');
const paths = ['/', '/guide', '/decisions', '/reports', '/journal', '/debrief', '/model',
  ...['finance', 'factory', 'housing', 'social', 'tourism'].map(kind => `/reports/${kind}`)];
for (const path of paths) {
  const response = await fetch(new URL(`${path}?lang=fr`, origin));
  assert.equal(response.status, 200, path);
  assert.match(response.headers.get('content-type') || '', /text\/html/, path);
  assert.match(await response.text(), /src\/app\.js/, path);
}

const pending = [new URL('/src/app.js', origin)];
const visited = new Set();
while (pending.length) {
  const url = pending.pop();
  if (visited.has(url.href)) continue;
  visited.add(url.href);
  const response = await fetch(url);
  assert.equal(response.status, 200, `Module unavailable: ${url.pathname}; restart the server after adding modules.`);
  assert.match(response.headers.get('content-type') || '', /javascript/, url.pathname);
  const source = await response.text();
  for (const match of source.matchAll(/\b(?:import|export)\s+(?:[^;]*?\bfrom\s*)?['"]([^'"]+)['"]/g)) {
    if (!match[1].startsWith('.')) continue;
    pending.push(new URL(match[1], url));
  }
}

for (const path of ['/styles.css', '/favicon.svg']) {
  assert.equal((await fetch(new URL(path, origin))).status, 200, path);
}
for (const path of ['/AGENTS.md', '/COORDINATION/state/codex.md', '/knowledge/internal-book-review.md', '/not-a-route']) {
  assert.equal((await fetch(new URL(path, origin))).status, 404, path);
}
console.log(`HTTP verification passed: ${paths.length} pages, ${visited.size} application modules, assets and private-file boundaries.`);
