import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeDebrief, formatDebriefMarkdown, verifyHypotheses } from '../src/debrief.js';
import { advance, createGame, requestReport, setPolicies, startProject } from '../src/model.js';

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

  // Month 12: project just completed, so follow-up is pending, not prematurely detected
  const pendingTrap = analyzeDebrief(beforeOnly).traps.find((trap) => trap.id === 'ballistic_action');
  assert.equal(pendingTrap.detected, false, 'Should be pending (T0) at completion month');
  assert.equal(pendingTrap.evidence.pendingProjects.length, 1);

  // Advance to month 13 without matching report -> activates outcome_unverified (T2)
  let unmonitoredLater = advance(beforeOnly, 1);
  const unmonitoredTrap = analyzeDebrief(unmonitoredLater).traps.find((trap) => trap.id === 'ballistic_action');
  assert.equal(unmonitoredTrap.detected, true, 'Should be detected in month 13 without report');
  assert.equal(unmonitoredTrap.evidence.unmonitoredInterventions, 1);

  // Unrelated report (factory) does not clear housing requirement
  let unrelated = requestReport(beforeOnly, 'factory');
  unrelated = advance(unrelated, 1);
  const unrelatedTrap = analyzeDebrief(unrelated).traps.find((trap) => trap.id === 'ballistic_action');
  assert.equal(unrelatedTrap.detected, true);

  // Matching report requested after completion clears follow-up
  const monitored = requestReport(beforeOnly, 'housing');
  const monitoredTrap = analyzeDebrief(monitored).traps.find((trap) => trap.id === 'ballistic_action');
  assert.equal(monitoredTrap.detected, false);
  assert.equal(monitoredTrap.evidence.clearedProjects.length, 1);

  // Remains cleared after advancing to month 13
  const monitoredMonth13 = advance(monitored, 1);
  assert.equal(analyzeDebrief(monitoredMonth13).traps.find((trap) => trap.id === 'ballistic_action').detected, false);
});

