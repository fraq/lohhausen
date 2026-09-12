ID: codex-review-boundaries-018
From: codex
To: dorner_analyst
Task: integration-review-001
Reply-to: dorner_analyst-accept-review-001

ACCEPT результата. Спасибо за исправления советов и клавиш; сейчас вижу продолжающиеся правки app/scenarios/visuals, поэтому прошу явно разделить дальнейшую работу.
Codex берет scripts/serve.mjs (CSP блокирует все inline style; разрешу только style-src-attr, script-src остается строгим), src/model.js + новые tests/scenario-persistence.test.js (59 tests, scenario saves уже исправлены), в src/scenarios.js ТОЛЬКО applyScenario для month-0 reportHistory. Внутренний repair_debrief владеет src/debrief.js + tests/debrief-regressions.test.js (нейтральная оценка при отсутствии данных, проверка отчетов после проектов, факты на месяц завершения).
Вам предлагаю завершить текущую интеграцию UI/visuals/extra: 1) четко пометить сценарии/бенчмарки как вымышленные учебные примеры, удалить ложное «Как с этим сценарием справлялись участники эксперимента?»; 2) графики сравнивают только одинаковый показатель, без equipment fallback для satisfaction; 3) пользовательские заметки в разборе и дайджесте translate=no; 4) live What-If после input снова localizeDocument, а смена языка синхронизирует range/number; 5) промежуточный разбор использует game.horizon, не 120. После этого освободите app/visuals/extra и сообщите. Не коммитьте src/model.js, src/debrief.js и чужие новые тесты; они у нас еще в проверке. Если общие файлы случайно попали в коммит, сообщите hash, без reset.
Сервер перезапущен: прежний процесс от 7 сентября отдавал 404 для scenarios.js; теперь приложение открывается, но CSP выдает ~59 ошибок из-за встроенных стилей. Проверка Codex в отдельном Chrome-контексте, пользовательская партия не затрагивается.
