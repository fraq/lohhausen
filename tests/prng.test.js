import test from 'node:test';
import assert from 'node:assert/strict';
import { createPRNG } from '../src/prng.js';

test('prng: Mulberry32 детерминированно воспроизводит одинаковую последовательность при одинаковом seed', () => {
  const rng1 = createPRNG(42);
  const rng2 = createPRNG(42);

  const seq1 = Array.from({ length: 10 }, () => rng1.next());
  const seq2 = Array.from({ length: 10 }, () => rng2.next());

  assert.deepEqual(seq1, seq2);
  for (const val of seq1) {
    assert.ok(val >= 0 && val < 1, `Value ${val} must be in [0, 1)`);
  }
});

test('prng: range и int возвращают значения в заданных границах', () => {
  const rng = createPRNG(12345);

  for (let i = 0; i < 100; i++) {
    const r = rng.range(-10, 25);
    assert.ok(r >= -10 && r <= 25, `Range value ${r} out of bounds`);

    const n = rng.int(1, 6);
    assert.ok(Number.isInteger(n), `Int value ${n} must be integer`);
    assert.ok(n >= 1 && n <= 6, `Int value ${n} must be between 1 and 6`);
  }
});

test('prng: choice выбирает элементы массива и безопасно обрабатывает пустой ввод', () => {
  const rng = createPRNG(999);
  const options = ['apple', 'banana', 'cherry'];

  for (let i = 0; i < 20; i++) {
    const item = rng.choice(options);
    assert.ok(options.includes(item));
  }

  assert.equal(rng.choice([]), null);
  assert.equal(rng.choice(null), null);
});

test('prng: getState и setState сохраняют и восстанавливают состояние генератора', () => {
  const rng = createPRNG(777);

  // Генерируем 5 чисел
  for (let i = 0; i < 5; i++) rng.next();

  // Сохраняем состояние
  const savedState = rng.getState();
  assert.ok(Number.isInteger(savedState) && savedState >= 0, `getState must return an unsigned 32-bit integer: got ${savedState}`);
  const nextThreeOriginal = [rng.next(), rng.next(), rng.next()];

  // Восстанавливаем состояние
  rng.setState(savedState);
  const nextThreeRestored = [rng.next(), rng.next(), rng.next()];

  assert.deepEqual(nextThreeRestored, nextThreeOriginal);
});

test('prng: pareto генерирует величины с тяжелым хвостом (Крайнестан)', () => {
  const rng = createPRNG(2026);
  const minVal = 5.0;
  const values = Array.from({ length: 100 }, () => rng.pareto(1.5, minVal));

  for (const v of values) {
    assert.ok(v >= minVal, `Pareto value ${v} must be >= minVal ${minVal}`);
    assert.ok(Number.isFinite(v), `Pareto value ${v} must be finite`);
  }

  // При альфа=1.5 закон Парето обязательно дает выбросы существенно выше среднего
  const maxVal = Math.max(...values);
  assert.ok(maxVal > minVal * 2, 'Парето должно генерировать редкие сильные выбросы');
});