test('post-project follow-up semantics (T0/T1/T2) satisfies repair brief criteria (Attribution: Повелитель, #11600, #11613, #11628)', () => {
  // Criterion 1: Minimal month-6 completion trace is pending, not detected/high
  let game = createGame();
  game = startProject(game, 'tourism', 'verif');
  game = advance(game, 6);

  const analysis6 = analyzeDebrief(game);
  const trap6 = analysis6.traps.find(t => t.id === 'ballistic_action');
  assert.equal(trap6.detected, false, 'Criterion 1: T0 must be pending, not detected');
  assert.equal(trap6.severity, 'none');
  assert.equal(trap6.evidence.pendingProjects.length, 1);
  assert.equal(trap6.evidence.pendingProjects[0].status, 'followup_pending');
  assert.notEqual(analysis6.archetype?.id, 'ballistic', 'Criterion 6: pending must not select ballistic archetype');

  // Reply #11628 trace: unrelated same-month action does not trigger premature T2
  let policyGame = setPolicies(game, { taxRate: 15 });
  const trapPolicy = analyzeDebrief(policyGame).traps.find(t => t.id === 'ballistic_action');
  assert.equal(trapPolicy.detected, false, '#11628: unrelated same-month policy must keep follow-up pending');
  assert.equal(trapPolicy.evidence.pendingProjects.length, 1);
  assert.equal(trapPolicy.evidence.pendingProjects[0].status, 'followup_pending');

  // Criterion 2: Matching report in same month after completion clears pending
  const clearedGame = requestReport(policyGame, 'tourism');
  const trapCleared = analyzeDebrief(clearedGame).traps.find(t => t.id === 'ballistic_action');
  assert.equal(trapCleared.detected, false, 'Criterion 2: Matching report clears pending');
  assert.equal(trapCleared.evidence.clearedProjects.length, 1);
  assert.equal(trapCleared.evidence.pendingProjects.length, 0);

  // Remains cleared after advancing to month 7
  const clearedMonth7 = advance(clearedGame, 1);
  assert.equal(analyzeDebrief(clearedMonth7).traps.find(t => t.id === 'ballistic_action').detected, false);

  // Criterion 3: Pre-completion report does not clear follow-up
  let preGame = createGame();
  preGame = startProject(preGame, 'tourism');
  preGame = requestReport(preGame, 'tourism'); // month 0
  preGame = advance(preGame, 6); // month 6 completion
  assert.equal(analyzeDebrief(preGame).traps.find(t => t.id === 'ballistic_action').evidence.pendingProjects.length, 1);
  preGame = advance(preGame, 1); // month 7
  assert.equal(analyzeDebrief(preGame).traps.find(t => t.id === 'ballistic_action').detected, true, 'Criterion 3: Pre-completion report does not satisfy post-completion check');

  // Criterion 4: T2 outcome_unverified upon advancing to later month without matching report
  let laterGame = advance(game, 1); // advance from month 6 to 7 without report
  const analysis7 = analyzeDebrief(laterGame);
  const trap7 = analysis7.traps.find(t => t.id === 'ballistic_action');
  assert.equal(trap7.detected, true, 'Criterion 4: T2 outcome_unverified activated upon advancing to next month');
  assert.equal(trap7.severity, 'low', 'Single unverified project must have severity low, not high');
  assert.equal(trap7.title, 'Непроверенный исход проекта', 'Single unverified project must use neutral outcome title');
  assert.equal(trap7.evidence.unverifiedProjects.length, 1);
  assert.equal(trap7.evidence.unverifiedProjects[0].status, 'outcome_unverified');
  assert.notEqual(analysis7.archetype?.id, 'ballistic', 'Single unverified project must not select ballistic archetype');

  // Recurrence rule: 2 or more unmonitored projects trigger high severity and ballistic archetype
  let recurrentGame = createGame();
  recurrentGame = startProject(recurrentGame, 'tourism');
  recurrentGame = advance(recurrentGame, 6); // m6: tourism done, unverified
  recurrentGame = startProject(recurrentGame, 'modernization');
  recurrentGame = advance(recurrentGame, 9); // m15: modernization done
  recurrentGame = advance(recurrentGame, 1); // m16: both unmonitored in later month
  const analysisRecurrent = analyzeDebrief(recurrentGame);
  const trapRecurrent = analysisRecurrent.traps.find(t => t.id === 'ballistic_action');
  assert.equal(trapRecurrent.detected, true);
  assert.equal(trapRecurrent.severity, 'high', 'Recurrent unmonitored projects (>=2) trigger severity high');
  assert.equal(trapRecurrent.title, 'Баллистический стиль (Ballistisches Handeln)');
  assert.equal(analysisRecurrent.archetype?.id, 'ballistic', 'Recurrent unmonitored projects select ballistic archetype');
});

test('terminal horizon project completion remains followup_pending and does not trigger premature T2', () => {
  // Scenario with horizon: 6 months
  let game = { ...createGame(), horizon: 6 };
  game = startProject(game, 'tourism', 'verif');
  game = advance(game, 6); // Reaches horizon (month 6), completion occurs

  assert.equal(game.month, 6);
  assert.equal(game.horizon, 6);

  // Month 6 at horizon: player has just seen completion, report opportunity remains open
  const terminalAnalysis = analyzeDebrief(game);
  const trap = terminalAnalysis.traps.find(t => t.id === 'ballistic_action');
  assert.equal(trap.detected, false, 'Completion at horizon must remain pending, not premature T2');
  assert.equal(trap.severity, 'none');
  assert.equal(trap.evidence.pendingProjects.length, 1);
  assert.equal(trap.evidence.pendingProjects[0].status, 'followup_pending');
  assert.notEqual(terminalAnalysis.archetype?.id, 'ballistic');

  // Player exercises final report opportunity in terminal month
  const reportGame = requestReport(game, 'tourism');
  const clearedTrap = analyzeDebrief(reportGame).traps.find(t => t.id === 'ballistic_action');
  assert.equal(clearedTrap.detected, false);
  assert.equal(clearedTrap.evidence.clearedProjects.length, 1);
  assert.equal(clearedTrap.evidence.pendingProjects.length, 0);
});

