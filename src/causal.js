/**
 * Causal explanation engine, advisor intelligence, and Dörner cognitive trap
 * analyzer for the Lohhausen simulator.
 *
 * Implements the system dynamics mental model from Dietrich Dörner's
 * "Die Logik des Mißlingens" (The Logic of Failure).
 */

export const ADVISORS = Object.freeze({
  factory: {
    id: 'krause',
    sphere: 'factory',
    name: 'Герр Краузе',
    role: 'Директор часовой фабрики',
    icon: 'factory',
    color: '#9c7840',
    title: 'Часовое производство и сбыт',
    evaluate: (game) => getAdvisorDiagnosis('factory', game),
  },
  finance: {
    id: 'weber',
    sphere: 'finance',
    name: 'Фрау Вебер',
    role: 'Казначей города',
    icon: 'coins',
    color: '#345944',
    title: 'Казна, налоги и долговая нагрузка',
    evaluate: (game) => getAdvisorDiagnosis('finance', game),
  },
  housing: {
    id: 'bauer',
    sphere: 'housing',
    name: 'Герр Бауэр',
    role: 'Главный архитектор и жилищный комиссар',
    icon: 'home',
    color: '#718477',
    title: 'Жилой фонд и градостроительство',
    evaluate: (game) => getAdvisorDiagnosis('housing', game),
  },
  social: {
    id: 'frank',
    sphere: 'social',
    name: 'Доктор Франк',
    role: 'Комиссар по здравоохранению и труду',
    icon: 'people',
    color: '#51765f',
    title: 'Здравоохранение, услуги и образование',
    evaluate: (game) => getAdvisorDiagnosis('social', game),
  },
  tourism: {
    id: 'lindemann',
    sphere: 'tourism',
    name: 'Фрау Линдеманн',
    role: 'Управление туризма и развития',
    icon: 'leaf',
    color: '#bc9150',
    title: 'Гостеприимство и рекреация',
    evaluate: (game) => getAdvisorDiagnosis('tourism', game),
  },
  [Symbol.iterator]: function* () {
    yield this.factory;
    yield this.finance;
    yield this.housing;
    yield this.social;
    yield this.tourism;
  },
});

export const CAUSAL_LOOPS = Object.freeze([
  {
    id: 'tax_loop',
    title: 'Налоговая петля оттока',
    category: 'Финансы и миграция',
    loopType: 'balancing',
    typeLabel: 'Балансирующий контур (B)',
    icon: '⚖️',
    delayNodeIndex: -1,
    summary: 'Налоги ↑ ➔ Доходы казны ↑ сейчас, но Чистый доход ↓ ➔ Благополучие ↓ ➔ Отток населения ➔ Сжатие налоговой базы в будущем.',
    nodes: ['Налоговая ставка', 'Доходы бюджета', 'Располагаемый доход', 'Привлекательность', 'Миграция', 'Налоговая база'],
    explain: 'Повышение налога кажется легким способом закрыть дыру в казне. Однако бремя снижает привлекательность Лоххаузена: жители начинают уезжать, число налогоплательщиков падает, и в итоге налоговые поступления снова снижаются, несмотря на высокую ставку.',
    mechanism: 'Повышение налоговой ставки временно увеличивает сборы, но подрывает располагаемый доход и привлекательность города, вызывая отток населения.',
    dornerLesson: 'Недооценка запаздывающей обратной связи: участники эксперимента Дёрнера часто завышали налоги, не замечая оттока жителей.',
    dornerReference: 'Глава 2, §48: участники часто завышали налоги, не замечая оттока налогоплательщиков.',
  },
  {
    id: 'maintenance_loop',
    title: 'Петля износа станков',
    category: 'Производство',
    loopType: 'reinforcing',
    typeLabel: 'Усиливающий контур износа (R)',
    icon: '🔄',
    delayNodeIndex: 1,
    summary: 'Обслуживание ↓ ➔ Экономия бюджета сейчас, но Износ станков ↑ ➔ Брак и падение выпуска ➔ Спад продаж ➔ Убыток фабрики.',
    nodes: ['Расходы на ремонт', 'Состояние станков', 'Производительность', 'Выпуск часов', 'Выручка и прибыль'],
    explain: 'Экономия на текущем обслуживании станков не дает немедленного провала в первый же месяц. Но износ накапливается: станки ломаются, растет брак, выпуск падает, фабрика перестает приносить прибыль и начинает тянуть деньги из казны.',
    mechanism: 'Снижение расходов на обслуживание запускает кумулятивный износ оборудования, ведущий к обвалу выпуска и убыткам.',
    dornerLesson: 'Системное непонимание скрытого износа: участники списывали падение выпуска на внешние факторы, игнорируя деградацию фондов.',
    dornerReference: 'Глава 7, §85: участник объяснял падение выпуска леностью рабочих, хотя причиной был износ оборудования.',
  },
  {
    id: 'housing_lag_loop',
    title: 'Петля привлекательности и задержки жилья',
    category: 'Жилье и социум',
    loopType: 'balancing',
    typeLabel: 'Запаздывающий контур с лагом (B)',
    icon: '⏳',
    delayNodeIndex: 3,
    summary: 'Успех города ➔ Приток жителей ➔ Исчерпание жилья (лаг стройки 12 мес.) ➔ Дефицит мест ➔ Перегрузка услуг ➔ Спад благополучия.',
    nodes: ['Благополучие города', 'Приток мигрантов', 'Потребность в жилье', 'Строительство (лаг 12 мес.)', 'Дефицит мест', 'Спад удовлетворенности'],
    explain: 'Если сделать город привлекательным, люди начинают приезжать. Но строительство муниципального жилья длится 12 месяцев. Если не начать строить заранее, город сталкивается с дефицитом жилья и перегрузкой больниц, что разрушает достигнутое благополучие.',
    mechanism: 'Временной лаг возведения жилья (12 месяцев) порождает кризис дефицита при резком притоке новых жителей.',
    dornerLesson: 'Игнорирование временных лагов (time lags) — одна из главных причин паники и нетерпеливого перерегулирования.',
    dornerReference: 'Глава 6, §54: ошибки в учете временных задержек (time lags) — одна из главных причин управленческого краха.',
  },
  {
    id: 'debt_spiral',
    title: 'Долговая спираль',
    category: 'Финансы',
    loopType: 'reinforcing',
    typeLabel: 'Усиливающая долговая спираль (R)',
    icon: '🔄',
    delayNodeIndex: -1,
    summary: 'Дефицит ➔ Займы ➔ Рост долга ➔ Проценты по долгу (+0.8%/мес.) ➔ Еще больший дефицит в следующем месяце.',
    nodes: ['Операционный дефицит', 'Займы города', 'Накопленный долг', 'Процентные выплаты', 'Неизбежные расходы'],
    explain: 'Покрытие текущих расходов займами порождает обязательства по процентам. При ставке 0.8% в месяц долг в 5000 тыс. требует 40 тыс. только на выплату процентов каждый месяц, оставляя всё меньше денег на школы и ремонт.',
    mechanism: 'Экспоненциальное накопление процентных обязательств при систематическом бюджетном дефиците.',
    dornerLesson: 'Кредитная эйфория: участники покрывали операционные провалы займами, не просчитывая лавинообразный рост процентов.',
    dornerReference: 'Глава 1, §5–12: пример Моро — стремление заткнуть текущие дыры приводит к истощению всех ресурсов.',
  },
  {
    id: 'tourism_bottleneck',
    title: 'Бутылочное горлышко туризма',
    category: 'Экономика',
    loopType: 'balancing',
    typeLabel: 'Ограничивающий контур емкости (B)',
    icon: '⚖️',
    delayNodeIndex: 2,
    summary: 'Реклама туризма ↑ ➔ Внешний спрос ↑, но если нет Гостиниц или Работников ➔ Туристы не приедут, деньги на рекламу сгорели.',
    nodes: ['Реклама туризма', 'Туристический спрос', 'Вместимость гостиниц', 'Свободная рабочая сила', 'Реальные посетители'],
    explain: 'Реклама привлекает желающих приехать, но туризм жестко ограничен материальными ресурсами: числом спальных мест в городе и наличием свободных работников. Если мест всего 20, реклама на 50 тыс. просто сгорает впустую.',
    mechanism: 'Физическая пропускная способность номерного фонда ограничивает отдачу от маркетинговых расходов.',
    dornerLesson: '«Рекламный мираж»: иллюзия, что маркетингом можно решить проблему при отсутствии физической емкости.',
    dornerReference: 'Глава 5, §13–17: участники спускали огромные бюджеты на рекламу туризма в городе, где негде было переночевать.',
  },
]);

