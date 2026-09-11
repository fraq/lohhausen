import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, setPolicies, requestReport, startProject, deserializeGame } from '../src/model.js';
import { createScenarioGame, evaluateScenario } from '../src/scenarios.js';
import { analyzeDebrief, formatDebriefJSON, formatDebriefMarkdown } from '../src/debrief.js';
import { translate } from '../src/i18n.js';

test('JSON session export retains the complete restorable scenario and literal player notes', () => {
  const game = advance(startProject(createScenarioGame('tourism_dilemma'), 'housing', 'Мой прогноз: +60 places'), 4);
  const exported = JSON.parse(formatDebriefJSON(game, analyzeDebrief(game), evaluateScenario(game)));
  assert.equal(exported.status, 'active');
  assert.deepEqual(deserializeGame(JSON.stringify(exported.game)), game);
});

test('intermediate exports do not claim that the term has completed', () => {
  const game = createScenarioGame('factory_crisis');
  const analysis = analyzeDebrief(game);
  assert.equal(JSON.parse(formatDebriefJSON(game, analysis)).status, 'active');
  assert.match(formatDebriefMarkdown(game, analysis, evaluateScenario(game)), /Статус сценария:\*\* Продолжается/);
});

test('JSON does not turn the absence of detected indicators into a Conrad classification', () => {
  const game = advance(requestReport(setPolicies(createScenarioGame('sandbox'), { maintenance: 25 }), 'finance'), 1);
  const analysis = analyzeDebrief(game);
  assert.ok(analysis.traps.every(trap => !trap.detected));
  const exported = JSON.parse(formatDebriefJSON(game, analysis, evaluateScenario(game)));
  assert.equal(exported.archetype.id, 'no_indicators_detected');
  assert.match(exported.summary, /не доказывает отсутствие/);
  assert.deepEqual(deserializeGame(JSON.stringify(exported.game)), game);
});

test('the Markdown export uses the selected interface language and preserves Markdown structure', () => {
  const initial = createScenarioGame('sandbox');
  const completedProject = advance(startProject(initial, 'housing', 'Мой прогноз'), 12);
  for (const game of [initial, completedProject]) for (const language of ['en', 'de', 'fr']) {
    const text = formatDebriefMarkdown(game, analyzeDebrief(game), evaluateScenario(game), line => translate(line, language));
    assert.doesNotMatch(text, /[А-Яа-яЁё]/);
    assert.ok(text.startsWith('# '));
    assert.equal(text.split('\n').filter(line => line.startsWith('## ')).length, 4);
  }
});
