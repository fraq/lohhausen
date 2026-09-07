import test from 'node:test';
import assert from 'node:assert/strict';

import {
  advance,
  createGame,
  deserializeGame,
  requestReport,
  serializeGame,
  setPolicies,
  startProject,
  summarize,
  trade,
} from '../src/model.js';

test('AC-1: новая игра начинается в месяце 0 с населением 3700 и горизонтом 120', () => {
  const game = createGame();

  assert.deepEqual(
    { month: game.month, population: game.population, horizon: game.horizon },
    { month: 0, population: 3700, horizon: 120 },
  );
});

test('AC-2: ход на 3 месяца совпадает с тремя ходами на 1 месяц при неизменных решениях', () => {
  const game = createGame();
  const policyGame = setPolicies(game, { taxRate: 18 }, 'Проверка эквивалентности хода');
  const byThree = advance(policyGame, 3);
  const byOne = advance(advance(advance(policyGame, 1), 1), 1);

  assert.deepEqual(byThree, byOne);
  assert.deepEqual(game.policies, createGame().policies);
});

test('AC-3: жильё добавляет 60 мест впервые на 12-м месяце после запуска', () => {
  const game = createGame();
  const planned = startProject(game, 'housing', 'Построить жильё');
  const beforeCompletion = advance(planned, 11);
  const completed = advance(planned, 12);

  assert.equal(beforeCompletion.housingCapacity, game.housingCapacity);
  assert.equal(completed.housingCapacity, game.housingCapacity + 60);
  assert.equal(completed.month, 12);
});

test('AC-4: фабрика продаёт спрос, переносит остаток в запас и считает выручку от продаж', () => {
  const result = trade({ production: 1000, inventory: 0, demand: 600, price: 2 });

  assert.deepEqual(result, { sales: 600, inventory: 400, revenue: 1200 });
});

test('AC-5: отчёт фабрики сохраняет дату снимка до следующего запроса', () => {
  const atZero = requestReport(createGame(), 'factory');
  const atOneWithoutRefresh = advance(atZero, 1);
  const refreshed = requestReport(atOneWithoutRefresh, 'factory');

  assert.equal(atOneWithoutRefresh.reports.factory.month, 0);
  assert.equal(refreshed.reports.factory.month, 1);
  assert.deepEqual(atZero.reports.factory.data, atOneWithoutRefresh.reports.factory.data);
});

test('AC-6: сохранение месяца 7 восстанавливает состояние, проекты, решения и журнал', () => {
  const game = createGame();
  const withPolicies = setPolicies(game, { taxRate: 22, maintenance: 30 }, 'Новый бюджет');
  const withProject = startProject(withPolicies, 'housing', 'Муниципальное жильё');
  const atMonthSeven = advance(withProject, 7);
  const restored = deserializeGame(serializeGame(atMonthSeven));

  assert.deepEqual(restored, atMonthSeven);
  assert.equal(restored.month, 7);
  assert.equal(restored.projects.length, 1);
  assert.equal(restored.policies.taxRate, 22);
  assert.ok(restored.journal.some((entry) => entry.note === 'Муниципальное жильё'));
});

test('AC-7: в месяце 120 разбор содержит пять динамических метрик и уроки из журнала', () => {
  const game = advance(createGame(), 120);
  const debrief = summarize(game);
  const expectedKeys = ['finance', 'production', 'unemployment', 'housing', 'satisfaction'];
  const sourceField = {
    finance: (snapshot) => snapshot.treasury - snapshot.debt,
    production: (snapshot) => snapshot.production,
    unemployment: (snapshot) => snapshot.unemployment,
    housing: (snapshot) => snapshot.housingShortage,
    satisfaction: (snapshot) => snapshot.satisfaction,
  };
  const metrics = [...debrief.metrics].sort((left, right) => left.key.localeCompare(right.key));
  const sortedKeys = [...expectedKeys].sort();

  assert.equal(game.month, 120);
  assert.deepEqual(metrics.map((metric) => metric.key), sortedKeys);
  assert.deepEqual(
    metrics.map(({ key, initial, final, change }) => ({ key, initial, final, change })),
    sortedKeys.map((key) => ({
      key,
      initial: sourceField[key](game.history[0]),
      final: sourceField[key](game.history.at(-1)),
      change: sourceField[key](game.history.at(-1)) - sourceField[key](game.history[0]),
    })),
  );
  assert.equal(debrief.metrics.length, 5);
  assert.equal(debrief.lessons.length > 0, true);
});

test('EC-1: ход на 3 месяца из 119 останавливается на 120 и повторный ход не меняет город', () => {
  const at119 = advance(createGame(), 119);
  const at120 = advance(at119, 3);

  assert.equal(at120.month, 120);
  assert.deepEqual(advance(at120, 3), at120);
});

test('EC-2: нулевое население не создаёт NaN или Infinity, занятость, безработица и спрос жилья равны нулю', () => {
  const game = createGame();
  const emptyTown = {
    ...game,
    population: 0,
    workforce: 0,
    factoryJobs: 0,
    otherJobs: 0,
    tourismJobs: 0,
  };
  const next = advance(emptyTown, 1);

  assert.deepEqual(
    { population: next.population, workforce: next.workforce, unemployment: next.unemployment, housingShortage: next.housingShortage },
    { population: 0, workforce: 0, unemployment: 0, housingShortage: 0 },
  );
  assert.equal(
    [next.population, next.workforce, next.factoryJobs, next.otherJobs, next.tourismJobs, next.unemployment, next.housingShortage]
      .every(Number.isFinite),
    true,
  );
});

test('EC-3: недоступный инвестиционный проект отклоняется без изменения казны и очереди', () => {
  const game = { ...createGame(), treasury: 0 };
  const before = structuredClone(game);

  assert.throws(() => startProject(game, 'housing', 'Недоступный проект'), /недостат|средств|fund/i);
  assert.deepEqual(game, before);
});

test('ERR-1: повреждённое сохранение возвращает понятную ошибку и не является состоянием игры', () => {
  const corrupt = '{"version":1,"policies":';
  const result = deserializeGame(corrupt);

  assert.equal(result instanceof Error, true);
  assert.match(result.message, /сохран|json|повреж|read|parse/i);
});
