import { createPRNG } from "./prng.js";

/**
 * Каталог событий Крайнестана по Нассиму Талебу.
 */
export const TALEB_EVENTS = Object.freeze({
  quartz_crisis: {
    id: "quartz_crisis",
    type: "negative_swan",
    icon: "⚡",
    title: "Кварцевый кризис",
    description: "На мировом рынке появились дешевые кварцевые часы. Внешний спрос на традиционную механику обрушился на 60%.",
    duration: 10,
    effects: { demandMultiplier: 0.4 },
  },
  sanitary_crisis: {
    id: "sanitary_crisis",
    type: "negative_swan",
    icon: "☣️",
    title: "Санитарно-эпидемический коллапс",
    description: "Вспышка инфекции и заражение водопровода: падение здоровья горожан (-25 п.) и обнуление туристического спроса.",
    duration: 6,
    effects: { healthShock: -25, tourismMultiplier: 0.0 },
  },
  credit_crunch: {
    id: "credit_crunch",
    type: "negative_swan",
    icon: "📉",
    title: "Кредитный зажим",
    description: "Региональный банковский кризис: процентная ставка по городскому долгу подскочила с 0.8% до 2.8% в месяц.",
    duration: 8,
    effects: { interestMultiplier: 3.5 },
  },
  boiler_failure: {
    id: "boiler_failure",
    type: "negative_swan",
    icon: "💥",
    title: "Авария парового котла",
    description: "Тяжелая авария в энергоцехе фабрики: оборудование упало на 22 пункта, а стоимость текущего обслуживания возросла на 80%.",
    duration: 6,
    effects: { equipmentShock: -22, maintenanceMultiplier: 1.8 },
  },
  luxury_watch_boom: {
    id: "luxury_watch_boom",
    type: "positive_swan",
    icon: "🏆",
    title: "Женевский бум признания",
    description: "Коллекционные часы Лоххаузена удостоены Гран-при: внешний спрос вырос в 2.2 раза по премиальной цене 0.90 марки/шт.",
    duration: 10,
    effects: { demandMultiplier: 2.2, priceOverride: 0.90 },
  },
  distressed_asset_sale: {
    id: "distressed_asset_sale",
    type: "positive_swan",
    icon: "💎",
    title: "Аукцион активов разорившейся коммуны",
    description: "Соседний муниципалитет объявил банкротство. Тест стратегии штанги: при наличии свободной казны от 800 тыс. марок выкуплено современное оборудование (+18 п.) всего за 200 тыс. марок!",
    duration: 1,
    instant: true,
    requiredTreasury: 800,
    cost: 200,
    equipmentBonus: 18,
  },
  thermal_spring_discovery: {
    id: "thermal_spring_discovery",
    type: "positive_swan",
    icon: "♨️",
    title: "Открытие бальнеологического источника",
    description: "Геологи обнаружили термальные минеральные воды: поток туристов увеличился на 80 человек в месяц.",
    duration: 12,
    effects: { tourismDemandBonus: 80 },
  },
  media_panic: {
    id: "media_panic",
    type: "noise",
    icon: "📰",
    title: "Газетная паника вокруг дефицита",
    description: "Слухи в региональной прессе провоцируют панику. Советники требуют поднять налоги. Напоминание: завышение налога выше 20% вызовет исход жителей!",
    duration: 4,
    effects: { taxPenaltyMultiplier: 1.6 },
  },
});

/**
 * Инициализация состояния Талеба для сценария.
 * Формирует детерминированное расписание шоков по заданному сиду.
 */
export function initTalebState(seed = 19870505) {
  const prng = createPRNG(seed);

  // Выбираем 2 отрицательных Черных лебедя на разные фазы игры
  const negPool = ["quartz_crisis", "sanitary_crisis", "credit_crunch", "boiler_failure"];
  const firstNeg = negPool[prng.int(0, negPool.length - 1)];
  const remainingNeg = negPool.filter((id) => id !== firstNeg);
  const secondNeg = remainingNeg[prng.int(0, remainingNeg.length - 1)];

  // Выбираем 2 положительных Черных лебедя
  const posPool = ["luxury_watch_boom", "distressed_asset_sale", "thermal_spring_discovery"];
  const firstPos = posPool[prng.int(0, posPool.length - 1)];
  const remainingPos = posPool.filter((id) => id !== firstPos);
  const secondPos = remainingPos[prng.int(0, remainingPos.length - 1)];

  // 1 событие ятрогенного шума
  const noiseEvent = "media_panic";

  // Детерминированные временные интервалы наступления (горизонт 60 месяцев)
  const scheduledEvents = [
    { month: prng.int(10, 18), eventId: firstNeg },
    { month: prng.int(20, 28), eventId: firstPos },
    { month: prng.int(32, 38), eventId: noiseEvent },
    { month: prng.int(40, 48), eventId: secondNeg },
    { month: prng.int(50, 56), eventId: secondPos },
  ].sort((a, b) => a.month - b.month);

  return {
    seed,
    prngState: prng.getState(),
    scheduledEvents,
    activeShocks: [],
    history: [],
  };
}

