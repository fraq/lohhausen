import { createGame, setPolicies, startProject, advance, PROJECTS } from './model.js';
import { initTalebState, getTalebEventSummary, listTalebOpportunities, resolveTalebOpportunity } from './taleb-events.js';

export const SCENARIOS = Object.freeze({
  sandbox: {
    id: 'sandbox',
    icon: '🏛️',
    title: 'Свободное управление (Песочница)',
    subtitle: 'Учебная реконструкция Лоххаузена',
    difficulty: 'Стандартная',
    horizon: 120,
    duration: 120,
    briefing: 'Стандартные стартовые условия города Лоххаузен. Горизонт планирования — 10 лет (120 месяцев). Ваша задача — развивать город, соблюдая баланс между экономикой фабрики, благополучием жителей и устойчивостью казны.',
    objectives: [
      { id: 'satisfaction', label: 'Удовлетворенность жителей ≥ 85%', target: 85, check: (g) => g.satisfaction >= 85 },
      { id: 'treasury', label: 'Казна без хронического долга (долг = 0)', target: 0, check: (g) => g.debt === 0 },
      { id: 'equipment', label: 'Оборудование фабрики ≥ 80%', target: 80, check: (g) => g.equipment >= 80 },
    ],
  },
  factory_crisis: {
    id: 'factory_crisis',
    icon: '🏭',
    title: 'Кризис часовой фабрики',
    subtitle: 'Спасение градообразующего предприятия за 36 месяцев',
    difficulty: 'Средняя',
    horizon: 36,
    duration: 36,
    briefing: 'Оборудование градообразующего часового завода изношено до критических 24%. Накоплен краткосрочный долг в 1800 тыс. марок, а свободных средств в казне осталось всего 350 тыс. Предотвратите остановку завода и верните рентабельность.',
    objectives: [
      { id: 'equipment', label: 'Восстановить оборудование фабрики ≥ 70%', target: 70, check: (g) => g.equipment >= 70 },
      { id: 'debt', label: 'Снизить долг казны ≤ 1000 тыс. марок', target: 1000, check: (g) => g.debt <= 1000 },
      { id: 'production', label: 'Выпуск часов не менее 700 шт/мес', target: 700, check: (g) => g.production >= 700 },
    ],
  },
  tourism_dilemma: {
    id: 'tourism_dilemma',
    icon: '🌲',
    title: 'Экологическая дилемма туризма',
    subtitle: 'Развитие курорта без вытеснения коренных жителей',
    difficulty: 'Высокая',
    horizon: 48,
    duration: 48,
    briefing: 'Администрация развернула агрессивную рекламу туризма (бюджет 45 тыс./мес.), однако гостиничных мест всего 20, а в городе возник дефицит жилья (3680 мест при населении 3700). Балансируйте развитие рекреации и базовые потребности горожан.',
    objectives: [
      { id: 'tourism_capacity', label: 'Инфраструктура туризма ≥ 100 мест', target: 100, check: (g) => g.tourismCapacity >= 100 },
      { id: 'housing', label: 'Ликвидировать дефицит жилья', target: 0, check: (g) => g.housingShortage === 0 },
      { id: 'satisfaction', label: 'Удовлетворенность постоянных жителей ≥ 82%', target: 82, check: (g) => g.satisfaction >= 82 },
    ],
  },
  dorner_challenge: {
    id: 'dorner_challenge',
    icon: '⚡',
    title: 'Вызов Дёрнера: Преодоление ловушек',
    subtitle: 'Антикризисное управление при системной раскачке',
    difficulty: 'Экстремальная',
    horizon: 60,
    duration: 60,
    briefing: 'Город вошел в фазу нестабильности: налоги завышены до 24%, рабочие недовольны низкими зарплатами, а инфраструктура запущена. Проявите комплексное мышление, избегая синдрома ремонтника и нетерпеливого перерегулирования.',
    objectives: [
      { id: 'satisfaction_groups', label: 'Удовлетворенность всех групп ≥ 85%', target: 85, check: (g) => Object.values(g.satisfactionGroups || {}).length > 0 && Object.values(g.satisfactionGroups).every((value) => value >= 85) },
      { id: 'population', label: 'Сохранить население города ≥ 3600 чел.', target: 3600, check: (g) => g.population >= 3600 },
      { id: 'equipment', label: 'Оборудование завода ≥ 85%', target: 85, check: (g) => g.equipment >= 85 },
      { id: 'solvency', label: 'Казна с положительным сальдо (долг 0)', target: 0, check: (g) => g.debt === 0 },
    ],
  },
  extremistan_challenge: {
    id: 'extremistan_challenge',
    icon: '🦢',
    title: 'Вызов Крайнестана: учебный стресс-тест',
    subtitle: 'Пять событий с заданной силой и длительностью',
    difficulty: 'Экстремальная',
    horizon: 60,
    duration: 60,
    briefing: 'Авторское упражнение по мотивам идей Нассима Талеба: ограниченная колода из двух разных отрицательных событий, двух разных положительных и одного шумового. Сид определяет выбор и месяцы событий; их сила и длительность заданы заранее. Сохраните город и переживите хотя бы один завершенный отрицательный шок. Покупку оборудования выбираете вы. Выполнение целей показывает устойчивость в этом испытании; пользу от шока оценивает отдельное сравнение.',
    objectives: [
      { id: 'solvency', label: 'Казна без хронического долга (долг = 0)', target: 0, check: (g) => g.debt === 0 },
      { id: 'resilience', label: 'Подушка казны ≥ 800 тыс. марок (Slack)', target: 800, check: (g) => g.treasury >= 800 },
      { id: 'satisfaction', label: 'Удовлетворенность горожан ≥ 80%', target: 80, check: (g) => g.satisfaction >= 80 },
      { id: 'population', label: 'Сохранить население города ≥ 3400 чел.', target: 3400, check: (g) => g.population >= 3400 },
      { id: 'survived_negative', label: 'Пережить хотя бы один завершенный отрицательный шок', target: 1, check: (g) => getTalebEventSummary(g).survivedNegativeShocks >= 1 },
    ],
  },
});

