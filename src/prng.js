/**
 * Детерминированный генератор псевдослучайных чисел на базе алгоритма Mulberry32.
 * Гарантирует 100% воспроизводимость последовательности при одинаковом сиде (seed).
 */

export function createPRNG(initialSeed = 19870505) {
  let s = (Number.isInteger(initialSeed) ? initialSeed : 19870505) >>> 0;

  function next() {
    s |= 0;
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function range(min, max) {
    return min + next() * (max - min);
  }

  function int(min, max) {
    return Math.floor(range(min, max + 1));
  }

  function choice(array) {
    if (!Array.isArray(array) || array.length === 0) return null;
    return array[int(0, array.length - 1)];
  }

  /**
   * Генерация случайной величины с толстым хвостом по закону Парето (Крайнестан).
   * P(X > x) = (minVal / x)^alpha
   */
  function pareto(alpha = 1.5, minVal = 1.0) {
    const u = 1.0 - next();
    return minVal / Math.pow(u, 1.0 / alpha);
  }

  function getState() {
    return s;
  }

  function setState(savedState) {
    s = savedState >>> 0;
  }

  return {
    next,
    range,
    int,
    choice,
    pareto,
    getState,
    setState,
  };
}
