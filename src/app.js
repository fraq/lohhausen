import { createGame, setPolicies, startProject, advance, requestReport, serializeGame, deserializeGame, summarize, POLICY_CONFIG, PROJECTS } from './model.js';
import { icon, cityIllustration, sparkline, trendChart } from './visuals.js';
import { resolveRoute, pathFor } from './routes.js';
import { languageFrom, localizedPath, translate, localizeDocument, wikiFor } from './i18n.js';
import { ADVISORS, CAUSAL_LOOPS, getAdvisorDiagnosis, explainStepCauses, detectCognitiveTraps, getPolicyWhatIf } from './causal.js';

const SAVE_KEY = 'lohhausen-save-v1';
const LANGUAGE_KEY = 'lohhausen-language';
let storedLanguage = 'ru';
try { storedLanguage = localStorage.getItem(LANGUAGE_KEY) || 'ru'; } catch { /* URL choice still works when storage is unavailable. */ }
let language = languageFrom(window.location.search, storedLanguage);
window.history.replaceState(null, '', localizedPath(`${location.pathname}${location.search}${location.hash}`, language));
const app = document.querySelector('#app');
let number = new Intl.NumberFormat(language, { maximumFractionDigits: 1 });
let integer = new Intl.NumberFormat(language, { maximumFractionDigits: 0 });
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const fmt = value => number.format(Number(value) || 0);
const money = value => `${fmt(value)} тыс. м.`;
const percent = value => `${fmt(value)}%`;
const monthLabel = month => month === 0 ? 'Начало управления' : `Месяц ${month}`;
const reportPeriod = month => month === 0 ? 'на начало управления' : `за месяц ${month}`;
const signed = value => `${value > 0 ? '+' : ''}${fmt(value)}`;

let game = createGame();
const initialRoute = resolveRoute(window.location.pathname);
let view = initialRoute?.view || 'overview';
let reportKind = initialRoute?.reportKind || 'factory';
let chartMetric = 'finance';
let activeLoopId = 'tax_loop';
let notice = '';
let errorMessage = '';
let storageBlocked = false;
let saved = false;

try {
  const raw = localStorage.getItem(SAVE_KEY);
  if (raw) {
    const loaded = deserializeGame(raw);
    if (loaded instanceof Error) throw loaded;
    game = loaded;
    saved = true;
  }
} catch (error) {
  errorMessage = `Сохранение не удалось прочитать. ${error.message} Начните новую игру, чтобы продолжить; исходная запись пока сохранена.`;
  storageBlocked = true;
}

const navigation = [
  ['overview', 'Кабинет бургомистра'],
  ['guide', 'Как играть'],
  ['decisions', 'Решения и проекты'],
  ['reports', 'Отчеты служб'],
  ['journal', 'Дневник решений'],
  ['debrief', 'Разбор'],
  ['model', 'О модели'],
];

const reports = {
  factory: 'Часовая фабрика',
  finance: 'Финансы',
  housing: 'Жилье',
  social: 'Жители и услуги',
  tourism: 'Туризм',
};

const navigationPath = (nextView, nextReport) => localizedPath(`${pathFor(nextView, nextReport)}${location.search}${location.hash}`, language);

function setRoute(nextView, nextReport) {
  const path = navigationPath(nextView, nextReport);
  view = nextView;
  if (nextView === 'reports') reportKind = nextReport || 'factory';
  if (`${location.pathname}${location.search}${location.hash}` !== path) window.history.pushState(null, '', path);
}

function renderNavigationLinks() {
  for (const button of app.querySelectorAll('button[data-view], button[data-report], button[data-open-report]')) {
    const link = document.createElement('a');
    for (const attribute of button.attributes) link.setAttribute(attribute.name, attribute.value);
    const kind = button.dataset.report || button.dataset.openReport;
    link.href = kind ? navigationPath('reports', kind) : navigationPath(button.dataset.view);
    link.innerHTML = button.innerHTML;
    link.removeAttribute('aria-pressed');
    if (kind && view === 'reports' && reportKind === kind) link.setAttribute('aria-current', 'page');
    button.replaceWith(link);
  }
  app.querySelector('.brand').href = navigationPath('overview');
}

function bookLink() {
  const reference = wikiFor(language);
  return `<a class="book-reference" href="${reference.href}" target="_blank" rel="noopener noreferrer" title="${reference.title}">По книге Дитриха Дёрнера «Логика неудачи»${language === 'fr' ? '<small translate="no">Wikipédia · en anglais</small>' : ''}</a>`;
}

const metrics = [
  { key: 'finance', label: 'Чистые средства', field: 'netPosition', icon: 'coins', unit: 'тыс. м.', color: '#345944', good: 1 },
  { key: 'production', label: 'Выпуск часов', field: 'production', icon: 'factory', unit: 'шт. / месяц', color: '#9c7840', good: 1 },
  { key: 'unemployment', label: 'Без работы', field: 'unemployment', icon: 'people', unit: 'человек', color: '#ad6550', good: -1 },
  { key: 'housing', label: 'Дефицит жилья', field: 'housingShortage', icon: 'home', unit: 'мест', color: '#718477', good: -1 },
  { key: 'satisfaction', label: 'Благополучие', field: 'satisfaction', icon: 'leaf', unit: 'из 100', color: '#51765f', good: 1 },
];

const history = () => game.history.map(item => ({ ...item, netPosition: item.treasury - item.debt }));
const stateValue = metric => metric.key === 'finance' ? game.treasury - game.debt : game[metric.field];
const complete = () => game.month >= game.horizon;
const locked = () => storageBlocked || complete();
const disabled = value => value ? 'disabled' : '';
const dateLabel = month => month >= 120 ? 'Десять лет спустя' : `${['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'][month % 12]} · год ${Math.floor(month / 12) + 1}`;

function persist() {
  if (storageBlocked) return false;
  try {
    localStorage.setItem(SAVE_KEY, serializeGame(game));
    saved = true;
    return true;
  } catch (error) {
    saved = false;
    errorMessage = `Игра продолжается, но сохранить ее не удалось: ${error.message}. Не закрывайте вкладку; повторите сохранение.`;
    return false;
  }
}

function commit(next, message) {
  if (storageBlocked) return;
  game = next;
  notice = message;
  errorMessage = '';
  persist();
  render();
}

function metricCards() {
  const rows = history();
  return `<section class="metric-grid" aria-label="Главные показатели">${metrics.map(metric => {
    const value = stateValue(metric);
    const previous = rows.at(-2)?.[metric.field] ?? value;
    const delta = value - previous;
    return `<article class="metric-card"><div class="metric-top"><span>${metric.label}</span>${icon(metric.icon)}</div>
      <div class="metric-value">${fmt(value)} <small>${metric.unit}</small></div>
      <div class="metric-bottom"><span class="metric-delta ${delta * metric.good > 0 ? 'positive' : delta * metric.good < 0 ? 'negative' : 'muted'}">${game.month ? `${signed(delta)} за месяц` : 'На начало управления'}</span>${sparkline(rows.map(row => row[metric.field]), metric.color)}</div></article>`;
  }).join('')}</section>`;
}