export function getScenariosList(options) {
  const includeAll = options === true || options?.all === true;
  const list = [
    {
      id: SCENARIOS.sandbox.id,
      icon: SCENARIOS.sandbox.icon,
      title: SCENARIOS.sandbox.title,
      subtitle: SCENARIOS.sandbox.subtitle,
      difficulty: SCENARIOS.sandbox.difficulty,
      horizon: SCENARIOS.sandbox.horizon,
      briefing: SCENARIOS.sandbox.briefing,
    },
    {
      id: SCENARIOS.factory_crisis.id,
      icon: SCENARIOS.factory_crisis.icon,
      title: SCENARIOS.factory_crisis.title,
      subtitle: SCENARIOS.factory_crisis.subtitle,
      difficulty: SCENARIOS.factory_crisis.difficulty,
      horizon: SCENARIOS.factory_crisis.horizon,
      briefing: SCENARIOS.factory_crisis.briefing,
    },
    {
      id: SCENARIOS.tourism_dilemma.id,
      icon: SCENARIOS.tourism_dilemma.icon,
      title: SCENARIOS.tourism_dilemma.title,
      subtitle: SCENARIOS.tourism_dilemma.subtitle,
      difficulty: SCENARIOS.tourism_dilemma.difficulty,
      horizon: SCENARIOS.tourism_dilemma.horizon,
      briefing: SCENARIOS.tourism_dilemma.briefing,
    },
    {
      id: SCENARIOS.dorner_challenge.id,
      icon: SCENARIOS.dorner_challenge.icon,
      title: SCENARIOS.dorner_challenge.title,
      subtitle: SCENARIOS.dorner_challenge.subtitle,
      difficulty: SCENARIOS.dorner_challenge.difficulty,
      horizon: SCENARIOS.dorner_challenge.horizon,
      briefing: SCENARIOS.dorner_challenge.briefing,
    },
  ];

  if (includeAll) {
    list.push({
      id: SCENARIOS.extremistan_challenge.id,
      icon: SCENARIOS.extremistan_challenge.icon,
      title: SCENARIOS.extremistan_challenge.title,
      subtitle: SCENARIOS.extremistan_challenge.subtitle,
      difficulty: SCENARIOS.extremistan_challenge.difficulty,
      horizon: SCENARIOS.extremistan_challenge.horizon,
      briefing: SCENARIOS.extremistan_challenge.briefing,
    });
  }

  return list;
}

