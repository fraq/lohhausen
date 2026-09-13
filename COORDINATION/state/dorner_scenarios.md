# dorner_scenarios (Руководитель проекта / Project Lead)

Дата: 2026-09-12.
Роль: Project Lead & Scenario Architect (руководство проектом по поручению пользователя).
Идентификатор: `dorner_scenarios`

## Текущий статус проекта:
- **Устранены все замечания ревью Codex (`codex-ballistic-implementation-review-064` и `codex-recurrence-counterexample-068`) по задаче `debrief-followup-fix-001`**:
  * **Разрешение контрпримера Codex 068**: сырой подсчет строк проектов заменен на группировку по независимым возможностям контроля (`independentFollowupOpportunities = unique(month, expectedReport)`) и периодам завершения (`independentDecisionEpochs = unique(completeMonth)`). Параллельные проекты в одном месяце (контрпример Codex: 2 туризма в месяце 6) делят одну возможность отчета и не вызывают ложного срабатывания архетипа `ballistic`. Рекуррентность активируется строго при $\ge 2$ независимых возможностях в $\ge 2$ расчетных периодах.
  * **Терминальный горизонт**: проект, завершившийся на горизонте сценария (`game.month === game.horizon`), сохраняет статус `followup_pending` (`detected = false`, `severity = 'none'`), предоставляя игроку финальную возможность контроля.
  * **Трассировка #11628 и 9 критериев**: в `tests/debrief-regressions.test.js` включена последовательность: завершение на месяце 6 $\to$ несвязанное действие `setPolicies` в месяце 6 (статус остается pending) $\to$ запрос профильного отчета `requestReport('tourism')` в месяце 6 (статус переходит в `cleared`).
  * **Публичная атрибуция**: в коде `src/debrief.js` и карточке `COORDINATION/tasks/debrief-followup-fix-001.md` зафиксированы ссылки на реплику #11628, контрпример Codex 068 и реплику #11637.
  * **Устранение дефекта Oversteerer**: в `src/debrief.js` устранен ложный fallback на профиль «Нетерпеливый регулятор» при отсутствии индикатора `lag_ignorance`.
  * **Отправлен ответ Codex**: `COORDINATION/mail/codex/20260912T220000Z-dorner_scenarios-recurrence-grouping-rule-resolved.md`.
- **Указания пользователя от 2026-09-13**:
  1. «публикацию пока не делаем» — любые внешние публикации (Get Posting Board, GitHub Pages) строго заморожены.
  2. «Крайнестан изолируем, устраняем аварийные дефекты отдельной принятой задачей» — режим «Вызов Крайнестана» изолирован от канонических сценариев Дёрнера. Аварийные дефекты сохранений и seed решаются строго через отдельную согласованную задачу (`extremistan-save-safety-001` / `extremistan-repair-001`) без преждевременных правок исходников.
  3. «а cc7be0e ревьюим отдельно. Вариант 2 в предложенном виде тоже слишком широк: он предлагает выкатить H1/H2 и binding constraints, которые еще не приняты» — статус коммита `cc7be0e` остается strictly read-only review, выкатка отменена, задачи `competing-hypotheses-journal-001` и `binding-constraints-001` зафиксированы в статусе `review (pending Codex acceptance)` без объявления `done`.
- **Входящие письма от Codex**:
  * `codex-extremistan-review-072` (CHANGES_REQUESTED по Крайнестану, запрет правок без отдельной карточки).
  * `codex-extremistan-reproduction-073` (воспроизведение дефектов month 0 `antifragile`, `talebState: {}`, seed -1).
  * Отправлен ответ-подтверждение: `COORDINATION/mail/codex/20260913T084500Z-dorner_scenarios-extremistan-review-ack-and-scope-boundary.md` (ID: `dorner_scenarios-extremistan-review-ack-074`).
- **Тестовый контур**: **181/181 green** (`npm test`), синтаксис проверен (`npm run check`, 0 ошибок), 720 состояний полигона верифицированы, 4/4 сценария экспорта LMN v1.2 подтверждены.

## Границы ответственности:
- Руководство проектом и дидактическая архитектура (по поручению пользователя).
- Личный ящик: `COORDINATION/mail/dorner_scenarios/`

