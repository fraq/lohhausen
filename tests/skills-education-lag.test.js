import test from 'node:test';
import assert from 'node:assert/strict';

import { createGame, advance, setPolicies } from '../src/model.js';
import { getAdvisorDiagnosis, getPolicyWhatIf, skillsForecast } from '../src/causal.js';
import { formatDebriefAIPrompt, buildChessMatchRecord, analyzeDebrief } from '../src/debrief.js';

test('skillsForecast correctly computes target qualification and delayed rate of convergence', () => {
  const game = createGame(); // skills: 45, modernizationLevel: 0
  
  // Case A: Zero education
  const zeroForecast = skillsForecast(0, game);
  assert.equal(zeroForecast.target, 31);
  assert.equal(zeroForecast.curSkills, 45);
  assert.equal(zeroForecast.halfLifeMonths, 8.9);
  assert.ok(zeroForecast.monthlyDelta < 0);
  assert.equal(zeroForecast.monthlyDelta, -1.05);

  // Case B: High education (50k)
  const highForecast = skillsForecast(50, game);
  assert.equal(highForecast.target, 70); // 31 + 50 * 0.78 = 70
  assert.ok(highForecast.monthlyDelta > 0);
  assert.equal(highForecast.monthlyDelta, 1.88); // (70 - 45) * 0.075 = 1.875 -> 1.88
});

test('getPolicyWhatIf for education explains target qualification, delayed convergence and zero-funding trap', () => {
  const game = createGame();

  // Test zero education
  const zeroPreview = getPolicyWhatIf('education', 0, game);
  assert.match(zeroPreview.direct, /Целевая квалификация.*31%/i);
  assert.match(zeroPreview.sideEffect, /деградаци|падение квалификации.*31%/i);
  assert.match(zeroPreview.sideEffect, /полураспад/i);
  assert.match(zeroPreview.risk, /отложенн.*кризис|высочайш.*риск/i);

  // Test expansion to 50k
  const expandPreview = getPolicyWhatIf('education', 50, game);
  assert.match(expandPreview.direct, /Целевая квалификация.*70%/i);
  assert.match(expandPreview.sideEffect, /рости к 70%|7\.5%/i);

  // Test aggregate patch preview
  const aggPreview = getPolicyWhatIf(game, { education: 45 });
  assert.ok(aggPreview.forecastNotes.some(n => n.includes('Целевая квалификация') || n.includes('целевая квалификация')));
});

test('social advisor warns about hidden risk when education is severely underfunded', () => {
  const game = createGame();
  game.policies.education = 0;
  
  const diag = getAdvisorDiagnosis('social', game);
  assert.equal(diag.status, 'warning');
  assert.match(diag.quote, /образовани|квалификаци/i);
  assert.match(diag.keyStat, /Квалификация/i);
  assert.match(diag.recommendation, /образовани/i);
});

test('formatDebriefAIPrompt includes skills in city summary and key trajectory table', () => {
  let game = createGame();
  game = advance(game, 12);
  const analysis = analyzeDebrief(game);
  const prompt = formatDebriefAIPrompt(game, analysis);

  // Section 2: Summary includes skills
  assert.match(prompt, /Квалификация рабочих.*%/i);
  // Section 5: Trajectory table includes skills column
  assert.match(prompt, /\|\s*Месяц\s*\|\s*Население\s*\|\s*Казна\s*\|\s*Долг\s*\|\s*Станки \(%\)\s*\|\s*Квалификация \(%\)/i);
});

test('buildChessMatchRecord tracks skills in preActionState, transition deltas, and flags zero education as blunder', () => {
  let game = createGame();
  // Cut education to 0 in turn 0
  game = setPolicies(game, { education: 0 }, 'Полная экономия на образовании');
  game = advance(game, 1);

  const match = buildChessMatchRecord({ game });
  assert.ok(match.moves.length >= 2);
  
  const move0 = match.moves[0];
  assert.ok(Number.isFinite(move0.preActionState.skills), 'preActionState must have finite skills');
  assert.equal(move0.preActionState.skills, 45);
  assert.ok(Number.isFinite(move0.transitionToNextMonth.delta.skills), 'transition must record delta skills');
  
  // Systemic blunder tag ?? for zeroing education
  assert.equal(move0.systemicEvaluation.tag, '??');
  assert.match(move0.systemicEvaluation.label, /образовани|квалификаци/i);
});
