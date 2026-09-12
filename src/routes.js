export const PAGE_PATHS = {
  overview: '/',
  guide: '/guide',
  decisions: '/decisions',
  reports: '/reports',
  journal: '/journal',
  debrief: '/debrief',
  model: '/model',
};

const REPORT_KINDS = {
  factory: 'factory',
  finance: 'finance',
  housing: 'housing',
  social: 'social',
  tourism: 'tourism',
};

const ROUTES = new Map([
  [PAGE_PATHS.overview, { view: 'overview', reportKind: null }],
  [PAGE_PATHS.guide, { view: 'guide', reportKind: null }],
  [PAGE_PATHS.decisions, { view: 'decisions', reportKind: null }],
  [PAGE_PATHS.reports, { view: 'reports', reportKind: 'factory' }],
  [PAGE_PATHS.journal, { view: 'journal', reportKind: null }],
  [PAGE_PATHS.debrief, { view: 'debrief', reportKind: null }],
  [PAGE_PATHS.model, { view: 'model', reportKind: null }],
  ['/index.html', { view: 'overview', reportKind: null }],
]);

for (const reportKind of Object.values(REPORT_KINDS)) {
  ROUTES.set(`${PAGE_PATHS.reports}/${reportKind}`, { view: 'reports', reportKind });
}

export function getRepoPrefix() {
  if (typeof window !== 'undefined' && window.location) {
    if (window.location.hostname.endsWith('github.io')) {
      const seg = window.location.pathname.split('/')[1];
      return seg ? `/${seg}` : '';
    }
    if (window.location.pathname.startsWith('/lohhausen')) {
      return '/lohhausen';
    }
  }
  return '';
}

export function resolveRoute(pathname) {
  if (typeof pathname !== 'string') return null;
  const prefix = getRepoPrefix();
  let canonical = pathname;
  if (prefix && (canonical === prefix || canonical.startsWith(`${prefix}/`))) {
    canonical = canonical.slice(prefix.length);
    if (canonical === '') canonical = '/';
  }
  const route = ROUTES.get(canonical);
  return route ? { ...route } : null;
}

export function pathFor(view, reportKind) {
  if (typeof view !== 'string' || !Object.hasOwn(PAGE_PATHS, view)) {
    throw new Error(`Unknown view: ${String(view)}`);
  }

  let canonical;
  if (view !== 'reports') canonical = PAGE_PATHS[view];
  else if (reportKind === undefined) canonical = PAGE_PATHS.reports;
  else if (typeof reportKind !== 'string' || !Object.hasOwn(REPORT_KINDS, reportKind)) {
    throw new Error(`Unknown report kind: ${String(reportKind)}`);
  } else {
    canonical = `${PAGE_PATHS.reports}/${REPORT_KINDS[reportKind]}`;
  }

  const prefix = getRepoPrefix();
  if (prefix) {
    return canonical === '/' ? `${prefix}/` : `${prefix}${canonical}`;
  }
  return canonical;
}
