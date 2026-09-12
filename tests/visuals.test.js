import test from 'node:test';
import assert from 'node:assert/strict';

import { renderCausalLoopDiagram, renderBenchmarkComparisonChart, renderSystemicRadarChart } from '../src/visuals.js';
import { CAUSAL_LOOPS } from '../src/causal.js';
import { createGame } from '../src/model.js';

test('visuals: renderCausalLoopDiagram генерирует валидный SVG для налоговой петли', () => {
  const loop = CAUSAL_LOOPS.find(l => l.id === 'tax_loop');
  assert.ok(loop, 'Петля tax_loop должна существовать в CAUSAL_LOOPS');

  const svg = renderCausalLoopDiagram(loop);
  assert.equal(typeof svg, 'string');
  assert.ok(svg.startsWith('<svg'), 'Должен начинаться с тега <svg');
  assert.ok(svg.includes('</svg>'), 'Должен содержать закрывающий тег </svg>');
  assert.ok(svg.includes('viewBox="0 0 720 280"'), 'Должен содержать корректный viewBox');

  // Проверяем наличие всех узлов
  for (const node of loop.nodes) {
    assert.ok(svg.includes(node), `SVG должен отображать узел «${node}»`);
  }

  // Проверяем наличие маркеров стрелок и центрального бейджа контура
  assert.ok(svg.includes('id="causal-arrow"'), 'Должен определять маркер стрелки');
  assert.ok(svg.includes('causal-center-badge'), 'Должен содержать центральный символ контура');
});

test('visuals: renderCausalLoopDiagram отображает маркер временного лага для жилищной петли', () => {
  const loop = CAUSAL_LOOPS.find(l => l.id === 'housing_lag_loop');
  const svg = renderCausalLoopDiagram(loop);

  assert.ok(svg.includes('⏳') || svg.includes('лаг') || svg.includes('delay'), 'Должен содержать индикатор временной задержки');
});

test('visuals: renderCausalLoopDiagram не дублирует бейджи лагов и не создает наложенных текстов', () => {
  const loop = CAUSAL_LOOPS.find(l => l.id === 'housing_lag_loop');
  const svg = renderCausalLoopDiagram(loop);

  // Ровно один бейдж задержки на контуре
  const delayBadgeMatches = (svg.match(/class="causal-delay-badge"/g) || []).length;
  assert.equal(delayBadgeMatches, 1, 'На жилищной петле должен быть ровно один маркер задержки строительства');

  // Узлы не должны содержать дублирующего наложенного текста
  assert.doesNotMatch(svg, /y="247"/, 'Не должно быть наложенного текста под узлом строительства');
  assert.doesNotMatch(svg, /y="207"/, 'Не должно быть ошибочного лага под потребностью в жилье');
});

test('visuals: renderCausalLoopDiagram корректно отличает балансирующие и усиливающие контуры', () => {
  const reinforcingLoop = CAUSAL_LOOPS.find(l => l.id === 'debt_spiral');
  const svgR = renderCausalLoopDiagram(reinforcingLoop);
  assert.ok(svgR.includes('🔄') || svgR.includes('R') || svgR.includes('Усиливающий'), 'Должен определять петлю как усиливающую');

  const balancingLoop = CAUSAL_LOOPS.find(l => l.id === 'tax_loop');
  const svgB = renderCausalLoopDiagram(balancingLoop);
  assert.ok(svgB.includes('⚖️') || svgB.includes('B') || svgB.includes('Балансирующий'), 'Должен определять петлю как балансирующую');
});

test('visuals: renderCausalLoopDiagram безопасно обрабатывает пустые или некорректные входные данные', () => {
  const svgNull = renderCausalLoopDiagram(null);
  assert.equal(typeof svgNull, 'string');
  assert.ok(svgNull.startsWith('<svg'));

  const svgEmpty = renderCausalLoopDiagram({ nodes: [] });
  assert.equal(typeof svgEmpty, 'string');
  assert.ok(svgEmpty.startsWith('<svg'));
});

