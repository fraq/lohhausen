import { createPRNG } from "./prng.js";

/**
 * Author-written, bounded stress deck inspired by Taleb. Not a Pareto process.
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
    description: "Предложение оборудования: +18 п. за 200 тыс. марок. Для покупки нужна казна от 800 тыс. Решение принимаете вы; предложение действует три месяца.",
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
    description: "Слухи в прессе провоцируют панику и призывы повысить налоги. При ставке выше 20% усиливается миграционное давление. Проверьте показатели перед решением.",
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
  ].sort((a, b) => a.month - b.month).map((item, index) => ({ ...item, instanceId: `${item.month}:${item.eventId}:${index}` }));

  return {
    seed: seed >>> 0,
    prngState: prng.getState(),
    scheduledEvents,
    activeShocks: [],
    history: [],
  };
}

export function talebEventInstanceId(item, index) {
  return item.instanceId ?? `${item.month}:${item.eventId}:${index}`;
}

export function listTalebOpportunities(game) {
  if (!game.talebState || game.month >= game.horizon) return [];
  const def = TALEB_EVENTS.distressed_asset_sale;
  return game.talebState.history.filter(entry => entry.eventId === def.id
    && entry.outcome === 'offered' && entry.month <= game.month && entry.expiresMonth >= game.month)
    .map(entry => ({ instanceId: entry.instanceId, eventId: def.id, title: def.title,
      cost: def.cost, requiredTreasury: def.requiredTreasury, equipmentBonus: def.equipmentBonus, expiresMonth: entry.expiresMonth }));
}

export function resolveTalebOpportunity(game, instanceId, choice) {
  if (!['buy', 'decline'].includes(choice)) throw new Error('Выберите покупку или отказ от предложения.');
  const offer = listTalebOpportunities(game).find(item => item.instanceId === instanceId);
  if (!offer) throw new Error('Предложение недоступно или уже закрыто.');
  if (choice === 'buy' && game.treasury < offer.requiredTreasury) throw new Error('Для покупки оборудования нужна казна не менее 800 тыс. марок.');
  const next = structuredClone(game);
  const entry = next.talebState.history.find(item => item.instanceId === instanceId);
  entry.outcome = choice === 'buy' ? 'capitalized' : 'declined';
  entry.choice = choice;
  entry.choiceMonth = game.month;
  if (choice === 'buy') {
    next.treasury = Number((next.treasury - offer.cost).toFixed(6));
    next.equipment = Math.min(100, next.equipment + offer.equipmentBonus);
  }
  const message = choice === 'buy' ? 'Оборудование куплено за 200 тыс. марок.' : 'Вы отказались от покупки оборудования.';
  next.journal.push({ month: next.month, type: 'taleb_choice', title: offer.title, note: message,
    instanceId, eventId: offer.eventId, choice });
  next.events = [message];
  return next;
}

export function getTalebEventSummary(game) {
  const entries = game.talebState?.history || [];
  const negativeShocks = entries.filter(entry => TALEB_EVENTS[entry.eventId]?.type === 'negative_swan').map(entry => {
    const duration = TALEB_EVENTS[entry.eventId].duration;
    const endMonth = entry.month + duration - 1;
    const completed = game.month >= endMonth;
    const samples = (game.history || []).filter(snap => snap.month >= entry.month && snap.month <= endMonth);
    const completeHistory = samples.length === duration && samples.every((snap, i) => snap.month === entry.month + i
      && ['treasury', 'debt', 'population'].every(key => Number.isFinite(snap[key])));
    const survived = completed && completeHistory
      ? samples.every(snap => snap.treasury > 0 && snap.debt <= 5000 && snap.population >= 2500) : null;
    const scheduleIndex = game.talebState.scheduledEvents.findIndex(item => item.eventId === entry.eventId && item.month === entry.month);
    return { instanceId: entry.instanceId ?? talebEventInstanceId(entry, scheduleIndex), eventId: entry.eventId,
      startMonth: entry.month, endMonth, observationMonth: endMonth + 6, completed, survived };
  });
  return {
    activatedEventsCount: entries.length,
    completedNegativeShocks: negativeShocks.filter(entry => entry.completed).length,
    survivedNegativeShocks: negativeShocks.filter(entry => entry.survived === true).length,
    windfallEventsCount: entries.filter(entry => TALEB_EVENTS[entry.eventId]?.type === 'positive_swan').length,
    noiseEventsCount: entries.filter(entry => TALEB_EVENTS[entry.eventId]?.type === 'noise').length,
    capitalizedOpportunities: entries.filter(entry => entry.eventId === 'distressed_asset_sale' && entry.outcome === 'capitalized'
      && entry.choice === 'buy' && game.journal.some(action => action.type === 'taleb_choice' && action.choice === 'buy' && action.instanceId === entry.instanceId)).length,
    negativeShocks,
  };
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && Object.prototype.toString.call(value) === '[object Object]';
}

/**
 * Структурный валидатор состояния talebState для безопасной десериализации.
 */
