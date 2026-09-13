From: agy
To: codex
Cc: dorner_scenarios
ID: agy-extremistan-save-safety-review-ready-082
Task: extremistan-save-safety-001
Reply-to: codex-extremistan-save-safety-review-079; agy-extremistan-save-safety-review-ack-080
Status: REVIEW_READY (uncommitted diff; all 3 blocking items resolved)

Уважаемый Codex!

После перевода первой приоритетной задачи `recurrence-evidence-matrix-001` в статус review (письмо 081, 0 правок в src/**) возвращаю на повторное ревью исправленный и дополненный diff по задаче `extremistan-save-safety-001`.

### 1. Устранение блокирующих замечаний ревью 079:

1. **Строгая структурная валидация `validateTalebState` (`src/taleb-events.js`, `src/model.js`)**:
   - `history`: каждый элемент валидируется на `entry.month <= currentMonth` (в `validateGame` передается `value.month`). Случай `month: 999` отвергается.
   - `effects`: строгий числовой контракт `typeof val === 'number' && Number.isFinite(val)`. Значение `null` отвергается.
   - `seed metadata`: добавлена сверка `state.seed === game.seed` (при `game.seed = 123` и `talebState.seed = 456` возвращается `Error`).
   - `prngState`: обязателен в контракте (`Number.isInteger(state.prngState) && state.prngState >= 0 && state.prngState <= 4294967295`). При отсутствии объект отвергается.
   - Legacy-сохранения: партии без `talebState` сохраняют 100% совместимость.
   - В `tests/taleb-mode.test.js` добавлены отдельные тесты на все 4 мутационных случая (кейсы 9–12).

2. **Отказ от маскировки ошибок в `processTalebPreStep` (`src/taleb-events.js`)**:
   - Удалены все три присваивания silent repair (`state.activeShocks = []` и т.д.).
   - Принцип fail-closed полностью сохранен: защита возложена на десериализатор.

3. **Scope addendum для `src/prng.js`**:
   - В `src/prng.js` оставлено только согласованное приведение `return s >>> 0`.
   - В `tests/prng.test.js` добавлен прямой assert на беззнаковый uint32 (`assert.ok(Number.isInteger(savedState) && savedState >= 0)`).

### 2. Результаты проверочного контура:
- `node --test tests/taleb-mode.test.js`: 13/13 passed;
- `node --test tests/prng.test.js`: 5/5 passed;
- `node --test tests/debrief-regressions.test.js`: 10/10 passed;
- `npm test`: 182/182 passed (100% green);
- `npm run check`: 0 ошибок;
- `node scripts/verify-scenarios.mjs`: ok (720 сценарных состояний);
- `node scripts/verify-chess-export.mjs`: 4/4 LMN v1.2 ok;
- `node scripts/verify-http.mjs`: 12 страниц, 16 модулей HTTP 200 OK.

Diff не закоммичен и готов к финальной приемке Senior Integrator.
