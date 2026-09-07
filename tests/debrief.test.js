import test from 'node:test';
import assert from 'node:assert/strict';

import { analyzeDebrief, formatDebriefMarkdown, formatDebriefJSON, verifyHypotheses } from '../src/debrief.js';
import { createGame, setPolicies, startProject, advance, requestReport } from '../src/model.js';

test('debrief: сбалансированная игра без грубых ловушек получает системный профиль Конрада', () => {
  let game = createGame();
  // Постепенное системное управление с контролем отчетов
  game = requestReport(game, 'factory');
  game = setPolicies(game, { maintenance: 25 }, 'Плановое укрепление оборудования');
  game = advance(game, 6);
  game = requestReport(game, 'factory');
  game = advance(game, 6);

  const analysis = analyzeDebrief(game);

  assert.ok(analysis, 'Анализ должен возвращать объект');
  assert.equal(typeof analysis.summary, 'string');
  assert.equal(analysis.archetype.id, 'conrad');
  assert.equal(analysis.traps.filter(t => t.severity === 'high').length, 0);
  assert.ok(Array.isArray(analysis.reflectionQuestions));
  assert.ok(analysis.reflectionQuestions.length >= 3);
});

test('debrief: обнаруживает тематическое блуждание (Thematic Vagabonding) при хаотичной смене сфер', () => {
  let game = createGame();
  // Хаотичные переключения каждый ход между несвязанными сферами
  const steps = [
    { taxRate: 20 },
    { tourismMarketing: 25 },
    { education: 50 },
    { wage: 115 },
    { services: 100 },
    { taxRate: 12 },
    { marketing: 40 },
    { tourismMarketing: 5 },
  ];

  for (const patch of steps) {
    game = setPolicies(game, patch, 'Импульсивное действие');
    game = advance(game, 1);
  }

  const analysis = analyzeDebrief(game);
  const vagabondingTrap = analysis.traps.find(t => t.id === 'thematic_vagabonding');

  assert.ok(vagabondingTrap, 'Должна быть зафиксирована ловушка тематического блуждания');
  assert.equal(vagabondingTrap.detected, true);
  assert.ok(vagabondingTrap.evidence.switchesCount >= 5);
});

test('debrief: обнаруживает инкапсуляцию (Encapsulation) при уходе в туризм на фоне кризиса фабрики', () => {
  let game = createGame();
  // Игнорируем обслуживание фабрики (снижаем до минимума)
  game = setPolicies(game, { maintenance: 0, tourismMarketing: 40 });
  game = advance(game, 12);
  // Запускаем туристические проекты вместо ремонта
  if (game.treasury >= 220) {
    game = startProject(game, 'tourism', 'Очередной парк');
  }
  game = advance(game, 12);
  game = setPolicies(game, { tourismMarketing: 50 });
  game = advance(game, 12);

  const analysis = analyzeDebrief(game);
  const encapsulationTrap = analysis.traps.find(t => t.id === 'encapsulation');

  assert.ok(encapsulationTrap, 'Должна быть обнаружена инкапсуляция');
  assert.equal(encapsulationTrap.detected, true);
  assert.match(encapsulationTrap.description, /туризм|второстепенн/i);
});

test('debrief: обнаруживает баллистический стиль (Ballistic Action) при отсутствии контроля после проектов', () => {
  let game = createGame();
  // Запускаем проект жилья и модернизации, но принципиально не запрашиваем отчеты
  game = startProject(game, 'housing', 'Стройка без контроля');
  game = advance(game, 24);
  game = setPolicies(game, { taxRate: 28 }, 'Резкий подъем налогов без проверки базы');
  game = advance(game, 12);

  const analysis = analyzeDebrief(game);
  const ballisticTrap = analysis.traps.find(t => t.id === 'ballistic_action');

  assert.ok(ballisticTrap, 'Должен быть зафиксирован баллистический стиль');
  assert.equal(ballisticTrap.detected, true);
  assert.ok(ballisticTrap.evidence.unmonitoredInterventions > 0);
});

test('debrief: обнаруживает раскачку системы из-за игнорирования задержек (Lag Ignorance)', () => {
  let game = createGame();
  // Импульсивные повторные изменения налогов каждый месяц без выдержки лага
  game = setPolicies(game, { taxRate: 25 }, 'Поднимаем налог');
  game = advance(game, 1);
  game = setPolicies(game, { taxRate: 32 }, 'Срочно еще поднимаем');
  game = advance(game, 1);
  game = setPolicies(game, { taxRate: 10 }, 'Паника: снижаем');
  game = advance(game, 1);

  const analysis = analyzeDebrief(game);
  const lagTrap = analysis.traps.find(t => t.id === 'lag_ignorance');

  assert.ok(lagTrap, 'Должна быть зафиксирована недооценка временных задержек');
  assert.equal(lagTrap.detected, true);
});

test('debrief: совместим с вызовом как от game, так и от (history, journal, state)', () => {
  const game = createGame();
  const res1 = analyzeDebrief(game);
  const res2 = analyzeDebrief(game.history, game.journal, game);

  assert.deepEqual(res1.archetype, res2.archetype);
  assert.equal(res1.traps.length, res2.traps.length);
});

test('debrief: formatDebriefMarkdown генерирует содержательный отчет для скачивания', () => {
  const game = createGame();
  const analysis = analyzeDebrief(game);
  const md = formatDebriefMarkdown(game, analysis, { status: 'victory' });

  assert.equal(typeof md, 'string');
  assert.match(md, /Итоговый разбор управления городом Лоххаузен/);
  assert.match(md, /Управленческий архетип/);
  assert.match(md, /Население:/);
  assert.match(md, /Вопросы для саморефлексии/);
});

test('debrief: formatDebriefJSON возвращает валидный структурированный JSON', () => {
  const game = createGame();
  const analysis = analyzeDebrief(game);
  const jsonStr = formatDebriefJSON(game, analysis, { status: 'victory' });

  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.scenario, 'sandbox');
  assert.equal(parsed.status, 'victory');
  assert.ok(parsed.archetype);
  assert.ok(Array.isArray(parsed.traps));
  assert.ok(parsed.finalMetrics);
});

test('debrief: verifyHypotheses сопоставляет прогнозы из журнала с исходом завершенных проектов', () => {
  let game = createGame();
  game = startProject(game, 'housing', 'Ожидаю ликвидировать дефицит жилья через год');
  game = advance(game, 12);

  const reflections = verifyHypotheses(game);
  assert.ok(Array.isArray(reflections));
  assert.ok(reflections.length >= 1);
  const ref = reflections[0];
  assert.equal(ref.projectType, 'housing');
  assert.ok(ref.playerNote.includes('Ожидаю'));
  assert.ok(ref.outcomeSummary);
  assert.ok(ref.hindsightLesson);
});

