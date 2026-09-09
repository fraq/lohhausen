import test from 'node:test';
import assert from 'node:assert/strict';
import { createScenarioGame, evaluateScenario } from '../src/scenarios.js';

test('meeting objectives before the deadline does not report a completed scenario', () => {
  const game = createScenarioGame('factory_crisis');
  Object.assign(game, { month: 27, equipment: 80, debt: 500, production: 750 });
  assert.equal(evaluateScenario(game).completionRate, 100);
  assert.equal(evaluateScenario(game).status, 'active');
  game.month = 36;
  assert.equal(evaluateScenario(game).status, 'victory');
});

test('a recoverable crisis is not labeled terminal while the simulation still permits turns', () => {
  const game = createScenarioGame('sandbox');
  Object.assign(game, { month: 20, debt: 26000 });
  assert.equal(evaluateScenario(game).status, 'active');
  game.month = 120;
  assert.equal(evaluateScenario(game).status, 'defeat');
});