function chartPanel() {
  const metric = metrics.find(item => item.key === chartMetric);
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">ДИНАМИКА ГОРОДА</p><h2>За цифрами — изменения</h2></div>
    <label class="chart-select"><span class="sr-only">Показатель на графике</span><select id="chart-metric">${metrics.map(item => `<option value="${item.key}" ${item.key === chartMetric ? 'selected' : ''}>${item.label}</option>`).join('')}</select></label></div>
    <div class="chart">${trendChart(history(), metric.field, { color: metric.color, label: metric.label, unit: metric.unit })}</div>
    <div class="chart-legend"><span>Месяц управления</span><span>${metric.label}: ${fmt(stateValue(metric))} ${metric.unit}</span></div></section>`;
}

function budgetPanel() {
  const budget = game.lastBudget || {};
  return `<section class="panel"><div class="panel-heading"><div><p class="eyebrow">ГОРОДСКАЯ КАЗНА</p><h2>Запас прочности</h2></div>${icon('coins', 24)}</div>
    <div class="budget-row"><span>Свободные средства</span><strong>${money(game.treasury)}</strong></div>
    <div class="budget-row"><span>Долг города</span><strong class="${game.debt > 0 ? 'negative' : ''}">${money(game.debt)}</strong></div>
    <div class="budget-row"><span>Поступления за месяц</span><span>${money(budget.income)}</span></div>
    <div class="budget-row"><span>Расходы за месяц</span><span>${money(budget.expenses)}</span></div>
    <div class="budget-total"><span>Месячный баланс</span><strong class="${budget.net < 0 ? 'negative' : 'positive'}">${signed(budget.net || 0)} тыс. м.</strong></div>
    <p class="source-note">${game.month === 0 ? 'Стартовая оценка. Первый расчет будет выполнен после хода.' : 'При дефиците растет долг. Проценты (+0.8%/мес.) увеличивают будущие расходы.'}</p>
    <button class="button secondary" data-open-report="finance">Посмотреть полный финансовый отчет ${icon('arrow', 16)}</button></section>`;
}

/**
 * Renders the Causal Turn Digest ("Что произошло и почему").
 */
function causalDigestSection() {
  const previous = game.history.length > 1 ? game.history.at(-2) : null;
  const causes = explainStepCauses(game, previous);
  const traps = detectCognitiveTraps(game);

  const trapMarkup = traps.length ? `
    <div class="cognitive-alerts">
      ${traps.map(trap => `
        <article class="trap-card">
          <div class="trap-icon">${icon('alert', 28)}</div>
          <div>
            <div class="trap-subtitle">${escapeHTML(trap.subtitle)}</div>
            <h4 class="trap-title">${escapeHTML(trap.title)}</h4>
            <p class="trap-message">${escapeHTML(trap.message)}</p>
            <span class="trap-advice">💡 Совет: ${escapeHTML(trap.advice)}</span>
          </div>
        </article>
      `).join('')}
    </div>
  ` : '';

  return `
    ${trapMarkup}
    <section class="causal-digest" aria-label="Хроника последнего хода">
      <div class="causal-digest-header">
        <div>
          <p class="eyebrow">ПРИЧИННО-СЛЕДСТВЕННЫЙ АНАЛИЗ</p>
          <h3>${game.month === 0 ? 'Стартовая диспозиция Лоххаузена' : `Что произошло за месяц ${game.month}?`}</h3>
        </div>
        <span class="badge">${game.month ? `Месяц ${game.month}` : 'Начало'}</span>
      </div>
      <div class="causal-grid">
        ${causes.map(item => `
          <div class="causal-item ${item.tone || 'neutral'}">
            <div class="causal-icon">${icon(item.icon || 'spark', 20)}</div>
            <div class="causal-body">
              <span class="causal-title">${escapeHTML(item.headline)}</span>
              <p class="causal-desc">${escapeHTML(item.explanation)}</p>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
  `;
}

/**
 * 5 Mayoral Spheres Grid with live advisor intelligence and direct actions.
 */
function mayoralSpheresSection() {
  const spheres = [
    { id: 'factory', name: 'Часовая фабрика', icon: 'factory' },
    { id: 'finance', name: 'Казна и налоги', icon: 'coins' },
    { id: 'housing', name: 'Жилье и город', icon: 'home' },
    { id: 'social', name: 'Жители и услуги', icon: 'people' },
    { id: 'tourism', name: 'Туризм и развитие', icon: 'leaf' },
  ];

  return `
    <div class="spheres-heading">
      <div>
        <p class="eyebrow">ГОРОДСКИЕ СЛУЖБЫ</p>
        <h3>Кабинет советников</h3>
      </div>
      <p class="source-note">Службы реагируют на реальные изменения в городе</p>
    </div>
    <div class="spheres-grid">
      ${spheres.map(sphere => {
        const advisor = ADVISORS[sphere.id];
        const diag = getAdvisorDiagnosis(sphere.id, game);
        const reportKey = sphere.id === 'factory' ? 'factory' : sphere.id === 'finance' ? 'finance' : sphere.id === 'housing' ? 'housing' : sphere.id === 'social' ? 'social' : 'tourism';
        return `
          <article class="sphere-card">
            <div class="sphere-header">
              <div class="sphere-title-group">
                <div class="sphere-icon-badge">${icon(advisor.icon, 20)}</div>
                <div>
                  <h4 class="sphere-name">${escapeHTML(sphere.name)}</h4>
                  <span class="advisor-meta">${escapeHTML(advisor.name)} · ${escapeHTML(advisor.role)}</span>
                </div>
              </div>
              <span class="status-pill ${diag.status}">${diag.status === 'crisis' ? 'Кризис' : diag.status === 'warning' ? 'Внимание' : diag.status === 'good' ? 'Норма' : 'Стабильно'}</span>
            </div>
            <blockquote class="advisor-quote">${escapeHTML(diag.quote)}</blockquote>
            <div class="sphere-key-stat">${escapeHTML(diag.keyStat)}</div>
            <div class="sphere-footer">
              <button class="button quiet" data-open-report="${reportKey}">Отчет службы ${icon('arrow', 14)}</button>
              <button class="button secondary" data-view="decisions">Управление ${icon('decisions', 14)}</button>
            </div>
          </article>
        `;
      }).join('')}
    </div>
  `;
}

/**
 * Interactive Causal Loops Explorer (Дёрнеровские контуры системной динамики).
 */
function causalLoopExplorerSection() {
  const currentLoop = CAUSAL_LOOPS.find(item => item.id === activeLoopId) || CAUSAL_LOOPS[0];

  // Evaluate current town situation regarding this loop
  let townStatusText = '';
  if (currentLoop.id === 'tax_loop') {
    const tax = game.policies.taxRate;
    townStatusText = `Сейчас налоговая ставка составляет <strong>${tax}%</strong>. ${tax > 25 ? 'Внимание: высокая ставка сдерживает миграцию и снижает чистое благополучие!' : 'Ставка в умеренном диапазоне.'}`;
  } else if (currentLoop.id === 'maintenance_loop') {
    const eq = game.equipment;
    const maint = game.policies.maintenance;
    townStatusText = `Состояние станков: <strong>${eq.toFixed(1)}%</strong>. Обслуживание: <strong>${maint} тыс. м./мес.</strong> ${maint < 14 ? 'Этого недостаточно: станки продолжают терять ресурс каждый месяц!' : 'Расходы достаточны для поддержания оборудования.'}`;
  } else if (currentLoop.id === 'housing_lag_loop') {
    const shortage = game.housingShortage;
    const free = Math.max(0, game.housingCapacity - game.population);
    const hasHousingProj = (game.projects || []).some(pr => pr.type === 'housing');
    townStatusText = shortage > 0
      ? `Острый дефицит жилья: <strong>${Math.round(shortage)} мест</strong>! ${hasHousingProj ? 'Строительство уже ведется — дождитесь ввода.' : 'Необходимо срочно начать муниципальную стройку.'}`
      : `Свободно <strong>${Math.round(free)} мест</strong>. ${hasHousingProj ? 'Муниципальное жилье уже строится (+60 мест).' : 'Резерв пока достаточен.'}`;
  } else if (currentLoop.id === 'debt_spiral') {
    const debt = game.debt;
    const interest = game.lastBudget?.interest || debt * 0.008;
    townStatusText = debt > 0
      ? `Накопленный долг: <strong>${Math.round(debt)} тыс. м.</strong> Каждый месяц город отдает <strong>${Math.round(interest)} тыс. м.</strong> только в виде процентов банку!`
      : `Город не имеет долгов (<strong>0 тыс. м.</strong>). Процентных обязательств нет.`;
  } else if (currentLoop.id === 'tourism_bottleneck') {
    const cap = game.tourismCapacity;
    const dem = game.tourismDemand;
    const ads = game.policies.tourismMarketing;
    townStatusText = `Вместимость: <strong>${cap} мест</strong>, спрос: <strong>${Math.round(dem)} чел.</strong>, реклама: <strong>${ads} тыс. м.</strong> ${ads > 15 && cap < 50 ? 'Реклама привлекает больше людей, чем могут вместить гостиницы — часть средств сгорает впустую!' : 'Параметры туризма сбалансированы.'}`;
  }

  return `
    <section class="loop-explorer-panel" aria-label="Анатомия системных связей">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">СИСТЕМНАЯ ДИНАМИКА ПО ДЁРНЕРУ</p>
          <h3>Анатомия связей: почему всё зависит от всего?</h3>
        </div>
        ${icon('loop', 24)}
      </div>
      <p class="source-note">В книге «Логика неудачи» участники терпели крах, пытаясь воздействовать на одну переменную и игнорируя замкнутые петли обратной связи.</p>
      <div class="loop-tabs-nav" role="tablist">
        ${CAUSAL_LOOPS.map(loop => `
          <button class="loop-tab-btn ${loop.id === activeLoopId ? 'active' : ''}" data-action="select-loop" data-loop="${loop.id}" role="tab" aria-selected="${loop.id === activeLoopId}">
            ${escapeHTML(loop.title)}
          </button>
        `).join('')}
      </div>
      <div class="loop-content">
        <h4>${escapeHTML(currentLoop.title)} <small class="advisor-meta">· ${escapeHTML(currentLoop.category)}</small></h4>
        <div class="loop-chain">
          ${currentLoop.nodes.map((node, i) => `
            <span class="loop-node-tag">${escapeHTML(node)}</span>
            ${i < currentLoop.nodes.length - 1 ? `<span class="loop-arrow-symbol">➔</span>` : ''}
          `).join('')}
        </div>
        <p class="loop-explanation-text">${escapeHTML(currentLoop.explain)}</p>
        <p class="source-note"><em>📖 ${escapeHTML(currentLoop.dornerReference)}</em></p>
        <div class="loop-current-status">
          <strong>Положение в вашем Лоххаузене прямо сейчас:</strong>
          <div>${townStatusText}</div>
        </div>
      </div>
    </section>
  `;
}

function overviewView() {
  return `
    <div class="dashboard-top">
      <section class="hero-card">
        <div class="hero-copy">
          <span class="pill">${complete() ? 'Управление завершено' : 'Ваш город · Ваши решения'}</span>
          <h2>Будущее складывается<br>из сегодняшних решений.</h2>
          <p>Фабрика, жители, казна — части одной связанной системы.<br>Изучайте связи. Учитывайте время и задержки.</p>
          <div class="cockpit-actions">
            <button class="button primary hero-guide" data-view="guide">Как играть ${icon('arrow', 16)}</button>
            <button class="button secondary" data-view="decisions">Принять решения ${icon('decisions', 16)}</button>
            <button class="button quiet" data-view="reports">Отчеты служб ${icon('reports', 16)}</button>
          </div>
        </div>
        <div class="city-art">${cityIllustration()}</div>
        <div class="hero-caption">
          <span>${icon('people', 16)} ${integer.format(game.population)} жителей</span>
          <span>${icon('clock', 16)} Горизонт — 10 лет (120 мес.)</span>
          <span>Нажмите на район города, чтобы открыть отчет подразделения</span>
        </div>
      </section>
      <section class="dispatch-card">
        <div class="panel-heading">
          <div>
            <p class="eyebrow">ИЗ РАТУШИ</p>
            <h2>Городские вести</h2>
          </div>
          <span class="badge">${String(game.month + 1).padStart(3, '0')}</span>
        </div>
        <div class="dispatch-list">
          ${(game.events?.length ? game.events : [
            'Муниципальная фабрика — основной работодатель города. Ее состояние влияет на казну и занятость.',
            'Благополучие привлекает новых жителей. Вместе с ними растет потребность в жилье и услугах.',
            'У служб есть подробные сведения. Начните с вопросов о причинах происходящего.',
          ]).slice(0, 3).map((event, index) => `
            <article class="dispatch-item">
              <span class="dispatch-number">0${index + 1}</span>
              <p>${escapeHTML(event)}</p>
            </article>
          `).join('')}
        </div>
        <button class="button quiet" data-view="reports">Спросить у служб ${icon('arrow', 16)}</button>
      </section>
    </div>

    ${metricCards()}
    ${causalDigestSection()}
    ${mayoralSpheresSection()}
    ${causalLoopExplorerSection()}

    <div class="grid-two">
      ${chartPanel()}
      ${budgetPanel()}
    </div>
  `;
}

function decisionsView() {
  const groups = [
    {
      title: '🏭 Часовая фабрика и производство',
      advisor: ADVISORS.factory.name,
      keys: ['maintenance', 'wage', 'marketing'],
    },
    {
      title: '🏛️ Финансы и налоги',
      advisor: ADVISORS.finance.name,
      keys: ['taxRate'],
    },
    {
      title: '👥 Общественные услуги и образование',
      advisor: ADVISORS.social.name,
      keys: ['services', 'education'],
    },
    {
      title: '🌲 Туризм и рекреация',
      advisor: ADVISORS.tourism.name,
      keys: ['tourismMarketing'],
    },
  ];

  return `
    <div class="view-heading">
      <p class="eyebrow">ПОЛИТИКА И ИНВЕСТИЦИИ</p>
      <h2>Не только что. Но и когда.</h2>
      <p>Текущая политика действует каждый месяц. Проекты оплачиваются один раз и дают результат после завершения срока строительства.</p>
    </div>
    ${complete() ? '<div class="inline-note">Десять лет управления завершены. Решения сохранены для разбора.</div>' : ''}
    <form id="policy-form" class="panel">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">ЕЖЕМЕСЯЧНЫЕ СТАВКИ</p>
          <h3>Действующая политика</h3>
        </div>
        <span class="pill">Применяется каждый шаг</span>
      </div>
      <div class="policy-grid">
        ${groups.map(group => `
          <div class="policy-group-heading">
            <h4>${escapeHTML(group.title)}</h4>
            <span class="advisor-meta">${escapeHTML(group.advisor)}</span>
          </div>
          ${group.keys.map(key => {
            const config = POLICY_CONFIG[key];
            const whatIf = getPolicyWhatIf(key, game.policies[key], game);
            return `
              <div class="field">
                <label class="field-label" for="policy-${key}">${escapeHTML(config.label)}</label>
                <div class="range-slider-pair">
                  <input type="range" min="${config.min}" max="${config.max}" step="${config.step}" value="${game.policies[key]}" data-sync-for="policy-${key}" ${disabled(locked())}>
                  <div class="input-unit">
                    <input type="number" id="policy-${key}" name="${key}" min="${config.min}" max="${config.max}" step="${config.step}" value="${game.policies[key]}" required ${disabled(locked())}>
                    <span>${escapeHTML(config.unit)}</span>
                  </div>
                </div>
                <p class="field-description">${escapeHTML(config.description)}</p>
                <div class="what-if-box" id="what-if-${key}">
                  <span class="what-if-direct">⚡ ${escapeHTML(whatIf.direct)}</span>
                  <span class="what-if-side">🔄 ${escapeHTML(whatIf.sideEffect)}</span>
                  <span class="what-if-risk">⚠️ ${escapeHTML(whatIf.risk)}</span>
                </div>
              </div>
            `;
          }).join('')}
        `).join('')}
      </div>
      <div class="journal-note">
        <label for="policy-note"><strong>Что вы хотите изменить и какого результата ждете?</strong> (Дневник намерений по Дёрнеру)</label>
        <textarea id="policy-note" name="policyNote" maxlength="600" rows="2" placeholder="Например: увеличить ремонт станков до 25 тыс.; через полгода проверить выпуск и прибыль фабрики." ${disabled(locked())}></textarea>
      </div>
      <div class="form-footer">
        <span class="source-note">Новая политика начнет действовать со следующего хода.</span>
        <button class="button primary" type="submit" data-testid="apply-policies" ${disabled(locked())}>
          ${icon('check', 17)} Принять политику
        </button>
      </div>
    </form>

    <div class="panel-heading section-heading">
      <div>
        <p class="eyebrow">КАПИТАЛЬНЫЕ ПРОЕКТЫ</p>
        <h3>Вложения с отложенным эффектом</h3>
      </div>
      <span data-testid="housing-capacity" data-value="${game.housingCapacity}" class="pill">Жилье: ${integer.format(game.housingCapacity)} мест</span>
    </div>
    <section class="project-grid">
      ${Object.entries(PROJECTS).map(([key, project]) => `
        <article class="project-card">
          <div class="project-icon">${icon(key === 'housing' ? 'home' : key === 'modernization' ? 'factory' : 'leaf', 28)}</div>
          <h3>${escapeHTML(project.label)}</h3>
          <p>${escapeHTML(project.description)}</p>
          <div class="project-meta">
            <strong>${money(project.cost)}</strong>
            <span>${icon('clock', 15)} ${project.duration} мес.</span>
          </div>
          <button class="button secondary" data-project="${key}" data-testid="project-${key}" ${disabled(locked() || game.treasury < project.cost || game.month + project.duration > game.horizon)}>
            ${game.month + project.duration > game.horizon ? 'Не успеет до конца срока' : game.treasury < project.cost ? 'Недостаточно средств' : 'Оплатить и начать'}
          </button>
        </article>
      `).join('')}
    </section>
    <section class="panel projects-panel">
      <div class="panel-heading">
        <h3>В работе</h3>
        <span class="badge">${game.projects.length}</span>
      </div>
      ${projectList()}
    </section>
  `;
}

function projectList() {
  return game.projects.length ? `
    <div class="timeline">
      ${game.projects.map(project => `
        <article class="project-progress">
          <div class="budget-row">
            <strong>${escapeHTML(project.label)}</strong>
            <span>Ввод: месяц ${project.completeMonth}</span>
          </div>
          <progress value="${Math.max(0, game.month - project.startMonth)}" max="${project.completeMonth - project.startMonth}" aria-label="Ход проекта ${escapeHTML(project.label)}"></progress>
          <p class="source-note">Оплачено ${money(project.cost)} · осталось ${Math.max(0, project.completeMonth - game.month)} мес.</p>
        </article>
      `).join('')}
    </div>
  ` : '<div class="empty-state">Активных проектов пока нет. Завершенные проекты остаются в дневнике.</div>';
}

const fieldNames = {
  treasury: 'Свободные средства', debt: 'Долг', netPosition: 'Чистая финансовая позиция', lastBudget: 'Месячный бюджет',
  income: 'Поступления', expenses: 'Расходы', net: 'Баланс', taxIncome: 'Налоговые поступления', factoryProfit: 'Результат фабрики', tourismIncome: 'Доход туризма', rentIncome: 'Аренда жилья', services: 'Услуги', education: 'Обучение', administration: 'Содержание города', interest: 'Проценты по долгу',
  population: 'Население', workforce: 'Рабочая сила', factoryJobs: 'Работники фабрики', otherJobs: 'Занятость в других отраслях', tourismJobs: 'Работники туризма', unemployment: 'Безработные', housingCapacity: 'Вместимость жилья', housingShortage: 'Дефицит мест',
  equipment: 'Состояние станков', skills: 'Квалификация', production: 'Выпуск за месяц', inventory: 'Часы на складе', sales: 'Продажи за месяц', demand: 'Спрос на часы',
  serviceQuality: 'Качество услуг', health: 'Здоровье', satisfaction: 'Благополучие', satisfactionGroups: 'Группы жителей', workers: 'Рабочие', families: 'Семьи с детьми', seniors: 'Пожилые',
  tourismCapacity: 'Туристическая вместимость', tourismDemand: 'Туристический спрос', visitors: 'Принято туристов',
};

const percentFields = new Set(['equipment', 'skills', 'health', 'serviceQuality', 'satisfaction', 'workers', 'families', 'seniors']);
const moneyFields = new Set(['treasury', 'debt', 'netPosition', 'income', 'expenses', 'net', 'taxIncome', 'factoryProfit', 'tourismIncome', 'rentIncome', 'services', 'administration', 'interest']);
const beneficialIncrease = new Set(['treasury', 'netPosition', 'net', 'equipment', 'skills', 'health', 'serviceQuality', 'satisfaction', 'workers', 'families', 'seniors']);
const beneficialDecrease = new Set(['debt', 'unemployment', 'housingShortage']);

function reportChange(key, value, previous, parent) {
  const field = parent ? `${parent}.${key}` : key;
  if (!Number.isFinite(value) || !Number.isFinite(previous)) return `<span class="report-change muted" data-comparison-field="${field}">Нет данных для сравнения</span>`;
  const delta = value - previous;
  const isMoney = parent === 'lastBudget' || moneyFields.has(key);
  const isScore = !isMoney && (percentFields.has(key) || key === 'education');
  const unit = isMoney ? 'тыс. м.' : isScore ? 'п.' : ['production', 'sales', 'inventory', 'demand'].includes(key) ? 'шт.' : ['housingCapacity', 'housingShortage', 'tourismCapacity'].includes(key) ? 'мест' : 'чел.';
  const before = isMoney ? money(previous) : isScore ? `${fmt(previous)} / 100` : fmt(previous);
  if (Math.abs(delta) < 0.000001) return `<span class="report-change muted" data-comparison-field="${field}" data-delta="0" title="Было: ${before}">— Без изменений</span>`;
  const magnitude = Math.abs(delta) < 0.05 ? 'менее 0,1' : fmt(Math.abs(delta));
  const quality = beneficialIncrease.has(key) ? Math.sign(delta) : beneficialDecrease.has(key) ? -Math.sign(delta) : 0;
  const tone = quality > 0 ? 'positive' : quality < 0 ? 'negative' : 'neutral';
  return `<span class="report-change ${tone}" data-comparison-field="${field}" data-delta="${delta}" title="Было: ${before}" aria-label="${delta > 0 ? 'Рост' : 'Снижение'} на ${magnitude} ${unit}. Было: ${before}">${delta > 0 ? '↑' : '↓'} ${Math.abs(delta) < 0.05 ? magnitude : `${delta > 0 ? '+' : '−'}${magnitude}`} ${unit}</span>`;
}

function reportRows(data, previous = null, parent = '') {
  return Object.entries(data || {}).filter(([key]) => key in fieldNames).map(([key, value]) => {
    if (value && typeof value === 'object') return `<tr class="table-group"><th colspan="2">${fieldNames[key]}</th></tr>${reportRows(value, previous?.[key], key)}`;
    const display = typeof value === 'number' ? (parent === 'lastBudget' || moneyFields.has(key) ? money(value) : percentFields.has(key) || key === 'education' ? `${fmt(value)} / 100` : fmt(value)) : escapeHTML(value);
    return `<tr><th scope="row" ${parent ? 'class="nested-label"' : ''}>${fieldNames[key]}</th><td><span class="report-value">${display}</span>${reportChange(key, value, previous?.[key], parent)}</td></tr>`;
  }).join('');
}

function reportsView() {
  const report = game.reports[reportKind];
  const stale = report && report.month < game.month;
  const advisor = ADVISORS[reportKind] || ADVISORS.factory;
  const diag = getAdvisorDiagnosis(reportKind, game);
  const comparisonNote = report?.comparison ? `Изменения относительно ${report.comparison.month === 0 ? 'начала управления' : `месяца ${report.comparison.month}`}. Стрелки показывают рост или снижение; наведите на изменение, чтобы увидеть прежнее значение.` : report?.month === 0 ? 'Это начальное состояние города. Сравнение появится после первого хода и обновления отчета.' : 'Для этого снимка нет данных предыдущего месяца. После следующего хода обновите отчет — появится сравнение.';

  return `
    <div class="view-heading">
      <p class="eyebrow">СНАЧАЛА — ВОПРОСЫ И АНАЛИЗ</p>
      <h2>Что происходит в подразделениях города?</h2>
      <p>Сводка на главной показывает общее состояние. Подробный отчет раскрывает причины и скрытые механизмы.</p>
    </div>
    <div class="report-tabs" role="group" aria-label="Подразделения">
      ${Object.entries(reports).map(([key, label]) => `
        <button class="report-tab ${key === reportKind ? 'active' : ''}" data-report="${key}" data-testid="report-${key}" aria-pressed="${key === reportKind}">
          ${escapeHTML(label)}
        </button>
      `).join('')}
    </div>
    <section class="panel report-detail">
      <div class="panel-heading">
        <div>
          <p class="eyebrow">${report ? 'СНИМОК СОСТОЯНИЯ' : 'СВЕДЕНИЯ ЕЩЕ НЕ ЗАПРОШЕНЫ'}</p>
          <h3>${reports[reportKind]}</h3>
          <span class="advisor-meta">${escapeHTML(advisor.name)} · ${escapeHTML(advisor.role)}</span>
        </div>
        <div style="display:flex; gap:8px;">
          <button class="button secondary" data-action="request-all-reports" title="Обновить отчеты всех 5 подразделений">
            ${icon('check', 16)} Обновить все службы
          </button>
          <button class="button primary" data-action="request-report" data-testid="request-report" ${disabled(storageBlocked)}>
            ${icon('reports', 18)} ${report ? 'Обновить отчет' : 'Запросить отчет'}
          </button>
        </div>
      </div>
      ${report ? `
        <p data-testid="report-date" data-month="${report.month}" class="inline-note ${stale ? 'stale' : ''}">
          ${icon('clock', 16)} Данные ${reportPeriod(report.month)}. ${stale ? `Сейчас месяц ${game.month}. Отчет устарел — запросите свежие сведения.` : report.month === 0 ? 'Первый месяц еще не рассчитан.' : 'Сведения актуальны.'}
        </p>
        <div class="advisor-quote" style="margin: 14px 0;">
          <strong>Оценка советника (${escapeHTML(advisor.name)}):</strong> ${escapeHTML(diag.quote)}
        </div>
        <p class="source-note report-comparison-note">${comparisonNote}</p>
        <div class="report-body">
          <table class="stat-table">
            <caption class="sr-only">${reports[reportKind]}: сведения ${reportPeriod(report.month)}</caption>
            <tbody>${reportRows(report.data, report.comparison?.data)}</tbody>
          </table>
          <aside class="report-observations">
            <h4>Наблюдения службы</h4>
            ${(report.observations || ['Сравните эти сведения с прошлыми решениями и общей динамикой города.']).map(line => `<p>${escapeHTML(line)}</p>`).join('')}
            <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line);">
              <strong>Рекомендация:</strong>
              <p>${escapeHTML(diag.recommendation)}</p>
            </div>
          </aside>
        </div>
      ` : `
        <div class="empty-state report-empty">
          ${icon('reports', 40)}
          <h3>Вопросы открывают детали</h3>
          <p>Запросите отчет, чтобы увидеть показатели этого подразделения. Позже вы сможете сравнить их с результатами своих решений.</p>
        </div>
      `}
    </section>
    <p class="source-note">Датированные отчеты — отражение неполноты информации в эксперименте Дёрнера. Спрашивайте то, что нужно для проверки конкретной гипотезы.</p>
  `;
}

function journalView() {
  const entries = [...game.journal].reverse();
  return `
    <div class="view-heading">
      <p class="eyebrow">ПАМЯТЬ ОБ УПРАВЛЕНИИ</p>
      <h2>Решение. Ожидание. Последствие.</h2>
      <p>Возвращайтесь к своим предположениям. То, что события совпали по времени, еще не доказывает причину.</p>
    </div>
    <div class="grid-two">
      <section class="panel">
        <div class="panel-heading">
          <h3>Дневник бургомистра</h3>
          <span class="badge">${entries.length}</span>
        </div>
        <div class="timeline">
          ${entries.length ? entries.map(entry => `
            <article class="journal-entry">
              <span class="journal-date">${monthLabel(entry.month)}</span>
              <div>
                <h4>${escapeHTML(entry.title)}</h4>
                ${entry.changes ? `<p>${Object.entries(entry.changes).map(([key, value]) => `${escapeHTML(POLICY_CONFIG[key]?.label || key)}: ${fmt(value)} ${escapeHTML(POLICY_CONFIG[key]?.unit || '')}`).join(' · ')}</p>` : ''}
                ${entry.project ? `<p>${money(entry.project.cost)} · ввод в месяце ${entry.project.completeMonth}</p>` : ''}
                ${entry.note ? `<p class="journal-quote" ${entry.type === 'policy' ? 'translate="no"' : ''}>${escapeHTML(entry.note)}</p>` : ''}
              </div>
            </article>
          `).join('') : '<div class="empty-state">Здесь появятся принятые решения и ваши ожидания. Запись можно добавить при изменении политики.</div>'}
        </div>
      </section>
      <div>
        ${chartPanel()}
        <div class="panel journal-guide">
          <h3>Три вопроса рефлексии Дёрнера</h3>
          <ol>
            <li><strong>Что я ожидал увидеть и к какому сроку?</strong> (Не действовать «баллистически» — всегда формулировать ожидание).</li>
            <li><strong>Что действительно изменилось в системе?</strong> (Сверить факт с прогнозом и отчетом подразделения).</li>
            <li><strong>Какие побочные эффекты проявились?</strong> (Не вызвала ли попытка решить одну проблему кризис в соседней сфере?).</li>
          </ol>
        </div>
      </div>
    </div>
  `;
}

function debriefView() {
  const summary = summarize(game);
  const traps = detectCognitiveTraps(game);

  return `
    <section data-testid="debrief">
      <div class="view-heading">
        <p class="eyebrow">${complete() ? 'ДЕСЯТЬ ЛЕТ СПУСТЯ' : 'ПРОМЕЖУТОЧНЫЙ РАЗБОР'}</p>
        <h2>${complete() ? 'Как изменился ваш Лоххаузен?' : 'Остановиться и посмотреть на целое.'}</h2>
        <p>${complete() ? 'Управление завершено. Рассмотрите не только конечные цифры, но и путь, который к ним привел.' : `Прошло ${game.month} из 120 месяцев. Сверьте намерения с результатами, прежде чем принимать новые решения.`}</p>
      </div>
      <div class="debrief-grid">
        ${summary.metrics.map(metric => `
          <article class="debrief-metric" data-testid="metric-${metric.key}">
            <p class="eyebrow">${escapeHTML(metric.label)}</p>
            <div class="debrief-values">
              <span>${fmt(metric.initial)}</span>
              ${icon('arrow', 20)}
              <strong>${fmt(metric.final)}</strong>
            </div>
            <p>${signed(metric.change)} ${escapeHTML(metric.unit)} с начала управления</p>
          </article>
        `).join('')}
      </div>
      <div class="grid-two">
        <section class="panel">
          <p class="eyebrow">СИСТЕМНЫЕ НАБЛЮДЕНИЯ ПО ВАШЕЙ ПАРТИИ</p>
          <h3>Поводы пересмотреть гипотезы</h3>
          <div class="lesson-list">
            ${summary.lessons.map(lesson => `<p>${escapeHTML(lesson)}</p>`).join('')}
          </div>
          ${traps.length ? `
            <div style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--line);">
              <h4 style="margin:0 0 8px; font-family:var(--serif); font-size:16px; color:#8d4130;">Обнаруженные ловушки мышления:</h4>
              ${traps.map(t => `<p>⚠️ <strong>${escapeHTML(t.title)}:</strong> ${escapeHTML(t.message)}</p>`).join('')}
            </div>
          ` : ''}
          <button class="button secondary" data-view="journal" style="margin-top:14px;">
            Вернуться к дневнику решений ${icon('arrow', 16)}
          </button>
        </section>
        ${budgetPanel()}
      </div>
      <div class="panel source-note">
        Это разбор событий учебной модели, а не оценка ваших личных способностей. В книге «Логика неудачи» даже опытные политики и ученые совершали похожие системные ошибки. Ценность симулятора — в возможности исследовать последствия без риска для реальных людей.
      </div>
    </section>
  `;
}

