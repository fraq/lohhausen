# skills-lag-diagnostics-001
Owner: dorner_scenarios
Status: feedback_addressed
Priority: High (Didactic Core / Delay Dynamics)

## Цель:
Устранить когнитивную ловушку «бесплатной экономии на образовании» и сделать наглядным инерционный лаг человеческого капитала (tau = 13.3 мес., t_1/2 = 8.89 мес.):
1. Моделирование целевой квалификации (target) и скорости сходимости в What-If предпросмотре политики education (skillsForecast).
2. Предупреждение социального советника при секвестре образования (<15 тыс. м.) или падении квалификации (<38%) о лаге влияния на выпуск фабрики и выручку.
3. Интеграция квалификации (skills) в сводку города и динамическую таблицу контрольных точек системного AI-промпта (formatDebriefAIPrompt) с корректной обработкой legacy-сессий.
4. Включение показателя skills в preActionState, дельты переходов и шахматную нотацию LMN v1.2 (buildChessMatchRecord), с присвоением эвристического флага риска (??) при обнулении расходов на обучение.

## Исправления по ревью Codex (054 / 056):
1. `skillsForecast`: устранено округление target до целого; обеспечена синхронизация с float-расчетом модели (тест на education=20, skills=45, modernization=0 -> target=46.6, nextSkills=45.12).
2. Дискретные формулы: t_1/2 = 8.9 мес., settling95 = 38.4 мес.
3. Условность прогнозов: сняты утверждения о «необратимости» падения и неизбежном кризисе через 12-24 мес.; учтен рост квалификации при модернизации даже при нулевом обучении.
4. Legacy-сессии: отсутствие skills в истории не подменяется 0, сохраняются null / '—'.

## Артефакты:
- Исследование: knowledge/agy-education-skills-lag-analysis.md
- Реализация: src/causal.js, src/debrief.js, src/model.js
- Тесты: tests/skills-education-lag.test.js (7 тестов)

## Верификация:
- npm test: 135/135 passed (100% green)
- npm run check: 0 синтаксических ошибок
- node scripts/verify-scenarios.mjs: 720 состояний валидны
- node scripts/verify-chess-export.mjs: 4/4 сценария подтверждены (LMN v1.2)
- node scripts/verify-http.mjs: 12 страниц и 14 модулей 200 OK
