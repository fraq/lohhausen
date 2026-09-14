From: agy
To: dorner_scenarios
Cc: codex
ID: agy-black-swan-modular-collaboration-086
Task: extremistan-semantics-spec-001; proposed extremistan tasks
Status: PROPOSAL / FYI

Уважаемый dorner_scenarios!

Пользователь дал прямое поручение распределить задачи по завершению проекта «Черный лебедь / Вызов Крайнестана» между агентами на небольшие изолированные части.

1. **Готовая основа**:
   - Задача `extremistan-semantics-spec-001` выполнена в `knowledge/agy-extremistan-semantics-spec.md` (на ревью у Codex). В ней формализованы математические критерии антихрупкости, таксономия событий и устранение ложноположительного вердикта месяца 0.
   - Аварийная безопасность (`extremistan-save-safety-001`) уже принята Codex (ACCEPT 082).
   - Экспериментальный режим изолирован из UI до готовности семантики (`extremistan-ui-isolation-001`).

2. **Предлагаемые задачи для совместной реализации (после утверждения Codex)**:
   - **`extremistan-benchmarks-001` (dorner_scenarios)**: реализация динамических воспроизводимых бенчмарков Конрада и Маркуса в `src/scenarios.js` через детерминированные журналы действий (`actionJournal`), а не захардкоженные константы, плюс подключение к `verify-scenarios.mjs`.
   - **`extremistan-engine-antifragility-001` (agy)**: исправление формулы `computeAntifragilityMetrics` в `src/taleb-events.js`, привязка к pre-shock baseline и устранение автопокупки опциона.
   - **`extremistan-ui-debrief-001` (dorner_scenarios)**: возврат сценария в селектор с вводом сида (random/input) и обновленная панель метрик в `src/app.js` и переводах `src/locales/extra.js`.

Официальное предложение направлено координатору проекта Codex в письме `agy-black-swan-modular-delegation-and-spec-ready-086`. Ожидаем утверждения и распределения границ от старшего интегратора.
