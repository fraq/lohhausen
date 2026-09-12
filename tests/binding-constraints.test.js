import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame } from '../src/model.js';
import { evaluateProjectConstraint, getProjectAdvisorEndorsement } from '../src/causal.js';

test('evaluateProjectConstraint correctly identifies slack housing reserve at standard game start', () => {
  const game = createGame();
  // Standard start: pop = 3700, cap = 3900 -> surplus = 200, treasury = 1200
  const audit = evaluateProjectConstraint('housing', game);

  assert.equal(audit.key, 'housing');
  assert.equal(audit.cost, 300);
  assert.equal(audit.duration, 12);
  assert.equal(audit.surplus, 200);
  assert.equal(audit.maxImmigrationRate, 2);
  assert.equal(audit.bufferMonths, 100); // 200 / 2 = 100 months
  assert.equal(audit.status, 'slack');
  assert.equal(audit.marginalPayoffImmediate, false);
  assert.equal(audit.liquidityRisk, 'safe'); // 1200 - 300 = 900 >= 600
  assert.match(audit.summary, /избыточный/i);

  // When treasury is down to 800 (post-project = 500 < 600)
  game.treasury = 800;
  const auditTight = evaluateProjectConstraint('housing', game);
  assert.equal(auditTight.liquidityRisk, 'moderate_drain');
});

test('evaluateProjectConstraint detects binding constraint when housing is depleted', () => {
  const game = createGame();
  game.population = 3920;
  game.housingCapacity = 3900;
  game.housingShortage = 20;

  const audit = evaluateProjectConstraint('housing', game);
  assert.equal(audit.status, 'binding');
  assert.equal(audit.surplus, -20);
  assert.equal(audit.bufferMonths, 0);
  assert.equal(audit.marginalPayoffImmediate, true);
  assert.match(audit.recommendation, /Срочно/i);
});

test('evaluateProjectConstraint evaluates tourism capacity bottleneck vs advertising drain', () => {
  const game = createGame();
  game.tourismCapacity = 20;
  game.policies.tourismMarketing = 15;
  game.tourismDemand = 90;

  const audit = evaluateProjectConstraint('tourism', game);
  assert.equal(audit.key, 'tourism');
  assert.equal(audit.cost, 220);
  assert.equal(audit.status, 'binding');
  assert.equal(audit.marginalPayoffImmediate, true);
  assert.match(audit.bottleneckNote, /узкое горлышко/i);

  // When hotel capacity is already 100
  game.tourismCapacity = 100;
  game.tourismDemand = 40;
  const auditSlack = evaluateProjectConstraint('tourism', game);
  assert.equal(auditSlack.status, 'slack');
  assert.equal(auditSlack.marginalPayoffImmediate, false);
});

test('evaluateProjectConstraint detects factory equipment wear as primary constraint', () => {
  const game = createGame();
  game.equipment = 35; // heavily worn

  const audit = evaluateProjectConstraint('modernization', game);
  assert.equal(audit.key, 'modernization');
  assert.equal(audit.cost, 460);
  assert.equal(audit.status, 'binding');
  assert.equal(audit.marginalPayoffImmediate, true);
  assert.match(audit.summary, /износ станков/i);

  // When equipment is already 85% and treasury is tight
  game.equipment = 85;
  game.treasury = 500;
  const auditSlack = evaluateProjectConstraint('modernization', game);
  assert.equal(auditSlack.status, 'slack');
  assert.equal(auditSlack.liquidityRisk, 'severe_drain'); // 500 - 460 = 40 < 200
});

test('getProjectAdvisorEndorsement integrates constraint audit without regression', () => {
  const game = createGame();

  // Housing endorsement at start of game
  const housingEndorsement = getProjectAdvisorEndorsement('housing', game);
  assert.equal(housingEndorsement.advisor.id, 'bauer');
  assert.equal(housingEndorsement.duration, 12);
  assert.ok(housingEndorsement.advice.length > 10);
  assert.ok(housingEndorsement.constraintAudit);
  assert.equal(housingEndorsement.constraintAudit.status, 'slack');
  assert.match(housingEndorsement.advice, /резерв/i);

  // Modernization endorsement
  const modEndorsement = getProjectAdvisorEndorsement('modernization', game);
  assert.equal(modEndorsement.advisor.id, 'krause');
  assert.equal(modEndorsement.duration, 9);
  assert.ok(modEndorsement.advice.length > 10);
  assert.ok(modEndorsement.constraintAudit);

  // Tourism endorsement
  const tourEndorsement = getProjectAdvisorEndorsement('tourism', game);
  assert.equal(tourEndorsement.advisor.id, 'lindemann');
  assert.equal(tourEndorsement.duration, 6);
  assert.ok(tourEndorsement.advice.length > 10);
  assert.ok(tourEndorsement.constraintAudit);
});