export function validateTalebState(state, horizon = 60, currentMonth = horizon, gameSeed = undefined) {
  if (!isPlainObject(state)) return false;
  if (!Number.isInteger(state.seed) || state.seed < 0 || state.seed > 4294967295) return false;
  if (gameSeed !== undefined && state.seed !== gameSeed) return false;
  if (!Number.isInteger(state.prngState) || state.prngState < 0 || state.prngState > 4294967295) return false;

  if (!Array.isArray(state.scheduledEvents)) return false;
  const identities = new Set();
  for (const [index, item] of state.scheduledEvents.entries()) {
    if (!isPlainObject(item)) return false;
    if (!Number.isInteger(item.month) || item.month < 1 || item.month > horizon) return false;
    if (typeof item.eventId !== 'string' || !Object.hasOwn(TALEB_EVENTS, item.eventId)) return false;
    if ('instanceId' in item && (typeof item.instanceId !== 'string' || !item.instanceId)) return false;
    const identity = talebEventInstanceId(item, index);
    if (identities.has(identity)) return false;
    identities.add(identity);
  }

  if (!Array.isArray(state.activeShocks)) return false;
  for (const shock of state.activeShocks) {
    if (!isPlainObject(shock)) return false;
    if (typeof shock.eventId !== 'string' || !Object.hasOwn(TALEB_EVENTS, shock.eventId)) return false;
    if (!Number.isInteger(shock.monthsRemaining) || shock.monthsRemaining < 1 || shock.monthsRemaining > TALEB_EVENTS[shock.eventId].duration) return false;
    if ('instanceId' in shock && !identities.has(shock.instanceId)) return false;
    if (!isPlainObject(shock.effects)) return false;
    if (Object.keys(TALEB_EVENTS[shock.eventId].effects || {}).some(key => !(key in shock.effects))) return false;
    for (const [key, val] of Object.entries(shock.effects)) {
      if (typeof val !== 'number' || !Number.isFinite(val) || val !== TALEB_EVENTS[shock.eventId].effects?.[key]) return false;
    }
  }

  if (!Array.isArray(state.history)) return false;
  const recordedIdentities = new Set();
  for (const entry of state.history) {
    if (!isPlainObject(entry)) return false;
    if (!Number.isInteger(entry.month) || entry.month < 0 || entry.month > currentMonth || entry.month > horizon) return false;
    if (typeof entry.eventId !== 'string' || !Object.hasOwn(TALEB_EVENTS, entry.eventId)) return false;
    if ('instanceId' in entry && !identities.has(entry.instanceId)) return false;
    if ('instanceId' in entry) {
      if (recordedIdentities.has(entry.instanceId)) return false;
      recordedIdentities.add(entry.instanceId);
      if (!state.scheduledEvents.some((item, index) => talebEventInstanceId(item, index) === entry.instanceId
        && item.month === entry.month && item.eventId === entry.eventId)) return false;
    }
    if ('outcome' in entry && !['active', 'capitalized', 'missed_liquidity', 'offered', 'declined', 'expired'].includes(entry.outcome)) return false;
    if (['offered', 'declined', 'expired'].includes(entry.outcome) || 'choice' in entry || 'expiresMonth' in entry) {
      if (entry.eventId !== 'distressed_asset_sale' || typeof entry.instanceId !== 'string') return false;
      if (!Number.isInteger(entry.expiresMonth) || entry.expiresMonth !== Math.min(horizon - 1, entry.month + 2)) return false;
      if ('choice' in entry) {
        if (!['buy', 'decline'].includes(entry.choice) || entry.outcome !== (entry.choice === 'buy' ? 'capitalized' : 'declined')) return false;
        if (!Number.isInteger(entry.choiceMonth) || entry.choiceMonth < entry.month || entry.choiceMonth > entry.expiresMonth || entry.choiceMonth > currentMonth) return false;
      } else if (entry.outcome === 'declined') return false;
    }
  }

  return true;
}

/**
 * Пре-шаг: обработка завершения старых шоков, активация новых, применение мгновенных эффектов
 * и вычисление модификаторов для шага модели.
 */
export function processTalebPreStep(game, events) {
  if (!game.talebState) return { demandMultiplier: 1.0, priceOverride: null, interestMultiplier: 1.0, maintenanceMultiplier: 1.0, tourismMultiplier: 1.0, tourismDemandBonus: 0, taxPenaltyMultiplier: 1.0 };

  const state = game.talebState;
  const currentMonth = game.month; // Месяц, в который перешел симулятор

  for (const entry of state.history) {
    if (entry.outcome === 'offered' && currentMonth > entry.expiresMonth) entry.outcome = 'expired';
  }

  // 1. Декремент активных шоков
  const remainingShocks = [];
  for (const shock of state.activeShocks) {
    shock.monthsRemaining -= 1;
    if (shock.monthsRemaining > 0) {
      remainingShocks.push(shock);
    } else {
      const def = TALEB_EVENTS[shock.eventId];
      events.push(`Завершилось действие события «${def.title}». Последствия могут сохраняться.`);
    }
  }
  state.activeShocks = remainingShocks;

  // 2. Проверка наступления запланированных событий
  const dueEvents = state.scheduledEvents.filter((se) => se.month === currentMonth);
  for (const item of dueEvents) {
    const def = TALEB_EVENTS[item.eventId];
    if (!def) continue;

    const instanceId = talebEventInstanceId(item, state.scheduledEvents.indexOf(item));
    if (def.id === "distressed_asset_sale") {
      state.history.push({ month: currentMonth, eventId: def.id, instanceId, outcome: 'offered',
        expiresMonth: Math.min(game.horizon - 1, currentMonth + 2) });
      events.push(def.description);
      game.journal.push({ month: currentMonth, type: 'taleb_offer', title: def.title, note: def.description, instanceId });
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
      instanceId,
      monthsRemaining: def.duration,
      effects: def.effects || {},
    });

    events.push(`🦢 Событие стресс-теста! «${def.title}»: ${def.description}`);
    game.journal.push({
      month: currentMonth,
      type: def.type === "negative_swan" ? "taleb_shock" : def.type === "positive_swan" ? "taleb_windfall" : "taleb_noise",
      title: def.title,
      note: def.description,
      duration: def.duration,
    });
    state.history.push({ month: currentMonth, eventId: def.id, instanceId, outcome: "active" });
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

// Backwards-compatible entry point; analysis lives outside the event engine.
export { computeAntifragilityMetrics } from './extremistan-analysis.js';