function maintenanceForecast(maintenance, game = {}) {
  const production = Number.isFinite(game.production) ? game.production : 890;
  const spending = Number.isFinite(Number(maintenance)) ? Number(maintenance) : 0;
  const wear = 0.72 + (production / 1300) * 0.18;
  return {
    breakEven: wear / 0.044,
    delta: spending * 0.044 - wear,
  };
}

export function skillsForecast(education, game = {}) {
  const spending = Number.isFinite(Number(education)) ? Number(education) : (game.policies?.education ?? 35);
  const curSkills = Number.isFinite(game.skills) ? game.skills : 45;
  const modernizationLevel = Number.isFinite(game.modernizationLevel) ? game.modernizationLevel : 0;
  // Match model.js: clamp(31 + p.education * 0.78 + game.modernizationLevel * 3, 0, 100)
  const target = Math.min(100, Math.max(0, 31 + spending * 0.78 + modernizationLevel * 3));
  // In model.js: game.skills = round(clamp(game.skills + (skillTarget - game.skills) * 0.075, 0, 100));
  const rawNextSkills = Math.min(100, Math.max(0, curSkills + (target - curSkills) * 0.075));
  const rawMonthlyDelta = (target - curSkills) * 0.075;
  const alpha = 0.075;
  // Exact discrete half-life: ln(0.5) / ln(1 - alpha) = 8.89... -> 8.9 мес.
  const halfLifeMonths = Number((Math.log(0.5) / Math.log(1 - alpha)).toFixed(1));
  // 95% gap closing time: ln(0.05) / ln(1 - alpha) = 38.4... -> 38.4 мес.
  const settlingMonths95 = Number((Math.log(0.05) / Math.log(1 - alpha)).toFixed(1));
  return {
    target: Number(target.toFixed(2)),
    targetRaw: target,
    curSkills: Number(curSkills.toFixed(2)),
    nextSkills: Number(rawNextSkills.toFixed(2)),
    nextSkillsExact: Number(rawNextSkills.toFixed(6)),
    monthlyDelta: Number(rawMonthlyDelta.toFixed(2)),
    monthlyDeltaExact: Number(rawMonthlyDelta.toFixed(6)),
    halfLifeMonths,
    settlingMonths95,
  };
}

export function servicesForecast(services, game = {}) {
  const pop = Number.isFinite(game.population) ? Math.max(0, game.population) : 3700;
  const currentSpending = Number.isFinite(game.policies?.services) ? game.policies.services : 68;
  const spending = Number.isFinite(Number(services)) ? Number(services) : currentSpending;
  const curQuality = Number.isFinite(game.serviceQuality) ? game.serviceQuality : 80;
  const serviceNeed = Math.max(1, pop * 0.0205);
  const target = Math.min(100, Math.max(0, 18 + 72 * Math.min(1.15, spending / serviceNeed)));
  const housingShortage = Math.max(0, pop - (game.housingCapacity ?? 3700));
  const housingPenalty = pop > 0 ? (housingShortage / pop) * 2 : 0;
  const rawNextQuality = Math.min(100, Math.max(0, curQuality + (target - curQuality) * 0.11 - housingPenalty));
  const rawMonthlyDelta = (target - curQuality) * 0.11 - housingPenalty;
  const alpha = 0.11;
  const halfLifeMonths = Number((Math.log(0.5) / Math.log(1 - alpha)).toFixed(1));
  const settlingMonths95 = Number((Math.log(0.05) / Math.log(1 - alpha)).toFixed(1));

  const currentOtherPositions = Math.max(0, Math.round(pop * (0.16 + curQuality / 2500 + currentSpending / 850)));
  const otherPositions = Math.max(0, Math.round(pop * (0.16 + curQuality / 2500 + spending / 850)));
  const jobDifference = otherPositions - currentOtherPositions;

  return {
    serviceNeed: Number(serviceNeed.toFixed(2)),
    curQuality: Number(curQuality.toFixed(2)),
    target: Number(target.toFixed(2)),
    targetRaw: target,
    nextQuality: Number(rawNextQuality.toFixed(2)),
    nextQualityExact: Number(rawNextQuality.toFixed(6)),
    monthlyDelta: Number(rawMonthlyDelta.toFixed(2)),
    monthlyDeltaExact: Number(rawMonthlyDelta.toFixed(6)),
    halfLifeMonths,
    settlingMonths95,
    otherPositions,
    currentOtherPositions,
    jobDifference,
  };
}

export function taxForecast(taxRate, game = {}) {
  const curTax = Number.isFinite(game.policies?.taxRate) ? game.policies.taxRate : 16;
  const rate = Number.isFinite(Number(taxRate)) ? Number(taxRate) : curTax;
  const wage = Number.isFinite(game.policies?.wage) ? game.policies.wage : 100;
  const pop = Number.isFinite(game.population) ? Math.max(0, game.population) : 3700;
  const workforce = Number.isFinite(game.workforce) ? game.workforce : Math.round(pop * 0.555);

  // Exact model.js formula for disposableScore (src/model.js:218):
  // clamp(40 + p.wage * 0.5 - (p.taxRate - 5) * 1.4, 0, 100)
  const disposableScore = Math.min(100, Math.max(0, 40 + wage * 0.5 - (rate - 5) * 1.4));
  const curDisposableScore = Math.min(100, Math.max(0, 40 + wage * 0.5 - (curTax - 5) * 1.4));
  const disposableDelta = Number((disposableScore - curDisposableScore).toFixed(2));

  // Non-linear threshold penalty (src/model.js:230):
  // Math.max(0, p.taxRate - 20) * 0.55
  const isAboveThreshold = rate > 20;
  const thresholdExcess = Math.max(0, rate - 20);
  const taxPenalty = Number((thresholdExcess * 0.55).toFixed(2));

  // Estimate total wages and monthly tax revenue
  let wagePool;
  if (game.lastBudget?.taxIncome && curTax > 0) {
    wagePool = game.lastBudget.taxIncome / (curTax / 100);
  } else {
    const factoryJobs = game.factoryJobs ?? Math.round(workforce * 0.45);
    const otherJobs = game.otherJobs ?? Math.round(workforce * 0.45);
    const tourismJobs = game.tourismJobs ?? Math.round(workforce * 0.05);
    wagePool = factoryJobs * 0.105 * (wage / 100) + otherJobs * 0.09 + tourismJobs * 0.085;
  }
  const monthlyTaxRevenue = Number((wagePool * (rate / 100)).toFixed(1));
  const curTaxRevenue = Number((wagePool * (curTax / 100)).toFixed(1));
  const monthlyTaxDelta = Number((monthlyTaxRevenue - curTaxRevenue).toFixed(1));

  // Migration bounds in model.js (src/model.js:231):
  // clamp(attraction * 1.1 + (employmentScore - 90) * 0.15, -15, 2)
  const maxEmigrationRate = -15;
  const maxImmigrationRate = 2;
  const recoveryAsymmetryRatio = 7.5;

  let warningLevel = 'normal';
  if (rate >= 25) {
    warningLevel = 'critical';
  } else if (rate > 20) {
    warningLevel = 'elevated';
  } else if (rate < 10) {
    warningLevel = 'low';
  }

  return {
    curTax,
    taxRate: rate,
    disposableScore: Number(disposableScore.toFixed(1)),
    curDisposableScore: Number(curDisposableScore.toFixed(1)),
    disposableDelta,
    isAboveThreshold,
    thresholdExcess,
    taxPenalty,
    monthlyTaxRevenue,
    monthlyTaxDelta,
    maxEmigrationRate,
    maxImmigrationRate,
    recoveryAsymmetryRatio,
    warningLevel,
  };
}