/**
 * Пре-шаг: обработка завершения старых шоков, активация новых, применение мгновенных эффектов
 * и вычисление модификаторов для шага модели.
 */
export function processTalebPreStep(game, events) {
  if (!game.talebState) return { demandMultiplier: 1.0, priceOverride: null, interestMultiplier: 1.0, maintenanceMultiplier: 1.0, tourismMultiplier: 1.0, tourismDemandBonus: 0, taxPenaltyMultiplier: 1.0 };

  const state = game.talebState;
  const currentMonth = game.month; // Месяц, в который перешел симулятор

  // 1. Декремент активных шоков
  const remainingShocks = [];
  for (const shock of state.activeShocks) {
    shock.monthsRemaining -= 1;
    if (shock.monthsRemaining > 0) {
      remainingShocks.push(shock);
    } else {
      const def = TALEB_EVENTS[shock.eventId];
      events.push(`Завершилось действие события «${def.title}». Ситуация нормализована.`);
    }
  }
  state.activeShocks = remainingShocks;

  // 2. Проверка наступления запланированных событий
  const dueEvents = state.scheduledEvents.filter((se) => se.month === currentMonth);
  for (const item of dueEvents) {
    const def = TALEB_EVENTS[item.eventId];
    if (!def) continue;

    if (def.instant && def.id === "distressed_asset_sale") {
      // Тест стратегии штанги
      if (game.treasury >= def.requiredTreasury) {
        game.treasury = Math.round(game.treasury - def.cost);
        game.equipment = Math.min(100, Math.round(game.equipment + def.equipmentBonus));
        events.push(`🏆 Опциональность реализована! «${def.title}»: казна ${game.treasury + def.cost} тыс. позволила выкупить станки (+18 п.) за ${def.cost} тыс. марок!`);
        game.journal.push({
          month: currentMonth,
          type: "taleb_positive",
          title: def.title,
          note: `Успех стратегии штанги: наличие свободной подушки ликвидности (${game.treasury + def.cost} тыс.) позволило инвестировать в активы с колоссальной скидкой.`,
        });
        state.history.push({ month: currentMonth, eventId: def.id, outcome: "capitalized" });
      } else {
        events.push(`⚠️ Упущенная опциональность! «${def.title}»: в казне всего ${Math.round(game.treasury)} тыс. (требовалось ${def.requiredTreasury} тыс.). Активы ушли конкурентам.`);
        game.journal.push({
          month: currentMonth,
          type: "taleb_missed",
          title: def.title,
          note: `Провал стратегии штанги: недостаток свободной ликвидности (${Math.round(game.treasury)} тыс. < ${def.requiredTreasury} тыс.) не позволил выкупить подешевевшие активы.`,
        });
        state.history.push({ month: currentMonth, eventId: def.id, outcome: "missed_liquidity" });
      }
      continue;
    }

    // Мгновенные шоковые дельты
    if (def.effects?.equipmentShock) {
      const prevEq = game.equipment;
      game.equipment = Math.max(0, Math.round(game.equipment + def.effects.equipmentShock));
      events.push(`💥 «${def.title}»: оборудование завода повреждено (${prevEq}% ➔ ${game.equipment}%).`);
    }
    if (def.effects?.healthShock) {
      const prevHealth = game.health;
      game.health = Math.max(0, Math.round(game.health + def.effects.healthShock));
      events.push(`☣️ «${def.title}»: система здравоохранения перегружена (здоровье ${prevHealth}% ➔ ${game.health}%).`);
    }

    // Добавление в активные шоки
    state.activeShocks.push({
      eventId: def.id,
      title: def.title,
      monthsRemaining: def.duration,
      effects: def.effects || {},
    });

    events.push(`🦢 Черный лебедь! «${def.title}»: ${def.description}`);
    game.journal.push({
      month: currentMonth,
      type: def.type === "negative_swan" ? "taleb_shock" : def.type === "positive_swan" ? "taleb_windfall" : "taleb_noise",
      title: def.title,
      note: def.description,
      duration: def.duration,
    });
    state.history.push({ month: currentMonth, eventId: def.id, outcome: "active" });
  }

  // 3. Агрегация активных модификаторов
  let demandMultiplier = 1.0;
  let priceOverride = null;
  let interestMultiplier = 1.0;
  let maintenanceMultiplier = 1.0;
  let tourismMultiplier = 1.0;
  let tourismDemandBonus = 0;
  let taxPenaltyMultiplier = 1.0;

  for (const shock of state.activeShocks) {
    const ef = shock.effects;
    if (ef.demandMultiplier) demandMultiplier *= ef.demandMultiplier;
    if (ef.priceOverride) priceOverride = Math.max(priceOverride || 0, ef.priceOverride);
    if (ef.interestMultiplier) interestMultiplier *= ef.interestMultiplier;
    if (ef.maintenanceMultiplier) maintenanceMultiplier *= ef.maintenanceMultiplier;
    if (ef.tourismMultiplier !== undefined) tourismMultiplier *= ef.tourismMultiplier;
    if (ef.tourismDemandBonus) tourismDemandBonus += ef.tourismDemandBonus;
    if (ef.taxPenaltyMultiplier) taxPenaltyMultiplier *= ef.taxPenaltyMultiplier;
  }

  return {
    demandMultiplier,
    priceOverride,
    interestMultiplier,
    maintenanceMultiplier,
    tourismMultiplier,
    tourismDemandBonus,
    taxPenaltyMultiplier,
  };
}