export function listScenarios() {
  return getScenariosList();
}

export function getScenario(id) {
  if (id && SCENARIOS[id]) {
    return SCENARIOS[id];
  }
  return SCENARIOS.sandbox;
}

export function applyScenario(baseGame, scenarioId, seed = null) {
  const scenario = getScenario(scenarioId);
  const game = structuredClone(baseGame);

  game.scenarioId = scenario.id;
  game.scenarioTitle = scenario.title;
  game.horizon = scenario.horizon;
  // The base game's report snapshots precede scenario-specific starting values.
  // advance() captures the actual starting state before the first calculation.
  game.reportHistory = [];
  game.reports = {};

  if (scenario.id === 'factory_crisis') {
    game.equipment = 24;
    game.treasury = 350;
    game.debt = 1800;
    game.production = 520;
    game.demand = 750;
  } else if (scenario.id === 'tourism_dilemma') {
    game.policies.tourismMarketing = 45;
    game.tourismCapacity = 20;
    game.tourismDemand = 150;
    game.housingCapacity = 3680;
    game.housingShortage = Math.max(0, game.population - 3680);
  } else if (scenario.id === 'dorner_challenge') {
    game.policies.taxRate = 24;
    game.policies.wage = 85;
    game.policies.services = 50;
    game.policies.maintenance = 8;
    game.equipment = 32;
    game.treasury = 600;
    game.debt = 800;
    game.satisfaction = 68;
    game.satisfactionGroups = { workers: 58, families: 65, seniors: 74 };
  } else if (scenario.id === 'extremistan_challenge') {
    const rawSeed = Number.isInteger(seed) ? seed : (baseGame.seed ?? 19870505);
    game.seed = rawSeed >>> 0;
    game.talebState = initTalebState(game.seed);
    game.treasury = 900;
    game.debt = 0;
  }

  // Обновляем начальный слепок истории под условия сценария
  if (game.history && game.history.length > 0) {
    game.history[0] = {
      month: 0,
      population: game.population,
      treasury: game.treasury,
      debt: game.debt,
      production: game.production,
      unemployment: game.unemployment,
      housingShortage: game.housingShortage || 0,
      satisfaction: game.satisfaction,
      equipment: game.equipment,
      housingCapacity: game.housingCapacity,
      tourismCapacity: game.tourismCapacity,
      visitors: game.visitors,
      serviceQuality: game.serviceQuality,
    };
  }

  // Запись в журнал бургомистра
  game.journal.push({
    month: 0,
    type: 'scenario',
    title: `Старт сценария: ${scenario.title}`,
    note: scenario.briefing,
    horizon: scenario.horizon,
  });

  game.events = [`Запущен сценарий «${scenario.title}». Горизонт: ${scenario.horizon} мес.`];
  return game;
}

export function createScenarioGame(scenarioId, seed = null) {
  const base = createGame();
  return applyScenario(base, scenarioId, seed);
}

