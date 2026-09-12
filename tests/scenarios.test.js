import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advance } from '../src/model.js';
import {
  SCENARIOS,
  getScenario,
  getScenariosList,
  applyScenario,
  evaluateScenario,
  getScenarioBenchmark
} from '../src/scenarios.js';

test('scenarios: список содержит 4 канонических сценария Дёрнера', () => {
  const list = getScenariosList();
  assert.equal(list.length, 4);
  const ids = list.map(s => s.id);
  assert.deepEqual(ids, ['sandbox', 'factory_crisis', 'tourism_dilemma', 'dorner_challenge']);
});

test('scenarios: getScenario возвращает сценарий по ID или sandbox по умолчанию', () => {
  const factory = getScenario('factory_crisis');
  assert.equal(factory.id, 'factory_crisis');
  assert.equal(factory.horizon, 36);
  assert.ok(factory.briefing);

  const unknown = getScenario('non_existent');
  assert.equal(unknown.id, 'sandbox');
});

test('scenarios: applyScenario корректно меняет начальные условия под Кризис фабрики', () => {
  const base = createGame();
  const game = applyScenario(base, 'factory_crisis');

  assert.equal(game.scenarioId, 'factory_crisis');
  assert.equal(game.horizon, 36);
  assert.equal(game.equipment, 24);
  assert.equal(game.treasury, 350);
  assert.equal(game.debt, 1800);
  assert.equal(game.history[0].debt, 1800);
  assert.ok(game.journal.some(j => j.type === 'scenario'));
});

test('scenarios: applyScenario корректно готовит Экологическую ловушку туризма', () => {
  const base = createGame();
  const game = applyScenario(base, 'tourism_dilemma');

  assert.equal(game.scenarioId, 'tourism_dilemma');
  assert.equal(game.horizon, 48);
  assert.equal(game.policies.tourismMarketing, 45);
  assert.equal(game.tourismCapacity, 20);
  assert.equal(game.housingCapacity, 3680); // создает дефицит жилья
});

test('scenarios: evaluateScenario возвращает детальный прогресс по целям', () => {
  const base = createGame();
  const game = applyScenario(base, 'factory_crisis');
  const evaluation = evaluateScenario(game);

  assert.equal(evaluation.scenarioId, 'factory_crisis');
  assert.equal(evaluation.status, 'active');
  assert.ok(Array.isArray(evaluation.objectives));
  assert.ok(evaluation.objectives.length >= 3);
  assert.equal(typeof evaluation.completionRate, 'number');
});

test('scenarios: эталонные бенчмарки Конрада и Маркуса доступны для всех сценариев', () => {
  const scenarios = ['sandbox', 'factory_crisis', 'tourism_dilemma', 'dorner_challenge'];
  for (const id of scenarios) {
    const benchmark = getScenarioBenchmark(id);
    assert.ok(benchmark.conrad, `Conrad benchmark missing for ${id}`);
    assert.ok(benchmark.marcus, `Marcus benchmark missing for ${id}`);
    assert.ok(benchmark.conrad.name);
    assert.ok(benchmark.conrad.strategy, `Conrad strategy missing for ${id}`);
    assert.ok(benchmark.conrad.verdict, `Conrad verdict missing for ${id}`);
    assert.ok(benchmark.marcus.strategy, `Marcus strategy missing for ${id}`);
    assert.ok(benchmark.marcus.verdict, `Marcus verdict missing for ${id}`);
    assert.ok(benchmark.conrad.finalEquipment >= benchmark.marcus.finalEquipment);
  }
});

test('scenarios: applyScenario корректно инициализирует Вызов Крайнестана с опциональным seed', () => {
  const base = createGame();
  const gameDefault = applyScenario(base, 'extremistan_challenge');
  assert.equal(gameDefault.scenarioId, 'extremistan_challenge');
  assert.equal(gameDefault.horizon, 60);
  assert.equal(gameDefault.treasury, 900);
  assert.equal(gameDefault.debt, 0);
  assert.equal(gameDefault.seed, 19870505);
  assert.ok(gameDefault.talebState, 'talebState must be initialized');
  assert.equal(gameDefault.talebState.seed, 19870505);

  const gameCustomSeed = applyScenario(base, 'extremistan_challenge', 42);
  assert.equal(gameCustomSeed.seed, 42);
  assert.equal(gameCustomSeed.talebState.seed, 42);

  const evaluation = evaluateScenario(gameDefault);
  assert.equal(evaluation.scenarioId, 'extremistan_challenge');
  assert.equal(evaluation.status, 'active');
  assert.equal(evaluation.objectives.length, 4);
});