function guideView() {
  return `
    <section data-testid="game-guide" class="game-guide">
      <div class="view-heading">
        <p class="eyebrow">ПАМЯТКА БУРГОМИСТРА</p>
        <h2>Как играть в Лоххаузен</h2>
        <p>У вас небольшой город, 3700 жителей и десять лет управления (120 месяцев). Ваша задача — поддерживать жизнеспособность города и благополучие людей.</p>
      </div>
      <article class="panel guide-start">
        <span class="pill">Один управленческий цикл</span>
        <h3>Узнать ➔ Решить ➔ Подождать ➔ Проверить</h3>
        <p>Время идет только по кнопкам «Следующий месяц» и «+3 месяца». Пока вы анализируете доклады советников или настраиваете политику, город ждет.</p>
        <ol class="guide-steps">
          <li><strong>Изучите доклады советников.</strong> На главном экране кабинета советники (Герр Краузе, Фрау Вебер, Герр Бауэр, Доктор Франк, Фрау Линдеманн) сообщают о текущих узких местах.</li>
          <li><strong>Сформулируйте изменение.</strong> В «Решениях» настройте ползунки, прочитайте What-If подсказки о прямых эффектах и системных рисках.</li>
          <li><strong>Сделайте ход.</strong> Для осмысленного опыта двигайтесь по одному месяцу: «Хроника хода» сразу объяснит, что и почему изменилось.</li>
          <li><strong>Проверьте гипотезу.</strong> Сопоставьте реальный факт с ожиданием. Если что-то пошло не так, исследуйте обратные связи в разделе «Анатомия связей».</li>
        </ol>
        <div class="guide-actions">
          <button class="button primary" data-view="overview">В кабинет бургомистра ${icon('arrow', 16)}</button>
          <button class="button secondary" data-view="decisions">Перейти к решениям</button>
        </div>
      </article>
      <div class="grid-two">
        <article class="panel">
          <h3>Политика и проекты работают по-разному</h3>
          <p><strong>Политика действует каждый месяц</strong> до нового решения. Налог пополняет казну, но снижает привлекательность города. Обслуживание компенсирует износ оборудования фабрики. Услуги поддерживают медицину и уровень жизни.</p>
          <p><strong>Проект оплачивается сразу и один раз</strong> и требует времени: муниципальное жилье строится 12 месяцев (+60 мест), модернизация фабрики длится 9 месяцев, туристическая инфраструктура строится 6 месяцев (+80 мест). За ходом работ можно следить в панели «В работе».</p>
        </article>
        <article class="panel">
          <h3>Главные когнитивные ловушки Дёрнера</h3>
          <p><strong>«Синдром ремонтника»</strong>: бросить все средства на одну сиюминутную жалобу, пробив дыру в бюджете.</p>
          <p><strong>«Нетерпеливое перерегулирование»</strong>: начать несколько строек подряд, не дождавшись окончания 12-месячного срока первой.</p>
          <p><strong>«Долговая петля»</strong>: покрывать дефицит займами, пока проценты не сожрут весь бюджет.</p>
          <p><strong>«Рекламный мираж»</strong>: тратить деньги на рекламу туризма, когда в городе нет свободных гостиничных мест.</p>
        </article>
      </div>
    </section>
  `;
}

