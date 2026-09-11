const HORIZON = 120;
const SCENARIO_HORIZONS = Object.freeze({ sandbox: 120, factory_crisis: 36, tourism_dilemma: 48, dorner_challenge: 60 });
const REPORT_KINDS = ['finance', 'factory', 'housing', 'social', 'tourism'];
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round = (value, digits = 6) => Number(value.toFixed(digits));
const copy = (value) => structuredClone(value);

export const POLICY_CONFIG = Object.freeze({
  taxRate: { label: 'Налоговая ставка', min: 5, max: 35, step: 1, unit: '%', description: 'Доля зарплат, поступающая в казну.' },
  wage: { label: 'Оплата труда фабрики', min: 70, max: 140, step: 1, unit: '% базовой ставки', description: 'Влияет на расходы фабрики и удовлетворенность рабочих.' },
  maintenance: { label: 'Обслуживание станков', min: 0, max: 80, step: 1, unit: 'тыс. марок/мес.', description: 'Замедляет износ и при достаточном уровне восстанавливает оборудование.' },
  services: { label: 'Общественные услуги', min: 0, max: 150, step: 1, unit: 'тыс. марок/мес.', description: 'Поддерживает качество услуг и здоровье.' },
  education: { label: 'Профессиональное обучение', min: 0, max: 100, step: 1, unit: 'тыс. марок/мес.', description: 'С задержкой повышает квалификацию.' },
  marketing: { label: 'Сбыт часов', min: 0, max: 80, step: 1, unit: 'тыс. марок/мес.', description: 'Расширяет внешний спрос на часы.' },
  tourismMarketing: { label: 'Реклама туризма', min: 0, max: 60, step: 1, unit: 'тыс. марок/мес.', description: 'Привлекает посетителей только при наличии мест и работников.' },
});

export const PROJECTS = Object.freeze({
  housing: { label: 'Муниципальное жильё', cost: 300, duration: 12, description: 'Через 12 месяцев добавляет 60 мест жилья.' },
  modernization: { label: 'Модернизация фабрики', cost: 460, duration: 9, description: 'Повышает состояние оборудования и производительность.' },
  tourism: { label: 'Туристическая инфраструктура', cost: 220, duration: 6, description: 'Добавляет 80 мест для посетителей.' },
});

const DEFAULT_POLICIES = Object.freeze({ taxRate: 16, wage: 100, maintenance: 14, services: 68, education: 20, marketing: 20, tourismMarketing: 5 });

function snapshot(game) {
  return { month: game.month, population: game.population, treasury: game.treasury, debt: game.debt, production: game.production, unemployment: game.unemployment, housingShortage: game.housingShortage, satisfaction: game.satisfaction, equipment: game.equipment, housingCapacity: game.housingCapacity, tourismCapacity: game.tourismCapacity, visitors: game.visitors, serviceQuality: game.serviceQuality };
}

function makeBudget() {
  return { income: 0, expenses: 0, net: 0, taxIncome: 0, factoryProfit: 0, tourismIncome: 0, rentIncome: 0, services: 0, education: 0, administration: 0, interest: 0 };
}

export function createGame() {
  const game = {
    version: 1, month: 0, horizon: HORIZON, population: 3700, treasury: 1200, debt: 0, housingCapacity: 3900,
    workforce: 2054, factoryJobs: 1130, otherJobs: 700, tourismJobs: 0, unemployment: 224, housingShortage: 0,
    equipment: 48, skills: 45, production: 890, inventory: 80, sales: 810, demand: 810,
    serviceQuality: 63, health: 64, education: 43, satisfactionGroups: { workers: 84, families: 84, seniors: 85 }, satisfaction: 84,
    tourismCapacity: 20, tourismDemand: 90, visitors: 0, policies: copy(DEFAULT_POLICIES), projects: [], reports: {}, reportHistory: [], history: [],
    journal: [{ month: 0, type: 'system', title: 'Начало управления городом', note: 'Стартовая сводка зафиксирована.' }],
    events: ['Город ожидает первых решений бургомистра.'], lastBudget: makeBudget(), modernizationLevel: 0, migrationPressure: 0,
  };
  game.history.push(snapshot(game));
  recordReportSnapshot(game);
  return game;
}

