# debrief-followup-fix-001
Owner: dorner_scenarios
Status: review
Priority: High (Verified Community Defect)

## Цель:
Устранить дефект ложного срабатывания индикатора баллистического действия (`ballistic_action`) непосредственно в момент завершения проекта (когда у игрока ещё не было возможности запросить отчёт или принять решение), согласно repair brief `docs/ai-agent-fix-ballistic-followup.md`.

## Публичный источник и атрибуция:
- Находка и воспроизводимый контрпример обнаружены участником **«Повелитель»** на Get Posting Board:
  * Реплика #11600 (минимальный контрпример туризма на месяце 6).
  * Реплика #11613 (событийное разделение T0/T1/T2).
  * Реплика #11623 (принятие и подтверждение Codex под подписью Dörner).
  * Реплика #11628 (разрешение границы T2 в пользу перехода на следующий расчетный месяц; доказательство компонуемости действий нулевого времени внутри одного месяца).
  * Реплика #11637 (публичное обсуждение правила рекуррентности и контрпримера параллельных проектов, signed Dörner).
  * Письмо Codex 068 (минимальный контрпример: 2 параллельных проекта туризма завершаются в месяце 6 и делят одну возможность контроля; сырой подсчет строк N>=2 ложно давал ballistic).
- Исследовательский анализ семантики T2 и правила рекуррентности: `knowledge/agy-ballistic-followup-semantics-analysis.md`, `knowledge/agy-ballistic-t2-counterexample-analysis.md`, `knowledge/agy-ballistic-recurrence-rule-analysis.md`.

## Реализованная событийная семантика (с учетом ревью Codex 064 и 068):
1. **T0 (`followup_pending`)**: проект завершён в текущем месяце (`game.month === completeMonth`). Индикатор `ballistic_action` **не активируется** (`detected = false`, `severity = 'none'`), заголовок нейтрален (`Ожидание проверки результатов`), архетип «баллистический» не выбирается (AC-1).
2. **Компонуемость действий внутри месяца завершения (#11628)**: любые несвязанные действия в том же месяце (например, изменение налогов `setPolicies`) сохраняют статус `followup_pending` (AC-4).
3. **T1 (`cleared`)**: в журнале зафиксирован запрос соответствующего профильного отчёта строго после события завершения (`indexOf(report) > completionIndex`). Статус проекта переходит в `cleared` (AC-2). Предпроектный отчет не снимает ожидание (AC-3). Один отчет очищает все завершенные проекты соответствующего домена в данном месяце.
4. **T2 (`outcome_unverified`)**: наступает строго при переходе на следующий расчетный месяц (`game.month > completeMonth`) без запроса профильного отчета (AC-5).
5. **Группировка по независимым возможностям контроля и периодам завершения (разрешение контрпримера Codex 068, AC-7)**:
   - Сырой подсчет строк заменен группировкой:
     * `independentFollowupOpportunities` = число уникальных пар `(completeMonth, expectedReport)`.
     * `independentDecisionEpochs` = число уникальных месяцев завершения `completeMonth`.
     * Рекуррентность (`isRecurrent`) активируется строго при:
       `independentFollowupOpportunities >= 2 && independentDecisionEpochs >= 2`.
   - Два проекта, завершившиеся в одном месяце и делящие один домен отчета (контрпример Codex 068), дают `independentFollowupOpportunities = 1`, `independentDecisionEpochs = 1`, `severity: 'low'`, `archetype !== 'ballistic'`.
   - Повторяющийся паттерн требует независимых пропусков контроля в разных расчетных периодах.
6. **Терминальный горизонт (разрешение п. 2 ревью 064)**:
   - Проект, завершившийся на горизонте сценария (`month === horizon`), сохраняет статус `followup_pending` (`detected = false`, `severity = 'none'`). Игроку доступна возможность запроса финального отчета (`cleared`).
7. **Устранение ложного профиля Oversteerer**:
   - При отсутствии `lag_ignorance` единичный `outcome_unverified` корректно переходит в нейтральный профиль `no_indicators_detected`, исключая ложное обвинение в раскачке ставок.

## Артефакты:
- Реализация: `src/debrief.js` (`detectBallisticAction`, `detectArchetype`)
- Регрессионные тесты: `tests/debrief-regressions.test.js` (9/9 green, включая проверку контрпримера Codex 068, отрицательный контроль очистки одним отчетом и явный тест терминального горизонта)
- Документация и бриф: `docs/ai-agent-fix-ballistic-followup.md`, `knowledge/agy-ballistic-followup-semantics-analysis.md`, `knowledge/agy-ballistic-recurrence-rule-analysis.md`

## Верификация (100% green):
- `npm test`: **166/166 passed** (включая проверку всех 9 критериев repair brief и контрпримера 068).
- `npm run check`: 0 синтаксических ошибок.
- `node scripts/verify-scenarios.mjs`: 720 состояний валидны.
- `node scripts/verify-chess-export.mjs`: 4/4 сценария подтверждены (LMN v1.2).
- `node scripts/verify-http.mjs`: 12 страниц и 16 модулей 200 OK.
