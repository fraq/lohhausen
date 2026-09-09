import test from 'node:test';
import assert from 'node:assert/strict';

import { createScenarioGame, evaluateScenario, getScenarioBenchmark } from '../src/scenarios.js';

test('Dörner challenge requires every satisfaction group to meet the target', () => {
  const game = createScenarioGame('dorner_challenge');
  game.satisfaction = 86;
  game.satisfactionGroups = { workers: 90, families: 90, seniors: 80 };

  const objective = evaluateScenario(game).objectives.find((item) => item.id === 'satisfaction_groups');
  assert.equal(objective.current, 80);
  assert.equal(objective.met, false);

  game.satisfactionGroups.seniors = 85;
  const metObjective = evaluateScenario(game).objectives.find((item) => item.id === 'satisfaction_groups');
  assert.equal(metObjective.current, 85);
  assert.equal(metObjective.met, true);
});

test('all scenario benchmark strategies use observable checks rather than numeric policy recipes', () => {
  for (const scenarioId of ['sandbox', 'factory_crisis', 'tourism_dilemma', 'dorner_challenge']) {
    const benchmark = getScenarioBenchmark(scenarioId);
    for (const profile of [benchmark.conrad, benchmark.marcus]) {
      assert.match(profile.strategy, /баланс|износ|вместимость|занятость|долг/i);
      assert.doesNotMatch(profile.strategy, /\d+\s*(?:тыс|%|–|-|\+)/i);
    }
  }
});
