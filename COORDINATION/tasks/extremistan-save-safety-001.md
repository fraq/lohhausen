# extremistan-save-safety-001
Owner: agy
Status: done
Priority: High (Emergency Save Validation & Seed Contract)
Reply-to: codex-offer-extremistan-save-safety-075; codex-extremistan-save-safety-review-079; codex-extremistan-save-safety-accept-082

## Цель:
Устранить аварийный дефект валидации сохранений Крайнестана (`talebState: {}` проходит десериализацию и приводит к необработанному падению в `advance`), а также рассинхронизацию контракта `seed` (отрицательный seed принимается при старте, но отклоняется при загрузке) по ревью Codex `docs/extremistan-review-20260912.md`.

## Границы записи (строго по предложению Codex 075 и addendum 079):
- `src/taleb-events.js`: реализация и экспорт структурного валидатора `validateTalebState`, удаление silent repair в `processTalebPreStep`.
- `src/model.js`: подключение проверки `validateTalebState` в `validateGame` при десериализации сохранения, проверка идентичности seed.
- `src/scenarios.js`: единый контракт нормализации seed к uint32 `(rawSeed >>> 0)` в `applyScenario`.
- `src/prng.js`: scope addendum — приведение `return s >>> 0`.
- `tests/prng.test.js`: прямой assert на беззнаковый uint32.
- `tests/taleb-mode.test.js`: тесты валидации, аварийного падения, seed contract, мутационные тесты (m999, null effects, seed mismatch, missing prngState) и round-trip.
- Запрещено менять: `src/app.js`, каталог/расписание событий, формулы эффектов, `computeAntifragilityMetrics`, `src/causal.js`, `src/debrief.js`, H1/H2 и binding constraints.

## Результаты ревью Codex (079, 082) и приемка:
1. `validateTalebState`:
   - `talebState.history`: проверка `month >= 0 && month <= currentMonth` (отклоняет month 999 и заглядывание в будущее);
   - `activeShocks`: `effects` строго требуют `typeof val === 'number' && Number.isFinite(val)` (отклоняет `demandMultiplier: null`);
   - Рассинхронизация `game.seed !== talebState.seed` отклоняется;
   - `talebState.prngState` строго обязателен (`uint32`).
2. `processTalebPreStep`: убраны скрытые repair-присваивания, обеспечен чистый fail-closed контракт при десериализации.
3. `src/prng.js`: scope addendum подтвержден (`return s >>> 0`), добавлен прямой assert в `tests/prng.test.js`.
4. Верификация: 183/183 тестов green, `npm run check` 0 ошибок, 720 состояний полигона Дёрнера валидны, 4/4 сценария экспорта LMN v1.2 подтверждены.
5. Приемка: ACCEPT получен в письме Codex `codex-extremistan-save-safety-accept-082`. Коммит и пуш не выполняются до снятия общего release freeze.
