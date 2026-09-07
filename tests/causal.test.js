import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, advance, startProject } from '../src/model.js';
import {
  ADVISORS,
  CAUSAL_LOOPS,
  getAdvisorDiagnosis,
  explainStepCauses,
  detectCognitiveTraps,
  getPolicyWhatIf,
} from '../src/causal.js';

test('causal: все 5 советников определены и имеют валидные метаданные', () => {
  const advisorKeys = Object.keys(ADVISORS);
  assert.equal(advisorKeys.length, 5);
  assert.ok(ADVISORS.factory);
  assert.ok(ADVISORS.finance);
  assert.ok(ADVISORS.housing);
  assert.ok(ADVISORS.social);
  assert.ok(ADVISORS.tourism);

  for (const [key, adv] of Object.entries(ADVISORS)) {
    assert.ok(adv.name);
    assert.ok(adv.role);
    assert.ok(adv.title);
    assert.ok(adv.icon);
    assert.ok(adv.color);
  }
});

test('causal: getAdvisorDiagnosis возвращает содержательную оценку для каждого советника', () => {
  const game = createGame();
  for (const sphereId of Object.keys(ADVISORS)) {
    const diag = getAdvisorDiagnosis(sphereId, game);
    assert.ok(diag);
    assert.ok(diag.quote);
    assert.ok(diag.recommendation);
    assert.ok(diag.keyStat);
    assert.ok(['good', 'normal', 'warning', 'crisis'].includes(diag.status));
  }
});

test('causal: CAUSAL_LOOPS содержит ключевые системные контуры Дёрнера', () => {
  assert.ok(CAUSAL_LOOPS.length >= 3);
  const taxLoop = CAUSAL_LOOPS.find(l => l.id === 'tax_loop');
  const housingLoop = CAUSAL_LOOPS.find(l => l.id === 'housing_lag_loop');
  const debtSpiral = CAUSAL_LOOPS.find(l => l.id === 'debt_spiral');

  assert.ok(taxLoop);
  assert.ok(housingLoop);
  assert.ok(debtSpiral);

  for (const loop of CAUSAL_LOOPS) {
    assert.ok(loop.title);
    assert.ok(Array.isArray(loop.nodes) && loop.nodes.length >= 3);
    assert.ok(loop.summary);
    assert.ok(loop.explain);
    assert.ok(loop.dornerReference);
  }
});

test('causal: explainStepCauses отражает ввод инвестиционного проекта и исходную гипотезу игрока', () => {
  let prev = createGame();
  prev = startProject(prev, 'housing', 'Снизить нехватку жилья к концу года');
  
  // Advance 12 months so the project finishes
  const curr = advance(prev, 12);

  const causes = explainStepCauses(curr, prev);
  assert.ok(Array.isArray(causes));
  
  const projectCause = causes.find(c => c.sphere === 'project');
  assert.ok(projectCause, 'Дайджест должен содержать блок завершения проекта');
  assert.ok(projectCause.headline.includes('Строительство жилья') || projectCause.headline.includes('Завершен'));
  assert.ok(projectCause.explanation.includes('Снизить нехватку жилья к концу года'), 'Должен отражать исходную гипотезу');
});

test('causal: getPolicyWhatIf рассчитывает ожидаемый эффект изменения регуляторов', () => {
  const game = createGame();
  const whatIf = getPolicyWhatIf('taxRate', 25, game);

  assert.ok(whatIf);
  assert.ok(whatIf.direct);
  assert.ok(whatIf.sideEffect);
  assert.ok(whatIf.risk);
});

test('causal: detectCognitiveTraps выявляет синдром ремонтника при резком росте расходов в дефиците', () => {
  let game = createGame();
  game.policies.services = 120;
  game.lastBudget = { net: -50 };

  const traps = detectCognitiveTraps(game);
  assert.ok(Array.isArray(traps));
  const repair = traps.find(t => t.id === 'repair_service');
  assert.ok(repair, 'Должен детектировать синдром ремонтника');
});
