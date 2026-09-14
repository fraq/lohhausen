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

test('taleb: богатый город без наблюдений не доказывает антихрупкость', () => {
  const game = applyScenario(createGame(), 'extremistan_challenge', 42);
  const metrics = computeAntifragilityMetrics(game);
  assert.equal(metrics.classification, 'insufficient_evidence');
  assert.equal(metrics.survivedNegativeShocks, 0);
  assert.equal(metrics.liquidityDiscipline, 100);
});

test('scenarios: extremistan_challenge инициализируется, оценивается и предоставляет бенчмарки', () => {
  const scenario = getScenario('extremistan_challenge');
  assert.equal(scenario.id, 'extremistan_challenge');
  assert.equal(scenario.horizon, 60);
  assert.equal(scenario.objectives.length, 5);

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
