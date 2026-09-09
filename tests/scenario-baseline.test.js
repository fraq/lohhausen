import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, requestReport } from '../src/model.js';
import { createScenarioGame } from '../src/scenarios.js';

test('scenario reports compare month 1 with the actual scenario starting state', () => {
  for (const id of ['sandbox', 'factory_crisis', 'tourism_dilemma', 'dorner_challenge']) {
    const initial = createScenarioGame(id);
    const monthOne = advance(initial, 1);
    for (const kind of ['finance', 'factory', 'housing', 'social', 'tourism']) {
      const expected = requestReport(initial, kind).reports[kind].data;
      const actual = requestReport(monthOne, kind).reports[kind].comparison;
      assert.equal(actual.month, 0);
      assert.deepEqual(actual.data, expected, `${id}: ${kind}`);
    }
    assert.equal(initial.journal.some(entry => entry.type === 'report'), false);
  }
});