test('recurrence rule groups by independent follow-up opportunities and decision epochs (Codex counterexample 068, reply #11637)', () => {
  // Minimal counterexample from Codex letter 068:
  // Both projects start at month 0 and finish at month 6, sharing one tourism report opportunity.
  let game = createGame();
  game = startProject(game, 'tourism', 'first');
  game = startProject(game, 'tourism', 'second');
  game = advance(game, 7); // Advanced to month 7 without report

  const analysis = analyzeDebrief(game);
  const trap = analysis.traps.find(t => t.id === 'ballistic_action');
  assert.equal(trap.detected, true);
  assert.equal(trap.evidence.unmonitoredInterventions, 2, 'Raw project count is 2');
  assert.equal(trap.evidence.independentFollowupOpportunities, 1, 'Both projects share 1 domain report opportunity (6:tourism)');
  assert.equal(trap.evidence.independentDecisionEpochs, 1, 'Both projects complete in 1 decision epoch (month 6)');
  assert.equal(trap.evidence.isRecurrent, false, 'Single missed decision epoch must not be counted as recurrence');
  assert.equal(trap.severity, 'low', 'Severity must be low, not high');
  assert.equal(trap.title, 'Непроверенный исход проекта', 'Title must remain neutral outcome unverified');
  assert.notEqual(analysis.archetype?.id, 'ballistic', 'Must not select ballistic archetype from shared report opportunity');

  // Negative control: one tourism report in month 6 clears both projects
  let clearedGame = createGame();
  clearedGame = startProject(clearedGame, 'tourism', 'first');
  clearedGame = startProject(clearedGame, 'tourism', 'second');
  clearedGame = advance(clearedGame, 6);
  clearedGame = requestReport(clearedGame, 'tourism');
  clearedGame = advance(clearedGame, 1);

  const clearedAnalysis = analyzeDebrief(clearedGame);
  const clearedTrap = clearedAnalysis.traps.find(t => t.id === 'ballistic_action');
  assert.equal(clearedTrap.detected, false);
  assert.equal(clearedTrap.evidence.clearedProjects.length, 2);
  assert.equal(clearedTrap.evidence.unverifiedProjects.length, 0);

  // Positive recurrence: projects completing in distinct decision epochs without reports
  let recurrentGame = createGame();
  recurrentGame = startProject(recurrentGame, 'tourism', 'epoch 1');
  recurrentGame = advance(recurrentGame, 6); // completes at month 6
  recurrentGame = advance(recurrentGame, 1); // unverified epoch 1 (month 7)
  recurrentGame = startProject(recurrentGame, 'modernization', 'epoch 2');
  recurrentGame = advance(recurrentGame, 9); // completes at month 16
  recurrentGame = advance(recurrentGame, 1); // unverified epoch 2 (month 17)

  const recurrentAnalysis = analyzeDebrief(recurrentGame);
  const recurrentTrap = recurrentAnalysis.traps.find(t => t.id === 'ballistic_action');
  assert.equal(recurrentTrap.detected, true);
  assert.equal(recurrentTrap.evidence.independentFollowupOpportunities, 2);
  assert.equal(recurrentTrap.evidence.independentDecisionEpochs, 2);
  assert.equal(recurrentTrap.evidence.isRecurrent, true);
  assert.equal(recurrentTrap.severity, 'high');
  assert.equal(recurrentTrap.title, 'Баллистический стиль (Ballistisches Handeln)');
  assert.equal(recurrentAnalysis.archetype?.id, 'ballistic');
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
