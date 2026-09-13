# binding-constraints-001
Owner: agy
Status: review (pending Codex acceptance)
Priority: High (Didactic Core / Capital Allocation)
Note: Изменения в коде (коммит cc7be0e) находятся на отдельном ревью у Senior Integrator (Codex) и НЕ приняты. Выкатка приостановлена по указанию пользователя.

## Цель:
Устранить когнитивную ловушку ложного приоритета и омертвления дефицитной ликвидности (Dörner, "Die Logik des Mißlingens", гл. 4: «Цели и приоритеты: планирование в условиях дефицита ресурсов», Theory of Constraints Голдратта):
1. Реализовать `evaluateProjectConstraint(projectKey, game)` в `src/causal.js` для анализа связывающих ограничений инвестиционных проектов:
   - Жилищный фонд: точный расчет времени исчерпания резерва в месяцах (`bufferMonths = surplus / maxImmigrationRate`). При стандартном старте (200 мест запаса, миграция до +2 чел./мес.) запас составляет 100 месяцев; предельная отдача немедленного ввода равна нулю (`marginalPayoffImmediate: false`, `housingScore = 100%`).
   - Фабрика: детектирование износа оборудования (<50%) как первичного связывающего ограничения производительности.
   - Туризм: сопоставление гостиничной емкости с маркетинговым спросом, предотвращение омертвления рекламы при узком горлышке в 20 мест.
2. Калибровать `getProjectAdvisorEndorsement(projectKey, game)`:
   - Архитектор Бауэр предупреждает об избыточном резерве жилья и советует сберечь ликвидность казны, пока резерв не снизится до 60–80 мест, вместо ложного призыва строить при 200 свободных местах.
   - Оценка риска кассового разрыва (`liquidityRisk`: `safe`, `moderate_drain`, `severe_drain`, `infeasible`).
3. Исключить морализаторские или безапелляционные суждения в соответствии с замечаниями Codex 056.

## Артефакты:
- Исследование: `knowledge/agy-binding-constraints-and-capital-allocation.md`
- Реализация: `src/causal.js` (`evaluateProjectConstraint`, `getProjectAdvisorEndorsement`)
- Тесты: `tests/binding-constraints.test.js` (5 тестов)

## Верификация:
- `tests/binding-constraints.test.js`: 5/5 passed (100% green)
- `npm test`: 175/175 passed (100% green)
- `npm run check`: 0 синтаксических ошибок
- `node scripts/verify-scenarios.mjs`: 720 состояний валидны
- `node scripts/verify-chess-export.mjs`: 4/4 сценария подтверждены (LMN v1.2)
- `node scripts/verify-http.mjs`: 12 страниц и 16 модулей 200 OK
