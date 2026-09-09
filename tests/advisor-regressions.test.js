import test from 'node:test';
import assert from 'node:assert/strict';

import { advance, createGame, setPolicies } from '../src/model.js';
import { getAdvisorDiagnosis, getPolicyWhatIf } from '../src/causal.js';

test('maintenance what-if direction agrees with the actual next model step', () => {
  for (const [maintenance, expectedDirection] of [[18, -1], [20, 1]]) {
    const initial = createGame();
    const preview = getPolicyWhatIf('maintenance', maintenance, initial);
    const aggregatePreview = getPolicyWhatIf(initial, { maintenance });
    const next = advance(setPolicies(initial, { maintenance }), 1);
    const actualDelta = next.equipment - initial.equipment;
    assert.equal(Math.sign(actualDelta), expectedDirection);
    assert.match(preview.direct, new RegExp(`${actualDelta >= 0 ? '\\+' : ''}${actualDelta.toFixed(2)}`));
    assert.match(aggregatePreview.direct, new RegExp(`${actualDelta >= 0 ? '\\+' : ''}${actualDelta.toFixed(2)}`));
  }
});

test('factory advisor derives its maintenance threshold from current production', () => {
  const game = createGame();
  game.equipment = 40;
  game.policies.maintenance = 18;
  const diagnosis = getAdvisorDiagnosis('factory', game);

  assert.match(diagnosis.recommendation, /19\.2 тыс\. м\.\/мес\./);
  assert.match(diagnosis.recommendation, /-0\.05 п\.п\./);
});

test('wage preview describes satisfaction and expenses without a direct staffing claim', () => {
  const game = createGame();
  const high = getPolicyWhatIf('wage', 110, game);
  const low = getPolicyWhatIf('wage', 80, game);

  assert.match(high.direct, /Фонд оплаты труда/);
  assert.match(high.sideEffect, /удовлетворенность.*может позже повлиять на миграцию/i);
  assert.doesNotMatch(high.sideEffect, /привлекает кадры/i);
  assert.match(low.sideEffect, /прямого изменения числа рабочих мест.*не вызывает/i);
});

test('tourism advisor labels visitor revenue as gross receipts', () => {
  const game = createGame();
  game.tourismCapacity = 100;
  game.visitors = 100;
  game.tourismJobs = 13;
  const diagnosis = getAdvisorDiagnosis('tourism', game);

  assert.match(diagnosis.quote, /до вычета рекламы и общегородских расходов/);
  assert.match(diagnosis.keyStat, /Валовые поступления/);
  assert.doesNotMatch(diagnosis.quote, /тыс\. чистыми/);
});