function assertActive(game, action) { if (game.month >= game.horizon) throw new Error(`После ${game.horizon}-го месяца нельзя ${action}.`); }
function assertGameLike(game) { if (!game || typeof game !== 'object' || Array.isArray(game)) throw new Error('Передано некорректное состояние игры.'); }
function validatePolicyValue(key, value) {
  const config = POLICY_CONFIG[key];
  if (!config || !Number.isFinite(value) || value < config.min || value > config.max) throw new Error(`Недопустимое значение политики «${key}».`);
}

export function setPolicies(game, patch, note = '') {
  assertGameLike(game); assertActive(game, 'изменять решения');
  if (!patch || typeof patch !== 'object' || Array.isArray(patch) || Object.keys(patch).length === 0) throw new Error('Нужно указать хотя бы одно изменение политики.');
  for (const [key, value] of Object.entries(patch)) validatePolicyValue(key, value);
  const next = copy(game);
  next.policies = { ...next.policies, ...patch };
  next.journal.push({ month: next.month, type: 'policy', title: 'Изменение политики', note: String(note), changes: copy(patch) });
  next.events = ['Политика города обновлена.'];
  return next;
}

export function startProject(game, type, note = '') {
  assertGameLike(game); assertActive(game, 'запускать проекты');
  const project = PROJECTS[type];
  if (!project) throw new Error('Неизвестный инвестиционный проект.');
  if (game.month + project.duration > game.horizon) throw new Error('Для этого проекта не осталось времени до окончания управления.');
  if (!Number.isFinite(game.treasury) || game.treasury < project.cost) throw new Error('Недостаточно средств в казне для этого проекта.');
  const next = copy(game);
  const item = { id: `${type}-${next.month}-${next.projects.length + 1}`, type, label: project.label, cost: project.cost, startMonth: next.month, completeMonth: next.month + project.duration };
  next.treasury = round(next.treasury - project.cost);
  next.projects.push(item);
  next.journal.push({ month: next.month, type: 'project', title: `Запущен проект: ${project.label}`, note: String(note), project: copy(item) });
  next.events = [`${project.label}: ввод запланирован на месяц ${item.completeMonth}.`];
  return next;
}

export function trade({ production, inventory, demand, price }) {
  for (const value of [production, inventory, demand, price]) if (!Number.isFinite(value) || value < 0) throw new Error('Для торговли нужны неотрицательные конечные числа.');
  const available = production + inventory;
  const sales = Math.min(available, demand);
  return { sales: round(sales), inventory: round(available - sales), revenue: round(sales * price) };
}

function weightedSatisfaction(parts) {
  const sufficientLevel = 82;
  const criticalLevel = 40;
  const weight = parts.reduce((sum, part) => sum + part.weight, 0);
  const penalty = parts.reduce((sum, part) => {
    const score = clamp(part.score, 0, sufficientLevel);
    const deficit = (sufficientLevel - score) / sufficientLevel;
    const criticalMultiplier = score < criticalLevel ? 1 + ((criticalLevel - score) / criticalLevel) * 1.25 : 1;
    return sum + part.weight * deficit * criticalMultiplier;
  }, 0) / weight;
  return round(clamp(100 * (1 - penalty), 0, 100));
}

function reportData(game, kind) {
  const netPosition = round(game.treasury - game.debt);
  const reports = {
    finance: { data: { treasury: game.treasury, debt: game.debt, netPosition, lastBudget: copy(game.lastBudget) }, observations: [netPosition < 0 ? 'Долг превышает свободную казну.' : 'Чистая финансовая позиция пока неотрицательна.'] },
    factory: { data: { equipment: game.equipment, skills: game.skills, factoryJobs: game.factoryJobs, production: game.production, sales: game.sales, inventory: game.inventory, demand: game.demand }, observations: [game.inventory > game.demand ? 'Запасы превышают один текущий месяц спроса.' : 'Запасы не превышают текущий спрос.'] },
    housing: { data: { population: game.population, housingCapacity: game.housingCapacity, housingShortage: game.housingShortage }, observations: [game.housingShortage > 0 ? 'Спрос жителей превысил вместимость жилья.' : 'Дефицита мест жилья сейчас нет.'] },
    social: { data: { health: game.health, serviceQuality: game.serviceQuality, education: game.education, satisfactionGroups: copy(game.satisfactionGroups), satisfaction: game.satisfaction, workforce: game.workforce, unemployment: game.unemployment }, observations: [game.unemployment > game.workforce * 0.1 ? 'Безработица заметно влияет на условия жизни.' : 'Занятость пока поддерживает социальную ситуацию.'] },
    tourism: { data: { tourismCapacity: game.tourismCapacity, tourismDemand: game.tourismDemand, tourismJobs: game.tourismJobs, visitors: game.visitors }, observations: [game.tourismDemand > game.visitors ? 'Туристический спрос ограничен местами или работниками.' : 'Спрос туристов обслужен имеющимися ресурсами.'] },
  };
  return reports[kind];
}