export function evaluateScenario(game) {
  const scenarioId = game.scenarioId || 'sandbox';
  const scenario = getScenario(scenarioId);

  const objectives = scenario.objectives.map((obj) => {
    let current = null;
    if (obj.id === 'equipment') current = Math.round(game.equipment);
    else if (obj.id === 'debt' || obj.id === 'solvency' || obj.id === 'treasury') current = Math.round(game.debt);
    else if (obj.id === 'resilience') current = Math.round(game.treasury);
    else if (obj.id === 'production') current = Math.round(game.production);
    else if (obj.id === 'tourism_capacity') current = game.tourismCapacity;
    else if (obj.id === 'housing') current = game.housingShortage || 0;
    else if (obj.id === 'satisfaction') current = Math.round(game.satisfaction);
    else if (obj.id === 'satisfaction_groups') current = Math.round(Math.min(...Object.values(game.satisfactionGroups || {})));
    else if (obj.id === 'population') current = Math.round(game.population);
    else if (obj.id === 'survived_negative') current = getTalebEventSummary(game).survivedNegativeShocks;

    const isMet = Boolean(obj.check(game));
    return {
      id: obj.id,
      label: obj.label,
      target: obj.target,
      current,
      met: isMet,
      isMet,
    };
  });

  const metCount = objectives.filter((o) => o.isMet).length;
  const totalCount = objectives.length;
  const completionRate = totalCount > 0 ? Math.round((metCount / totalCount) * 100) : 100;
  const monthsLeft = Math.max(0, scenario.horizon - game.month);

  let status = 'active';
  let reason = '';

  if (game.month >= scenario.horizon && game.debt > 25000) {
    status = 'defeat';
    reason = 'Казна города объявила дефолт из-за критического долга.';
  } else if (game.month >= scenario.horizon && game.population < 1500) {
    status = 'defeat';
    reason = 'Массовый исход жителей привел к опустению города.';
  } else if (game.month >= scenario.horizon) {
    if (metCount === totalCount) {
      status = 'victory';
    } else {
      status = 'defeat';
      reason = 'Срок управления завершен: не все цели сценария выполнены.';
    }
  }

  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    status,
    reason,
    month: game.month,
    horizon: scenario.horizon,
    monthsLeft,
    metCount,
    totalCount,
    objectives,
    progress: objectives,
    completionRate,
  };
}

// These are authored, inspectable policies, not claims of optimal or guaranteed
// outcomes. Every trajectory below is generated by the same city engine.
const EXTREMISTAN_RECIPES = {
  conrad: {
    id: 'conrad',
    name: 'Пример Конрада: резерв и плановые инвестиции',
    description: 'Авторский набор решений с резервом после проектов и явным выбором покупки оборудования.',
    strategy: 'Пересматривать расходы по заданному расписанию, оставлять после проектов резерв 600 тыс. марок и покупать предложенное оборудование только при казне от 800 тыс. марок.',
    policySteps: [
      { month: 0, patch: { taxRate: 20, wage: 105, maintenance: 30, services: 82, education: 28, marketing: 42, tourismMarketing: 5 } },
      { month: 12, patch: { maintenance: 34, education: 32 } },
      { month: 24, patch: { services: 86, tourismMarketing: 12 } },
      { month: 36, patch: { maintenance: 38, marketing: 46 } },
      { month: 48, patch: { education: 24, tourismMarketing: 8 } },
    ],
    projectSteps: [
      { month: 0, type: 'modernization', reserve: 600 },
      { month: 6, type: 'modernization', reserve: 600 },
      { month: 12, type: 'tourism', reserve: 600 },
      { month: 24, type: 'modernization', reserve: 600 },
      { month: 36, type: 'housing', reserve: 600 },
    ],
    opportunityRule: 'buy_if_eligible_else_decline',
  },
  marcus: {
    id: 'marcus',
    name: 'Пример Маркуса: расходы и смена курса',
    description: 'Авторский набор решений с ранними расходами, рекламой туризма и последующим повышением налогов.',
    strategy: 'Запускать запланированные проекты при достаточной казне без дополнительного резерва, менять налоги и расходы по расписанию и отклонять покупку предложенного оборудования.',
    policySteps: [
      { month: 0, patch: { taxRate: 16, wage: 115, maintenance: 8, services: 110, education: 70, marketing: 70, tourismMarketing: 60 } },
      { month: 12, patch: { taxRate: 28, wage: 100, services: 80 } },
      { month: 24, patch: { taxRate: 35, maintenance: 4, education: 12 } },
      { month: 36, patch: { taxRate: 18, wage: 120, services: 115 } },
      { month: 48, patch: { taxRate: 30, wage: 90, services: 65 } },
    ],
    projectSteps: [
      { month: 0, type: 'tourism', reserve: 0 },
      { month: 0, type: 'housing', reserve: 0 },
      { month: 0, type: 'modernization', reserve: 0 },
      { month: 12, type: 'tourism', reserve: 0 },
      { month: 24, type: 'modernization', reserve: 0 },
      { month: 36, type: 'housing', reserve: 0 },
    ],
    opportunityRule: 'decline',
  },
};

