import test from 'node:test';
import assert from 'node:assert/strict';

import { listProjectChoices, compareWithoutProject } from '../src/counterfactual.js';
import {
  advance,
  createGame,
  requestReport,
  setPolicies,
  startProject,
} from '../src/model.js';
import { createScenarioGame } from '../src/scenarios.js';

const projectIndex = (game, occurrence = 0) => game.journal
  .map((entry, journalIndex) => ({ entry, journalIndex }))
  .filter(({ entry }) => entry.type === 'project')[occurrence].journalIndex;
const availabilitySummary = (result) => ({
  status: result.status,
  reason: result.reason,
  hasActual: 'actual' in result,
  hasAlternative: 'alternative' in result,
});

test('AC-1: completed projects retain journal identity and literal notes', () => {
  let game = createGame();
  game = startProject(game, 'housing', 'Первая гипотеза <дословно>');
  game = startProject(game, 'housing', 'Вторая гипотеза & дословно');
  game = advance(game, 12);

  const choices = listProjectChoices(game);
  const indexes = [projectIndex(game, 0), projectIndex(game, 1)];

  assert.equal(choices.length, 2);
  assert.deepEqual(choices.map(({ journalIndex }) => journalIndex), indexes);
  assert.notEqual(choices[0].journalIndex, choices[1].journalIndex);
  assert.deepEqual(choices.map(({ type, startMonth, completeMonth, note }) => ({ type, startMonth, completeMonth, note })), [
    { type: 'housing', startMonth: 0, completeMonth: 12, note: 'Первая гипотеза <дословно>' },
    { type: 'housing', startMonth: 0, completeMonth: 12, note: 'Вторая гипотеза & дословно' },
  ]);
});

test('AC-2: same-month policy -> project -> policy replay preserves order and current post-action money', () => {
  let actual = createGame();
  actual = setPolicies(actual, { maintenance: 25 }, 'до проекта');
  actual = startProject(actual, 'housing', 'проверить жильё');
  const selectedIndex = projectIndex(actual);
  actual = setPolicies(actual, { maintenance: 41 }, 'после проекта');
  actual = advance(actual, 12);
  actual = startProject(actual, 'tourism', 'текущее действие после последнего снимка');

  let expectedWithout = createGame();
  expectedWithout = setPolicies(expectedWithout, { maintenance: 25 }, 'до проекта');
  expectedWithout = setPolicies(expectedWithout, { maintenance: 41 }, 'после проекта');
  expectedWithout = advance(expectedWithout, 12);
  expectedWithout = startProject(expectedWithout, 'tourism', 'текущее действие после последнего снимка');

  const result = compareWithoutProject(actual, selectedIndex);
  assert.equal(result.status, 'available');
  assert.equal(result.month, 12);
  assert.deepEqual(result.actual, actual);
  assert.deepEqual(result.alternative, expectedWithout);
  assert.notEqual(result.actual, actual);
  assert.notEqual(result.alternative, actual);
});

test('AC-3: selecting the second identical project removes only that journal entry', () => {
  let actual = createGame();
  actual = startProject(actual, 'housing', 'оставить первый');
  actual = startProject(actual, 'housing', 'убрать второй');
  const secondIndex = projectIndex(actual, 1);
  actual = advance(actual, 12);

  let expectedWithout = createGame();
  expectedWithout = startProject(expectedWithout, 'housing', 'оставить первый');
  expectedWithout = advance(expectedWithout, 12);

  const result = compareWithoutProject(actual, secondIndex);
  assert.equal(result.status, 'available');
  assert.equal(result.project.journalIndex, secondIndex);
  assert.deepEqual(result.alternative, expectedWithout);
  assert.equal(result.alternative.housingCapacity, 3960);
});

test('AC-4: a one-unit intermediate-history or current-state mismatch independently makes replay unverifiable', () => {
  const original = advance(startProject(createGame(), 'housing', 'исходная запись'), 12);
  const historyTampered = structuredClone(original);
  historyTampered.history[6].treasury += 1;
  assert.deepEqual(compareWithoutProject(historyTampered, projectIndex(historyTampered)), {
    status: 'unavailable',
    reason: 'unverifiable',
  });

  const currentTampered = structuredClone(original);
  currentTampered.treasury += 1;
  assert.deepEqual(compareWithoutProject(currentTampered, projectIndex(currentTampered)), {
    status: 'unavailable',
    reason: 'unverifiable',
  });
});

