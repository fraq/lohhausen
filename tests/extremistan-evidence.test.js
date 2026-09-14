import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advance, setPolicies, startProject, serializeGame, deserializeGame } from '../src/model.js';
import { applyScenario } from '../src/scenarios.js';
import { listTalebOpportunities, resolveTalebOpportunity, getTalebEventSummary } from '../src/taleb-events.js';
import { computeAntifragilityMetrics, compareTalebPerformance, classifyTalebEvidence, replayTalebGame } from '../src/extremistan-analysis.js';

function scenario(schedule = []) {
  const game = applyScenario(createGame(), 'extremistan_challenge', 42);
  game.talebState.scheduledEvents = schedule.map((item, index) => ({ ...item, instanceId: `fixture-${index}` }));
  return game;
}

test('wealth, a positive windfall and noise alone never prove antifragility or survival', () => {
  const game = advance(scenario([{ month: 1, eventId: 'luxury_watch_boom' }, { month: 2, eventId: 'media_panic' }]), 15);
  const metrics = computeAntifragilityMetrics(game);
  assert.equal(metrics.classification, 'insufficient_evidence');
  assert.equal(metrics.completedNegativeShocks, 0);
  assert.equal(metrics.survivedNegativeShocks, 0);
  assert.equal(metrics.activatedEventsCount, 2);
  assert.equal(metrics.windfallEventsCount, 1);
  assert.equal(metrics.noiseEventsCount, 1);
});

test('negative shock completes after its last affected month, recovery window remains open', () => {
  const start = scenario([{ month: 2, eventId: 'credit_crunch' }]);
  const active = computeAntifragilityMetrics(advance(start, 8));
  assert.equal(active.completedNegativeShocks, 0);
  assert.equal(active.survivedNegativeShocks, 0);
  const end = computeAntifragilityMetrics(advance(start, 9));
  assert.equal(end.completedNegativeShocks, 1);
  assert.equal(end.survivedNegativeShocks, 1);
  assert.equal(end.classification, 'insufficient_evidence');
  assert.equal(end.observations[0].observationMonth, 15);
  assert.equal(computeAntifragilityMetrics(advance(start, 15)).classification, 'robust');
});

test('growth from modernization in both branches is not attributed to the shock', () => {
  let game = scenario([{ month: 3, eventId: 'credit_crunch' }]);
  game = advance(startProject(game, 'modernization'), 16);
  assert.ok(game.history[16].production > game.history[2].production);
  const result = computeAntifragilityMetrics(game);
  assert.equal(result.classification, 'robust');
  assert.equal(result.observations[0].delta, 0);
  assert.equal(result.observations[0].productionDelta, 0);
});

test('observation uses fixed monthly snapshot, independent of same-month decisions and later recovery', () => {
  let game = advance(scenario([{ month: 2, eventId: 'credit_crunch' }]), 15);
  const observation = computeAntifragilityMetrics(game).observations[0];
  assert.ok(game.treasury >= 220);
  game = startProject(game, 'tourism');
  assert.deepEqual(computeAntifragilityMetrics(game).observations[0], observation);
  game = advance(setPolicies(game, { maintenance: 80 }), 5);
  assert.deepEqual(computeAntifragilityMetrics(game).observations[0], observation);
});

test('survival checks the whole shock interval, not just the recovered final state', () => {
  const game = advance(scenario([{ month: 2, eventId: 'credit_crunch' }]), 15);
  game.history[4].treasury = 0;
  assert.equal(getTalebEventSummary(game).survivedNegativeShocks, 0);
  assert.equal(computeAntifragilityMetrics(game).classification, 'insufficient_evidence', 'factual replay rejects edited evidence');
  game.history.splice(4, 1);
  assert.equal(getTalebEventSummary(game).negativeShocks[0].survived, null);
  assert.equal(computeAntifragilityMetrics(game).classification, 'insufficient_evidence');
});

test('late terminal shock has no completed observation window and no positive verdict', () => {
  const result = computeAntifragilityMetrics(advance(scenario([{ month: 56, eventId: 'credit_crunch' }]), 60));
  assert.equal(result.classification, 'insufficient_evidence');
  assert.equal(result.observations[0].status, 'pending');
  assert.equal(result.survivedNegativeShocks, 0);
});

test('fixed score handles zeros and explicit evidence precedence', () => {
  const zero = { treasury: 0, debt: 0, production: 0, satisfaction: 0 };
  assert.equal(compareTalebPerformance(zero, zero).delta, 0);
  const positive = { status: 'available', survived: true, delta: 0.02 };
  assert.equal(classifyTalebEvidence([positive]), 'antifragile');
  assert.equal(classifyTalebEvidence([{ ...positive, delta: 0.01 }]), 'robust');
  assert.equal(classifyTalebEvidence([positive, { status: 'pending' }]), 'insufficient_evidence');
  assert.equal(classifyTalebEvidence([positive, { ...positive, delta: -0.02 }, { status: 'pending' }]), 'fragile');
  assert.equal(classifyTalebEvidence([positive, { status: 'unavailable' }]), 'insufficient_evidence');
  assert.equal(classifyTalebEvidence([{ ...positive, survived: false }]), 'fragile');
});

