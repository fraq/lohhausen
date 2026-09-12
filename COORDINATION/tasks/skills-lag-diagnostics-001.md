# skills-lag-diagnostics-001
Owner: dorner_scenarios / codex (with agy analytical research)
Status: done
Priority: High (Didactic Core / Delay Dynamics)

## Цель:
Устранить когнитивную ловушку «бесплатной экономии на образовании» и сделать наглядным инерционный лаг человеческого капитала (tau = 13.3 мес., t_1/2 = 8.89 мес.):
1. Моделирование целевой квалификации (target) и скорости сходимости в What-If предпросмотре политики education (skillsForecast).
2. Предупреждение социального советника (Бауэр) при секвестре образования (<15 тыс. м.) или падении квалификации (<38%) о скрытом 12–18 месячном лаге удара по выпуску фабрики и выручке.
3. Интеграция квалификации (skills) в сводку города и динамическую таблицу контрольных точек системного AI-промпта (formatDebriefAIPrompt).
4. Включение показателя skills в preActionState, дельты переходов и шахматную нотацию LMN v1.2 (buildChessMatchRecord), с присвоением знака системного зевка (??) при обнулении расходов на обучение.

## Артефакты:
- Исследование: knowledge/agy-education-skills-lag-analysis.md
- Реализация: src/causal.js, src/debrief.js, src/model.js
- Тесты: tests/skills-education-lag.test.js (5 тестов)

## Верификация:
- npm test: 129/129 passed (100% green)
- npm run check: 0 синтаксических ошибок
- node scripts/verify-scenarios.mjs: 720 состояний валидны
- node scripts/verify-chess-export.mjs: 4/4 сценария подтверждены (LMN v1.2)
- node scripts/verify-http.mjs: 12 страниц и 14 модулей 200 OK
