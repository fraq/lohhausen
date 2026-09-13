import test from "node:test";
import assert from "node:assert/strict";
import { createGame, advance, serializeGame, deserializeGame } from "../src/model.js";
import { createPRNG } from "../src/prng.js";
import {
  TALEB_EVENTS,
  initTalebState,
  processTalebPreStep,
  computeAntifragilityMetrics
} from "../src/taleb-events.js";
import {
  SCENARIOS,
  getScenario,
  getScenariosList,
  applyScenario,
  evaluateScenario,
  getScenarioBenchmark
} from "../src/scenarios.js";

test("prng: Mulberry32 детерминированно воспроизводит одинаковую последовательность", () => {
  const prng1 = createPRNG(42);
  const prng2 = createPRNG(42);
  for (let i = 0; i < 50; i += 1) {
    assert.equal(prng1.next(), prng2.next());
  }

  const prng3 = createPRNG(12345);
  assert.notEqual(prng1.next(), prng3.next());
});

test("prng: генерация степенного распределения Парето (Крайнестан)", () => {
  const prng = createPRNG(777);
  const samples = [];
  for (let i = 0; i < 1000; i += 1) {
    samples.push(prng.pareto(1.5, 10));
  }
  assert.ok(samples.every((x) => x >= 10));
  const maxVal = Math.max(...samples);
  // В распределении с толстым хвостом максимум существенно превосходит медиану
  assert.ok(maxVal > 100, "Максимальное значение должно отражать толстый хвост");
});

test("taleb-events: каталог содержит ключевые категории Черных лебедей", () => {
  assert.ok(TALEB_EVENTS.quartz_crisis);
  assert.ok(TALEB_EVENTS.sanitary_crisis);
  assert.ok(TALEB_EVENTS.credit_crunch);
  assert.ok(TALEB_EVENTS.boiler_failure);
  assert.ok(TALEB_EVENTS.luxury_watch_boom);
  assert.ok(TALEB_EVENTS.distressed_asset_sale);
  assert.ok(TALEB_EVENTS.thermal_spring_discovery);
  assert.ok(TALEB_EVENTS.media_panic);
});

test("scenarios: extremistan_challenge доступен и корректно сконфигурирован", () => {
  const scenario = getScenario("extremistan_challenge");
  assert.equal(scenario.id, "extremistan_challenge");
  assert.equal(scenario.horizon, 60);
  assert.equal(scenario.duration, 60);
  assert.equal(scenario.objectives.length, 4);

  // Проверка разделения канонического списка и полного
  const canonicalList = getScenariosList();
  assert.equal(canonicalList.length, 4);
  assert.ok(!canonicalList.some((s) => s.id === "extremistan_challenge"));

  const fullList = getScenariosList({ all: true });
  assert.equal(fullList.length, 5);
  assert.ok(fullList.some((s) => s.id === "extremistan_challenge"));
});

test("scenarios: applyScenario инициализирует extremistan_challenge с детерминированным сидом", () => {
  const base = createGame();
  const game = applyScenario(base, "extremistan_challenge", 19870505);

  assert.equal(game.scenarioId, "extremistan_challenge");
  assert.equal(game.horizon, 60);
  assert.equal(game.treasury, 900);
  assert.equal(game.debt, 0);
  assert.equal(game.seed, 19870505);
  assert.ok(game.talebState);
  assert.ok(Array.isArray(game.talebState.scheduledEvents));
  assert.ok(game.talebState.scheduledEvents.length >= 4);
});

test("taleb-mode: 60-месячная симуляция Крайнестана 100% воспроизводима при одинаковом сиде", () => {
  const run1 = advance(applyScenario(createGame(), "extremistan_challenge", 12345), 60);
  const run2 = advance(applyScenario(createGame(), "extremistan_challenge", 12345), 60);

  assert.equal(run1.month, 60);
  assert.equal(run2.month, 60);
  assert.equal(run1.treasury, run2.treasury);
  assert.equal(run1.debt, run2.debt);
  assert.equal(run1.population, run2.population);
  assert.equal(run1.equipment, run2.equipment);
  assert.equal(run1.satisfaction, run2.satisfaction);
  assert.deepEqual(run1.events, run2.events);
  assert.equal(run1.journal.length, run2.journal.length);
});

