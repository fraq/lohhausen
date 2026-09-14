import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import messages from '../src/locales/extremistan.js';
import { translate } from '../src/i18n.js';
import { createScenarioGame, getScenarioBenchmark } from '../src/scenarios.js';
import { computeAntifragilityMetrics } from '../src/extremistan-analysis.js';
import { TALEB_EVENTS } from '../src/taleb-events.js';

const source = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8');
const seedStart = source.indexOf('function readNewGameSeed(');
const seedEnd = source.indexOf('\n\ntry {', seedStart);
const readSeed = vm.runInNewContext(`(${source.slice(seedStart, seedEnd)})`);

test('new-game seed input accepts decimal uint32 boundaries and rejects ambiguous input', () => {
  const noRandom = { getRandomValues() { assert.fail('explicit seeds must not use randomness'); } };
  for (const [input, expected] of [['0', 0], [' 42 ', 42], ['4294967295', 4294967295]]) assert.equal(readSeed(input, noRandom), expected);
  for (const input of ['-1', '4294967296', '1.5', '1e3', '0x10', 'Infinity', 'hello', '+42']) assert.throws(() => readSeed(input, noRandom));
});

test('a blank seed uses one crypto draw; no crypto requires manual input', () => {
  let calls = 0;
  const random = { getRandomValues(array) { calls += 1; assert.equal(array.length, 1); array[0] = 987; return array; } };
  assert.equal(readSeed(' ', random), 987);
  assert.equal(calls, 1);
  assert.throws(() => readSeed('', {}));
});

test('Extremistan translations have matching placeholders and no untranslated Russian', () => {
  for (const [language, dictionary] of Object.entries(messages)) {
    for (const [key, value] of Object.entries(dictionary)) {
      assert.deepEqual(key.match(/\{n\d+\}/g) || [], value.match(/\{n\d+\}/g) || [], `${language}: ${key}`);
      assert.doesNotMatch(value, /[А-Яа-яЁё]/, `${language}: ${key}`);
      const text = key.replace(/\{n(\d+)\}/g, (_, index) => String(Number(index) + 12));
      assert.doesNotMatch(translate(text, language), /[А-Яа-яЁё]/, `${language}: ${text}`);
    }
    const benchmark = getScenarioBenchmark('extremistan_challenge', 42);
    for (const profile of Object.values(benchmark)) {
      for (const key of ['name', 'description', 'strategy', 'verdict']) assert.doesNotMatch(translate(profile[key], language), /[А-Яа-яЁё]/);
    }
  }
});

test('month-zero debrief renders insufficient evidence and separate zero counters', () => {
  const begin = source.indexOf('function renderTalebAntifragilitySection()');
  const end = source.indexOf('\nfunction debriefView()', begin);
  const format = new Intl.NumberFormat('en');
  const render = vm.runInNewContext(`(${source.slice(begin, end)})`, {
    game: createScenarioGame('extremistan_challenge', 42), computeAntifragilityMetrics, TALEB_EVENTS,
    escapeHTML: value => String(value), integer: format, fmt: value => format.format(value), signed: value => format.format(value),
  });
  const html = render();
  assert.match(html, /data-classification="insufficient_evidence"/);
  assert.match(html, /Недостаточно данных/);
  assert.match(html, /taleb-survivedNegativeShocks"><span>Пережито отрицательных шоков<\/span><strong>0<\/strong>/);
  assert.match(html, /taleb-capitalizedOpportunities/);
  assert.doesNotMatch(html, /Стратегия штанги|Истинная победа|стал сильнее/);
});
