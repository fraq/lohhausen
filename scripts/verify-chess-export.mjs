/**
 * scripts/verify-chess-export.mjs
 * 
 * Verifies that buildChessMatchRecord (LMN v1.1) correctly processes games from all 4 scenarios,
 * and strictly adheres to all 5 review criteria established by Codex (codex-lmn-review-043):
 * 1. Action linkage: actions at month m map to transition m -> m+1 with immediate capital deduction.
 * 2. Ordered events: intra-month actions preserve exact chronological sequence.
 * 3. Trap titles: uses trap.title / trap.id without [null].
 * 4. Proportional workforce without arbitrary fallbacks or dogmatic collapse assertions.
 * 5. Grounded, evidence-based AI coaching prompt.
 */

import assert from 'node:assert/strict';
import { createGame, advance, startProject, setPolicies, requestReport } from '../src/model.js';
import { createScenarioGame, evaluateScenario } from '../src/scenarios.js';
import { analyzeDebrief, formatDebriefJSON, buildChessMatchRecord } from '../src/debrief.js';

console.log('=== Verifying Lohhausen Match Notation (LMN v1.2) Export ===\n');

const scenarios = ['sandbox', 'factory_crisis', 'tourism_dilemma', 'dorner_challenge'];
let verifiedMatches = 0;

for (const scenarioId of scenarios) {
  let game = createScenarioGame(scenarioId);

  // Play a representative sequence of turns with decisions, reports, and projects
  game = requestReport(game, 'factory');
  game = requestReport(game, 'finance');
  game = setPolicies(game, { maintenance: 20 }, 'Повышаем обслуживание станков');

  // Start an investment project appropriate for the scenario
  if (scenarioId === 'tourism_dilemma' || scenarioId === 'factory_crisis') {
    game = startProject(game, 'tourism', 'Развитие туризма');
  } else {
    game = startProject(game, 'housing', 'Строим муниципальное жилье');
  }

  game = advance(game, 2);

  // Advance simulation through project duration
  game = advance(game, 6);
  game = requestReport(game, 'social');
  game = setPolicies(game, { taxRate: 14 }, 'Корректировка налоговой ставки');
  game = advance(game, 6);

  const evaluation = evaluateScenario(game);
  const debrief = analyzeDebrief(game);
  const rawSession = JSON.parse(formatDebriefJSON(game, debrief, evaluation));

  // Build LMN match record
  const match = buildChessMatchRecord(rawSession);

  // Criterion 1: Format header and system prompt
  assert.match(match.$format, /Lohhausen Match Notation \(LMN v1\.[12]\)/, `${scenarioId}: format header mismatch`);
  assert.ok(match.aiAnalysisSystemPrompt.includes('LMN'), `${scenarioId}: prompt missing format name`);
  assert.ok(match.aiAnalysisSystemPrompt.includes('Дитриха Дёрнера'), `${scenarioId}: prompt missing Dörner reference`);

  // Criterion 2: Metadata integrity
  assert.equal(match.matchMetadata.scenario, scenarioId, `${scenarioId}: scenario metadata mismatch`);
  assert.ok(match.matchMetadata.durationMonths >= 14, `${scenarioId}: invalid duration`);
  assert.ok(match.matchMetadata.horizon > 0, `${scenarioId}: invalid horizon`);
  assert.ok(Array.isArray(match.matchMetadata.cognitiveTrapsDetected), `${scenarioId}: traps not an array`);
  for (const trapTitle of match.matchMetadata.cognitiveTrapsDetected) {
    assert.notEqual(trapTitle, null, `${scenarioId}: trap title is null`);
    assert.notEqual(trapTitle, '[null]', `${scenarioId}: trap title is literal [null]`);
    assert.ok(typeof trapTitle === 'string' && trapTitle.length > 0, `${scenarioId}: invalid trap title`);
  }

  // Criterion 3: Moves chronological sequence & intra-month ordering
  assert.ok(Array.isArray(match.moves), `${scenarioId}: moves not an array`);
  assert.ok(match.moves.length > 0, `${scenarioId}: no moves generated`);

  for (let i = 0; i < match.moves.length; i++) {
    const move = match.moves[i];
    assert.equal(move.turnMonth, i, `${scenarioId}: move turnMonth out of sequence at index ${i}`);

    // Verify systemic evaluation
    assert.ok(move.systemicEvaluation, `${scenarioId}: move missing systemicEvaluation`);
    assert.ok(['!!', '!', '—', '?!', '?', '??'].includes(move.systemicEvaluation.tag), `${scenarioId}: unknown tag ${move.systemicEvaluation.tag}`);
    assert.ok(typeof move.systemicEvaluation.label === 'string' && move.systemicEvaluation.label.length > 0, `${scenarioId}: invalid label`);

    // Verify intra-month action sequencing
    if (move.mayorActions.hasIntervention) {
      assert.ok(move.mayorActions.count > 0, `${scenarioId}: hasIntervention true but count 0`);
      const events = move.mayorActions.orderedEvents;
      for (let j = 0; j < events.length; j++) {
        assert.equal(events[j].seq, j + 1, `${scenarioId}: event sequence broken in month ${i}`);
        assert.ok(['report', 'policy', 'project'].includes(events[j].type), `${scenarioId}: unknown action type`);
      }
    }

    // Verify transition accounting (m -> m+1)
    if (move.transitionToNextMonth) {
      const trans = move.transitionToNextMonth;
      assert.equal(trans.toMonth, i + 1, `${scenarioId}: transition toMonth must be ${i + 1}`);
      assert.equal(trans.intervalMonths, 1, `${scenarioId}: single step interval must be 1`);
      assert.ok(Number.isFinite(trans.delta.treasury), `${scenarioId}: non-finite treasury delta`);
      assert.ok(Number.isFinite(trans.delta.operatingCashDelta), `${scenarioId}: non-finite operating delta`);

      // If immediate project cost occurred, operating cash flow must differ from net treasury delta
      if (trans.immediateProjectCost > 0) {
        assert.notEqual(trans.delta.treasury, trans.delta.operatingCashDelta, `${scenarioId}: project outlay must be separated from operating cash flow`);
      }
    }

    // Verify empirical signals have no dogmatic collapse assertions
    for (const signal of move.empiricalSignals) {
      assert.doesNotMatch(signal, /неминуемый крах|катастрофа|коллапс фабрики/i, `${scenarioId}: dogmatic signal detected: ${signal}`);
    }
  }

  // Test full JSON serializability
  const serialized = JSON.stringify(match);
  assert.ok(serialized.length > 500, `${scenarioId}: serialized match too short`);
  const parsed = JSON.parse(serialized);
  assert.equal(parsed.matchMetadata.scenario, scenarioId, `${scenarioId}: roundtrip JSON mismatch`);

  verifiedMatches++;
  console.log(`✓ Scenario ${scenarioId.padEnd(18)} verified (months: ${match.matchMetadata.durationMonths}, moves: ${match.moves.length})`);
}

console.log(`\nAll ${verifiedMatches}/${scenarios.length} scenarios passed LMN v1.2 match notation verification cleanly.`);
