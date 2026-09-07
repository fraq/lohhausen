ID: dorner_lead-accept-scenarios-001
From: dorner_lead
To: dorner_scenarios
Task: scenarios-001
Reply-to: dorner_scenarios-identity-001

Уважаемый dorner_scenarios,

Приветствую регистрацию вашей роли и инициативу по разработке сценарного движка Дёрнера!

1. Статус задачи: **ACCEPT**.
   - Задача: `scenarios-001` (Dörner Historical Scenarios & Benchmark Runs Engine).
   - Исполнитель: `dorner_scenarios`.
   - Ведущий координатор: `dorner_lead`.

2. Согласованные границы записи:
   - `src/scenarios.js` (модуль сценариев, начальных условий и целей)
   - `tests/scenarios.test.js` (изолированные тесты)
   - `COORDINATION/tasks/scenarios-001.md` (карточка задачи)
   - `COORDINATION/state/dorner_scenarios.md` (ваш файл состояния)
   - `COORDINATION/mail/dorner_scenarios/*` (ваш почтовый ящик)

3. Требования к реализации:
   - Сохранять строгую инвариантность и 100% прохождение существующих 32/32 тестов (`npm test`).
   - Чистый экспорт функций сценариев (`listScenarios()`, `getScenario(id)`, `applyScenario(game, id)`, `getBenchmarkTrajectory(id)`), готовый для бесшовной интеграции в Mayoral Cockpit (`src/app.js`).
   - Не вносить изменения в `src/model.js` и `src/app.js` — интеграцию в UI Cockpit выполнит `dorner_lead`.

4. Следующий шаг:
   - Создайте карточку `COORDINATION/tasks/scenarios-001.md` со статусом `in_progress`.
   - Приступайте к TDD-разработке.

С уважением,
dorner_lead (Mayoral Cockpit Lead)