function runExtremistanBenchmark(recipe, seed) {
  let game = createScenarioGame('extremistan_challenge', seed);
  const decisionLog = [];
  while (game.month < game.horizon) {
    for (const step of recipe.policySteps.filter((item) => item.month === game.month)) {
      game = setPolicies(game, step.patch);
      decisionLog.push({ month: game.month, type: 'policy', patch: structuredClone(step.patch), feasible: true, applied: true, reason: 'applied' });
    }
    for (const step of recipe.projectSteps.filter((item) => item.month === game.month)) {
      const project = PROJECTS[step.type];
      const feasible = game.treasury >= project.cost && game.month + project.duration <= game.horizon;
      const applied = feasible && game.treasury - project.cost >= step.reserve;
      const reason = game.month + project.duration > game.horizon ? 'outside_horizon'
        : game.treasury < project.cost ? 'insufficient_treasury'
          : !applied ? 'reserve_floor' : 'applied';
      decisionLog.push({ ...step, type: 'project', projectType: step.type, cost: project.cost, treasuryBefore: game.treasury, feasible, applied, reason });
      if (applied) game = startProject(game, step.type);
    }
    for (const offer of listTalebOpportunities(game)) {
      const eligible = game.treasury >= offer.requiredTreasury;
      const choice = recipe.opportunityRule === 'buy_if_eligible_else_decline' && eligible ? 'buy' : 'decline';
      decisionLog.push({ month: game.month, type: 'taleb_choice', instanceId: offer.instanceId, eventId: offer.eventId, choice, purchaseFeasible: eligible, treasuryBefore: game.treasury, cost: offer.cost, requiredTreasury: offer.requiredTreasury, feasible: true, applied: true, reason: choice === 'buy' ? 'applied' : eligible ? 'recipe_declines' : 'insufficient_treasury' });
      game = resolveTalebOpportunity(game, offer.instanceId, choice);
    }
    game = advance(game, 1);
  }
  const history = structuredClone(game.history);
  return {
    name: recipe.name,
    description: recipe.description,
    strategy: recipe.strategy,
    verdict: 'Траектория рассчитана движком с указанным сидом. Этот авторский пример не гарантирует победу и не устанавливает лучший способ управления.',
    scenarioId: game.scenarioId,
    seed: game.seed,
    recipe: structuredClone(recipe),
    decisionLog,
    actionJournal: structuredClone(game.journal.filter((entry) => ['policy', 'project', 'taleb_choice'].includes(entry.type))),
    scheduledEvents: structuredClone(game.talebState.scheduledEvents),
    history,
    equipmentTrajectory: history.map((entry) => entry.equipment),
    satisfactionTrajectory: history.map((entry) => entry.satisfaction),
    debtTrajectory: history.map((entry) => entry.debt),
    treasuryTrajectory: history.map((entry) => entry.treasury),
    populationTrajectory: history.map((entry) => entry.population),
    finalEquipment: game.equipment,
    finalDebt: game.debt,
    finalSatisfaction: game.satisfaction,
    finalTreasury: game.treasury,
    evaluation: evaluateScenario(game),
    finalState: game,
  };
}

