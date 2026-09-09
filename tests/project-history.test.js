import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, startProject, advance, serializeGame, deserializeGame } from '../src/model.js';
import { verifyHypotheses } from '../src/debrief.js';

test('completed housing and tourism observations survive later changes and reload', () => {
  for (const [type, deadline] of [['housing', 12], ['tourism', 6]]) {
    const completed = advance(startProject(createGame(), type, 'Мой исходный прогноз'), deadline);
    const original = verifyHypotheses(completed)[0];
    assert.equal(original.evidenceStatus, 'observed', `${type}: completion snapshot should be available`);
    const later = deserializeGame(serializeGame(advance(completed, 12)));
    assert.ok(!(later instanceof Error));
    assert.equal(verifyHypotheses(later)[0].outcomeSummary, original.outcomeSummary);
    assert.equal(verifyHypotheses(later)[0].playerNote, 'Мой исходный прогноз');
  }
});