test('visuals: renderBenchmarkComparisonChart строит SVG сопоставления игрока, Конрада и Маркуса', () => {
  const chart = renderBenchmarkComparisonChart({
    playerHistory: [
      { month: 0, value: 24 },
      { month: 6, value: 32 },
      { month: 12, value: 45 },
      { month: 18, value: 60 },
      { month: 24, value: 72 },
    ],
    conradTrajectory: [24, 30, 42, 56, 68],
    marcusTrajectory: [24, 21, 18, 14, 11],
    metricLabel: 'Состояние оборудования',
    unit: '%',
    horizon: 24,
  });

  assert.equal(typeof chart, 'string');
  assert.ok(chart.startsWith('<svg'));
  assert.ok(chart.includes('</svg>'));
  assert.ok(chart.includes('Игрок') || chart.includes('Вы'));
  assert.ok(chart.includes('Конрад'));
  assert.ok(chart.includes('Маркус'));
  assert.ok(chart.includes('viewBox="0 0 720 260"'));
});

test('visuals: renderBenchmarkComparisonChart renders historical comparison when previousTrajectory is provided', () => {
  const chart = renderBenchmarkComparisonChart({
    playerHistory: [
      { month: 0, value: 24 },
      { month: 12, value: 50 },
    ],
    conradTrajectory: [24, 60],
    marcusTrajectory: [24, 15],
    previousTrajectory: [
      { month: 0, value: 24 },
      { month: 12, value: 30 },
    ],
    metricLabel: 'Состояние оборудования',
    unit: '%',
    horizon: 12,
  });

  assert.equal(typeof chart, 'string');
  assert.ok(chart.includes('Прошлая'));
  assert.ok(chart.includes('#6b5b95'));
});


test('visuals: renderSystemicRadarChart produces valid SVG and includes critical 40% ring', () => {
  const game = createGame();
  const svg = renderSystemicRadarChart(game);
  assert.equal(typeof svg, 'string');
  assert.ok(svg.startsWith('<svg') || svg.trimStart().startsWith('<svg'), 'SVG should start with <svg');
  assert.ok(svg.includes('class="systemic-radar"'), 'Should have class attribute');
  assert.ok(svg.includes('#c62828'), 'Critical ring should be red');
  assert.ok(svg.includes('</svg>'), 'Should have closing </svg>');
  assert.ok(svg.includes('polygon'), 'Should contain data polygon');
});

test('visuals: renderSystemicRadarChart supports custom translated labels and dimensions', () => {
  const game = createGame();
  const svg = renderSystemicRadarChart(game, {
    width: 320,
    height: 320,
    labels: {
      production: 'Produktion',
      fiscal: 'Finanzen',
      housing: 'Wohnen',
      services: 'Dienste',
      satisfaction: 'Zufriedenheit',
    },
  });
  assert.ok(svg.includes('viewBox="0 0 320 320"'));
  assert.ok(svg.includes('Produktion'));
  assert.ok(svg.includes('Finanzen'));
  assert.ok(svg.includes('Wohnen'));
  assert.ok(svg.includes('Dienste'));
  assert.ok(svg.includes('Zufriedenheit'));
});

test('visuals: renderSystemicRadarChart renders ghost baseline polygon when history > 1', () => {
  const game = createGame();
  const svg0 = renderSystemicRadarChart(game);
  assert.ok(!svg0.includes('stroke="#7d786d" stroke-width="1.8"'));

  game.month = 1;
  game.history.push({ ...game.history[0], month: 1, satisfaction: 75 });
  const svg1 = renderSystemicRadarChart(game);
  assert.ok(svg1.includes('stroke="#7d786d" stroke-width="1.8"'));
  assert.ok(svg1.includes('stroke-dasharray="3 3"'));
});

test('radar never substitutes current service quality for missing historical observations', () => {
  const game = createGame();
  game.history.push({ ...game.history[0], month: 1 });
  const initial = renderSystemicRadarChart(game).match(/<polygon[^>]*stroke="#7d786d"[^>]*>/)?.[0];
  game.serviceQuality = 5;
  assert.equal(renderSystemicRadarChart(game).match(/<polygon[^>]*stroke="#7d786d"[^>]*>/)?.[0], initial);
  delete game.history[0].serviceQuality;
  assert.doesNotMatch(renderSystemicRadarChart(game), /<polygon[^>]*stroke="#7d786d"/);
});
