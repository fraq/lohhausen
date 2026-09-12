import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../src/model.js';
import { taxForecast, getPolicyWhatIf, getAdvisorDiagnosis } from '../src/causal.js';

test('taxForecast correctly computes disposable score, threshold excess, and non-linear penalty', () => {
  const game = createGame();
  
  // Base case: 16% (within 20% tolerance zone)
  const baseForecast = taxForecast(16, game);
  assert.equal(baseForecast.curTax, 16);
  assert.equal(baseForecast.taxRate, 16);
  assert.equal(baseForecast.disposableScore, 74.6);
  assert.equal(baseForecast.isAboveThreshold, false);
  assert.equal(baseForecast.thresholdExcess, 0);
  assert.equal(baseForecast.taxPenalty, 0);
  assert.equal(baseForecast.maxEmigrationRate, -15);
  assert.equal(baseForecast.maxImmigrationRate, 2);
  assert.equal(baseForecast.recoveryAsymmetryRatio, 7.5);
  assert.equal(baseForecast.warningLevel, 'normal');

  // Elevated case: 24% (exceeds 20% by 4 p.p.)
  const highForecast = taxForecast(24, game);
  assert.equal(highForecast.taxRate, 24);
  assert.equal(highForecast.disposableScore, 63.4);
  assert.equal(highForecast.disposableDelta, -11.2);
  assert.equal(highForecast.isAboveThreshold, true);
  assert.equal(highForecast.thresholdExcess, 4);
  assert.equal(highForecast.taxPenalty, 2.2); // 4 * 0.55
  assert.equal(highForecast.warningLevel, 'elevated');

  // Critical case: 28%
  const criticalForecast = taxForecast(28, game);
  assert.equal(criticalForecast.taxRate, 28);
  assert.equal(criticalForecast.thresholdExcess, 8);
  assert.equal(criticalForecast.taxPenalty, 4.4); // 8 * 0.55
  assert.equal(criticalForecast.warningLevel, 'critical');
});

test('getPolicyWhatIf for taxRate explains 20% threshold, disposable score and asymmetric migration risk', () => {
  const game = createGame();

  // Moderate tax (18%)
  const moderate = getPolicyWhatIf('taxRate', 18, game);
  assert.ok(moderate.direct.includes('налоговых поступлений'));
  assert.match(moderate.sideEffect, /порог 20% не превышен/i);
  assert.equal(moderate.risk, 'Умеренная фискальная нагрузка без превышения критического порога 20%.');

  // High tax exceeding 20% (25%)
  const high = getPolicyWhatIf('taxRate', 25, game);
  assert.ok(high.direct.includes('налоговых поступлений'));
  assert.match(high.sideEffect, /порог 20%/);
  assert.match(high.sideEffect, /штраф.*-2\.75/);
  assert.match(high.sideEffect, /до -15 чел\.\/мес\..*максимум притока \+2/);
  assert.match(high.risk, /Критический риск необратимой депопуляции/);

  // Aggregate patch format (game, patch)
  const agg = getPolicyWhatIf(game, { taxRate: 26 });
  assert.ok(agg.budgetDelta > 0);
  assert.ok(agg.forecastNotes.some(n => n.includes('порог 20%') && n.includes('-3.3')));
});

test('Weber financial advisor warns early about 20% threshold and demographic risk when taxRate is excessive', () => {
  const game = createGame();
  game.policies.taxRate = 24;
  game.debt = 0;
  game.treasury = 1500;
  game.lastBudget = { net: 30 };

  const diag = getAdvisorDiagnosis('finance', game);
  assert.equal(diag.status, 'warning');
  assert.match(diag.quote, /порог.*20%/i);
  assert.match(diag.quote, /-0\.55/);
  assert.match(diag.quote, /-15 чел\.\/мес\./);
  assert.match(diag.keyStat, /24%/);
  assert.match(diag.recommendation, /16–20%/);
});
