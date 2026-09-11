import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advance, startProject, setPolicies } from '../src/model.js';
import { explainStepCauses } from '../src/causal.js';
import { translate } from '../src/i18n.js';

test('causal-wear: standard step with maintenance=14 reports wear deficit and not false compensation', () => {
  let prev = createGame();
  let curr = advance(structuredClone(prev), 1);

  const causes = explainStepCauses(curr, prev);
  const factoryCause = causes.find(c => c.sphere === 'factory');
  assert.ok(factoryCause, 'Factory cause must be present in digest');

  // At maintenance=14, deltaEq is approx -0.21. It must NOT claim that maintenance compensates wear!
  assert.doesNotMatch(factoryCause.explanation, /компенсирует естественный износ/, 'Must not falsely claim maintenance compensates wear');
  assert.match(factoryCause.explanation, /недостаточно против износа|потеряли/i, 'Must report that maintenance is insufficient against wear');
});

test('causal-wear: 3-month step explicitly states the multi-month interval', () => {
  let prev = createGame();
  let curr = advance(structuredClone(prev), 3);

  const causes = explainStepCauses(curr, prev);
  const factoryCause = causes.find(c => c.sphere === 'factory');
  assert.ok(factoryCause);

  assert.match(factoryCause.explanation, /За 3 мес\./, 'Must explicitly mention the 3-month interval');
  assert.match(factoryCause.explanation, /потеряли.*состояния/i, 'Must report wear over the 3-month interval');
});

test('causal-wear: saturation boundaries (0% and 100%) handle equipment without false compensation or false equilibrium', () => {
  let prev0 = createGame();
  prev0.equipment = 0;
  prev0.policies.maintenance = 0;
  let curr0 = structuredClone(prev0);
  curr0.month = 1;
  curr0.equipment = 0;

  const cause0 = explainStepCauses(curr0, prev0).find(c => c.sphere === 'factory');
  assert.ok(cause0);
  assert.doesNotMatch(cause0.explanation, /компенсирует/, '0% equipment with M=0 must not claim compensation');
  assert.match(cause0.explanation, /полностью изношены \(0%\)/, 'Must report 0% worn equipment');

  let prev100 = createGame();
  prev100.equipment = 100;
  prev100.policies.maintenance = 80;
  let curr100 = structuredClone(prev100);
  curr100.month = 1;
  curr100.equipment = 100;

  const cause100 = explainStepCauses(curr100, prev100).find(c => c.sphere === 'factory');
  assert.ok(cause100);
  assert.doesNotMatch(cause100.explanation, /равновеси/, '100% equipment with M=80 must not claim exact equilibrium');
  assert.match(cause100.explanation, /максимуме \(100%\)/, 'Must report equipment at maximum');
});

test('causal-wear: modernization completion is separated from monthly maintenance', () => {
  let prev = createGame();
  prev = startProject(prev, 'modernization', 'Проверяем разделение модернизации');
  // Advance 9 months to project completion
  let curr = advance(prev, 9);

  const causes = explainStepCauses(curr, curr.history[8]);
  const factoryCause = causes.find(c => c.sphere === 'factory');
  assert.ok(factoryCause);

  assert.match(factoryCause.explanation, /модернизаци/i, 'Must explicitly mention modernization completion in equipment explanation');
  assert.match(factoryCause.explanation, /ввод, обслуживание, износ/i, 'Must distinguish the contributing mechanisms from the observed total change');
  assert.doesNotMatch(factoryCause.explanation, /надежно защищает|остается ниже уровня естественного износа/i, 'Must not infer a universal maintenance threshold from the latest policy');
});

test('causal-wear: all causal equipment explanations translate to en, de, fr without leaving untranslated Russian words', () => {
  // Test 1: standard wear deficit
  let prev = createGame();
  let curr = advance(structuredClone(prev), 1);
  const exp1 = explainStepCauses(curr, prev).find(c => c.sphere === 'factory').explanation;

  // Test 2: multi-month wear
  let curr3 = advance(structuredClone(prev), 3);
  const exp3 = explainStepCauses(curr3, prev).find(c => c.sphere === 'factory').explanation;

  // Test 3: boundary 0%
  let p0 = createGame();
  p0.equipment = 0;
  let c0 = structuredClone(p0);
  c0.month = 1;
  c0.equipment = 0;
  const exp0 = explainStepCauses(c0, p0).find(c => c.sphere === 'factory').explanation;

  // Test 4: boundary 100%
  let p100 = createGame();
  p100.equipment = 100;
  let c100 = structuredClone(p100);
  c100.month = 1;
  c100.equipment = 100;
  const exp100 = explainStepCauses(c100, p100).find(c => c.sphere === 'factory').explanation;

  const samples = [exp1, exp3, exp0, exp100];
  for (const sample of samples) {
    for (const lang of ['en', 'de', 'fr']) {
      const translated = translate(sample, lang);
      assert.ok(translated.length > 0, `Translated string for ${lang} must not be empty`);
      assert.doesNotMatch(translated, /[А-Яа-яЁё]/, `Translated string for ${lang} must not contain Russian characters. Got: "${translated}"`);
    }
  }
});
