import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createGame, setPolicies, startProject, advance, serializeGame, deserializeGame, POLICY_CONFIG } from '../src/model.js';

const scenarios = [];
const near = (actual, expected, label) => assert(Math.abs(actual - expected) < 0.00001, label);
function finiteTree(value) {
  if (typeof value === 'number') assert(Number.isFinite(value));
  else if (value && typeof value === 'object') Object.values(value).forEach(finiteTree);
}
function run(name, initial) {
  let game = initial;
  for (let month = 1; month <= 120; month += 1) {
    const previous = game;
    game = advance(game, 1);
    finiteTree(game);
    near(game.inventory, previous.inventory + game.production - game.sales, `${name}: stock`);
    near(game.treasury - game.debt, previous.treasury - previous.debt + game.lastBudget.net, `${name}: budget`);
    assert(game.factoryJobs + game.otherJobs + game.tourismJobs <= game.workforce + 0.00001, `${name}: workforce`);
    for (const key of ['treasury', 'debt', 'inventory', 'production', 'sales', 'unemployment', 'housingShortage']) assert(game[key] >= 0, key);
    for (const key of ['equipment', 'skills', 'education', 'health', 'serviceQuality', 'satisfaction']) assert(game[key] >= 0 && game[key] <= 100, key);
    assert(game.visitors <= game.tourismCapacity + 0.00001);
    assert(game.visitors <= game.tourismDemand + 0.00001);
    assert.equal(game.history.length, month + 1);
    assert.deepEqual(deserializeGame(serializeGame(game)), game);
  }
  scenarios.push(Object.fromEntries([['name', name], ...['month', 'population', 'treasury', 'debt', 'equipment', 'production', 'satisfaction', 'housingShortage'].map(key => [key, game[key]])]));
  return game;
}

const idle = run('Бездействие', createGame());
const policies = { taxRate: 22, maintenance: 30, services: 82, education: 38, marketing: 42 };
const investmentStart = startProject(startProject(setPolicies(createGame(), policies), 'housing'), 'modernization');
const balanced = run('Согласованный план', investmentStart);
assert(balanced.treasury - balanced.debt > idle.treasury - idle.debt);
assert(balanced.equipment > idle.equipment);
assert(balanced.satisfaction > idle.satisfaction);
for (const [name, bound] of [['Минимальные значения', 'min'], ['Максимальные значения', 'max']]) {
  run(name, setPolicies(createGame(), Object.fromEntries(Object.entries(POLICY_CONFIG).map(([key, config]) => [key, config[bound]]))));
}
const highTax = run('Высокие налоги', setPolicies(investmentStart, { taxRate: 35 }));
assert(highTax.population < balanced.population);
run('Реклама туризма без строительства', setPolicies(createGame(), { tourismMarketing: 60 }));
const ads = advance(setPolicies(createGame(), { tourismMarketing: 60 }), 6);
const infrastructure = advance(startProject(setPolicies(createGame(), { tourismMarketing: 60 }), 'tourism'), 6);
assert.equal(ads.visitors, 20);
assert.equal(infrastructure.visitors, 100);
const result = {
  ok: true, monthlyStates: scenarios.length * 120,
  checks: ['finite', 'stock conservation', 'cash/debt balance', 'single workforce', 'bounds', 'tourism capacity/demand', 'history', 'save round-trip'],
  scenarios, tourism: { adsOnly: ads.visitors, withInfrastructure: infrastructure.visitors },
};
mkdirSync(new URL('../artifacts/', import.meta.url), { recursive: true });
writeFileSync(new URL('../artifacts/scenario-results.json', import.meta.url), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result, null, 2));