test('AC-4/ERR-1: missing required current or historical numeric fields are unverifiable', () => {
  const original = advance(startProject(createGame(), 'housing', 'полная запись'), 12);

  const missingCurrentTreasury = structuredClone(original);
  delete missingCurrentTreasury.treasury;
  const missingHistoricalProduction = structuredClone(original);
  delete missingHistoricalProduction.history[6].production;
  const actual = [missingCurrentTreasury, missingHistoricalProduction]
    .map((game) => availabilitySummary(compareWithoutProject(game, projectIndex(game))));
  assert.deepEqual(actual, Array.from({ length: 2 }, () => ({
    status: 'unavailable', reason: 'unverifiable', hasActual: false, hasAlternative: false,
  })));
});

test('AC-1/AC-4/ERR-1: tampered project facts are unverifiable and a false completion is never offered', () => {
  const original = advance(startProject(createGame(), 'housing', 'проверяемые сведения'), 12);
  const index = projectIndex(original);

  const tamperedResults = [
    (entry) => { entry.project.completeMonth += 1; },
    (entry) => { entry.project.startMonth += 1; },
    (entry) => { entry.project.cost += 1; },
  ].map((mutate) => {
    const tampered = structuredClone(original);
    mutate(tampered.journal[index]);
    return availabilitySummary(compareWithoutProject(tampered, index));
  });
  const falseCompletion = structuredClone(original);
  falseCompletion.journal[index].project.completeMonth = 1;
  assert.deepEqual({
    tamperedResults,
    falseChoices: listProjectChoices(falseCompletion),
    falseComparison: availabilitySummary(compareWithoutProject(falseCompletion, index)),
  }, {
    tamperedResults: Array.from({ length: 3 }, () => ({
      status: 'unavailable', reason: 'unverifiable', hasActual: false, hasAlternative: false,
    })),
    falseChoices: [],
    falseComparison: {
      status: 'unavailable', reason: 'unverifiable', hasActual: false, hasAlternative: false,
    },
  });
});

test('AC-5: removing a productive project reports the later unaffordable project as infeasible', () => {
  let game = startProject(createGame(), 'modernization', 'источник будущего дохода');
  const removedIndex = projectIndex(game);
  game = advance(game, 28);
  assert.ok(game.treasury >= 300, 'canonical actual trajectory can fund housing at month 28');
  game = startProject(game, 'housing', 'поздний обязательный проект');
  game = advance(game, 12);

  const result = compareWithoutProject(game, removedIndex);
  assert.deepEqual(result, {
    status: 'unavailable',
    reason: 'infeasible',
    month: 28,
    projectType: 'housing',
  });
  assert.equal('actual' in result, false);
  assert.equal('alternative' in result, false);
});

test('AC-6: APIs are pure and repeated comparisons are content-deterministic', () => {
  let game = createGame();
  game = setPolicies(game, { services: 80 }, 'политика дословно');
  game = startProject(game, 'housing', 'заметка дословно');
  game = advance(game, 12);
  const before = structuredClone(game);
  const index = projectIndex(game);

  const choices1 = listProjectChoices(game);
  const result1 = compareWithoutProject(game, index);
  const choices2 = listProjectChoices(game);
  const result2 = compareWithoutProject(game, index);

  assert.deepEqual(game, before);
  assert.deepEqual(choices2, choices1);
  assert.deepEqual(result2, result1);
  assert.deepEqual(game.journal, before.journal);
  assert.deepEqual(game.history, before.history);
  assert.deepEqual(game.policies, before.policies);
});

test('EC-1: no completed project is offered and an unfinished index is invalid', () => {
  assert.deepEqual(listProjectChoices(createGame()), []);
  const unfinished = advance(startProject(createGame(), 'housing', 'ещё строится'), 11);
  const index = projectIndex(unfinished);
  assert.deepEqual(listProjectChoices(unfinished), []);
  assert.deepEqual(compareWithoutProject(unfinished, index), {
    status: 'unavailable',
    reason: 'invalid_selection',
  });
});

test('EC-2: tourism_dilemma counterfactual stops at current month 12, not horizon 48', () => {
  let game = startProject(createScenarioGame('tourism_dilemma'), 'tourism', 'шесть месяцев');
  const index = projectIndex(game);
  game = advance(game, 12);

  const result = compareWithoutProject(game, index);
  assert.equal(result.status, 'available');
  assert.equal(result.month, 12);
  assert.equal(result.actual.month, 12);
  assert.equal(result.alternative.month, 12);
  assert.equal(result.actual.horizon, 48);
  assert.equal(result.alternative.horizon, 48);
});

test('EC-3: legacy history snapshots may omit optional extended metrics', () => {
  let game = advance(startProject(createGame(), 'housing', 'legacy'), 12);
  for (const snapshot of game.history) {
    for (const key of ['equipment', 'housingCapacity', 'tourismCapacity', 'visitors', 'serviceQuality']) delete snapshot[key];
  }

  const result = compareWithoutProject(game, projectIndex(game));
  assert.equal(result.status, 'available');
  assert.equal(result.month, 12);
});

