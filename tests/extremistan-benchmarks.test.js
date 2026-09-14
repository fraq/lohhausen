import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, setPolicies, startProject, serializeGame, deserializeGame } from '../src/model.js';
import { createScenarioGame, evaluateScenario, getScenario, getScenarioBenchmark, getScenariosList } from '../src/scenarios.js';
import { resolveTalebOpportunity, TALEB_EVENTS } from '../src/taleb-events.js';

function replayBenchmark(profile, saveAt = null) {
  let game = createScenarioGame(profile.scenarioId, profile.seed);
  game.talebState.scheduledEvents = structuredClone(profile.scheduledEvents);
  while (game.month < game.horizon) {
    for (const entry of profile.actionJournal.filter((item) => item.month === game.month)) {
      if (entry.type === 'policy') game = setPolicies(game, entry.changes, entry.note);
      else if (entry.type === 'project') game = startProject(game, entry.project.type, entry.note);
      else if (entry.type === 'taleb_choice') game = resolveTalebOpportunity(game, entry.instanceId, entry.choice);
      else assert.fail(`Unexpected benchmark action: ${entry.type}`);
    }
    game = advance(game, 1);
    if (game.month === saveAt) game = deserializeGame(serializeGame(game));
  }
  return game;
}

test('Extremistan is an explicit five-event stress deck and canonical scenario list stays at four', () => {
  assert.equal(getScenariosList().length, 4);
  assert.equal(getScenariosList({ all: true }).length, 5);
  const scenario = getScenario('extremistan_challenge');
  assert.match(scenario.subtitle, /Пять событий/);
  assert.doesNotMatch(`${scenario.briefing} ${scenario.subtitle}`, /статистическ|толстых хвост|Парето|стратеги[яи] штанги/i);
  for (const seed of [0, 1, 42, 19870505, 4294967295]) {
    const game = createScenarioGame(scenario.id, seed);
    const byType = (type) => game.talebState.scheduledEvents.filter((item) => TALEB_EVENTS[item.eventId].type === type);
    assert.equal(game.talebState.scheduledEvents.length, 5);
    assert.equal(new Set(byType('negative_swan').map((item) => item.eventId)).size, 2);
    assert.equal(new Set(byType('positive_swan').map((item) => item.eventId)).size, 2);
    assert.equal(byType('noise').length, 1);
  }
});

test('scenario creation propagates supplied seeds with deterministic uint32 normalization', () => {
  assert.equal(createScenarioGame('extremistan_challenge', 0).seed, 0);
  assert.equal(createScenarioGame('extremistan_challenge', -1).seed, 4294967295);
  assert.deepEqual(createScenarioGame('extremistan_challenge', -1), createScenarioGame('extremistan_challenge', 4294967295));
  assert.deepEqual(createScenarioGame('extremistan_challenge'), createScenarioGame('extremistan_challenge', 19870505));
  assert.deepEqual(createScenarioGame('sandbox', 0), createScenarioGame('sandbox', 42));
  assert.notDeepEqual(createScenarioGame('extremistan_challenge', 1).talebState.scheduledEvents, createScenarioGame('extremistan_challenge', 42).talebState.scheduledEvents);
});

test('Extremistan requires one survived negative shock even when all four city targets are met', () => {
  const game = createScenarioGame('extremistan_challenge', 42);
  let evaluation = evaluateScenario(game);
  assert.equal(evaluation.totalCount, 5);
  assert.equal(evaluation.metCount, 4);
  assert.deepEqual(evaluation.objectives.find((item) => item.id === 'survived_negative'), {
    id: 'survived_negative', label: 'Пережить хотя бы один завершенный отрицательный шок', target: 1, current: 0, met: false, isMet: false,
  });
  game.month = game.horizon;
  evaluation = evaluateScenario(game);
  assert.equal(evaluation.status, 'defeat');
});

test('the survived-shock target can complete only after the inclusive last affected month', () => {
  let game = createScenarioGame('extremistan_challenge', 42);
  game.treasury = 100000;
  game.history[0].treasury = game.treasury;
  game.talebState.scheduledEvents = [{ month: 1, eventId: 'credit_crunch' }];
  game = advance(game, 7);
  assert.equal(evaluateScenario(game).objectives.find((item) => item.id === 'survived_negative').current, 0);
  game = advance(game, 1);
  assert.equal(evaluateScenario(game).objectives.find((item) => item.id === 'survived_negative').current, 1);
  Object.assign(game, { month: game.horizon, treasury: 900, debt: 0, satisfaction: 80, population: 3400 });
  assert.equal(evaluateScenario(game).status, 'victory');
});

for (const seed of [42, 19870505]) {
  test(`Extremistan benchmark recipes replay exactly through save/load for seed ${seed}`, () => {
    const benchmarks = getScenarioBenchmark('extremistan_challenge', seed);
    for (const profile of Object.values(benchmarks)) {
      assert.equal(profile.seed, seed);
      assert.equal(profile.history.length, 61);
      assert.equal(profile.finalState.month, 60);
      assert.deepEqual(profile.scheduledEvents, createScenarioGame(profile.scenarioId, seed).talebState.scheduledEvents);
      assert.deepEqual(replayBenchmark(profile, 30), profile.finalState);
      assert.deepEqual(profile.history, profile.finalState.history);
      assert.deepEqual(deserializeGame(serializeGame(profile.finalState)), profile.finalState);
      for (const metric of ['equipment', 'satisfaction', 'debt', 'treasury', 'population']) {
        assert.deepEqual(profile[`${metric}Trajectory`], profile.history.map((snapshot) => snapshot[metric]));
      }
      assert.equal(profile.finalEquipment, profile.finalState.equipment);
      assert.equal(profile.finalDebt, profile.finalState.debt);
      assert.deepEqual(profile.evaluation, evaluateScenario(profile.finalState));
      assert.ok(profile.actionJournal.length > 0);
      assert.ok(profile.recipe.policySteps.length > 0);
      assert.equal(profile.decisionLog.filter((item) => item.applied).length, profile.actionJournal.length);
      assert.ok(profile.decisionLog.some((item) => item.type === 'project' && !item.applied));
      assert.doesNotMatch(`${profile.name} ${profile.description} ${profile.strategy} ${profile.verdict}`, /эталон|штанг|Антихрупкость|с легкостью|неуправляемую долговую/i);
    }
    assert.deepEqual(benchmarks, getScenarioBenchmark('extremistan_challenge', seed));
  });
}

test('benchmark output changes with the seed and records feasible and rejected project choices', () => {
  const first = getScenarioBenchmark('extremistan_challenge', 1);
  const other = getScenarioBenchmark('extremistan_challenge', 42);
  assert.notDeepEqual(first.conrad.history, other.conrad.history);
  assert.deepEqual(getScenarioBenchmark('extremistan_challenge', -1), getScenarioBenchmark('extremistan_challenge', 4294967295));
  const rejected = first.marcus.decisionLog.find((item) => item.type === 'project' && item.month === 0 && item.projectType === 'modernization');
  assert.equal(rejected.feasible, false);
  assert.equal(rejected.applied, false);
  assert.equal(rejected.reason, 'insufficient_treasury');
  assert.equal(rejected.treasuryBefore, 380);
  assert.ok(first.marcus.decisionLog.some((item) => item.type === 'project' && item.feasible && item.applied));
  const reserved = first.conrad.decisionLog.find((item) => item.type === 'project' && item.month === 0);
  assert.equal(reserved.feasible, true);
  assert.equal(reserved.applied, false);
  assert.equal(reserved.reason, 'reserve_floor');
});
