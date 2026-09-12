import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advance } from '../src/model.js';
import {
  TALEB_EVENTS,
  initTalebState,
  processTalebPreStep,
  computeAntifragilityMetrics
} from '../src/taleb-events.js';
import {
  getScenario,
  getScenariosList,
  applyScenario,
  evaluateScenario,
  getScenarioBenchmark
} from '../src/scenarios.js';

test('taleb: TALEB_EVENTS содержит валидные определения Черных лебедей и ятрогенного шума', () => {
  const events = Object.values(TALEB_EVENTS);
  assert.ok(events.length >= 7);

  for (const e of events) {
    assert.ok(e.id, 'Каждое событие должно иметь id');
    assert.ok(e.title, 'Каждое событие должно иметь title');
    assert.ok(e.description, 'Каждое событие должно иметь описание');
    assert.ok(['negative_swan', 'positive_swan', 'noise'].includes(e.type));
    assert.ok(Number.isInteger(e.duration) && e.duration >= 1);
  }
});

test('taleb: initTalebState детерминированно планирует события по сиду', () => {
  const state1 = initTalebState(19870505);
  const state2 = initTalebState(19870505);

  assert.deepEqual(state1.scheduledEvents, state2.scheduledEvents);
  assert.equal(state1.scheduledEvents.length, 5);

  for (const item of state1.scheduledEvents) {
    assert.ok(Number.isInteger(item.month));
    assert.ok(item.month >= 10 && item.month <= 60);
    assert.ok(TALEB_EVENTS[item.eventId]);
  }
});

test('taleb: processTalebPreStep корректно активирует шоки, уменьшает длительность и агрегирует эффекты', () => {
  const game = createGame();
  game.month = 12;
  game.talebState = {
    seed: 42,
    scheduledEvents: [
      { month: 12, eventId: 'quartz_crisis' }
    ],
    activeShocks: [],
    history: []
  };

  const events = [];
  const mods1 = processTalebPreStep(game, events);

  // Шовер активировался
  assert.equal(game.talebState.activeShocks.length, 1);
  assert.equal(game.talebState.activeShocks[0].eventId, 'quartz_crisis');
  assert.equal(mods1.demandMultiplier, 0.4);
  assert.ok(events.some(e => e.includes('Кварцевый кризис')));

  // Следующий месяц: длительность уменьшается
  game.month = 13;
  const mods2 = processTalebPreStep(game, events);
  assert.equal(game.talebState.activeShocks.length, 1);
  assert.equal(game.talebState.activeShocks[0].monthsRemaining, TALEB_EVENTS.quartz_crisis.duration - 1);
  assert.equal(mods2.demandMultiplier, 0.4);
});

test('taleb: тест стратегии штанги (distressed_asset_sale) капитализирует активы при казне >= 800 и упускает при нехватке', () => {
  // Вариант 1: Казна достаточна (капитализация)
  const solventGame = createGame();
  solventGame.month = 20;
  solventGame.treasury = 950;
  solventGame.equipment = 50;
  solventGame.talebState = {
    scheduledEvents: [{ month: 20, eventId: 'distressed_asset_sale' }],
    activeShocks: [],
    history: []
  };

  const solventEvents = [];
  processTalebPreStep(solventGame, solventEvents);

  assert.equal(solventGame.treasury, 750); // 950 - 200
  assert.equal(solventGame.equipment, 68); // 50 + 18
  assert.ok(solventEvents.some(e => e.includes('Опциональность реализована')));
  assert.equal(solventGame.talebState.history[0].outcome, 'capitalized');

  // Вариант 2: Казна недостаточна (упущенная опциональность)
  const leanGame = createGame();
  leanGame.month = 20;
  leanGame.treasury = 400; // < 800
  leanGame.equipment = 50;
  leanGame.talebState = {
    scheduledEvents: [{ month: 20, eventId: 'distressed_asset_sale' }],
    activeShocks: [],
    history: []
  };

  const leanEvents = [];
  processTalebPreStep(leanGame, leanEvents);

  assert.equal(leanGame.treasury, 400); // не изменилась
  assert.equal(leanGame.equipment, 50); // не изменилась
  assert.ok(leanEvents.some(e => e.includes('Упущенная опциональность')));
  assert.equal(leanGame.talebState.history[0].outcome, 'missed_liquidity');
});

test('taleb: computeAntifragilityMetrics корректно вычисляет классификацию по Триаде Талеба', () => {
  // 1. Хрупкая система (падение в долг)
  const fragileGame = createGame();
  fragileGame.history = [
    { satisfaction: 84, treasury: 1200, debt: 0 },
    { satisfaction: 82, treasury: 50, debt: 2000 },
    { satisfaction: 45, treasury: 0, debt: 6500, population: 2400 }
  ];
  const fragileMetrics = computeAntifragilityMetrics(fragileGame);
  assert.equal(fragileMetrics.classification, 'fragile');
  assert.ok(fragileMetrics.triadTitle.includes('Хрупкая'));

  // 2. Антихрупкая система (буфер ликвидности, отсутствие долга, высокая удовлетворенность)
  const antifragileGame = createGame();
  antifragileGame.history = [
    { satisfaction: 84, treasury: 1000, debt: 0 },
    { satisfaction: 85, treasury: 950, debt: 0 },
    { satisfaction: 88, treasury: 1100, debt: 0 },
    { satisfaction: 90, treasury: 1200, debt: 0 }
  ];
  antifragileGame.talebState = { history: [{ outcome: 'active' }, { outcome: 'capitalized' }] };
  const afMetrics = computeAntifragilityMetrics(antifragileGame);
  assert.equal(afMetrics.classification, 'antifragile');
  assert.ok(afMetrics.triadTitle.includes('Антихрупкая'));
  assert.equal(afMetrics.barbellCompliance, 100);
});

test('scenarios: extremistan_challenge инициализируется, оценивается и предоставляет бенчмарки', () => {
  const scenario = getScenario('extremistan_challenge');
  assert.equal(scenario.id, 'extremistan_challenge');
  assert.equal(scenario.horizon, 60);
  assert.equal(scenario.objectives.length, 4);

  // Проверка расширенного списка сценариев
  const allList = getScenariosList({ all: true });
  assert.equal(allList.length, 5);
  assert.ok(allList.some(s => s.id === 'extremistan_challenge'));

  // Проверка применения сценария
  const base = createGame();
  const game = applyScenario(base, 'extremistan_challenge', 42);
  assert.equal(game.scenarioId, 'extremistan_challenge');
  assert.equal(game.horizon, 60);
  assert.equal(game.treasury, 900);
  assert.ok(game.talebState);
  assert.equal(game.talebState.scheduledEvents.length, 5);

  // Проверка прогресса по целям
  const evaluation = evaluateScenario(game);
  assert.equal(evaluation.scenarioId, 'extremistan_challenge');
  assert.equal(evaluation.status, 'active');
  assert.ok(evaluation.objectives.some(p => p.id === 'resilience'));

  // Проверка бенчмарка
  const benchmarks = getScenarioBenchmark('extremistan_challenge');
  assert.ok(benchmarks.conrad);
  assert.ok(benchmarks.marcus);
  assert.ok(benchmarks.conrad.name.includes('Конрада'));
  assert.ok(benchmarks.marcus.name.includes('Маркуса'));
});
