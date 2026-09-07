import { createGame } from './model.js';

export const SCENARIOS = Object.freeze({
  sandbox: {
    id: 'sandbox',
    icon: '🏛️',
    title: 'Свободное управление (Песочница)',
    subtitle: 'Классический эксперимент Лоххаузена 1983 года',
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
      { id: 'satisfaction', label: 'Удовлетворенность всех групп ≥ 85%', target: 85, check: (g) => g.satisfaction >= 85 },
      { id: 'population', label: 'Сохранить население города ≥ 3600 чел.', target: 3600, check: (g) => g.population >= 3600 },
      { id: 'equipment', label: 'Оборудование завода ≥ 85%', target: 85, check: (g) => g.equipment >= 85 },
      { id: 'solvency', label: 'Казна с положительным сальдо (долг 0)', target: 0, check: (g) => g.debt === 0 },
    ],
  },
});

export function getScenariosList() {
  return [
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

export function applyScenario(baseGame, scenarioId) {
  const scenario = getScenario(scenarioId);
  const game = structuredClone(baseGame);

  game.scenarioId = scenario.id;
  game.scenarioTitle = scenario.title;
  game.horizon = scenario.horizon;

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

export function createScenarioGame(scenarioId) {
  const base = createGame();
  return applyScenario(base, scenarioId);
}

export function evaluateScenario(game) {
  const scenarioId = game.scenarioId || 'sandbox';
  const scenario = getScenario(scenarioId);

  const objectives = scenario.objectives.map((obj) => {
    let current = null;
    if (obj.id === 'equipment') current = game.equipment;
    else if (obj.id === 'debt' || obj.id === 'solvency' || obj.id === 'treasury') current = game.debt;
    else if (obj.id === 'production') current = game.production;
    else if (obj.id === 'tourism_capacity') current = game.tourismCapacity;
    else if (obj.id === 'housing') current = game.housingShortage || 0;
    else if (obj.id === 'satisfaction') current = game.satisfaction;
    else if (obj.id === 'population') current = game.population;

    const isMet = obj.check(game);
    return {
      id: obj.id,
      label: obj.label,
      target: obj.target,
      current,
      isMet,
    };
  });

  const metCount = objectives.filter((o) => o.isMet).length;
  const completionRate = objectives.length > 0 ? Number((metCount / objectives.length).toFixed(2)) : 1;

  let status = 'active';
  if (game.debt > 25000 || game.population < 1500) {
    status = 'failed';
  } else if (game.month >= scenario.horizon) {
    status = metCount === objectives.length ? 'completed' : 'failed';
  }

  return {
    scenarioId: scenario.id,
    scenarioTitle: scenario.title,
    status,
    month: game.month,
    horizon: scenario.horizon,
    objectives,
    completionRate,
  };
}

export function getScenarioBenchmark(scenarioId) {
  if (scenarioId === 'factory_crisis') {
    return {
      conrad: {
        name: 'Эталон Конрада (Комплексная модернизация)',
        description: 'Своевременное инвестирование в оборудование, сбалансированные зарплаты, контроль кассовых разрывов.',
        equipmentTrajectory: [24, 30, 42, 56, 68, 78, 86],
        finalEquipment: 86,
        debtTrajectory: [1800, 1500, 1100, 700, 300, 0, 0],
        finalDebt: 0,
      },
      marcus: {
        name: 'Траектория Маркуса (Синдром ремонтника)',
        description: 'Попытка решить кризис снижением расходов на обслуживание и урезанием зарплат приведшая к поломке станков.',
        equipmentTrajectory: [24, 21, 18, 14, 11, 8, 5],
        finalEquipment: 5,
        debtTrajectory: [1800, 2200, 2900, 3800, 5100, 6800, 9200],
        finalDebt: 9200,
      },
    };
  }

  // Общий бенчмарк для остальных сценариев
  return {
    conrad: {
      name: 'Эталон Конрада',
      description: 'Устойчивое развитие всех 5 сфер города без перекосов.',
      equipmentTrajectory: [48, 58, 72, 84, 92, 100],
      finalEquipment: 100,
      satisfactionTrajectory: [84, 88, 91, 93, 95, 96],
      finalSatisfaction: 96,
    },
    marcus: {
      name: 'Траектория Маркуса',
      description: 'Баллистические импульсивные реакции, раскачка системы.',
      equipmentTrajectory: [48, 42, 35, 28, 20, 15],
      finalEquipment: 15,
      satisfactionTrajectory: [84, 76, 68, 60, 52, 45],
      finalSatisfaction: 45,
    },
  };
}

export function getBenchmarkTrajectory(archetype) {
  const benchmark = getScenarioBenchmark('default');
  if (archetype === 'konrad') return benchmark.conrad;
  if (archetype === 'marcus') return benchmark.marcus;
  return null;
}