export function getScenarioBenchmark(scenarioId, seed = null) {
  if (scenarioId === 'factory_crisis') {
    return {
      conrad: {
        name: 'Эталон Конрада (Комплексная модернизация)',
        description: 'Своевременное инвестирование в оборудование, сбалансированные зарплаты, контроль кассовых разрывов.',
        strategy: 'Сверять обслуживание с расчетным износом при текущем выпуске, планировать модернизацию до остановки оборудования и контролировать месячный баланс.',
        verdict: 'Станки восстановлены до 86%, выручка фабрики покрыла долг, город вернулся к устойчивому профициту.',
        equipmentTrajectory: [24, 30, 42, 56, 68, 78, 86],
        finalEquipment: 86,
        satisfactionTrajectory: [80, 82, 84, 86, 88, 88, 88],
        debtTrajectory: [1800, 1500, 1100, 700, 300, 0, 0],
        finalDebt: 0,
        finalSatisfaction: 88,
      },
      marcus: {
        name: 'Траектория Маркуса (Синдром ремонтника)',
        description: 'Попытка решить кризис снижением расходов на обслуживание и урезанием зарплат приведшая к поломке станков.',
        strategy: 'Сокращать обслуживание при продолжающемся износе, резко менять налоги и реагировать лишь после ухудшения выпуска и месячного баланса.',
        verdict: 'Станки деградировали до 5%, фабрика остановилась, город погрузился в долговую спираль с долгом свыше 9000 тыс. м.',
        equipmentTrajectory: [24, 21, 18, 14, 11, 8, 5],
        finalEquipment: 5,
        satisfactionTrajectory: [80, 75, 68, 60, 55, 50, 48],
        debtTrajectory: [1800, 2200, 2900, 3800, 5100, 6800, 9200],
        finalDebt: 9200,
        finalSatisfaction: 48,
      },
    };
  }

  if (scenarioId === 'tourism_dilemma') {
    return {
      conrad: {
        name: 'Эталон Конрада (Синхронное развитие туризма)',
        description: 'Синхронизация рекламы туризма со строительством кемпингов и гостиниц; баланс между доходами и спокойствием жителей.',
        strategy: 'Сопоставлять рекламу с фактической вместимостью и доступными работниками, расширять инфраструктуру заранее и проверять месячный баланс.',
        verdict: 'Туристический сектор дал стабильный доход без перегрузки городской инфраструктуры и без раздражения горожан (благополучие 90+).',
        equipmentTrajectory: [48, 55, 62, 70, 78],
        finalEquipment: 78,
        satisfactionTrajectory: [84, 86, 88, 90, 91],
        tourismCapacityTrajectory: [20, 20, 100, 100, 180],
        finalTourismCapacity: 180,
        debtTrajectory: [0, 0, 0, 0, 0],
        finalDebt: 0,
        finalSatisfaction: 91,
      },
      marcus: {
        name: 'Траектория Маркуса (Рекламный мираж)',
        description: 'Массированные траты на рекламу туризма при полном отсутствии свободных мест и игнорировании дефицита жилья.',
        strategy: 'Наращивать рекламу при неизменной вместимости, игнорировать доступных работников и продолжать расходы при ухудшении месячного баланса.',
        verdict: 'Рекламный бюджет сожжен впустую, туристы не смогли приехать, обострился дефицит жилья, благополучие упало ниже 60.',
        equipmentTrajectory: [48, 45, 40, 35, 30],
        finalEquipment: 30,
        satisfactionTrajectory: [84, 78, 70, 62, 54],
        tourismCapacityTrajectory: [20, 20, 20, 20, 20],
        finalTourismCapacity: 20,
        debtTrajectory: [0, 800, 1800, 3200, 4800],
        finalDebt: 4800,
        finalSatisfaction: 54,
      },
    };
  }

  if (scenarioId === 'dorner_challenge') {
    return {
      conrad: {
        name: 'Эталон Конрада (Системная интеграция)',
        description: 'Целостное управление всеми 5 сферами города с учетом лагов времени и взаимных резонансов.',
        strategy: 'Сверять обслуживание с фактическим износом, услуги — с текущей потребностью населения, а каждое решение — с месячным балансом и сроками проектов.',
        verdict: 'Город преодолел все структурные диспропорции: отсутствие долга, процветающая фабрика, благополучие 93+.',
        equipmentTrajectory: [40, 52, 65, 78, 88, 95],
        finalEquipment: 95,
        satisfactionTrajectory: [78, 82, 86, 89, 92, 94],
        debtTrajectory: [500, 200, 0, 0, 0, 0],
        finalDebt: 0,
        finalSatisfaction: 94,
      },
      marcus: {
        name: 'Траектория Маркуса (Хаотическое блуждание)',
        description: 'Бессистемное метание от одной локальной проблемы к другой с пренебрежением долгосрочными последствиями.',
        strategy: 'Резко переключать налоги и расходы между сферами, прекращать финансирование до проявления эффекта и не проверять рост долга по месячному балансу.',
        verdict: 'Система вошла в фазовый резонанс: долг свыше 8000 тыс. м., износ станков, исход населения, крах доверия к бургомистру.',
        equipmentTrajectory: [40, 32, 25, 20, 15, 10],
        finalEquipment: 10,
        satisfactionTrajectory: [78, 70, 62, 54, 48, 42],
        debtTrajectory: [500, 1500, 3200, 5100, 7200, 9800],
        finalDebt: 9800,
        finalSatisfaction: 42,
      },
    };
  }

  if (scenarioId === 'extremistan_challenge') {
    return {
      conrad: runExtremistanBenchmark(EXTREMISTAN_RECIPES.conrad, seed),
      marcus: runExtremistanBenchmark(EXTREMISTAN_RECIPES.marcus, seed),
    };
  }

  // Общий бенчмарк для остальных сценариев (sandbox)
  return {
    conrad: {
      name: 'Эталон Конрада (10-летнее гармоничное развитие)',
      description: 'Устойчивое развитие всех 5 сфер города без перекосов.',
      strategy: 'Инвестировать с учетом доступной казны и сроков, заранее следить за запасом жилья и регулярно проверять занятость и месячный баланс.',
      verdict: 'В этом вымышленном примере итоговое благополучие составляет 96 из 100. Это иллюстрация, а не лучший возможный результат модели.',
      equipmentTrajectory: [48, 58, 72, 84, 92, 100],
      finalEquipment: 100,
      satisfactionTrajectory: [84, 88, 91, 93, 95, 96],
      finalSatisfaction: 96,
      finalDebt: 0,
    },
    marcus: {
      name: 'Траектория Маркуса (Баллистический стиль)',
      description: 'Баллистические импульсивные реакции, раскачка системы.',
      strategy: 'Принимать решения без последующей проверки фактического износа, потребности в услугах и месячного баланса; обнаруживать накопленные проблемы с опозданием.',
      verdict: 'Накопление отложенных дефицитов, резкий износ инфраструктуры и финансовый кризис во второй половине срока.',
      equipmentTrajectory: [48, 42, 35, 28, 20, 15],
      finalEquipment: 15,
      satisfactionTrajectory: [84, 76, 68, 60, 52, 45],
      finalSatisfaction: 45,
      finalDebt: 7500,
    },
  };
}

export function getBenchmarkTrajectory(archetype) {
  const benchmark = getScenarioBenchmark('default');
  if (archetype === 'konrad') return benchmark.conrad;
  if (archetype === 'marcus') return benchmark.marcus;
  return null;
}
