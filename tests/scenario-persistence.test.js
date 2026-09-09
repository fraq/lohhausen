import test from 'node:test';
import assert from 'node:assert/strict';

import { advance, createGame, deserializeGame, serializeGame, startProject } from '../src/model.js';
import { createScenarioGame } from '../src/scenarios.js';

const SCENARIO_HORIZONS = {
  sandbox: 120,
  factory_crisis: 36,
  tourism_dilemma: 48,
  dorner_challenge: 60,
};

test('scenario saves round-trip at start, midpoint, and horizon', () => {
  for (const [scenarioId, horizon] of Object.entries(SCENARIO_HORIZONS)) {
    let game = createScenarioGame(scenarioId);
    for (const month of [0, Math.floor(horizon / 2), horizon]) {
      game = advance(game, month - game.month);
      const restored = deserializeGame(serializeGame(game));
      assert.ok(!(restored instanceof Error), `${scenarioId} month ${month}: ${restored.message}`);
      assert.deepEqual(restored, game);
    }
  }
});

test('scenario saves reject mismatched horizons and months beyond their horizon', () => {
  const game = createScenarioGame('factory_crisis');
  const invalidHorizon = structuredClone(game);
  invalidHorizon.horizon = 48;
  assert.ok(deserializeGame(JSON.stringify(invalidHorizon)) instanceof Error);

  const invalidMonth = structuredClone(game);
  invalidMonth.month = invalidMonth.horizon + 1;
  invalidMonth.history.push({ ...invalidMonth.history.at(-1), month: invalidMonth.month });
  assert.ok(deserializeGame(JSON.stringify(invalidMonth)) instanceof Error);
});

test('legacy 120-month saves without scenario metadata or equipment snapshots remain valid', () => {
  const legacy = advance(createGame(), 2);
  for (const item of legacy.history) delete item.equipment;
  const restored = deserializeGame(JSON.stringify(legacy));
  assert.ok(!(restored instanceof Error), restored.message);
  assert.equal(restored.horizon, 120);
  assert.ok(restored.history.every((item) => !('equipment' in item)));
});

test('new monthly snapshots retain equipment for factory history charts', () => {
  const game = advance(createGame(), 3);
  assert.deepEqual(game.history.map((item) => item.equipment), [48, game.history[1].equipment, game.history[2].equipment, game.equipment]);
  assert.ok(game.history.every((item) => Number.isFinite(item.equipment)));
});

test('projects that would finish after the active scenario horizon are rejected', () => {
  const game = advance(createScenarioGame('factory_crisis'), 30);
  game.treasury = 1000;
  assert.throws(() => startProject(game, 'housing'), /не осталось времени/);
  assert.doesNotThrow(() => startProject(game, 'tourism'));
});