function recordReportSnapshot(game) {
  if (!Array.isArray(game.reportHistory)) game.reportHistory = [];
  const dataByKind = Object.fromEntries(REPORT_KINDS.map((kind) => [kind, reportData(game, kind).data]));
  game.reportHistory = [...game.reportHistory.filter((entry) => entry.month !== game.month), { month: game.month, dataByKind }].slice(-2);
}

function previousReportData(game, kind) {
  const previous = game.reportHistory.find((entry) => entry.month === game.month - 1);
  return previous ? { month: previous.month, data: copy(previous.dataByKind[kind]) } : null;
}

export function requestReport(game, kind) {
  assertGameLike(game);
  if (!REPORT_KINDS.includes(kind)) throw new Error('Неизвестный вид отчёта.');
  const next = copy(game);
  if (!Array.isArray(next.reportHistory)) next.reportHistory = [];
  const report = reportData(next, kind);
  const labels = { finance: 'финансы', factory: 'фабрика', housing: 'жильё', social: 'социальная сфера', tourism: 'туризм' };
  next.reports[kind] = { month: next.month, data: report.data, observations: report.observations, comparison: previousReportData(next, kind) };
  next.journal.push({ month: next.month, type: 'report', title: `Запрошен отчёт: ${labels[kind]}`, note: '' });
  next.events = [next.month === 0 ? 'Получен отчёт на начало управления.' : `Получен отчёт за месяц ${next.month}.`];
  return next;
}

function applyProjects(game, events) {
  const active = [];
  for (const project of game.projects) {
    if (project.completeMonth > game.month) { active.push(project); continue; }
    if (project.type === 'housing') game.housingCapacity += 60;
    if (project.type === 'modernization') { game.equipment = clamp(game.equipment + 12, 0, 100); game.modernizationLevel = round(game.modernizationLevel + 1); }
    if (project.type === 'tourism') game.tourismCapacity += 80;
    game.journal.push({ month: game.month, type: 'completion', title: `Завершён проект: ${project.label}`, note: '' });
    events.push(`${project.label} введён в эксплуатацию.`);
  }
  game.projects = active;
}

