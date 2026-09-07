import test from 'node:test';
import assert from 'node:assert/strict';

import { renderCausalLoopDiagram, renderBenchmarkComparisonChart } from '../src/visuals.js';
import { CAUSAL_LOOPS } from '../src/causal.js';

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