function modelView() {
  return `
    <section data-testid="model-info">
      <div class="view-heading">
        <p class="eyebrow">ИСТОЧНИК И ГРАНИЦЫ</p>
        <h2>Учебная реконструкция Лоххаузена</h2>
        <p>По книге Дитриха Дёрнера «Логика неудачи» (Die Logik des Mißlingens). Здесь можно исследовать описанные в книге системные связи.</p>
      </div>
      <div class="about-grid">
        <article class="panel">
          <span class="pill">Из книги Дёрнера</span>
          <h3>Что сохранено из первоисточника</h3>
          <ul>
            <li>Маленький город: около 3700 жителей в немецких среднегорьях.</li>
            <li>Муниципальная часовая фабрика — основа городской экономики.</li>
            <li>Широкие полномочия бургомистра и горизонт 10 лет (120 месяцев).</li>
            <li>Пять критических переменных: финансы, производство, работа, жилье и благополучие.</li>
            <li>Неполнота информации, обратные связи, временные задержки и конфликты целей.</li>
          </ul>
          <p class="source-note">Главы 2–8 «Логики неудачи»; немецкое издание Rowohlt, 2000: с. 32–37.</p>
        </article>
        <article class="panel">
          <span class="pill">Инженерные допущения</span>
          <h3>Что смоделировано в этой версии</h3>
          <ul>
            <li>Численные коэффициенты износа оборудования, производительности и спроса.</li>
            <li>Строительство жилья: 12 месяцев лага и 60 новых мест.</li>
            <li>Групповой нелинейный расчет удовлетворенности (рабочие, семьи, пожилые).</li>
            <li>Процентный долг города (0.8% в месяц) и кассовый баланс.</li>
            <li>Датированная отчетность и система советов подразделений.</li>
          </ul>
          <p class="source-note">Уравнения оригинального компьютерного симулятора 1970-х годов не опубликованы; мы воссоздали качественную системную динамику, строго следуя описанным в книге закономерностям.</p>
        </article>
      </div>
    </section>
  `;
}

