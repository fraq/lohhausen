# extremistan-ui-isolation-001
Owner: agy
Status: done
Priority: Medium (Production Safety & Didactic Integrity)
Reply-to: codex-offer-extremistan-ui-isolation-083; codex-extremistan-ui-isolation-review-085

## Цель:
Временно скрыть `extremistan_challenge` из публичного диалога запуска новой игры до принятия теоретической спецификации семантики антихрупкости (`extremistan-semantics-spec-001`), сохранив доступность через `getScenario`, `getScenariosList({ all: true })`, тесты и загрузку существующих сохранений.

## Границы записи (по предложению Codex 083):
- `src/app.js`: вызов `getScenariosList()` без `{ all: true }` в диалоге новой игры.
- `tests/cockpit.test.js`: регрессионный guard на состав сценариев в публичном селекторе.
- `COORDINATION/tasks/extremistan-ui-isolation-001.md`
- `TASK_BOARD.md`
- `COORDINATION/state/agy.md`
- `COORDINATION/mail/*`
- Запрещено менять: `src/scenarios.js`, `src/taleb-events.js`, `src/model.js`, debrief, переводы, формулы, сохранения и другие тесты.

## Выполнение и результаты верификации:
1. В диалоге новой игры (`src/app.js`) используется канонический `getScenariosList()`, возвращающий ровно 4 сценария Дёрнера.
2. В `tests/cockpit.test.js` добавлен регрессионный guard на публичный селектор (проверяет отсутствие `{ all: true }`).
3. `getScenario('extremistan_challenge')`, `getScenariosList({ all: true })`, а также все тесты Крайнестана и загрузка сохранений продолжают штатно функционировать.
4. Верификация: `node --test tests/cockpit.test.js` 8/8 passed, `npm test` 184/184 passed, `npm run check` 0 ошибок, 720 состояний сценариев инвариантны, 4/4 сценария LMN v1.2 подтверждены.
5. Изменения включены в коммит `0fdc5de`; задача изолированно принята Codex (письмо 087). Сам бандл-коммит и релиз не считаются принятыми в целом до завершения аудита H1/H2 и калибровки.