function advanceOne(source) {
  const game = copy(source);
  if (!Array.isArray(game.reportHistory) || !game.reportHistory.some((entry) => entry.month === game.month)) recordReportSnapshot(game);
  game.month += 1;
  const events = [];
  applyProjects(game, events);
  const p = game.policies;
  const populationBeforeMigration = Math.max(0, game.population);
  const workforce = populationBeforeMigration === 0 ? 0 : round(populationBeforeMigration * 0.555);
  const serviceNeed = Math.max(1, populationBeforeMigration * 0.0205);
  game.equipment = round(clamp(game.equipment + p.maintenance * 0.044 - (0.72 + game.production / 1300 * 0.18), 0, 100));
  const skillTarget = clamp(31 + p.education * 0.78 + game.modernizationLevel * 3, 0, 100);
  game.skills = round(clamp(game.skills + (skillTarget - game.skills) * 0.075, 0, 100));

  const productivity = 1.27 * (0.43 + game.equipment / 100 * 0.57) * (0.50 + game.skills / 100 * 0.50) * (1 + game.modernizationLevel * 0.12);
  const qualityDemand = (0.58 + game.equipment / 100 * 0.42) * (0.62 + game.skills / 100 * 0.38);
  const forecastDemand = (730 + p.marketing * 5.2) * qualityDemand;
  const desiredProduction = Math.max(0, forecastDemand - game.inventory * 0.18);
  const technicalFactoryPositions = Math.max(0, Math.round(610 + game.equipment * 7 + game.skills * 4 + game.modernizationLevel * 180));
  const marketFactoryPositions = Math.max(0, Math.ceil(desiredProduction / Math.max(0.1, productivity)));
  const factoryPositions = Math.min(technicalFactoryPositions, marketFactoryPositions);
  const otherPositions = Math.max(0, Math.round(populationBeforeMigration * (0.16 + game.serviceQuality / 2500 + p.services / 850)));
  game.otherJobs = Math.min(workforce, otherPositions);
  game.factoryJobs = Math.min(Math.max(0, workforce - game.otherJobs), factoryPositions);
  const seasonalTourism = 20 + 28 * Math.sin(((game.month - 2) / 12) * Math.PI * 2);
  game.tourismDemand = round(Math.max(0, 72 + p.tourismMarketing * 4.8 + seasonalTourism));
  const potentialVisitors = Math.min(game.tourismDemand, game.tourismCapacity);
  const availableForTourism = Math.max(0, workforce - game.otherJobs - game.factoryJobs);
  game.tourismJobs = Math.min(availableForTourism, Math.ceil(potentialVisitors / 8));
  game.visitors = round(Math.min(potentialVisitors, game.tourismJobs * 8));
  game.unemployment = round(Math.max(0, workforce - game.otherJobs - game.factoryJobs - game.tourismJobs));

  game.production = round(Math.max(0, game.factoryJobs * productivity));
  game.demand = round(Math.max(0, (730 + p.marketing * 5.2 + 35 * Math.sin(game.month / 12 * Math.PI * 2)) * qualityDemand));
  const goods = trade({ production: game.production, inventory: game.inventory, demand: game.demand, price: 0.57 });
  game.sales = goods.sales; game.inventory = goods.inventory;

  const factoryWages = game.factoryJobs * 0.105 * (p.wage / 100);
  const materials = game.production * 0.145;
  const factoryProfit = goods.revenue - factoryWages - materials - p.maintenance - p.marketing;
  const otherWages = game.otherJobs * 0.09;
  const tourismWages = game.tourismJobs * 0.085;
  const taxIncome = (factoryWages + otherWages + tourismWages) * (p.taxRate / 100);
  const tourismIncome = game.visitors * 0.19;
  const rentIncome = Math.min(game.housingCapacity, populationBeforeMigration) * 0.006;
  const debtBeforeBudget = game.debt;
  const interest = game.debt * 0.008;
  const administration = 78 + populationBeforeMigration * 0.004;
  const income = taxIncome + factoryProfit + tourismIncome + rentIncome;
  const expenses = p.services + p.education + p.tourismMarketing + administration + interest;
  const net = income - expenses;
  if (net >= 0) { const repayment = Math.min(game.debt, net); game.debt = round(game.debt - repayment); game.treasury = round(game.treasury + net - repayment); }
  else { const shortage = -net; const treasuryUsed = Math.min(game.treasury, shortage); game.treasury = round(game.treasury - treasuryUsed); game.debt = round(game.debt + shortage - treasuryUsed); }
  game.lastBudget = { income: round(income), expenses: round(expenses), net: round(net), taxIncome: round(taxIncome), factoryProfit: round(factoryProfit), tourismIncome: round(tourismIncome), rentIncome: round(rentIncome), services: p.services, education: p.education, administration: round(administration), interest: round(interest) };

  const serviceTarget = clamp(18 + 72 * Math.min(1.15, p.services / serviceNeed), 0, 100);
  game.serviceQuality = round(clamp(game.serviceQuality + (serviceTarget - game.serviceQuality) * 0.11 - Math.max(0, populationBeforeMigration - game.housingCapacity) / Math.max(1, populationBeforeMigration) * 2, 0, 100));
  const healthTarget = clamp(18 + game.serviceQuality * 0.62 + p.services / serviceNeed * 14 - game.unemployment / Math.max(1, workforce) * 12, 0, 100);
  game.health = round(clamp(game.health + (healthTarget - game.health) * 0.09, 0, 100));
  game.education = round(clamp(game.education + (skillTarget - game.education) * 0.06, 0, 100));
  const employmentScore = workforce === 0 ? 0 : 100 * (1 - game.unemployment / workforce);
  const housingScore = populationBeforeMigration === 0 ? 100 : 100 * (1 - Math.max(0, populationBeforeMigration - game.housingCapacity) / populationBeforeMigration);
  const disposableScore = clamp(40 + p.wage * 0.5 - (p.taxRate - 5) * 1.4, 0, 100);
  game.satisfactionGroups = {
    workers: weightedSatisfaction([{ score: employmentScore, weight: 0.31 }, { score: game.equipment, weight: 0.17 }, { score: game.serviceQuality, weight: 0.18 }, { score: game.health, weight: 0.13 }, { score: disposableScore, weight: 0.21 }]),
    families: weightedSatisfaction([{ score: housingScore, weight: 0.28 }, { score: game.education, weight: 0.18 }, { score: game.serviceQuality, weight: 0.18 }, { score: game.health, weight: 0.15 }, { score: employmentScore, weight: 0.13 }, { score: disposableScore, weight: 0.08 }]),
    seniors: weightedSatisfaction([{ score: game.health, weight: 0.33 }, { score: game.serviceQuality, weight: 0.28 }, { score: housingScore, weight: 0.15 }, { score: disposableScore, weight: 0.11 }, { score: employmentScore, weight: 0.13 }]),
  };
  game.satisfaction = round(game.satisfactionGroups.workers * 0.43 + game.satisfactionGroups.families * 0.34 + game.satisfactionGroups.seniors * 0.23);

  game.housingShortage = round(Math.max(0, populationBeforeMigration - game.housingCapacity));
  if (populationBeforeMigration === 0) {
    game.population = 0; game.workforce = 0; game.factoryJobs = 0; game.otherJobs = 0; game.tourismJobs = 0; game.unemployment = 0; game.housingShortage = 0;
  } else {
    const attraction = game.satisfaction - 90 - Math.max(0, p.taxRate - 20) * 0.55 - game.housingShortage / populationBeforeMigration * 60;
    const desiredMigration = clamp(attraction * 1.1 + (employmentScore - 90) * 0.15, -15, 2);
    game.migrationPressure = round(game.migrationPressure * 0.68 + desiredMigration * 0.32);
    game.population = round(Math.max(0, populationBeforeMigration + game.migrationPressure));
    game.workforce = round(game.population * 0.555);
    const employed = game.factoryJobs + game.otherJobs + game.tourismJobs;
    if (employed > game.workforce) { const ratio = game.workforce / employed; game.factoryJobs = round(game.factoryJobs * ratio); game.otherJobs = round(game.otherJobs * ratio); game.tourismJobs = round(game.tourismJobs * ratio); }
    game.unemployment = round(Math.max(0, game.workforce - game.factoryJobs - game.otherJobs - game.tourismJobs));
    game.housingShortage = round(Math.max(0, game.population - game.housingCapacity));
  }
  if (game.equipment < 25) events.push('Состояние станков стало критически низким.');
  if (game.housingShortage > 0) events.push('Население превысило вместимость жилья.');
  if (game.debt > debtBeforeBudget) events.push('Операционный дефицит увеличил долг города.');
  if (game.debt < debtBeforeBudget) events.push('Месячный профицит частично погасил долг города.');
  if (events.length === 0) events.push('Месячный баланс рассчитан без чрезвычайных событий.');
  game.events = events;
  game.history.push(snapshot(game));
  recordReportSnapshot(game);
  return game;
}

