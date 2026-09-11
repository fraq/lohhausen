import test from 'node:test';
import assert from 'node:assert/strict';

import { explainStepCauses } from '../src/causal.js';
import {
  advance,
  createGame,
  setPolicies,
  startProject,
} from '../src/model.js';

const factoryExplanation = (current, previous) => {
  const item = explainStepCauses(current, previous).find(({ sphere }) => sphere === 'factory');
  assert.ok(item, 'factory cause must be present');
  assert.equal(typeof item.explanation, 'string');
  return item.explanation;
};

test('missing legacy equipment observations do not imply a stable interval', () => {
  const current = advance(createGame(), 1);
  const previous = structuredClone(current.history[0]);
  delete previous.equipment;
  const explanation = factoryExplanation(current, previous);
  assert.match(explanation, /неизвестно/);
  assert.doesNotMatch(explanation, /стабильн|менее чем|компенсирует|NaN/);
});

test('modernization completion is attributed in month 9 only', () => {
  const started = startProject(createGame(), 'modernization', 'completion boundary');
  const month9 = advance(started, 9);
  const month10 = advance(month9, 1);

  const atCompletion = factoryExplanation(month9, month9.history[8]);
  const afterCompletion = factoryExplanation(month10, month10.history[9]);

  assert.match(atCompletion, /модернизац/i);
  assert.doesNotMatch(afterCompletion, /модернизац/i);
});

test('a real modernization completion remains visible when equipment endpoints are both capped at 100', () => {
  let prepared = setPolicies(createGame(), {
    maintenance: 80,
    services: 0,
    education: 0,
    tourismMarketing: 0,
    taxRate: 35,
    wage: 70,
    marketing: 80,
  }, 'prepare naturally saturated equipment');
  prepared = advance(prepared, 12);
  const started = startProject(prepared, 'modernization', 'saturated equipment');
  const previous = advance(started, 8);
  const current = advance(previous, 1);
  assert.equal(previous.equipment, 100);
  assert.equal(current.equipment, 100);

  const explanation = factoryExplanation(current, previous);

  assert.match(explanation, /модернизац/i);
});

test('maintenance 18 after a high-production month is not called reliable wear protection', () => {
  const previous = setPolicies(createGame(), { maintenance: 18 }, 'borderline maintenance');
  assert.ok(previous.production > 800, 'canonical previous production is high');
  const current = advance(previous, 1);

  const explanation = factoryExplanation(current, previous);

  assert.doesNotMatch(explanation, /над[её]жн\w*\s+защит|reliable\s+protection/i);
  assert.match(explanation, /износ|wear|потерял/i);
});

test('a three-month completion interval reports its length and actual observed equipment delta', () => {
  const started = startProject(createGame(), 'modernization', 'inside interval');
  const previous = advance(started, 8);
  const current = advance(previous, 3);
  const observedDelta = current.equipment - previous.equipment;
  assert.notEqual(Number(observedDelta.toFixed(1)), 12, 'canonical observed delta differs from project contribution');

  const explanation = factoryExplanation(current, previous);
  const statedRecovery = explanation.match(/восстановились на\s+([0-9]+(?:[.,][0-9]+)?)/i);

  assert.match(explanation, /3\s*мес|3\s*months?/i);
  assert.ok(statedRecovery, 'observed equipment recovery must be stated');
  const statedDelta = Number(statedRecovery[1].replace(',', '.'));
  assert.ok(Math.abs(statedDelta - observedDelta) <= 0.05,
    `stated recovery ${statedDelta} must match observed delta ${observedDelta}`);
  assert.ok(Math.abs(statedDelta - 12) > 0.05, 'project contribution must not be presented as the observed delta');
  assert.match(explanation, /модернизац|moderniz/i);
});