function formatSigned(value) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}`;
}

/**
 * Generates an intelligent, qualitative memo from the advisor of a specific sphere.
 */
export function getAdvisorDiagnosis(sphereOrAdv, game = {}) {
  let sphereId = typeof sphereOrAdv === 'string' ? sphereOrAdv : (sphereOrAdv?.sphere || sphereOrAdv?.id || 'factory');
  if (sphereId === 'krause') sphereId = 'factory';
  if (sphereId === 'weber') sphereId = 'finance';
  if (sphereId === 'bauer') sphereId = 'housing';
  if (sphereId === 'frank') sphereId = 'social';
  if (sphereId === 'lindemann') sphereId = 'tourism';

  const formatDiag = (raw) => {
    const statusMap = {
      crisis: 'critical',
      critical: 'critical',
      danger: 'critical',
      warning: 'warning',
      good: 'calm',
      normal: 'calm',
      calm: 'calm',
    };
    const mapped = statusMap[raw.status] || 'calm';
    return {
      ...raw,
      status: mapped,
      rawStatus: raw.status,
      verdict: raw.quote || raw.verdict || '',
      recommendation: raw.recommendation || '',
    };
  };

  const p = game.policies || {};
  const budget = game.lastBudget || {};
  const month = game.month;

  switch (sphereId) {
    case 'factory': {
      const eq = game.equipment ?? 48;
      const inv = game.inventory ?? 120;
      const dem = game.demand ?? 500;
      const profit = budget.factoryProfit ?? ((game.sales || 480) * 0.57 - (game.factoryJobs || 550) * 0.105 * ((p.wage || 100) / 100) - (game.production || 480) * 0.145 - (p.maintenance || 15) - (p.marketing || 10));
      const maintenance = Number.isFinite(p.maintenance) ? p.maintenance : 14;
      const maintenanceOutlook = maintenanceForecast(maintenance, game);
      const maintenanceAdvice = `При текущем выпуске точка компенсации износа — около ${maintenanceOutlook.breakEven.toFixed(1)} тыс. м./мес.; действующий бюджет дает расчетное изменение станков ${formatSigned(maintenanceOutlook.delta)} п.п. за следующий месяц.`;

      if (eq < 25) {
        return formatDiag({
          status: 'crisis',
          tone: 'danger',
          quote: '«Господин бургомистр, станки полностью разбиты! Износ критический. Рабочие простаивают, выпуска едва хватает, фабрика несет убытки. Срочно нужен ремонт или капитальная модернизация!»',
          keyStat: `Станки: ${eq.toFixed(1)}% (Критический износ)`,
          recommendation: `${maintenanceAdvice} Увеличьте обслуживание выше точки компенсации или рассмотрите модернизацию.`,
        });
      }
      if (eq < 45) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: '«Станки заметно изношены. Текущего ремонта не хватает, чтобы перекрыть естественный износ. Если не вложиться в обслуживание, производительность продолжит падать».',
          keyStat: `Станки: ${eq.toFixed(1)}% (Ниже нормы)`,
          recommendation: `${maintenanceAdvice} Для восстановления нужен бюджет выше этой точки.`,
        });
      }
      if (inv > dem * 1.6 && inv > 200) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: `«Наши склады забиты: скопилось ${Math.round(inv)} часов при месячном спросе ${Math.round(dem)} шт. Мы производим часы «на склад», замораживая средства фабрики».`,
          keyStat: `Запасы на складе: ${Math.round(inv)} шт.`,
          recommendation: 'Увеличьте маркетинг часов для расширения сбыта или временно снизьте выпуск.',
        });
      }
      if (profit < -20) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: `«Фабрика в этом месяце сработала в убыток (${Math.round(profit)} тыс. м.). Выручка не покрывает зарплаты, материалы и ремонт. Фабрика тянет средства из городской казны».`,
          keyStat: `Сальдо фабрики: ${profit > 0 ? '+' : ''}${Math.round(profit)} тыс. м.`,
          recommendation: 'Проверьте ставку оплаты труда и сбалансируйте маркетинг со спросом.',
        });
      }
      if (eq >= 70) {
        return formatDiag({
          status: 'good',
          tone: 'positive',
          quote: '«Оборудование в прекрасном состоянии! Выпуск часов стабилен, квалификация рабочих позволяет держать высокое качество. Фабрика работает как надежные швейцарские часы».',
          keyStat: `Станки: ${eq.toFixed(1)}% · Выпуск: ${Math.round(game.production || 500)} шт.`,
          recommendation: maintenanceAdvice,
        });
      }
      return formatDiag({
        status: 'normal',
        tone: 'neutral',
        quote: '«Фабрика работает стабильно. Станки требуют регулярного внимания, запасы на складе соответствуют обычному месячному обороту».',
        keyStat: `Станки: ${eq.toFixed(1)}% · Выпуск: ${Math.round(game.production || 500)} шт.`,
        recommendation: 'Следите за балансом между объемом выпуска и внешним спросом на часы.',
      });
    }

    case 'finance': {
      const debt = game.debt ?? 0;
      const treasury = game.treasury ?? 500;
      const net = budget.net || 0;
      const netPosition = treasury - debt;
      const tax = p.taxRate ?? 20;

      if (debt > 5000) {
        return formatDiag({
          status: 'crisis',
          tone: 'danger',
          quote: `«Господин бургомистр, город на грани финансового краха! Накоплен долг ${Math.round(debt)} тыс. марок. Каждый месяц мы отдаем банку ${Math.round(budget.interest || debt * 0.008)} тыс. только в виде процентов!»`,
          keyStat: `Долг: ${Math.round(debt)} тыс. м. (Проценты: ${Math.round(budget.interest || debt * 0.008)}/мес.)`,
          recommendation: 'Срочно сокращайте неприоритетные расходы и восстанавливайте доходы фабрики.',
        });
      }
      if (debt > 1200) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: `«Город живет взаймы. Накоплен долг ${Math.round(debt)} тыс. м. При дефиците он продолжит расти, увеличивая будущие процентные выплаты».`,
          keyStat: `Долг: ${Math.round(debt)} тыс. м. · Баланс: ${net > 0 ? '+' : ''}${Math.round(net)} тыс.`,
          recommendation: 'Постарайтесь выйти на ежемесячный профицит, чтобы начать погашение тела кредита.',
        });
      }
      if (net < -45) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: `«В бюджете серьезная дыра: дефицит ${Math.round(net)} тыс. марок в месяц. Свободная казна тает на глазах, скоро придется брать кредиты».`,
          keyStat: `Дефицит: ${Math.round(net)} тыс. м./мес.`,
          recommendation: 'Проанализируйте статьи расходов: услуги, обучение и субсидии.',
        });
      }
      if (netPosition > 3000 && debt === 0 && tax <= 20) {
        return formatDiag({
          status: 'good',
          tone: 'positive',
          quote: `«Городская казна в превосходном здравии: свободных средств ${Math.round(treasury)} тыс. марок, долги полностью отсутствуют. У нас надежная подушка безопасности».`,
          keyStat: `Казна: ${Math.round(treasury)} тыс. м. · Долг: 0`,
          recommendation: 'Избыточную ликвидность можно направить в инфраструктурные проекты с долгосрочной отдачей.',
        });
      }
      if (tax > 20) {
        const penalty = Number(((tax - 20) * 0.55).toFixed(2));
        return formatDiag({
          status: tax >= 28 && (game.migrationPressure ?? 0) < 0 ? 'crisis' : 'warning',
          tone: tax >= 28 ? 'danger' : 'warning',
          quote: `«Господин бургомистр, налоговая ставка ${tax}% превышает критический порог толерантности (20%). Включается прямой штраф к привлекательности города (-${penalty} п., -0.55/п.п.). Казна получает сиюминутную прибавку, но люди начинают покидать город со скоростью до -15 чел./мес. (при максимуме притока лишь +2). Это подрывает будущую налоговую базу!»`,
          keyStat: `Ставка: ${tax}% · Штраф: -${penalty} п.`,
          recommendation: 'Держите налоги в безопасном диапазоне 16–20%, чтобы не допустить депопуляции и сжатия фонда зарплат.',
        });
      }
      return formatDiag({
        status: 'normal',
        tone: 'neutral',
        quote: `«Финансовое положение устойчиво. Долг города: ${Math.round(debt)} тыс. м., казна: ${Math.round(treasury)} тыс. м. Текущий баланс под контролем».`,
        keyStat: `Баланс: ${net > 0 ? '+' : ''}${Math.round(net)} тыс. м. · Долг: ${Math.round(debt)} тыс.`,
        recommendation: 'Держите налоги в безопасном диапазоне (16–20%), чтобы не подавлять активность и не превышать порог оттока населения.',
      });
    }

    case 'housing': {
      const cap = game.housingCapacity ?? 3700;
      const pop = game.population ?? 3700;
      const shortage = game.housingShortage ?? Math.max(0, pop - cap);
      const free = Math.max(0, cap - pop);
      const underConstruction = (game.projects || []).filter((pr) => pr.type === 'housing').length;

      if (shortage > 40) {
        return formatDiag({
          status: 'crisis',
          tone: 'danger',
          quote: `«Катастрофическая нехватка жилья! ${Math.round(shortage)} горожан не имеют крыши над головой. Молодые семьи уезжают, переполненные квартиры вызывают раздражение и болезни!»`,
          keyStat: `Дефицит жилья: ${Math.round(shortage)} мест`,
          recommendation: 'Срочно профинансируйте муниципальное строительство (+60 мест, 300 тыс. м., лаг 12 мес.).',
        });
      }
      if (shortage > 0) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: `«Жилой фонд исчерпан: дефицит ${Math.round(shortage)} мест. Если не начать строить заранее, нехватка жилья подорвет благополучие всего города».`,
          keyStat: `Дефицит жилья: ${Math.round(shortage)} мест`,
          recommendation: underConstruction > 0 ? 'Строительство уже идет. Главное — набраться терпения и дождаться окончания срока.' : 'Запустите проект расширения жилья.',
        });
      }
      if (free < 25 && underConstruction === 0) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: `«Свободного жилья почти не осталось: всего ${Math.round(free)} мест резерва. Приток новых жителей или рабочих фабрики быстро приведет к дефициту».`,
          keyStat: `Свободно мест: ${Math.round(free)} из ${cap}`,
          recommendation: 'Помните о лаге в 12 месяцев: жилье нужно закладывать до того, как резерв станет нулевым.',
        });
      }
      if (underConstruction > 0) {
        return formatDiag({
          status: 'good',
          tone: 'positive',
          quote: `«Строительство муниципального жилья идет по плану. В работе ${underConstruction} объект(а). Город планомерно расширяет жилой фонд».`,
          keyStat: `В стройке: ${underConstruction * 60} мест · Резерв: ${Math.round(free)} мест`,
          recommendation: 'Не начинайте новые стройки без необходимости — дайте текущим объектам достроиться.',
        });
      }
      return formatDiag({
        status: 'normal',
        tone: 'neutral',
        quote: `«Жилищный вопрос спокоен: вместимость фонда ${cap} мест, свободно ${Math.round(free)} квартир. Дефицита нет».`,
        keyStat: `Свободно мест: ${Math.round(free)} из ${cap}`,
        recommendation: 'Следите за миграционным приростом населения.',
      });
    }

    case 'social': {
      const sat = game.satisfaction ?? 84;
      const health = game.health ?? 80;
      const qual = game.serviceQuality ?? 80;
      const unemp = game.unemployment ?? 0;
      const groups = game.satisfactionGroups || {};
      const lowestGroup = Object.entries(groups).sort((a, b) => a[1] - b[1])[0];

      if (sat < 50) {
        return formatDiag({
          status: 'crisis',
          tone: 'danger',
          quote: `«Жители крайне недовольны условиями жизни (индекс ${Math.round(sat)}/100). Наибольшее напряжение среди ${groupLabel(lowestGroup?.[0])} (${Math.round(lowestGroup?.[1] || 0)} п.). Люди голосуют ногами и уезжают!»`,
          keyStat: `Благополучие: ${Math.round(sat)}/100 (Критически низкое)`,
          recommendation: 'Поднимите расходы на общественные услуги и медицину, проверьте зарплаты и дефицит жилья.',
        });
      }
      if (unemp > (game.workforce || 2000) * 0.15 && (game.workforce || 2000) > 0) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: `«Растет безработица: ${Math.round(unemp)} человек без работы (${Math.round((unemp / (game.workforce || 2000)) * 100)}% рабочей силы). Безработица бьет по доходам семей и общему спокойствию».`,
          keyStat: `Без работы: ${Math.round(unemp)} чел.`,
          recommendation: 'Создайте новые рабочие места на фабрике (через спрос/маркетинг) или в сфере туризма.',
        });
      }
      const eduSpending = game.policies?.education ?? game.education ?? 35;
      const curSkills = game.skills ?? 45;
      const f = skillsForecast(eduSpending, game);
      if (f.target < curSkills && (eduSpending < 15 || curSkills < 38)) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: `«Экономия на образовании создает скрытую угрозу. При финансировании ${eduSpending} тыс. м. целевая квалификация составляет ${f.target}%, что ниже текущей (${curSkills}%). Постепенное снижение квалификации (лаг полураспада ~8.9 мес.) ухудшит качество часов и спрос».`,
          keyStat: `Квалификация: ${curSkills}% (цель: ${f.target}%) · Образование: ${eduSpending} тыс. м.`,
          recommendation: 'Поддерживайте расходы на образование на уровне воспроизводства кадров.',
        });
      }
      const servSpending = game.policies?.services ?? 68;
      const sf = servicesForecast(servSpending, game);
      if (sf.target < qual && (servSpending < sf.serviceNeed * 0.6 || sf.target < 50)) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: `«Секвестр общественных услуг создает отложенную угрозу. При расходах ${servSpending} тыс. м. целевое качество услуг составляет ${sf.target}%, что приведет к постепенной деградации среды (лаг полураспада ~6.0 мес.). Снижение услуг сокращает муниципальные рабочие места и через 6–12 месяцев ударит по здоровью пожилых жителей (вес 61%)».`,
          keyStat: `Услуги: ${qual}% (цель: ${sf.target}%) · Бюджет: ${servSpending} тыс. м. (норма ~${Math.round(sf.serviceNeed)})`,
          recommendation: 'Поддерживайте расходы на общественные услуги на уровне потребности города (~65–75 тыс. м.).',
        });
      }
      if (health < 50 || qual < 50) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: `«Социальные службы истощены. Здоровье жителей (${Math.round(health)}/100) или качество услуг (${Math.round(qual)}/100) просели из-за недостаточного финансирования».`,
          keyStat: `Услуги: ${Math.round(qual)}/100 · Здоровье: ${Math.round(health)}/100`,
          recommendation: 'Увеличьте ежемесячный бюджет общественных услуг (норма около 65–75 тыс. м.).',
        });
      }
      return formatDiag({
        status: 'good',
        tone: 'positive',
        quote: `«Социальный климат благоприятный: благополучие ${Math.round(sat)}/100. Рабочие довольны условиями (${Math.round(groups.workers || sat)}), семьи чувствуют заботу (${Math.round(groups.families || sat)}), пожилые спокойны (${Math.round(groups.seniors || sat)})».`,
        keyStat: `Благополучие: ${Math.round(sat)}/100 · Безработица: ${Math.round(unemp)} чел.`,
        recommendation: 'Поддерживайте расходы на обучение для планомерного роста квалификации рабочих.',
      });
    }

    case 'tourism': {
      const cap = game.tourismCapacity ?? 20;
      const dem = game.tourismDemand ?? 25;
      const visitors = game.visitors ?? 20;
      const jobs = game.tourismJobs ?? 20;
      const ads = p.tourismMarketing ?? 10;

      if (ads > 20 && cap < 50) {
        return formatDiag({
          status: 'warning',
          tone: 'warning',
          quote: `«Внимание, господин бургомистр! Мы тратим ${ads} тыс. на рекламу, спрос вырос до ${Math.round(dem)} человек, но в городе всего ${cap} гостиничных мест! Большинство желающих просто негде разместить — деньги на рекламу тратятся впустую».`,
          keyStat: `Спрос: ${Math.round(dem)} при вместимости ${cap} мест`,
          recommendation: 'Запустите проект «Туристическая инфраструктура» (+80 мест) или снизьте рекламу до расширения отелей.',
        });
      }
      if (visitors >= cap && cap >= 100) {
        return formatDiag({
          status: 'good',
          tone: 'positive',
          quote: `«Гостиницы заполнены на 100%! Мы приняли ${Math.round(visitors)} туристов: это дает ${Math.round(visitors * 0.19)} тыс. поступлений до вычета рекламы и общегородских расходов и обеспечивает занятость ${jobs} горожан».`,
          keyStat: `Туристов: ${Math.round(visitors)} · Валовые поступления: +${Math.round(visitors * 0.19)} тыс. м.`,
          recommendation: 'Отличный сектор диверсификации. Поддерживайте умеренную рекламу (10–15 тыс./мес.).',
        });
      }
      return formatDiag({
        status: 'normal',
        tone: 'neutral',
        quote: `«Туристический сектор работает в спокойном режиме: вместимость ${cap} мест, принято ${Math.round(visitors)} гостей. Спрос составляет ${Math.round(dem)} чел.».`,
        keyStat: `Мест: ${cap} · Посетителей: ${Math.round(visitors)}`,
        recommendation: 'Развитие туризма требует синхронного роста гостиниц, рекламы и доступных рабочих рук.',
      });
    }

    default:
      return formatDiag({ status: 'normal', tone: 'neutral', quote: 'Служба готова к исполнению поручений.', keyStat: '', recommendation: '' });
  }
}

function groupLabel(key) {
  switch (key) {
    case 'workers': return 'рабочих';
    case 'families': return 'семей с детьми';
    case 'seniors': return 'пожилых жителей';
    default: return 'жителей';
  }
}

/**
 * Detailed causal breakdown of the transition between two months.
 * Tells the player EXACTLY what changed, why, and what mechanisms were at work.
 */
export function explainStepCauses(current, previous) {
  if (!previous || previous.month === current.month) {
    return [
      {
        sphere: 'overview',
        icon: 'clock',
        headline: 'Начало управления городом',
        explanation: 'Лоххаузен ожидает первых решений. Ознакомьтесь с докладами подразделений и определите приоритеты.',
        tone: 'neutral',
      },
    ];
  }

  const p = current.policies || {};
  const prevPolicies = previous.policies || p;
  const items = [];

  // 0. Completed Projects & Temporal Hypothesis Reflection
  const completions = (current.journal || []).filter(j =>
    j.type === 'completion' && j.month > previous.month && j.month <= current.month
  );
  for (const comp of completions) {
    const projTitle = comp.title ? comp.title.replace(/^Завершён проект:\s*/, '') : 'Инвестиционный проект';
    const origProj = (current.journal || []).find(j =>
      j.type === 'project' && j.project && (comp.title.includes(j.project.label) || j.project.label.includes(projTitle))
    );
    const origNote = origProj?.note ? origProj.note.trim() : '';
    const noteMsg = origNote ? ` Изначальная гипотеза бургомистра: «${origNote}».` : ' Ожидание перед запуском не записано.';
    items.push({
      sphere: 'project',
      icon: 'spark',
      headline: `🏗️ Завершен проект: ${projTitle}`,
      explanation: `Временной лаг стройки завершен, мощности введены в эксплуатацию.${noteMsg} Сверьте реальные сдвиги показателей с вашими ожиданиями.`,
      playerNote: origNote || undefined,
      tone: 'positive',
    });
  }

  // 1. Factory & Production Causal Flow
  const monthsElapsed = Math.max(1, current.month - previous.month);
  const deltaEq = current.equipment - previous.equipment;
  const deltaProd = current.production - previous.production;
  const deltaInv = current.inventory - previous.inventory;
  const maintenanceVal = p.maintenance ?? 0;

  const modernizationCount = completions.filter(entry =>
    entry.project?.type === 'modernization' || /модернизаци/i.test(entry.title || '')
  ).length;

  // Report the observed interval separately from its contributing mechanisms.
  // Monthly snapshots do not retain modernizationLevel or past policy values.
  let factoryExplain = !Number.isFinite(deltaEq)
    ? 'В истории нет сопоставимых данных о состоянии оборудования. Изменение за этот интервал неизвестно.'
    : deltaEq < -0.005
    ? `За ${monthsElapsed} мес. станки потеряли ${Math.abs(deltaEq).toFixed(2)} п. состояния.`
    : deltaEq > 0.005
      ? `За ${monthsElapsed} мес. станки восстановились на ${deltaEq.toFixed(2)} п. состояния.`
      : `За ${monthsElapsed} мес. состояние оборудования изменилось менее чем на 0.01 п.`;
  if (current.equipment === 0) factoryExplain += ' Станки полностью изношены (0%).';
  if (current.equipment === 100) factoryExplain += ' Состояние станков на максимуме (100%).';
  factoryExplain += ` Текущее обслуживание: ${maintenanceVal} тыс. марок/мес.`;
  if (modernizationCount) {
    factoryExplain += ` Завершено модернизаций за этот интервал: ${modernizationCount}. Изменение состояния учитывает их ввод, обслуживание, износ и предел 100%.`;
  }

  if (current.sales < current.production) {
    factoryExplain += ` Произведено ${Math.round(current.production)} часов, продано ${Math.round(current.sales)}. Остаток ${Math.round(current.production - current.sales)} шт. ушел на склад (всего на складе ${Math.round(current.inventory)}).`;
  } else if (current.inventory < previous.inventory) {
    factoryExplain += ` Высокий спрос (${Math.round(current.demand)} шт.) позволил продать всю партию и разгрузить склад на ${Math.round(previous.inventory - current.inventory)} шт.`;
  }

  items.push({
    sphere: 'factory',
    icon: 'factory',
    headline: `Фабрика: выпуск ${Math.round(current.production)} шт. (${deltaProd >= 0 ? '+' : ''}${Math.round(deltaProd)})`,
    explanation: factoryExplain,
    tone: deltaEq < -0.05 * monthsElapsed || current.equipment < 30 ? 'warning' : deltaEq > 0.05 * monthsElapsed ? 'positive' : 'neutral',
  });

  // 2. Budget & Treasury Causal Flow
  const budget = current.lastBudget || {};
  const net = budget.net || 0;
  const debtDelta = current.debt - previous.debt;
  const treasuryDelta = current.treasury - previous.treasury;

  let budgetExplain = '';
  if (net < 0) {
    const shortage = -net;
    if (debtDelta > 0) {
      budgetExplain = `Дефицит бюджета составил ${Math.round(shortage)} тыс. марок. Казны не хватило, долг города вырос на +${Math.round(debtDelta)} тыс. м. (на проценты уже уходит ${Math.round(budget.interest || 0)} тыс./мес.).`;
    } else {
      budgetExplain = `Дефицит в ${Math.round(shortage)} тыс. марок полностью покрыт из свободной казны (осталось ${Math.round(current.treasury)} тыс. м.).`;
    }
  } else {
    if (previous.debt > 0 && current.debt < previous.debt) {
      budgetExplain = `Профицит в ${Math.round(net)} тыс. марок позволил погасить ${Math.round(previous.debt - current.debt)} тыс. городского долга.`;
    } else {
      budgetExplain = `Профицит в +${Math.round(net)} тыс. марок пополнил городскую казну (всего свободных средств: ${Math.round(current.treasury)} тыс. м.).`;
    }
  }

  items.push({
    sphere: 'finance',
    icon: 'coins',
    headline: `Бюджет: сальдо ${net >= 0 ? '+' : ''}${Math.round(net)} тыс. м. (${net >= 0 ? 'профицит' : 'дефицит'})`,
    explanation: budgetExplain,
    tone: net < -30 || current.debt > 2000 ? 'warning' : net > 0 ? 'positive' : 'neutral',
  });

  // 3. Demographics & Housing Causal Flow
  const deltaPop = current.population - previous.population;
  const shortageDelta = current.housingShortage - previous.housingShortage;

  let demoExplain = '';
  if (deltaPop > 1) {
    demoExplain = `Благополучие города (${Math.round(current.satisfaction)}/100) привлекло +${Math.round(deltaPop)} новых жителей.`;
    if (current.housingShortage > 0) {
      demoExplain += ` Это вызвало дефицит жилья: не хватает ${Math.round(current.housingShortage)} мест.`;
    } else {
      demoExplain += ` В городе осталось ${Math.round(current.housingCapacity - current.population)} свободных мест жилья.`;
    }
  } else if (deltaPop < -1) {
    const reasons = [];
    if (p.taxRate > 22) reasons.push(`высоких налогов (${p.taxRate}%)`);
    if (current.housingShortage > 0) reasons.push('нехватки жилья');
    if (current.satisfaction < 75) reasons.push('падения благополучия');
    demoExplain = `Население сократилось на ${Math.abs(Math.round(deltaPop))} чел. Из-за ${reasons.length ? reasons.join(' и ') : 'условий жизни'} люди покидают Лоххаузен.`;
  } else {
    demoExplain = 'Миграционный баланс стабилен, оттока и резкого притока населения не зафиксировано.';
  }

  items.push({
    sphere: 'housing',
    icon: 'home',
    headline: `Городская среда: население ${Math.round(current.population)} чел. (${deltaPop >= 0 ? '+' : ''}${Math.round(deltaPop)})`,
    explanation: demoExplain,
    tone: current.housingShortage > 0 ? 'danger' : deltaPop < -5 ? 'warning' : 'neutral',
  });

  // 4. Social & Well-being
  const deltaSat = current.satisfaction - previous.satisfaction;
  if (Math.abs(deltaSat) >= 0.5) {
    items.push({
      sphere: 'social',
      icon: 'people',
      headline: `Благополучие жителей: ${Math.round(current.satisfaction)}/100 (${deltaSat >= 0 ? '+' : ''}${deltaSat.toFixed(1)} п.)`,
      explanation: deltaSat > 0
        ? 'Общая удовлетворенность выросла. Сравните показатели групп и действующие решения в социальном отчете.'
        : 'Снижение вызвано нагрузкой на сферу услуг, налогами или нехваткой доступного жилья.',
      tone: deltaSat > 0 ? 'positive' : 'warning',
    });
  }

  return items;
}

/**
 * Analyzes the player's current run and flags classic Dörner cognitive traps.
 */
export function detectCognitiveTraps(game) {
  const traps = [];
  const p = game.policies || {};
  const budget = game.lastBudget || {};
  const history = game.history || [];
  const month = game.month;

  // 1. Repair-service mentality (Reparaturdienst-Verhalten)
  // Sudden huge surge in a specific spending category while running steep deficit
  if (budget.net < -40) {
    const singleDominant = p.services > 110 || p.education > 70 || p.marketing > 60 || p.maintenance > 50;
    if (singleDominant) {
      traps.push({
        id: 'repair_service',
        title: 'Ловушка «Синдром ремонтника»',
        subtitle: 'Reparaturdienst-Mentalität по Дёрнеру',
        message: 'Вы резко увеличили финансирование одной отдельной сферы, но город получил тяжелый дефицит бюджета. В сложных системах нельзя «чинить» один симптом ценой разорения всего механизма.',
        advice: 'Сбалансируйте расходы по всем направлениям вместо максимального вливания в одну точку.',
      });
    }
  }

  // 2. Oversteering & Delay Panic
  // Starting another costly project while a previous one of same type is still in construction
  const activeHousing = (game.projects || []).filter((pr) => pr.type === 'housing');
  if (activeHousing.length > 1) {
    traps.push({
      id: 'delay_panic',
      title: 'Ловушка «Нетерпеливое перерегулирование»',
      subtitle: 'Недооценка временного лага стройки',
      message: 'Запущено сразу несколько параллельных строек жилья. Каждая требует 300 тыс. м. и длится 12 месяцев. Не дождавшись ввода первого объекта, легко опустошить казну и перегрузить город.',
      advice: 'Учитывайте временные задержки (time lags): дайте запущенным проектам завершиться перед новым раундом строек.',
    });
  }

  // 3. Debt Spiral Compounding
  if (game.debt > 3000 && budget.net < 0) {
    traps.push({
      id: 'debt_compounding',
      title: 'Ловушка «Долговой маховик»',
      subtitle: 'Экспоненциальный рост обязательств',
      message: `Город накопил долг ${Math.round(game.debt)} тыс. м. и продолжает жить в дефицит. Выплаты по процентам (${Math.round(budget.interest || 0)} тыс./мес.) превышают многие полезные статьи расходов.`,
      advice: 'Если не выйти в профицит, проценты полностью парализуют муниципальный бюджет.',
    });
  }

  // 4. Tourism Mirage (Advertising without infrastructure)
  if (p.tourismMarketing > 25 && game.tourismCapacity < 50) {
    traps.push({
      id: 'tourism_mirage',
      title: 'Ловушка «Рекламный мираж»',
      subtitle: 'Разрыв между спросом и физической емкостью',
      message: `Вы тратите ${p.tourismMarketing} тыс. м. на рекламу туризма, но в городе всего ${game.tourismCapacity} гостиничных мест. Желающие приехать упираются в нехватку отелей, и деньги на рекламу сгорают.`,
      advice: 'Сначала постройте туристическую инфраструктуру (+80 мест), и только затем наращивайте рекламу.',
    });
  }

  // 5. Tax Kill (Ignoring long-term side effects)
  if (p.taxRate >= 28 && game.migrationPressure < -2) {
    traps.push({
      id: 'tax_kill',
      title: 'Ловушка «Побочный налоговый эффект»',
      subtitle: 'Разрушение налоговой базы ради сиюминутных поступлений',
      message: `Налоговая ставка ${p.taxRate}% дает временную прибавку в казне, но провоцирует отток жителей и квалифицированных рабочих. Через год налоговая база сожмется.`,
      advice: 'Снизьте налоговое давление, чтобы сохранить привлекательность города.',
    });
  }

  return traps;
}

/**
 * Provides an instant "What-If" preview when adjusting a policy slider,
 * or calculates expected aggregate effect when passed (game, patch).
 */
export function getPolicyWhatIf(arg1, arg2, arg3) {
  if (arg1 && typeof arg1 === 'object' && arg2 && typeof arg2 === 'object') {
    const game = arg1;
    const patch = arg2;
    const notes = [];
    let delta = 0;
    const workforce = game.workforce || Math.round((game.population || 3700) * 0.555);

    if (patch.taxRate !== undefined) {
      const f = taxForecast(patch.taxRate, game);
      delta += f.monthlyTaxDelta;
      if (f.isAboveThreshold) {
        notes.push(`Налоговая ставка ${patch.taxRate}%: сборы ~${f.monthlyTaxRevenue} тыс. м./мес. (${formatSigned(f.monthlyTaxDelta)}), но превышен порог 20% (штраф привлекательности -${f.taxPenalty} п., риск оттока до -15 чел./мес.).`);
      } else {
        notes.push(`Налоговая ставка ${patch.taxRate}%: сборы ~${f.monthlyTaxRevenue} тыс. м./мес. (${formatSigned(f.monthlyTaxDelta)}), порог 20% не превышен.`);
      }
    }
    if (patch.maintenance !== undefined) {
      const curMaint = game.policies?.maintenance ?? 15;
      const dMaint = patch.maintenance - curMaint;
      delta -= dMaint;
      const forecast = maintenanceForecast(patch.maintenance, game);
      notes.push(`Обслуживание ${patch.maintenance} тыс. м.: расчетное изменение станков в следующем месяце ${formatSigned(forecast.delta)} п.п. (компенсация износа около ${forecast.breakEven.toFixed(1)} тыс. м.).`);
    }
    if (patch.services !== undefined) {
      const curServ = game.policies?.services ?? 76;
      delta -= (patch.services - curServ);
      notes.push(`Услуги ${patch.services} тыс. м.`);
    }
    if (patch.education !== undefined) {
      const curEdu = game.policies?.education ?? 35;
      delta -= (patch.education - curEdu);
      const f = skillsForecast(patch.education, game);
      notes.push(`Образование ${patch.education} тыс. м.: целевая квалификация ${f.target}% (текущая: ${f.curSkills}%, лаг полураспада ~9 мес.).`);
    }
    if (patch.tourismMarketing !== undefined) {
      const curTour = game.policies?.tourismMarketing ?? 10;
      delta -= (patch.tourismMarketing - curTour);
      notes.push(`Реклама туризма ${patch.tourismMarketing} тыс. м.`);
    }

    return {
      budgetDelta: delta,
      forecastNotes: notes,
      direct: notes.join('; '),
      sideEffect: 'Оценка прямого влияния на баланс бюджета',
      risk: delta < -30 ? 'Рост дефицита казны' : 'Умеренный риск',
    };
  }

  const key = arg1;
  const value = arg2;
  const game = arg3 || {};
  const num = Number(value);
  const pop = game.population || 3700;
  const workforce = game.workforce || Math.round(pop * 0.555);

  switch (key) {
    case 'taxRate': {
      const f = taxForecast(num, game);
      let side;
      let risk;
      if (f.isAboveThreshold) {
        side = `Снижает располагаемый доход на ${Math.abs(f.disposableDelta).toFixed(1)} п. (оценка ${f.disposableScore}). Превышен нелинейный порог 20%: включается штраф привлекательности -${f.taxPenalty} п. (-0.55/п.п.). Отток жителей может достигать до -15 чел./мес., тогда как максимум притока +2 чел./мес.`;
        if (f.warningLevel === 'critical') {
          risk = 'Критический риск необратимой депопуляции (отток до -15 чел./мес. при максимуме притока +2) и сжатия налоговой базы.';
        } else {
          risk = 'Повышенный риск: включение прямого штрафа к привлекательности (-0.55 за каждый % выше 20%).';
        }
      } else if (num < 10) {
        side = `Оставляет максимум средств жителям (располагаемый доход ${f.disposableScore}), высокая привлекательность города.`;
        risk = 'Хронический недобор средств в городскую казну.';
      } else {
        side = `Умеренное влияние на располагаемый доход (${f.disposableScore}). Порог 20% не превышен: прямой фискальный штраф к привлекательности равен 0.`;
        risk = 'Умеренная фискальная нагрузка без превышения критического порога 20%.';
      }
      return {
        direct: `Около +${f.monthlyTaxRevenue} тыс. м./мес. налоговых поступлений (${formatSigned(f.monthlyTaxDelta)} тыс. м./мес. к текущим).`,
        sideEffect: side,
        risk: risk,
      };
    }
    case 'maintenance': {
      const forecast = maintenanceForecast(num, game);
      return {
        direct: `Расчетное изменение состояния станков в следующем месяце: ${formatSigned(forecast.delta)} п.п. при текущем выпуске ${Math.round(Number.isFinite(game.production) ? game.production : 890)} шт.`,
        sideEffect: `Точка компенсации текущего износа — около ${forecast.breakEven.toFixed(1)} тыс. м./мес.; фактический износ меняется вместе с выпуском.`,
        risk: forecast.delta < 0 ? 'Состояние станков продолжит снижаться при неизменной нагрузке.' : 'Расходы фабрики вырастут на выбранную сумму обслуживания.',
      };
    }
    case 'wage': {
      return {
        direct: `Фонд оплаты труда фабрики изменится пропорционально ставке (${num}%).`,
        sideEffect: num >= 100
          ? 'Повышает удовлетворенность рабочих; через общее благополучие это может позже повлиять на миграцию.'
          : 'Снижает удовлетворенность рабочих; прямого изменения числа рабочих мест ставка не вызывает.',
        risk: num > 125
          ? 'Фабрика может стать планово-убыточной.'
          : num < 80
            ? 'Резкое недовольство рабочего класса.'
            : 'Умеренный риск.',
      };
    }
    case 'services': {
      const sf = servicesForecast(num, game);
      const need = sf.serviceNeed;
      const direct = `Ежемесячные расходы казны: ${num} тыс. марок (потребность города: ~${Math.round(need)} тыс.). Целевое качество услуг: ${sf.target}% (текущее: ${sf.curQuality}%). Муниципальных вакансий: ~${sf.otherPositions} мест.`;
      let sideEffect = '';
      let risk = '';
      if (num >= need) {
        sideEffect = `Поддерживает высокое качество услуг и здравоохранения (цель: ${sf.target}%), защищает пожилых горожан и семьи. Муниципальный сектор стабильно обеспечивает занятость ~${sf.otherPositions} человек.`;
        risk = num > need * 1.3 ? 'Чрезмерное финансирование сверх потребности дает убывающую отдачу (насыщение).' : 'Умеренный риск: финансовая нагрузка сбалансирована пользой.';
      } else {
        const jobsLost = Math.abs(sf.jobDifference);
        sideEffect = `Финансирование ниже потребности (~${Math.round(need)} тыс. м.): качество услуг будет плавно снижаться к ${sf.target}% (сходимость ~11% разрыва в месяц, лаг полураспада ~6.0 мес.). Прямой побочный эффект — сокращение муниципальных рабочих мест на ~${jobsLost} чел.`;
        risk = 'Высокий системный риск: сжатие общественных услуг запускает цепную реакцию — рост безработицы, падение здоровья пожилых людей (вес 61%) и отток населения из города.';
      }
      return {
        direct,
        sideEffect,
        risk,
      };
    }
    case 'education': {
      const f = skillsForecast(num, game);
      const direct = `Ежемесячные расходы казны: ${num} тыс. марок. Целевая квалификация рабочих: ${f.target}% (текущая: ${f.curSkills}%).`;
      let side = '';
      let risk = '';
      if (num === 0) {
        if (f.curSkills > f.target) {
          side = `При нулевом финансировании и текущей модернизации целевая квалификация составляет ${f.target}%. При сохранении такой политики прогнозируется постепенное падение квалификации к ${f.target}% (сходимость ~7.5% разрыва в месяц, лаг полураспада 8.9 мес.), что снижает производительность.`;
          risk = 'Высочайший системный риск: если не возобновить обучение, снижение квалификации кадров со временем приведет к падению качества продукции и сокращению спроса.';
        } else {
          side = `При нулевом финансировании целевая квалификация составляет ${f.target}%. Поскольку текущая квалификация (${f.curSkills}%) ниже цели за счет модернизации оборудования, квалификация продолжит сходиться к ${f.target}%.`;
          risk = 'Умеренный риск: отсутствие расходов на обучение ограничивает дальнейший потенциал квалификации уровнем модернизации.';
        }
      } else if (f.target > f.curSkills) {
        side = `При сохранении выбранных расходов квалификация будет плавно расти к ${f.target}% (сходимость ~7.5% разрыва в месяц, полураспад 8.9 мес.), стимулируя производительность и спрос на часы.`;
        risk = 'Эффект проявляется с инерцией: изменение начинается со следующего месяца, но полный выход на целевой уровень требует времени.';
      } else if (f.target < f.curSkills) {
        side = `При сохранении выбранных расходов целевая квалификация (${f.target}%) ниже текущей (${f.curSkills}%): квалификация рабочих будет постепенно сходиться к ${f.target}% (лаг полураспада 8.9 мес.).`;
        risk = 'Риск скрытой эрозии человеческого капитала: постепенное снижение квалификации ухудшит качество продукции и рыночный спрос.';
      } else {
        side = `Поддерживает равновесный уровень квалификации рабочих на отметке ${f.curSkills}%.`;
        risk = 'Умеренный: баланс между расходами казны и качеством кадров соблюден при текущем уровне модернизации.';
      }
      return {
        direct,
        sideEffect: side,
        risk,
      };
    }
    case 'marketing': {
      return {
        direct: `Расходы на сбыт: ${num} тыс. м./мес. Расширяет спрос на ~${Math.round(num * 5.2)} часов/мес.`,
        sideEffect: 'Помогает разгружать склады и увеличивает продажи.',
        risk: 'Если фабрика не способна выпустить столько часов из-за станков, спрос останется нереализованным.',
      };
    }
    case 'tourismMarketing': {
      return {
        direct: `Расходы на рекламу туризма: ${num} тыс. м./мес.`,
        sideEffect: `Привлекает туристов (текущая вместимость отелей: ${game.tourismCapacity} мест).`,
        risk: num > 15 && game.tourismCapacity < 60
          ? 'Деньги тратятся впустую: в городе нет свободных гостиниц для всех привлеченных туристов!'
          : 'Нет существенных рисков.',
      };
    }
    default:
      return { direct: 'Изменение действующей политики.', sideEffect: 'Вступит в силу со следующего месяца.', risk: 'Нет.' };
  }
}

/**
 * Evaluates capital investment projects against physical system bottlenecks (Binding Constraints),
 * buffer depletion horizons, liquidity impacts, and immediate marginal returns.
 * Grounded in Dietrich Dörner's chapter on resource allocation and the Theory of Constraints.
 *
 * @param {string} projectKey - 'housing' | 'modernization' | 'tourism'
 * @param {Object} game - current game state
 * @returns {Object} constraint evaluation
 */
export function evaluateProjectConstraint(projectKey, game = {}) {
  const treasury = game.treasury ?? 800;

  switch (projectKey) {
    case 'housing': {
      const pop = game.population ?? 3700;
      const cap = game.housingCapacity ?? 3900;
      const shortage = game.housingShortage ?? Math.max(0, pop - cap);
      const surplus = cap - pop;
      const underConstruction = (game.projects || []).filter((p) => p.type === 'housing').length;
      const cost = 300;
      const duration = 12;
      const maxImmigrationRate = 2; // model bounds migration to [-15, +2]

      let bufferMonths = 0;
      let status = 'slack';
      let statusLabel = 'Несвязывающий фонд (избыточный резерв)';
      let marginalPayoffImmediate = false;
      let bottleneckNote = '';
      let recommendation = '';

      if (shortage > 0 || surplus <= 0) {
        status = 'binding';
        statusLabel = 'Критическое узкое горлышко (дефицит жилья)';
        bufferMonths = 0;
        marginalPayoffImmediate = true;
        bottleneckNote = `Острый дефицит жилья (${Math.round(shortage || Math.abs(surplus))} мест). Снижает удовлетворенность и стимулирует отток жителей.`;
        recommendation = 'Срочно начать строительство (+60 мест, 12 мес.) для ликвидации дефицита.';
      } else if (surplus < 50) {
        status = 'latent';
        statusLabel = 'Латентное ограничение (буфер исчерпывается)';
        bufferMonths = Math.round(surplus / maxImmigrationRate);
        marginalPayoffImmediate = (surplus < duration * maxImmigrationRate);
        bottleneckNote = `Свободный резерв жилья сократился до ${Math.round(surplus)} мест (хватит примерно на ${bufferMonths} мес. при максимальном притоке).`;
        recommendation = 'Своевременная закладка жилья перед возникновением дефицита.';
      } else {
        status = 'slack';
        statusLabel = 'Несвязывающий фонд (избыточный резерв)';
        bufferMonths = Math.round(surplus / maxImmigrationRate);
        marginalPayoffImmediate = false;
        bottleneckNote = `Избыточный резерв ${Math.round(surplus)} свободных мест при максимальном росте населения до +${maxImmigrationRate} чел./мес. (буфер на ~${bufferMonths} мес.).`;
        recommendation = 'Избыточный буфер: проект заморозит 300 тыс. м. казны без немедленного прироста благополучия (housingScore = 100%). Сохраняйте ликвидность для узких мест.';
      }

      const postProjectTreasury = treasury - cost;
      let liquidityRisk = 'safe';
      if (treasury < cost) {
        liquidityRisk = 'infeasible';
      } else if (postProjectTreasury < 200) {
        liquidityRisk = 'severe_drain';
      } else if (postProjectTreasury < 600) {
        liquidityRisk = 'moderate_drain';
      }

      return {
        key: 'housing',
        cost,
        duration,
        surplus: Math.round(surplus),
        shortage: Math.round(shortage),
        underConstruction,
        maxImmigrationRate,
        bufferMonths,
        status,
        statusLabel,
        marginalPayoffImmediate,
        bottleneckNote,
        recommendation,
        liquidityRisk,
        postProjectTreasury,
        summary: `Жилищный фонд: ${statusLabel}. Резерв: ${Math.round(surplus)} мест (~${bufferMonths} мес.).`,
      };
    }

    case 'modernization': {
      const eq = game.equipment ?? 48;
      const modLevel = game.modernizationLevel ?? 0;
      const underConstruction = (game.projects || []).filter((p) => p.type === 'modernization').length;
      const cost = 460;
      const duration = 9;

      let status = 'binding';
      let statusLabel = 'Критическое ограничение (износ оборудования)';
      let marginalPayoffImmediate = true;
      let bottleneckNote = '';
      let recommendation = '';

      if (eq < 50) {
        status = 'binding';
        statusLabel = 'Критическое ограничение (износ оборудования)';
        marginalPayoffImmediate = true;
        bottleneckNote = `Оборудование изношено до ${eq.toFixed(1)}%. Износ снижает выпуск часов и выручку фабрики.`;
        recommendation = 'Критически необходимо: модернизация добавит +12 п. к оборудованию и повысит производительность.';
      } else if (eq < 75) {
        status = 'latent';
        statusLabel = 'Латентное ограничение (нарастающий износ)';
        marginalPayoffImmediate = true;
        bottleneckNote = `Оборудование умеренно изношено (${eq.toFixed(1)}%). Естественный износ требует планового обновления.`;
        recommendation = 'Целесообразно: плановое обновление станков (+12 п., +1 уровень) за 9 месяцев.';
      } else {
        status = 'slack';
        statusLabel = 'Исправный фонд (резерв надежности)';
        marginalPayoffImmediate = false;
        bottleneckNote = `Оборудование в хорошем состоянии (${eq.toFixed(1)}%). Станки пока не сдерживают выпуск.`;
        recommendation = 'Оборудование исправно: проект не является первоочередным узким местом. Избегайте преждевременного омертвления казны.';
      }

      const postProjectTreasury = treasury - cost;
      let liquidityRisk = 'safe';
      if (treasury < cost) {
        liquidityRisk = 'infeasible';
      } else if (postProjectTreasury < 200) {
        liquidityRisk = 'severe_drain';
      } else if (postProjectTreasury < 600) {
        liquidityRisk = 'moderate_drain';
      }

      return {
        key: 'modernization',
        cost,
        duration,
        equipment: eq,
        modernizationLevel: modLevel,
        underConstruction,
        status,
        statusLabel,
        marginalPayoffImmediate,
        bottleneckNote,
        recommendation,
        liquidityRisk,
        postProjectTreasury,
        summary: `Оборудование фабрики: ${statusLabel}. Состояние: ${eq.toFixed(1)}% (износ станков).`,
      };
    }

    case 'tourism': {
      const cap = game.tourismCapacity ?? 20;
      const dem = game.tourismDemand ?? 25;
      const ads = game.policies?.tourismMarketing ?? 5;
      const underConstruction = (game.projects || []).filter((p) => p.type === 'tourism').length;
      const cost = 220;
      const duration = 6;

      let status = 'latent';
      let statusLabel = 'Потенциал диверсификации';
      let marginalPayoffImmediate = (dem > cap);
      let bottleneckNote = '';
      let recommendation = '';

      if (cap <= 20 && (dem >= cap || ads > 10)) {
        status = 'binding';
        statusLabel = 'Критическое узкое горлышко (дефицит мест)';
        marginalPayoffImmediate = true;
        bottleneckNote = `Гостиницы переполнены (${cap} мест), а реклама создает спрос (${Math.round(dem)} чел.), который невозможно разместить (узкое горлышко).`;
        recommendation = 'Расширение гостиничного фонда (+80 мест, 6 мес.) снимет ограничение и прекратит сжигание бюджета рекламы.';
      } else if (cap < 100) {
        status = 'latent';
        statusLabel = 'Потенциал диверсификации';
        marginalPayoffImmediate = (dem > cap);
        bottleneckNote = `Гостиничный фонд составляет ${cap} мест. Проект добавит +80 мест.`;
        recommendation = 'Создает инфраструктурную базу для диверсификации доходов города.';
      } else {
        status = 'slack';
        statusLabel = 'Достаточная емкость фонда';
        marginalPayoffImmediate = false;
        bottleneckNote = `Вместимость отелей ${cap} мест полностью удовлетворяет спрос (${Math.round(dem)} чел.).`;
        recommendation = 'Фонд развит: узким местом является привлечение спроса или наем персонала, а не стройка.';
      }

      const postProjectTreasury = treasury - cost;
      let liquidityRisk = 'safe';
      if (treasury < cost) {
        liquidityRisk = 'infeasible';
      } else if (postProjectTreasury < 200) {
        liquidityRisk = 'severe_drain';
      } else if (postProjectTreasury < 600) {
        liquidityRisk = 'moderate_drain';
      }

      return {
        key: 'tourism',
        cost,
        duration,
        capacity: cap,
        demand: Math.round(dem),
        marketing: ads,
        underConstruction,
        status,
        statusLabel,
        marginalPayoffImmediate,
        bottleneckNote,
        recommendation,
        liquidityRisk,
        postProjectTreasury,
        summary: `Туристический сектор: ${statusLabel}. Вместимость: ${cap} мест (спрос: ${Math.round(dem)}).`,
      };
    }

    default:
      return {
        key: projectKey,
        cost: 0,
        duration: 0,
        status: 'slack',
        statusLabel: 'Нейтральный проект',
        marginalPayoffImmediate: false,
        bottleneckNote: '',
        recommendation: '',
        liquidityRisk: 'safe',
        postProjectTreasury: treasury,
        summary: 'Неизвестный проект.',
      };
  }
}

/**
 * Returns specific mayoral advisor guidance for capital investment projects,
 * highlighting time lags, physical bottlenecks, and long-term implications.
 */
export function getProjectAdvisorEndorsement(projectKey, game = {}) {
  const audit = evaluateProjectConstraint(projectKey, game);

  switch (projectKey) {
    case 'housing': {
      const pop = game.population ?? 3700;
      const cap = game.housingCapacity ?? 3900;
      const surplus = cap - pop;
      let advice = '';
      if (surplus < 50) {
        advice = 'Жилой фонд почти исчерпан! Строительство длится 12 месяцев. Если не начать сейчас, неизбежно возникнет острый дефицит жилья и отток людей.';
      } else if (surplus < 100) {
        advice = `Запас жилья умеренный (~${Math.round(surplus)} мест, резерв на ~${audit.bufferMonths} мес.). С учетом 12-месячного строительного лага стоит готовить расширение заранее.`;
      } else {
        advice = `Запас жилья значительный (~${Math.round(surplus)} свободных мест при максимальном росте до +${audit.maxImmigrationRate} чел./мес., резерв на ~${audit.bufferMonths} мес.). Проект добавит еще 60 мест через 12 месяцев, но немедленной отдачи для благополучия или казны не даст.`;
      }
      return {
        advisor: ADVISORS.housing,
        advice,
        duration: 12,
        key: 'housing',
        constraintAudit: audit,
      };
    }
    case 'modernization': {
      const eq = game.equipment ?? 48;
      const afterEq = Math.min(100, eq + 12);
      let advice = '';
      if (eq < 40) {
        advice = `Критически необходимо! Станки изношены до ${eq.toFixed(1)}%. Модернизация добавит +12 пунктов оборудования (до ~${afterEq.toFixed(0)}%) и повысит уровень производительности. Срок — 9 месяцев.`;
      } else if (eq < 70) {
        advice = `Оборудование изношено (${eq.toFixed(1)}%). Проект добавит +12 пунктов оборудования (~${afterEq.toFixed(0)}%) и повысит производительность линии за 9 месяцев.`;
      } else {
        advice = `Оборудование в хорошем состоянии (${eq.toFixed(1)}%). Модернизация прибавит ещё +12 пунктов оборудования (~${afterEq.toFixed(0)}%) и повысит производительность. Срок — 9 месяцев.`;
      }
      return {
        advisor: ADVISORS.factory,
        advice,
        duration: 9,
        key: 'modernization',
        constraintAudit: audit,
      };
    }
    case 'tourism': {
      const cap = game.tourismCapacity ?? 20;
      const ads = game.policies?.tourismMarketing ?? 5;
      let advice = '';
      if (cap <= 20 && ads > 10) {
        advice = 'Отели забиты, а реклама сжигает бюджет впустую! Этот проект добавит 80 мест за 6 месяцев и расширит узкое горлышко.';
      } else {
        advice = 'Добавляет 80 гостиничных мест через 6 месяцев. Создает физическую базу для приема гостей города и доходов казны.';
      }
      return {
        advisor: ADVISORS.tourism,
        advice,
        duration: 6,
        key: 'tourism',
        constraintAudit: audit,
      };
    }
    default:
      return {
        advisor: ADVISORS.finance,
        advice: 'Капитальные инвестиции требуют учета временного лага отдачи.',
        duration: 0,
        key: projectKey,
        constraintAudit: audit,
      };
  }
}