/**
 * Расчет антихрупкостных метрик по Нассиму Талебу для итогового разбора (/debrief).
 */
export function computeAntifragilityMetrics(game) {
  const history = game.history || [];
  if (history.length === 0) {
    return {
      classification: "robust",
      turkeyIndex: 0,
      slackScore: 50,
      barbellCompliance: 50,
      convexityRatio: 1.0,
      verdict: "Недостаточно данных для анализа антихрупкости.",
    };
  }

  let turkeyStreak = 0;
  let maxTurkeyIndex = 0;
  let barbellMonths = 0;
  let totalSlackSum = 0;

  for (const snap of history) {
    // Индекс индейки: удовлетворенность >= 80, но казна < 400 или долг > 0
    if (snap.satisfaction >= 80 && (snap.treasury < 400 || snap.debt > 0)) {
      turkeyStreak += 1;
      if (turkeyStreak > maxTurkeyIndex) maxTurkeyIndex = turkeyStreak;
    } else {
      turkeyStreak = 0;
    }

    // Соблюдение стратегии штанги: казна >= 600 и долг === 0
    if (snap.treasury >= 600 && snap.debt === 0) {
      barbellMonths += 1;
    }

    // Оценка буфера ликвидности (Slack)
    const bufferScore = Math.min(100, Math.round((snap.treasury / 800) * 100));
    totalSlackSum += bufferScore;
  }

  const barbellCompliance = Math.round((barbellMonths / history.length) * 100);
  const slackScore = Math.round(totalSlackSum / history.length);

  // Классификация по Триаде Талеба
  let classification = "robust";
  let triadTitle = "🛡️ Неуязвимая система (Phoenix)";
  let verdict = "Город выдержал внешние шоки Крайнестана, сохранив устойчивость без критических потерь.";

  const finalSnap = history[history.length - 1];
  const isSolvent = finalSnap.debt === 0;
  const isCapitalized = finalSnap.treasury >= 800;
  const isSatisfied = finalSnap.satisfaction >= 80;

  if (finalSnap.debt > 5000 || finalSnap.population < 2500) {
    classification = "fragile";
    triadTitle = "⚔️ Хрупкая система (Damocles)";
    verdict = "Город не выдержал Черных лебедей: отсутствие запаса прочности (Slack) и долговой навес привели к разрушительной катастрофе.";
  } else if (isSolvent && isCapitalized && isSatisfied && barbellCompliance >= 50) {
    classification = "antifragile";
    triadTitle = "🦢 Антихрупкая система (Hydra)";
    verdict = "Истинная победа по Талебу: стратегия штанги и подушка ликвидности позволили капитализировать кризисы и стать сильнее от испытаний!";
  } else if (!isSolvent || finalSnap.treasury < 300) {
    classification = "fragile";
    triadTitle = "⚔️ Хрупкая система (Damocles)";
    verdict = "Признаки хрупкости: уязвимость перед внешними шоками из-за истощения ликвидности или накопления долгов.";
  }

  const survivedSwans = (game.talebState?.history || []).filter((h) => h.outcome === "active" || h.outcome === "capitalized").length;

  return {
    classification,
    triadTitle,
    verdict,
    turkeyIndex: maxTurkeyIndex,
    slackScore,
    barbellCompliance,
    survivedSwans,
  };
}