export function advance(game, months = 1) {
  assertGameLike(game);
  if (!Number.isInteger(months) || months < 0) throw new Error('Количество месяцев должно быть неотрицательным целым числом.');
  let next = copy(game);
  const steps = Math.min(months, Math.max(0, next.horizon - next.month));
  for (let index = 0; index < steps; index += 1) next = advanceOne(next);
  return next;
}

export const stepMonth = advance;

export function summarize(game) {
  assertGameLike(game);
  const first = game.history[0] || snapshot(game); const last = game.history.at(-1) || snapshot(game);
  const definitions = [['finance', 'Чистая финансовая позиция', 'тыс. марок', (item) => item.treasury - item.debt], ['production', 'Выпуск фабрики', 'часов/мес.', (item) => item.production], ['unemployment', 'Безработица', 'человек', (item) => item.unemployment], ['housing', 'Дефицит мест жилья', 'человек', (item) => item.housingShortage], ['satisfaction', 'Удовлетворённость', 'баллов из 100', (item) => item.satisfaction]];
  const metrics = definitions.map(([key, label, unit, get]) => { const initial = get(first); const final = get(last); return { key, label, initial, final, change: final - initial, unit }; });
  const lessons = [];
  if (last.treasury - last.debt > first.treasury - first.debt) lessons.push('Чистая финансовая позиция улучшилась. Сопоставьте запас средств с месячным балансом и будущими расходами.');
  if (last.debt > first.debt) lessons.push('Рост долга совпал с месяцами, когда текущие доходы не покрывали расходы.');
  if (last.unemployment > first.unemployment) lessons.push('Число безработных выросло. Сопоставьте изменение рабочей силы с количеством рабочих мест; высокая общая удовлетворенность не отменяет проблемы занятости.');
  if (last.production < first.production) lessons.push('Выпуск ниже стартового уровня. Стартовая величина задана отдельно от месячного расчета, поэтому это сравнение само по себе не показывает эффект ваших решений. Проверьте также динамику от первого рассчитанного месяца.');
  if (last.housingShortage > 0) lessons.push('Приток или сохранение населения создали дефицит мест жилья; эффект строительства проявляется с задержкой.');
  if (last.satisfaction < first.satisfaction) lessons.push('Низкие базовые условия нескольких групп усилили снижение общей удовлетворённости.');
  if (game.journal.some((entry) => entry.type === 'policy' || entry.type === 'project')) lessons.push('Сопоставьте эти изменения с датами собственных решений в журнале: совпадение не доказывает единственную причину.');
  if (lessons.length === 0) lessons.push('Динамика города зависит от сочетания бюджета, занятости, жилья и услуг; просмотрите журнал решений по месяцам.');
  return { metrics, lessons };
}

