import test from 'node:test';
import assert from 'node:assert/strict';

import {
  advance,
  createGame,
  deserializeGame,
  requestReport,
  serializeGame,
} from '../src/model.js';

const REPORT_KINDS = ['factory', 'finance', 'housing', 'social', 'tourism'];

test('comparison: отчёт, впервые запрошенный в месяце 0, не имеет базы для прошлого месяца', () => {
  const game = createGame();

  for (const kind of REPORT_KINDS) {
    const report = requestReport(game, kind).reports[kind];
    assert.equal(report.comparison, null, `${kind}: comparison должен быть null в месяце 0`);
  }
});

test('comparison: запрос в месяце 4 сравнивает каждый отчёт с независимым снимком месяца 3', () => {
  const atMonthFour = advance(createGame(), 4);
  const independentMonthThree = advance(createGame(), 3);

  for (const kind of REPORT_KINDS) {
    const requestedAtFour = requestReport(atMonthFour, kind).reports[kind];
    const expectedPreviousMonth = requestReport(independentMonthThree, kind).reports[kind];

    assert.equal(requestedAtFour.month, 4, `${kind}: дата текущего отчёта`);
    assert.deepEqual(
      requestedAtFour.comparison,
      { month: 3, data: expectedPreviousMonth.data },
      `${kind}: база должна быть данными предыдущего календарного месяца`,
    );
  }
});

test('comparison: ранее полученный отчёт и его база не меняются при ходе без обновления', () => {
  const reported = requestReport(advance(createGame(), 4), 'factory');
  const expectedPreviousMonth = requestReport(advance(createGame(), 3), 'factory').reports.factory;
  const beforeAdvance = structuredClone(reported.reports.factory);
  const afterAdvance = advance(reported, 2);

  assert.deepEqual(beforeAdvance.comparison, { month: 3, data: expectedPreviousMonth.data });
  assert.deepEqual(afterAdvance.reports.factory, beforeAdvance);
});

test('comparison: сохранение восстанавливает отчёт с базой, а повторный запрос в том же месяце его не меняет', () => {
  const reported = requestReport(advance(createGame(), 4), 'social');
  const expectedPreviousMonth = requestReport(advance(createGame(), 3), 'social').reports.social;
  const restored = deserializeGame(serializeGame(reported));
  const beforeRefresh = structuredClone(restored.reports.social);
  const refreshed = requestReport(restored, 'social');

  assert.deepEqual(restored.reports.social, reported.reports.social);
  assert.deepEqual(restored.reports.social.comparison, { month: 3, data: expectedPreviousMonth.data });
  assert.deepEqual(refreshed.reports.social, beforeRefresh);
});

test('comparison: сохранение старой схемы без optional comparison загружается', () => {
  const reported = requestReport(advance(createGame(), 4), 'tourism');
  const oldSave = JSON.parse(serializeGame(reported));
  delete oldSave.reports.tourism.comparison;

  const restored = deserializeGame(JSON.stringify(oldSave));

  assert.equal(restored instanceof Error, false);
  assert.equal(restored.reports.tourism.comparison, null);
});
