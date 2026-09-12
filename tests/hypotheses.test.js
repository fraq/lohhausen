import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, advance, startProject } from '../src/model.js';
import { verifyHypotheses } from '../src/debrief.js';

test('hypotheses: legacy project without hypotheses outputs status no_data without error', () => {
  let game = createGame();
  game = startProject(game, 'housing', 'Строим муниципальные дома');
  game = advance(game, 12);

  const results = verifyHypotheses(game);
  assert.equal(results.length, 1);
  const item = results[0];
  assert.equal(item.projectType, 'housing');
  assert.equal(item.playerNote, 'Строим муниципальные дома');
  assert.ok(item.outcomeSummary.includes('вместимость жилья'));
  assert.ok(item.hindsightLesson.includes('не доказывает'));
  assert.ok(item.hypothesisVerification);
  assert.equal(item.hypothesisVerification.status, 'no_data');
  assert.equal(item.hypothesisVerification.h1Result, null);
  assert.equal(item.hypothesisVerification.h2Result, null);
  assert.match(item.hypothesisVerification.details, /не записано|нет данных/i);
});

test('hypotheses: structured H1 target verified as consistent when observed delta matches expectation', () => {
  let game = createGame();
  const hypotheses = {
    h1Target: {
      metric: 'housingCapacity',
      expectedDelta: 60,
      rationale: 'Ликвидация дефицита жилья',
    },
    h2Risk: {
      metric: 'unemployment',
      expectedDirection: 'increase',
      anticipatedCost: 'Рост населения при неизменных фабричных местах увеличит число ищущих работу',
    },
  };

  game = startProject(game, 'housing', 'Расширение жилого фонда', hypotheses);
  game = advance(game, 12);

  const results = verifyHypotheses(game);
  assert.equal(results.length, 1);
  const item = results[0];
  assert.deepEqual(item.hypotheses, hypotheses);
  assert.ok(item.hypothesisVerification);
  assert.equal(item.hypothesisVerification.h1Result.status, 'consistent');
  assert.equal(item.hypothesisVerification.h1Result.metric, 'housingCapacity');
  assert.equal(item.hypothesisVerification.h1Result.observedDelta, 60);
  assert.match(item.hypothesisVerification.h1Result.details, /согласуется/i);
  assert.equal(item.hypothesisVerification.h2Result.status, 'consistent');
  assert.equal(item.hypothesisVerification.status, 'consistent');
});

test('hypotheses: divergent H2 side-effect risk correctly identified as inconsistent with neutral framing', () => {
  let game = createGame();
  const hypotheses = {
    h1Target: {
      metric: 'equipment',
      expectedDelta: 12,
      rationale: 'Восстановление станков',
    },
    h2Risk: {
      metric: 'unemployment',
      expectedDirection: 'neutral', // Player assumed unemployment will NOT increase
      anticipatedCost: 'Предполагаем отсутствие побочного высвобождения труда',
    },
  };

  game = startProject(game, 'modernization', 'Ремонт станков с надеждой на сохранение занятости', hypotheses);
  game = advance(game, 9);

  const results = verifyHypotheses(game);
  assert.equal(results.length, 1);
  const item = results[0];
  assert.ok(item.hypothesisVerification);
  assert.equal(item.hypothesisVerification.h1Result.status, 'consistent');
  // Net equipment gain accounts for ongoing continuous wear (~10.37 net after 9 months)
  assert.ok(item.hypothesisVerification.h1Result.observedDelta > 10);
  assert.equal(item.hypothesisVerification.h2Result.status, 'inconsistent');
  assert.equal(item.hypothesisVerification.status, 'inconsistent');

  const h2 = item.hypothesisVerification.h2Result;
  assert.ok(h2);
  assert.doesNotMatch(h2.details, /!!|\?\?|слепота|недомыслие|глупость/);
  assert.match(h2.details, /разош|согласуется|побочн/i);
});

test('hypotheses: startProject accepts options object and preserves backward compatibility', () => {
  let game = createGame();
  const hyp = {
    h1Target: { metric: 'tourismCapacity', expectedDelta: 80 },
  };
  game = startProject(game, 'tourism', { note: 'Строительство гостиниц', hypotheses: hyp });
  const entry = game.journal.find(e => e.type === 'project');
  assert.ok(entry);
  assert.equal(entry.note, 'Строительство гостиниц');
  assert.deepEqual(entry.hypotheses, hyp);
});

test('hypotheses: unknown metric gracefully returns status no_data without crashing', () => {
  let game = createGame();
  const hyp = {
    h1Target: { metric: 'non_existent_indicator', expectedDelta: 10 },
  };
  game = startProject(game, 'housing', 'Проект с некорректной метрикой', hyp);
  game = advance(game, 12);

  const results = verifyHypotheses(game);
  assert.equal(results.length, 1);
  const item = results[0];
  assert.equal(item.hypothesisVerification.status, 'no_data');
  assert.equal(item.hypothesisVerification.h1Result.status, 'no_data');
  assert.match(item.hypothesisVerification.h1Result.details, /недоступны/i);
});

test('hypotheses: mixed legacy and structured projects co-exist cleanly', () => {
  let game = createGame();
  // Legacy project without hypotheses
  game = startProject(game, 'housing', 'Обычное жилье');
  // Advance 6 months
  game = advance(game, 6);
  // Structured project with hypotheses
  const hyp = {
    h1Target: { metric: 'tourismCapacity', expectedDelta: 80 },
  };
  game = startProject(game, 'tourism', 'Осознанный туризм', hyp);
  // Advance 6 more months (month 12: housing finishes, tourism finishes)
  game = advance(game, 6);

  const results = verifyHypotheses(game);
  assert.equal(results.length, 2);

  const legacyItem = results.find(r => r.projectType === 'housing');
  assert.ok(legacyItem);
  assert.equal(legacyItem.hypothesisVerification.status, 'no_data');
  assert.equal(legacyItem.hypotheses, null);

  const structuredItem = results.find(r => r.projectType === 'tourism');
  assert.ok(structuredItem);
  assert.equal(structuredItem.hypothesisVerification.status, 'consistent');
  assert.equal(structuredItem.hypothesisVerification.h1Result.observedDelta, 80);
});