export function serializeGame(game) { assertGameLike(game); return JSON.stringify(game); }

const NUMBER_FIELDS = ['version', 'month', 'horizon', 'population', 'treasury', 'debt', 'housingCapacity', 'workforce', 'factoryJobs', 'otherJobs', 'tourismJobs', 'unemployment', 'housingShortage', 'equipment', 'skills', 'production', 'inventory', 'sales', 'demand', 'serviceQuality', 'health', 'education', 'satisfaction', 'tourismCapacity', 'tourismDemand', 'visitors', 'modernizationLevel', 'migrationPressure'];
const PERCENT_FIELDS = ['equipment', 'skills', 'serviceQuality', 'health', 'education', 'satisfaction'];
const NON_NEGATIVE_FIELDS = ['population', 'treasury', 'debt', 'housingCapacity', 'workforce', 'factoryJobs', 'otherJobs', 'tourismJobs', 'unemployment', 'housingShortage', 'production', 'inventory', 'sales', 'demand', 'tourismCapacity', 'tourismDemand', 'visitors', 'modernizationLevel'];
function isPlainObject(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }
function validSnapshot(item) {
  return isPlainObject(item)
    && ['month', 'population', 'treasury', 'debt', 'production', 'unemployment', 'housingShortage', 'satisfaction'].every((key) => Number.isFinite(item[key]))
    && ['equipment', 'housingCapacity', 'tourismCapacity', 'visitors', 'serviceQuality'].every(key => !(key in item) || (Number.isFinite(item[key]) && item[key] >= 0));
}
function validReportData(kind, data) {
  const numberKeys = {
    finance: ['treasury', 'debt', 'netPosition'],
    factory: ['equipment', 'skills', 'factoryJobs', 'production', 'sales', 'inventory', 'demand'],
    housing: ['population', 'housingCapacity', 'housingShortage'],
    social: ['health', 'serviceQuality', 'education', 'satisfaction', 'workforce', 'unemployment'],
    tourism: ['tourismCapacity', 'tourismDemand', 'tourismJobs', 'visitors'],
  };
  if (!isPlainObject(data) || !numberKeys[kind]?.every((key) => Number.isFinite(data[key]))) return false;
  if (kind === 'finance' && (!isPlainObject(data.lastBudget) || !['income', 'expenses', 'net'].every((key) => Number.isFinite(data.lastBudget[key])))) return false;
  return kind !== 'social' || (isPlainObject(data.satisfactionGroups) && ['workers', 'families', 'seniors'].every((key) => Number.isFinite(data.satisfactionGroups[key])));
}
function validReportHistory(history, currentMonth) {
  return Array.isArray(history) && history.length <= 2 && history.every((entry, index) => isPlainObject(entry)
    && Number.isInteger(entry.month) && entry.month >= 0 && entry.month <= currentMonth
    && (index === 0 || history[index - 1].month < entry.month)
    && isPlainObject(entry.dataByKind) && REPORT_KINDS.every((kind) => validReportData(kind, entry.dataByKind[kind])));
}
function validComparison(kind, report) {
  return report.comparison === null || (isPlainObject(report.comparison)
    && Number.isInteger(report.comparison.month) && report.comparison.month >= 0 && report.comparison.month === report.month - 1
    && validReportData(kind, report.comparison.data));
}
function validateGame(value) {
  if (!isPlainObject(value) || value.version !== 1 || !NUMBER_FIELDS.every((key) => Number.isFinite(value[key]))) return false;
  const expectedHorizon = value.scenarioId === undefined ? HORIZON : SCENARIO_HORIZONS[value.scenarioId];
  if (value.horizon !== expectedHorizon) return false;
  if (!Number.isInteger(value.month) || value.month < 0 || value.month > value.horizon || !NON_NEGATIVE_FIELDS.every((key) => value[key] >= 0) || !PERCENT_FIELDS.every((key) => value[key] >= 0 && value[key] <= 100)) return false;
  if (!isPlainObject(value.satisfactionGroups) || !['workers', 'families', 'seniors'].every((key) => Number.isFinite(value.satisfactionGroups[key]) && value.satisfactionGroups[key] >= 0 && value.satisfactionGroups[key] <= 100)) return false;
  if (!isPlainObject(value.policies) || !Object.keys(POLICY_CONFIG).every((key) => Number.isFinite(value.policies[key]) && value.policies[key] >= POLICY_CONFIG[key].min && value.policies[key] <= POLICY_CONFIG[key].max)) return false;
  if (!Array.isArray(value.projects) || !value.projects.every((project) => isPlainObject(project) && typeof project.id === 'string' && typeof project.label === 'string' && PROJECTS[project.type] && Number.isFinite(project.cost) && project.cost >= 0 && Number.isInteger(project.startMonth) && Number.isInteger(project.completeMonth) && project.startMonth >= 0 && project.completeMonth > project.startMonth && project.completeMonth <= value.horizon)) return false;
  if (!isPlainObject(value.reports) || !Object.entries(value.reports).every(([kind, report]) => REPORT_KINDS.includes(kind) && isPlainObject(report) && Number.isInteger(report.month) && report.month >= 0 && report.month <= value.month && validReportData(kind, report.data) && Array.isArray(report.observations) && report.observations.every((item) => typeof item === 'string') && validComparison(kind, report))) return false;
  if (!validReportHistory(value.reportHistory, value.month)) return false;
  if (!Array.isArray(value.history) || value.history.length === 0 || !value.history.every(validSnapshot) || value.history[0].month !== 0 || value.history.at(-1).month !== value.month || !value.history.every((item, index) => item.month === index)) return false;
  if (!Array.isArray(value.journal) || !value.journal.every((entry) => isPlainObject(entry) && Number.isInteger(entry.month) && entry.month >= 0 && entry.month <= value.month && typeof entry.type === 'string' && typeof entry.title === 'string' && typeof entry.note === 'string')) return false;
  if (!Array.isArray(value.events) || !value.events.every((event) => typeof event === 'string') || !isPlainObject(value.lastBudget) || !['income', 'expenses', 'net'].every((key) => Number.isFinite(value.lastBudget[key]))) return false;
  return true;
}

export function deserializeGame(raw) {
  if (typeof raw !== 'string') return new Error('Не удалось прочитать сохранение: ожидался JSON.');
  try {
    const parsed = JSON.parse(raw);
    if (isPlainObject(parsed)) {
      if (!('reportHistory' in parsed)) parsed.reportHistory = [];
      if (isPlainObject(parsed.reports)) for (const report of Object.values(parsed.reports)) if (isPlainObject(report) && !('comparison' in report)) report.comparison = null;
    }
    return validateGame(parsed) ? copy(parsed) : new Error('Сохранение повреждено или имеет неверную структуру.');
  }
  catch { return new Error('Не удалось прочитать сохранение: повреждён JSON.'); }
}
