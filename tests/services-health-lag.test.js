import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, advance, setPolicies } from '../src/model.js';
import { getAdvisorDiagnosis, getPolicyWhatIf, servicesForecast } from '../src/causal.js';

test('servicesForecast correctly computes target service quality, job capacity and delayed convergence', () => {
  const game = createGame(); // population: 3700, serviceQuality: 63
  const need = 3700 * 0.0205; // 75.85

  // Case A: Adequate funding (68k)
  const normForecast = servicesForecast(68, game);
  assert.equal(normForecast.serviceNeed, 75.85);
  assert.equal(normForecast.curQuality, 63);
  assert.equal(normForecast.target, 82.55); // 18 + 72 * (68 / 75.85) = 18 + 64.548 = 82.55 -> clamped
  assert.equal(normForecast.halfLifeMonths, 5.9);
  assert.equal(normForecast.settlingMonths95, 25.7);
  assert.ok(normForecast.otherPositions > 0);

  // Case B: Severe austerity (20k)
  const cutForecast = servicesForecast(20, game);
  assert.ok(cutForecast.target < 40, `Target quality must collapse under 20k funding: got ${cutForecast.target}`);
  assert.ok(cutForecast.monthlyDelta < 0);
  assert.ok(cutForecast.jobDifference < -150, `Cutting services from 68 to 20 must reduce positions by ~209: got ${cutForecast.jobDifference}`);
});

test('servicesForecast exact fractional alignment matches model.js advance step exactly', () => {
  const game = createGame(); // policies.services: 68, serviceQuality: 63, population: 3700
  const forecast = servicesForecast(68, game);

  const nextGame = advance(game, 1);
  assert.equal(nextGame.serviceQuality, forecast.nextQualityExact);
});

test('getPolicyWhatIf for services explains target quality, municipal job impact and delayed erosion', () => {
  const game = createGame();

  // Test deep cut to 20k
  const cutPreview = getPolicyWhatIf('services', 20, game);
  assert.match(cutPreview.direct, /20 тыс\. марок/);
  assert.match(cutPreview.direct, /Целевое качество услуг/);
  assert.match(cutPreview.sideEffect, /лаг полураспада ~6\.0 мес|сокращение муниципальных рабочих мест/i);
  assert.match(cutPreview.risk, /пожилых людей|здоровь|отток населения/i);

  // Test adequate funding at 80k
  const adequatePreview = getPolicyWhatIf('services', 80, game);
  assert.match(adequatePreview.direct, /80 тыс\. марок/);
  assert.match(adequatePreview.sideEffect, /Поддерживает высокое качество услуг/);
});

test('social advisor warns early about hidden risk when services are severely slashed before health collapses', () => {
  const game = createGame();
  // Cut services to 15k, but keep health and quality initially at start (health: 64, quality: 63)
  game.policies.services = 15;

  const diag = getAdvisorDiagnosis('social', game);
  assert.equal(diag.status, 'warning');
  assert.match(diag.quote, /Секвестр общественных услуг|отложенную угрозу|лаг полураспада ~6\.0 мес/i);
  assert.match(diag.keyStat, /Услуги/i);
  assert.match(diag.recommendation, /общественн.*услуг/i);
});