function render() {
  const focusId = document.activeElement?.id;
  const focusTestId = document.activeElement?.dataset?.testid;
  const views = {
    overview: overviewView,
    guide: guideView,
    decisions: decisionsView,
    reports: reportsView,
    journal: journalView,
    debrief: debriefView,
    model: modelView,
  };
  const pageTitle = view === 'reports'
    ? `${translate('Отчеты служб', language)}: ${translate(reports[reportKind], language)}`
    : translate(navigation.find(([key]) => key === view)?.[1] || 'Лоххаузен', language);
  document.title = `${pageTitle} — ${translate('Лоххаузен', language)}`;
  document.documentElement.lang = language;

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#" data-view="overview">
          <span class="brand-mark">${icon('home', 30)}</span>
          <span>
            <span class="brand-name">Лоххаузен</span>
            <span class="brand-caption">ГОРОДСКОЕ УПРАВЛЕНИЕ</span>
          </span>
        </a>
        <p class="sidebar-section-label">КАБИНЕТ БУРГОМИСТРА</p>
        <nav class="nav-list" aria-label="Основная навигация">
          ${navigation.map(([key, label]) => `
            <button class="nav-item ${view === key ? 'active' : ''}" data-view="${key}" data-testid="nav-${key}" ${view === key ? 'aria-current="page"' : ''}>
              ${icon(key, 19)}
              <span>${label}</span>
              ${key === 'decisions' && game.projects.length ? `<span class="badge">${game.projects.length}</span>` : ''}
            </button>
          `).join('')}
        </nav>
        <div class="sidebar-foot">
          <div class="sidebar-emblem">L<span>•</span>H</div>
          <p>Маленький город.<br>Большие взаимосвязи.</p>
          ${bookLink()}
          <button class="button quiet" data-action="new-game" data-testid="new-game">
            ${icon('reset', 15)} Новая игра
          </button>
        </div>
      </aside>
      <main class="main" id="content">
        <div class="language-control">
          <label for="language-select">Язык интерфейса</label>
          <select id="language-select" translate="no">
            ${Object.entries({ ru: 'Русский', en: 'English', de: 'Deutsch', fr: 'Français' }).map(([code, label]) => `
              <option value="${code}" ${language === code ? 'selected' : ''}>${label}</option>
            `).join('')}
          </select>
        </div>
        <header class="topbar">
          <div>
            <p class="eyebrow">${complete() ? 'ИТОГИ УПРАВЛЕНИЯ' : 'КАБИНЕТ БУРГОМИСТРА'}</p>
            <div class="title-line">
              <h1>Лоххаузен</h1>
              <span class="town-dot" aria-hidden="true"></span>
            </div>
            <p class="subtitle">
              <span data-testid="population" data-value="${game.population}">${integer.format(game.population)} жителей</span>
              · каждый шаг оставляет след в системе города
            </p>
          </div>
          <div class="period">
            <span class="period-label">${dateLabel(game.month)}</span>
            <strong class="period-value" data-testid="month" data-month="${game.month}">
              ${monthLabel(game.month)} <span>${game.month ? '/ 120' : '· впереди 120 месяцев'}</span>
            </strong>
            <progress aria-label="Срок управления" value="${game.month}" max="120"></progress>
          </div>
        </header>
        <div class="toolbar">
          <p class="save-status">
            ${icon(saved ? 'check' : 'clock', 15)}
            ${storageBlocked ? 'Сохранение требует внимания' : saved ? 'Сохранено в этом браузере' : 'Новая партия'}
          </p>
          <div class="step-controls">
            <button class="button quiet" data-action="save" aria-label="Сохранить партию" data-testid="save" ${disabled(storageBlocked)}>
              ${icon('save', 17)}
              <span class="save-label">Сохранить</span>
            </button>
            <button class="button secondary" data-action="advance-3" data-testid="advance-3" title="Применит действующую политику три раза" ${disabled(locked())}>
              +3 месяца
            </button>
            <button class="button primary" data-action="advance-1" data-testid="advance-1" ${disabled(locked())}>
              Следующий месяц ${icon('next', 17)}
            </button>
          </div>
        </div>
        ${errorMessage ? `<div class="alert" role="alert" data-testid="error">${escapeHTML(errorMessage)}${storageBlocked ? '<button class="button secondary" data-action="new-game">Начать новую игру</button>' : ''}</div>` : ''}
        <div class="notice-region" role="status" aria-live="polite">
          ${notice ? `<p class="toast">${icon('check', 16)} ${escapeHTML(notice)}</p>` : ''}
        </div>
        <div class="view active" id="current-view">${views[view]()}</div>
        <footer class="main-footer">
          ${bookLink()}
          <button class="mobile-reset" data-action="new-game">Новая игра</button>
          <span>ЛОХХАУЗЕН · СИМУЛЯТОР СИСТЕМНОГО МЫШЛЕНИЯ ПО ДЁРНЕРУ</span>
          <button data-view="model">О книге и допущениях ${icon('arrow', 13)}</button>
        </footer>
      </main>
    </div>
    <dialog id="new-game-dialog" aria-labelledby="reset-title">
      <h2 id="reset-title">Начать заново?</h2>
      <p>Текущая партия в этом браузере будет заменена новой. У вас снова будет 10 лет управления городом.</p>
      <div class="dialog-actions">
        <button class="button secondary" data-action="cancel-new-game">Остаться в городе</button>
        <button class="button danger" data-action="confirm-new-game" data-testid="confirm-new-game">Начать новую игру</button>
      </div>
    </dialog>
  `;

  renderNavigationLinks();
  localizeDocument(app, language);
  document.querySelector('.skip-link').textContent = translate('Перейти к содержимому', language);
  const focusTarget = focusId ? document.getElementById(focusId) : focusTestId ? app.querySelector(`[data-testid="${CSS.escape(focusTestId)}"]`) : null;
  if (focusTarget && !focusTarget.disabled) focusTarget.focus({ preventScroll: true });
}

app.addEventListener('click', event => {
  const control = event.target.closest('[data-view], [data-action], [data-project], [data-report], [data-open-report], [data-district], [data-loop]');
  if (!control || control.disabled) return;
  if (control.matches('a[href]') && (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0)) return;
  event.preventDefault();
  try {
    if (control.dataset.view) {
      setRoute(control.dataset.view);
      notice = '';
      render();
      window.scrollTo(0, 0);
      return;
    }
    const selectedReport = control.dataset.report || control.dataset.openReport || control.dataset.district;
    if (selectedReport) {
      setRoute('reports', selectedReport);
      notice = '';
      render();
      window.scrollTo(0, 0);
      return;
    }
    if (control.dataset.loop) {
      activeLoopId = control.dataset.loop;
      render();
      return;
    }
    if (control.dataset.project) {
      const type = control.dataset.project;
      commit(startProject(game, type, `Ожидаемый ввод: месяц ${game.month + PROJECTS[type].duration}.`), `Проект «${PROJECTS[type].label}» начат. Стоимость списана один раз; ввод через ${PROJECTS[type].duration} мес.`);
      return;
    }
    switch (control.dataset.action) {
      case 'advance-1':
      case 'advance-3': {
        const months = control.dataset.action === 'advance-1' ? 1 : 3;
        const next = advance(game, months);
        if (next.month >= 120) setRoute('debrief');
        commit(next, next.month >= 120 ? 'Десять лет завершены. Итоги вашей партии готовы.' : `Рассчитан месяц ${next.month}. Ознакомьтесь с хроникой хода.`);
        break;
      }
      case 'request-report':
        commit(requestReport(game, reportKind), `Отчет «${reports[reportKind]}» получен ${reportPeriod(game.month)}.`);
        break;
      case 'request-all-reports': {
        let updated = game;
        for (const kind of Object.keys(reports)) {
          updated = requestReport(updated, kind);
        }
        commit(updated, `Получены свежие отчеты всех пяти служб на месяц ${game.month}.`);
        break;
      }
      case 'save':
        if (persist()) notice = 'Партия сохранена в этом браузере.';
        render();
        break;
      case 'new-game':
        document.querySelector('#new-game-dialog').showModal();
        break;
      case 'cancel-new-game':
        document.querySelector('#new-game-dialog').close();
        break;
      case 'confirm-new-game':
        game = createGame();
        storageBlocked = false;
        errorMessage = '';
        setRoute('overview');
        reportKind = 'factory';
        chartMetric = 'finance';
        notice = 'Новая партия началась. У вас десять лет управления.';
        persist();
        render();
        window.scrollTo(0, 0);
        break;
    }
  } catch (error) {
    errorMessage = error.message;
    render();
  }
});

app.addEventListener('input', event => {
  // Sync range slider with number input and live What-If preview
  if (event.target.matches('input[type="range"][data-sync-for]')) {
    const targetId = event.target.dataset.syncFor;
    const numInput = document.getElementById(targetId);
    if (numInput) {
      numInput.value = event.target.value;
      const key = numInput.name;
      const whatIfBox = document.getElementById(`what-if-${key}`);
      if (whatIfBox) {
        const preview = getPolicyWhatIf(key, event.target.value, game);
        whatIfBox.innerHTML = `
          <span class="what-if-direct">⚡ ${escapeHTML(preview.direct)}</span>
          <span class="what-if-side">🔄 ${escapeHTML(preview.sideEffect)}</span>
          <span class="what-if-risk">⚠️ ${escapeHTML(preview.risk)}</span>
        `;
      }
    }
  } else if (event.target.matches('#policy-form input[type="number"]')) {
    const range = document.querySelector(`input[type="range"][data-sync-for="${CSS.escape(event.target.id)}"]`);
    if (range) range.value = event.target.value;
    const key = event.target.name;
    const whatIfBox = document.getElementById(`what-if-${key}`);
    if (whatIfBox) {
      const preview = getPolicyWhatIf(key, event.target.value, game);
      whatIfBox.innerHTML = `
        <span class="what-if-direct">⚡ ${escapeHTML(preview.direct)}</span>
        <span class="what-if-side">🔄 ${escapeHTML(preview.sideEffect)}</span>
        <span class="what-if-risk">⚠️ ${escapeHTML(preview.risk)}</span>
      `;
    }
  }
});

app.addEventListener('submit', event => {
  if (event.target.id !== 'policy-form') return;
  event.preventDefault();
  if (locked()) return;
  const form = new FormData(event.target);
  const policy = Object.fromEntries(Object.keys(POLICY_CONFIG).map(key => [key, Number(form.get(key))]));
  try {
    commit(setPolicies(game, policy, String(form.get('policyNote') || '').trim()), 'Политика принята. Она действует каждый следующий месяц до нового решения.');
  } catch (error) {
    errorMessage = error.message;
    render();
  }
});

app.addEventListener('change', event => {
  if (event.target.id === 'language-select') {
    const draft = [...app.querySelectorAll('#policy-form input, #policy-form textarea')].map(field => [field.name, field.value]);
    language = event.target.value;
    storedLanguage = language;
    number = new Intl.NumberFormat(language, { maximumFractionDigits: 1 });
    integer = new Intl.NumberFormat(language, { maximumFractionDigits: 0 });
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Language remains encoded in URL. */ }
    window.history.pushState(null, '', localizedPath(`${location.pathname}${location.search}${location.hash}`, language));
    render();
    for (const [name, value] of draft) {
      const field = app.querySelector(`[name="${CSS.escape(name)}"]`);
      if (field) field.value = value;
    }
  }
  if (event.target.id === 'chart-metric') {
    chartMetric = event.target.value;
    render();
  }
});

app.addEventListener('keydown', event => {
  const landmark = event.target.closest('[data-district]');
  if (landmark && ['Enter', ' '].includes(event.key)) {
    event.preventDefault();
    landmark.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }
});

window.addEventListener('popstate', () => {
  const route = resolveRoute(window.location.pathname);
  if (!route) {
    window.location.reload();
    return;
  }
  view = route.view;
  try { storedLanguage = localStorage.getItem(LANGUAGE_KEY) || storedLanguage; } catch { /* Retain session preference. */ }
  language = languageFrom(window.location.search, storedLanguage);
  number = new Intl.NumberFormat(language, { maximumFractionDigits: 1 });
  integer = new Intl.NumberFormat(language, { maximumFractionDigits: 0 });
  reportKind = route.reportKind || 'factory';
  notice = '';
  render();
  window.scrollTo(0, 0);
});

render();