test('asset activation costs nothing; buy/decline/expiry are explicit and immutable', () => {
  const start = scenario([{ month: 1, eventId: 'distressed_asset_sale' }]);
  const offered = advance(start);
  const control = advance(scenario());
  assert.equal(offered.treasury, control.treasury);
  assert.equal(offered.equipment, control.equipment);
  assert.equal(getTalebEventSummary(offered).capitalizedOpportunities, 0);
  const [offer] = listTalebOpportunities(offered);
  assert.equal(offer.expiresMonth, 3);
  const before = serializeGame(offered);
  const bought = resolveTalebOpportunity(offered, offer.instanceId, 'buy');
  assert.equal(serializeGame(offered), before);
  assert.equal(bought.treasury, Number((offered.treasury - 200).toFixed(6)));
  assert.equal(bought.equipment, offered.equipment + 18);
  assert.equal(getTalebEventSummary(bought).capitalizedOpportunities, 1);
  assert.throws(() => resolveTalebOpportunity(bought, offer.instanceId, 'buy'));
  const declined = resolveTalebOpportunity(offered, offer.instanceId, 'decline');
  assert.equal(declined.treasury, offered.treasury);
  assert.equal(listTalebOpportunities(declined).length, 0);
  assert.equal(listTalebOpportunities(advance(offered, 3)).length, 0);
  assert.equal(advance(offered, 3).talebState.history[0].outcome, 'expired');
  const poor = { ...offered, treasury: 799 };
  assert.throws(() => resolveTalebOpportunity(poor, offer.instanceId, 'buy'));
  assert.equal(listTalebOpportunities(poor).length, 1);
  for (const game of [offered, bought, declined, advance(offered, 3)]) {
    assert.deepEqual(deserializeGame(serializeGame(game)), game);
    assert.deepEqual(advance(deserializeGame(serializeGame(game)), 3), advance(game, 3));
  }
});

test('explicit asset decision is replayed in factual and shock-free worlds', () => {
  let game = advance(scenario([{ month: 1, eventId: 'distressed_asset_sale' }, { month: 3, eventId: 'credit_crunch' }]));
  game = resolveTalebOpportunity(game, listTalebOpportunities(game)[0].instanceId, 'buy');
  game = advance(game, 15);
  assert.equal(computeAntifragilityMetrics(game).evidenceStatus, 'available');
  assert.deepEqual(replayTalebGame(game).history, game.history);
  const damaged = structuredClone(game);
  damaged.journal = damaged.journal.filter(entry => entry.type !== 'taleb_choice');
  assert.equal(computeAntifragilityMetrics(damaged).evidenceStatus, 'unverifiable');
});

test('unknown actions, modified initial state, invalid choices and impossible replay fail closed', () => {
  const base = advance(scenario([{ month: 2, eventId: 'credit_crunch' }]), 15);
  for (const change of [
    game => { game.history[0].treasury += 1; },
    game => { game.journal.push({ month: 15, type: 'unimplemented-action', title: '', note: '' }); },
    game => { game.journal.push({ month: 15, type: 'policy', title: '', note: '' }); },
  ]) {
    const game = structuredClone(base); change(game);
    assert.equal(computeAntifragilityMetrics(game).evidenceStatus, 'unverifiable');
  }
  const game = structuredClone(base);
  game.journal.push({ month: 15, type: 'taleb_choice', instanceId: 'missing', choice: 'buy', title: '', note: '' });
  assert.throws(() => replayTalebGame(game));
});

test('malformed new offer fields and missing scenario state are rejected; legacy schedules still load', () => {
  const base = advance(scenario([{ month: 1, eventId: 'distressed_asset_sale' }]));
  for (const mutate of [
    game => { game.talebState.history[0].expiresMonth = null; },
    game => { game.talebState.history[0].choice = 'buy'; },
    game => { game.talebState.scheduledEvents[0].eventId = 'toString'; },
    game => { game.talebState.history[0].instanceId = 'missing'; },
    game => { delete game.talebState; },
    game => { delete game.seed; },
  ]) {
    const damaged = structuredClone(base); mutate(damaged);
    assert.ok(deserializeGame(serializeGame(damaged)) instanceof Error);
  }
  const legacy = applyScenario(createGame(), 'extremistan_challenge', 42);
  legacy.talebState.scheduledEvents.forEach(item => delete item.instanceId);
  assert.deepEqual(deserializeGame(serializeGame(legacy)), legacy);
  assert.ok(!(deserializeGame(serializeGame(advance(legacy, 25))) instanceof Error));
});
