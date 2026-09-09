import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeDebrief, formatDebriefMarkdown, verifyHypotheses } from '../src/debrief.js';
import { advance, createGame, requestReport, startProject } from '../src/model.js';

test('tax reversal detection distinguishes gradual adjustment from a rapid change of direction', () => {
  const detect = (rates, months = [0, 1, 2]) => analyzeDebrief({ ...createGame(), month: 12,
    journal: rates.map((taxRate, index) => ({ type: 'policies', month: months[index], patch: { taxRate } }))
  }).traps.find(trap => trap.id === 'lag_ignorance');
  assert.equal(detect([10, 15, 20]).detected, false);
  assert.equal(detect([30, 25, 20]).detected, false);
  assert.equal(detect([10, 20, 10]).detected, true);
  assert.equal(detect([10, 20, 10], [0, 6, 12]).detected, false);
  assert.equal(detect([10, 12, 10]).detected, false);
});

test('empty game produces an insufficient-evidence debrief without personality claims', () => {
  const game = createGame();
  const analysis = analyzeDebrief(game);

  assert.equal(analysis.archetype.id, 'insufficient_evidence');
  assert.match(analysis.summary, /недостаточно данных/i);
  assert.doesNotMatch(JSON.stringify(analysis), /проявили терпение|системн(?:ый|ой) мыслитель|избежали.*ловуш/i);
});

test('ballistic project monitoring requires the matching report after completion', () => {
  let beforeOnly = createGame();
  beforeOnly = startProject(beforeOnly, 'housing', 'Проверю результат после ввода');
  beforeOnly = requestReport(beforeOnly, 'housing');
  beforeOnly = advance(beforeOnly, 12);

  const beforeTrap = analyzeDebrief(beforeOnly).traps.find((trap) => trap.id === 'ballistic_action');
  assert.equal(beforeTrap.detected, true);
  assert.equal(beforeTrap.evidence.unmonitoredInterventions, 1);

  let unrelated = requestReport(beforeOnly, 'factory');
  const unrelatedTrap = analyzeDebrief(unrelated).traps.find((trap) => trap.id === 'ballistic_action');
  assert.equal(unrelatedTrap.detected, true);

  const monitored = requestReport(beforeOnly, 'housing');
  const monitoredTrap = analyzeDebrief(monitored).traps.find((trap) => trap.id === 'ballistic_action');
  assert.equal(monitoredTrap.detected, false);
  assert.deepEqual(monitoredTrap.evidence.unmonitoredProjects, []);
});

test('verifyHypotheses reports completion-month observations rather than current values or proof', () => {
  const game = {
    month: 24,
    housingCapacity: 9999,
    housingShortage: 777,
    history: [
      { month: 12, housingCapacity: 3960, housingShortage: 14, population: 3940 },
      { month: 24, housingCapacity: 9999, housingShortage: 777, population: 9000 },
    ],
    journal: [{
      month: 0,
      type: 'project',
      title: 'Запущен проект',
      note: 'Жильё устранит дефицит',
      project: { type: 'housing', label: 'Муниципальное жильё', startMonth: 0, completeMonth: 12 },
    }],
  };

  const [reflection] = verifyHypotheses(game);
  assert.match(reflection.outcomeSummary, /3960/);
  assert.match(reflection.outcomeSummary, /14/);
  assert.doesNotMatch(reflection.outcomeSummary, /9999|777/);
  assert.match(reflection.hindsightLesson, /не доказывает/i);
  assert.equal(reflection.completionSnapshot.month, 12);
});

test('verifyHypotheses marks unavailable completion observations explicitly', () => {
  const game = {
    month: 8,
    history: [{ month: 8, population: 3700 }],
    journal: [{
      month: 2,
      type: 'project',
      title: 'Запущен проект',
      note: '',
      project: { type: 'tourism', label: 'Туризм', startMonth: 2, completeMonth: 8 },
    }],
  };

  const [reflection] = verifyHypotheses(game);
  assert.equal(reflection.evidenceStatus, 'unavailable');
  assert.match(reflection.outcomeSummary, /недоступны/i);
  assert.doesNotMatch(reflection.outcomeSummary, /успешно|\+80|окуп/i);
});

test('debrief exports paraphrased learning prompts without purported direct quotations', () => {
  const game = createGame();
  const analysis = analyzeDebrief(game);
  const markdown = formatDebriefMarkdown(game, analysis);

  assert.ok(analysis.traps.every((trap) => !('dornerQuote' in trap) && typeof trap.learningPrompt === 'string'));
  assert.doesNotMatch(markdown, /^> /m);
});
