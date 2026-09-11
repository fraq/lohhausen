import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advance, setPolicies, startProject, requestReport, summarize, serializeGame } from '../src/model.js';
import { createScenarioGame, evaluateScenario, getScenarioBenchmark } from '../src/scenarios.js';
import { analyzeDebrief, verifyHypotheses } from '../src/debrief.js';
import { translate } from '../src/i18n.js';

// Reported final figures; only the fields used by the summary and objectives are projected.
function reportedResult() {
  const game = advance(createScenarioGame('sandbox'), 120);
  const figures = { treasury: 2594.7, debt: 0, production: 809.5, unemployment: 384.3, satisfaction: 98.9, equipment: 100, housingShortage: 0 };
  Object.assign(game, figures);
  Object.assign(game.history.at(-1), figures);
  return game;
}

test('a solvent winning game still reports worsening employment without blaming improved equipment', () => {
  const game = reportedResult();
  const before = serializeGame(game);
  const lessons = summarize(game).lessons.join('\n');
  assert.match(lessons, /финансовая позиция улучшилась/i);
  assert.match(lessons, /безработных выросло/i);
  assert.match(lessons, /выпуск ниже стартового/i);
  assert.match(lessons, /стартовая величина задана отдельно от месячного расчета/i);
  assert.doesNotMatch(lessons, /снижение выпуска совпало с изменением состояния оборудования/i);
  assert.equal(evaluateScenario(game).status, 'victory');
  assert.equal(serializeGame(game), before);
});

test('employment improvement does not trigger the warning about rising unemployment', () => {
  const game = reportedResult();
  game.history.at(-1).unemployment = 200;
  assert.doesNotMatch(summarize(game).lessons.join('\n'), /безработных выросло/i);
});

test('a journal with no detected indicators does not claim proof of systematic management', () => {
  const game = advance(requestReport(setPolicies(createGame(), { maintenance: 25 }), 'finance'), 1);
  const analysis = analyzeDebrief(game);
  assert.ok(analysis.traps.every(trap => !trap.detected));
  assert.doesNotMatch([analysis.archetype.name, analysis.archetype.title, analysis.archetype.description].join(' '), /Профиль Конрада|Признаки последовательного управления|решения разнесены во времени/);
});

test('mixed-result observations and the illustrative benchmark remain translated', () => {
  const game = reportedResult();
  const profile = analyzeDebrief(advance(requestReport(setPolicies(createGame(), { maintenance: 25 }), 'finance'), 1)).archetype;
  const completedProject = advance(startProject(createGame(), 'modernization'), 9);
  const texts = [...summarize(game).lessons, profile.name, profile.title, profile.description, getScenarioBenchmark('sandbox').conrad.verdict, ...verifyHypotheses(completedProject).map(hypothesis => hypothesis.hindsightLesson), 'Что изменилось и что требует внимания'];
  for (const language of ['en', 'de', 'fr']) {
    for (const text of texts) assert.doesNotMatch(translate(text, language), /[А-Яа-яЁё]/, `${language}: ${text}`);
  }
  assert.doesNotMatch(getScenarioBenchmark('sandbox').conrad.verdict, /максимальн/i);
});