test('EC-3: a missing history month makes replay unverifiable', () => {
  let game = advance(startProject(createGame(), 'housing', 'gap'), 12);
  game.history.splice(6, 1);
  assert.deepEqual(compareWithoutProject(game, projectIndex(game)), {
    status: 'unavailable',
    reason: 'unverifiable',
  });
});

test('API journal compatibility: policies/patch and known no-op entries replay in place', () => {
  let game = setPolicies(createGame(), { maintenance: 26 }, 'старый формат');
  game.journal.at(-1).type = 'policies';
  game.journal.at(-1).patch = game.journal.at(-1).changes;
  delete game.journal.at(-1).changes;
  game = startProject(game, 'housing', 'выбор');
  const index = projectIndex(game);
  game = requestReport(game, 'finance');
  game.journal.push({ month: game.month, type: 'note', title: 'Заметка', note: 'не меняет город' });
  game.journal.push({ month: game.month, type: 'reflection', title: 'Рефлексия', note: 'тоже не меняет город' });
  game = advance(game, 12);

  const result = compareWithoutProject(game, index);
  assert.equal(result.status, 'available');
  assert.equal(result.actual.policies.maintenance, 26);
  assert.equal(result.alternative.policies.maintenance, 26);
});

test('API journal compatibility: policy/patch and policies/changes are both accepted', () => {
  const results = [
    { type: 'policy', payloadKey: 'patch', note: 'policy с patch' },
    { type: 'policies', payloadKey: 'changes', note: 'policies с changes' },
  ].map(({ type, payloadKey, note }) => {
    let game = setPolicies(createGame(), { services: 77 }, note);
    const policyEntry = game.journal.at(-1);
    policyEntry.type = type;
    if (payloadKey === 'patch') {
      policyEntry.patch = policyEntry.changes;
      delete policyEntry.changes;
    }
    game = startProject(game, 'housing', 'выбранный проект');
    const index = projectIndex(game);
    game = advance(game, 12);

    const result = compareWithoutProject(game, index);
    return { combination: `${type}/${payloadKey}`, status: result.status,
      actualServices: result.actual?.policies.services,
      alternativeServices: result.alternative?.policies.services };
  });
  assert.deepEqual(results, [
    { combination: 'policy/patch', status: 'available', actualServices: 77, alternativeServices: 77 },
    { combination: 'policies/changes', status: 'available', actualServices: 77, alternativeServices: 77 },
  ]);
});

test('ERR-1: conflicting changes and patch payloads are unverifiable', () => {
  let game = setPolicies(createGame(), { maintenance: 25 }, 'неоднозначная политика');
  game.journal.at(-1).patch = { maintenance: 40 };
  game = startProject(game, 'housing', 'выбранный проект');
  const index = projectIndex(game);
  game = advance(game, 12);

  assert.deepEqual(availabilitySummary(compareWithoutProject(game, index)), {
    status: 'unavailable',
    reason: 'unverifiable',
    hasActual: false,
    hasAlternative: false,
  });
});

test('ERR-1: malformed inputs return unavailable reasons instead of throwing', () => {
  assert.doesNotThrow(() => compareWithoutProject(null, 0));
  assert.deepEqual(compareWithoutProject(null, 0), { status: 'unavailable', reason: 'unverifiable' });

  const unknownScenario = advance(startProject(createGame(), 'housing', 'unknown scenario'), 12);
  unknownScenario.scenarioId = 'nonexistent_scenario';
  assert.deepEqual(compareWithoutProject(unknownScenario, projectIndex(unknownScenario)), { status: 'unavailable', reason: 'unverifiable' });

  const nonexistentIndex = advance(startProject(createGame(), 'housing', 'valid'), 12);
  assert.deepEqual(compareWithoutProject(nonexistentIndex, 9999), { status: 'unavailable', reason: 'invalid_selection' });

  const unknownEntry = advance(startProject(createGame(), 'housing', 'valid'), 12);
  unknownEntry.journal.push({ month: 12, type: 'future_action', title: '???', note: '' });
  assert.deepEqual(compareWithoutProject(unknownEntry, projectIndex(unknownEntry)), { status: 'unavailable', reason: 'unverifiable' });

  const badChronology = advance(startProject(createGame(), 'housing', 'valid'), 12);
  badChronology.journal.push({ month: 5, type: 'note', title: 'назад во времени', note: '' });
  assert.deepEqual(compareWithoutProject(badChronology, projectIndex(badChronology)), { status: 'unavailable', reason: 'unverifiable' });
});

// AC-7 is intentionally excluded: root verifies browser behavior on /debrief
// for ru/en/de/fr at 390px and 1280px, including labels, stale-result clearing,
// literal hypotheses, missing-note display, equal-month deltas, and persistence.