test("taleb-mode: сохранение и загрузка партии сериализует seed и talebState без ошибок", () => {
  const game = advance(applyScenario(createGame(), "extremistan_challenge", 999), 25);
  const serialized = serializeGame(game);
  assert.equal(typeof serialized, "string");

  const restored = deserializeGame(serialized);
  assert.ok(!(restored instanceof Error));
  assert.equal(restored.seed, 999);
  assert.equal(restored.scenarioId, "extremistan_challenge");
  assert.equal(restored.month, 25);
  assert.deepEqual(restored.talebState.scheduledEvents, game.talebState.scheduledEvents);
});

test("taleb-mode: расчет метрик антихрупкости (Triad, Slack, Turkey Index, Barbell)", () => {
  const game = advance(applyScenario(createGame(), "extremistan_challenge", 54321), 60);
  const metrics = computeAntifragilityMetrics(game);

  assert.ok(["antifragile", "robust", "fragile"].includes(metrics.classification));
  assert.ok(typeof metrics.triadTitle === "string");
  assert.ok(typeof metrics.verdict === "string");
  assert.ok(typeof metrics.turkeyIndex === "number");
  assert.ok(typeof metrics.slackScore === "number");
  assert.ok(typeof metrics.barbellCompliance === "number");
  assert.ok(typeof metrics.survivedSwans === "number");
});

test("scenarios: бенчмарки Конрада и Маркуса для extremistan_challenge", () => {
  const benchmark = getScenarioBenchmark("extremistan_challenge");
  assert.ok(benchmark.conrad);
  assert.ok(benchmark.marcus);
  assert.ok(benchmark.conrad.name.includes("Антихрупкость"));
  assert.ok(benchmark.marcus.name.includes("индейки"));
  assert.equal(benchmark.conrad.finalDebt, 0);
  assert.ok(benchmark.marcus.finalDebt > 10000);
});

test("taleb-mode: deserializeGame отвергает поврежденный talebState ({}, не-массивы, невалидные поля)", () => {
  const baseGame = applyScenario(createGame(), "extremistan_challenge", 12345);
  const validJson = serializeGame(baseGame);

  // 1. talebState: {} должен отвергаться
  const corruptEmpty = JSON.parse(validJson);
  corruptEmpty.talebState = {};
  const resEmpty = deserializeGame(JSON.stringify(corruptEmpty));
  assert.ok(resEmpty instanceof Error, "Пустой объект talebState должен возвращать Error");

  // 2. Отсутствие или не-массив scheduledEvents
  const corruptNoScheduled = JSON.parse(validJson);
  corruptNoScheduled.talebState.scheduledEvents = "not_an_array";
  assert.ok(deserializeGame(JSON.stringify(corruptNoScheduled)) instanceof Error);

  // 3. Отсутствие или не-массив activeShocks
  const corruptNoActive = JSON.parse(validJson);
  corruptNoActive.talebState.activeShocks = null;
  assert.ok(deserializeGame(JSON.stringify(corruptNoActive)) instanceof Error);

  // 4. Отсутствие или не-массив history
  const corruptNoHist = JSON.parse(validJson);
  corruptNoHist.talebState.history = 123;
  assert.ok(deserializeGame(JSON.stringify(corruptNoHist)) instanceof Error);

  // 5. Неизвестный eventId в scheduledEvents
  const corruptUnknownEvent = JSON.parse(validJson);
  corruptUnknownEvent.talebState.scheduledEvents = [{ month: 12, eventId: "alien_invasion" }];
  assert.ok(deserializeGame(JSON.stringify(corruptUnknownEvent)) instanceof Error);

  // 6. Невалидный месяц (> horizon)
  const corruptMonth = JSON.parse(validJson);
  corruptMonth.talebState.scheduledEvents = [{ month: 999, eventId: "quartz_crisis" }];
  assert.ok(deserializeGame(JSON.stringify(corruptMonth)) instanceof Error);

  // 7. Невалидный monthsRemaining в activeShocks
  const corruptRemaining = JSON.parse(validJson);
  corruptRemaining.talebState.activeShocks = [{ eventId: "quartz_crisis", monthsRemaining: 0 }];
  assert.ok(deserializeGame(JSON.stringify(corruptRemaining)) instanceof Error);

  // 8. Нечисловой эффект в activeShocks
  const corruptEffect = JSON.parse(validJson);
  corruptEffect.talebState.activeShocks = [{
    eventId: "quartz_crisis",
    monthsRemaining: 5,
    effects: { demandMultiplier: "broken_number" }
  }];
  assert.ok(deserializeGame(JSON.stringify(corruptEffect)) instanceof Error);
});

