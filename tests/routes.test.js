import assert from 'node:assert/strict';
import test from 'node:test';

import { PAGE_PATHS, pathFor, resolveRoute } from '../src/routes.js';

test('resolves every top-level page path and the index.html overview alias', () => {
  const expected = {
    overview: '/',
    guide: '/guide',
    decisions: '/decisions',
    reports: '/reports',
    journal: '/journal',
    debrief: '/debrief',
    model: '/model',
  };

  assert.deepEqual(PAGE_PATHS, expected);
  for (const [view, pathname] of Object.entries(expected)) {
    assert.deepEqual(resolveRoute(pathname), {
      view,
      reportKind: view === 'reports' ? 'factory' : null,
    });
  }
  assert.deepEqual(resolveRoute('/index.html'), { view: 'overview', reportKind: null });
});

test('resolves each report subtype from its canonical subpath', () => {
  for (const reportKind of ['factory', 'finance', 'housing', 'social', 'tourism']) {
    assert.deepEqual(resolveRoute(`/reports/${reportKind}`), { view: 'reports', reportKind });
  }
});

test('pathFor creates canonical paths that resolve back to their view', () => {
  for (const view of Object.keys(PAGE_PATHS)) {
    const pathname = pathFor(view);
    assert.deepEqual(resolveRoute(pathname), {
      view,
      reportKind: view === 'reports' ? 'factory' : null,
    });
  }

  for (const reportKind of ['factory', 'finance', 'housing', 'social', 'tourism']) {
    const pathname = pathFor('reports', reportKind);
    assert.equal(pathname, `/reports/${reportKind}`);
    assert.deepEqual(resolveRoute(pathname), { view: 'reports', reportKind });
  }
});

test('returns null for unknown or non-canonical routes', () => {
  for (const pathname of ['/missing', '/reports/unknown', '/guide/', '/reports/factory/']) {
    assert.equal(resolveRoute(pathname), null);
  }
});

test('pathFor rejects unknown views and report kinds', () => {
  assert.throws(() => pathFor('missing'), /unknown view/i);
  assert.throws(() => pathFor('reports', 'unknown'), /unknown report kind/i);
});