test("taleb-mode: deserializeGame отвергает мутации Codex 079 (history month > game.month, null-эффекты, seed mismatch, missing prngState)", () => {
  const baseGame = applyScenario(createGame(), "extremistan_challenge", 12345);
  const validJson = serializeGame(baseGame);

  // 1. history month > game.month (m=999 или m=10 при game.month=0)
  const corruptHistMonth = JSON.parse(validJson);
  corruptHistMonth.talebState.history = [{ month: 999, eventId: "quartz_crisis" }];
  assert.ok(deserializeGame(JSON.stringify(corruptHistMonth)) instanceof Error, "History month 999 должен отвергаться");

  const corruptHistFuture = JSON.parse(validJson);
  corruptHistFuture.talebState.history = [{ month: 10, eventId: "quartz_crisis" }];
  assert.ok(deserializeGame(JSON.stringify(corruptHistFuture)) instanceof Error, "History month > game.month должен отвергаться");

  // 2. active shock с effects: { demandMultiplier: null }
  const corruptNullEffect = JSON.parse(validJson);
  corruptNullEffect.talebState.activeShocks = [{
    eventId: "quartz_crisis",
    monthsRemaining: 5,
    effects: { demandMultiplier: null }
  }];
  assert.ok(deserializeGame(JSON.stringify(corruptNullEffect)) instanceof Error, "Active shock с null effect должен возвращать Error");

  // 11. Рассинхронизация seed между game.seed и talebState.seed
  const corruptSeedMismatch = JSON.parse(validJson);
  corruptSeedMismatch.seed = 123;
  corruptSeedMismatch.talebState.seed = 456;
  assert.ok(deserializeGame(JSON.stringify(corruptSeedMismatch)) instanceof Error, "Рассинхронизация seed metadata обязана возвращать Error");

  // 12. Отсутствующий talebState.prngState
  const corruptNoPrng = JSON.parse(validJson);
  delete corruptNoPrng.talebState.prngState;
  assert.ok(deserializeGame(JSON.stringify(corruptNoPrng)) instanceof Error, "Отсутствующий prngState обязан возвращать Error");
});

test("taleb-mode: отрицательный seed нормализуется в uint32 и проходит round-trip", () => {
  const game = applyScenario(createGame(), "extremistan_challenge", -1);
  assert.ok(Number.isInteger(game.seed) && game.seed >= 0, `Seed должен быть нормализован в uint32: got ${game.seed}`);
  assert.equal(game.seed, 4294967295);

  const serialized = serializeGame(game);
  const restored = deserializeGame(serialized);
  assert.ok(!(restored instanceof Error), `Сохранение с нормализованным seed обязано загружаться: ${restored}`);
  assert.equal(restored.seed, 4294967295);
});

test("taleb-mode: round-trip валидного состояния на старте (0), середине (25) и горизонте (60)", () => {
  for (const m of [0, 25, 60]) {
    const game = advance(applyScenario(createGame(), "extremistan_challenge", 777), m);
    const serialized = serializeGame(game);
    const restored = deserializeGame(serialized);

    assert.ok(!(restored instanceof Error), `Ошибка десериализации на месяце ${m}: ${restored}`);
    assert.equal(restored.month, m);
    assert.equal(restored.scenarioId, "extremistan_challenge");
    assert.equal(restored.seed, 777);
    assert.deepEqual(restored.talebState.scheduledEvents, game.talebState.scheduledEvents);
    assert.deepEqual(restored.talebState.activeShocks, game.talebState.activeShocks);
    assert.deepEqual(restored.talebState.history, game.talebState.history);
  }
});

test("taleb-mode: сохранение без talebState сохраняет 100% обратную совместимость", () => {
  const sandbox = createGame();
  const serialized = serializeGame(sandbox);
  const restored = deserializeGame(serialized);

  assert.ok(!(restored instanceof Error));
  assert.equal(restored.talebState, undefined);
  assert.ok(restored.scenarioId === undefined || restored.scenarioId === "sandbox");
});
