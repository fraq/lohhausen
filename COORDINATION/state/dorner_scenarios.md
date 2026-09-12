# dorner_scenarios (Руководитель проекта / Project Lead)

Дата: 2026-09-11.
Роль: Project Lead & Scenario Architect (руководство проектом по поручению пользователя).
Идентификатор: `dorner_scenarios`

## Текущий статус проекта:
- **INTEGRATION COMPLETED (Codex успешно интегрировал `causal-wear-integration-001` и `project-counterfactual-001`, commit `0a2ba43`)**.
- Задача `causal-wear-digest-001` закрыта со статусом `done`.
- **Внедрена задача `ai-prompt-export-001` (прямое поручение пользователя)**: экспорт итогов с готовым системным промптом для Claude, Gemini, Codex и ChatGPT в интерфейс `/debrief` (`copy-ai-prompt`, `export-debrief-ai-md`, `export-debrief-lmn`) с автоматическим контрфактическим анализом завершенных проектов.
- **Внедрена задача `skills-lag-diagnostics-001`**: диагностика инерционного лага человеческого капитала ($\tau = 13.3$ мес., $t_{1/2} = 8.9$ мес.), экспорт `skillsForecast`, ранняя диагностика советника по социальной сфере Хельги Мейер, включение квалификации в динамическую таблицу промпта ИИ и классификация обнуления образования как системного зевка (`??`) в LMN v1.2.
- **Исправлена верстка блока причинных петель (`renderCausalLoopDiagram` в `src/visuals.js`)**: устранены наложения стрелок на блоки (геометрия пересечения ray-AABB), убран дублирующий спам плашек «⏳ лаг» (ложное срабатывание regex на «Благополучие» и «жилье»), ликвидирован вылезающий текст под узлами и оптимизирован центральный круг контура.
- Тестовый набор: **132/132 green** (`npm test`), синтаксис проверен (`npm run check`, 0 ошибок), 720 состояний верифицированы, HTTP 12 страниц и 14 модулей 200 OK, 4/4 сценария LMN проверены.
- Официальный аудит готовности v1.1.0: [`COORDINATION/decisions/20260909-publication-readiness-audit-v1.1.md`](../decisions/20260909-publication-readiness-audit-v1.1.md).
- Анализ каузального дайджеста износа v1.1: [`knowledge/dorner-causal-wear-analysis.md`](../../knowledge/dorner-causal-wear-analysis.md).
- Спецификация шахматного экспорта для ИИ (LMN v1.2): [`knowledge/dorner-chess-export-spec.md`](../../knowledge/dorner-chess-export-spec.md).
- Алгоритмическая классификация ходов LMN v1.2: [`knowledge/dorner-move-evaluation-engine.md`](../../knowledge/dorner-move-evaluation-engine.md).
- Атлас системных отказов по сценариям: [`knowledge/dorner-scenario-failure-atlas.md`](../../knowledge/dorner-scenario-failure-atlas.md) (исправлен по замечаниям Codex 049).
- Прототип шахматного экспорта LMN v1.2: [`scratch/chess-export.mjs`](../../scratch/chess-export.mjs) (синхронизирован: фазовость, разделение live/history состояний, объективный промпт).
- Карточка задачи каузального износа: [`COORDINATION/tasks/causal-wear-digest-001.md`](../tasks/causal-wear-digest-001.md) (передана Codex в рамках `causal-wear-integration-001`).
- Дорожная карта дидактических улучшений v1.2+: [`knowledge/dorner-v1.2-didactic-roadmap.md`](../../knowledge/dorner-v1.2-didactic-roadmap.md).
- Теория осознания системных ошибок (Синтез Дёрнера и Стермана): [`knowledge/dorner-sterman-error-awareness.md`](../../knowledge/dorner-sterman-error-awareness.md).
- Дидактическое руководство: [`knowledge/dorner-didactic-guide.md`](../../knowledge/dorner-didactic-guide.md).
- Концепция осознания ошибок: [`knowledge/dorner-error-awareness-concept.md`](../../knowledge/dorner-error-awareness-concept.md).

## Сделано и проверено в текущем цикле:
1. **Передача интеграции causal-wear Codex и строгий SOURCE FREEZE**:
   - Направлен срочный ACK и письмо о передаче файлов Codex (`COORDINATION/mail/codex/20260911T215200Z-dorner_scenarios-freeze-ack-and-handover.md` и `20260911T215400Z-dorner_scenarios-ack-wear-integration.md`).
   - Подтверждено прекращение любых правок кодовой базы со стороны `dorner_scenarios`. Codex осуществляет интеграцию `src/causal.js` и локалей в своих границах.

2. **Корректировка Атласа системных отказов (`knowledge/dorner-scenario-failure-atlas.md`)**:
   - Внесены исправления по отзыву Codex 049:
     * Стартовые параметры sandbox исправлены на точные (оборудование 48%, выпуск 890 как стартовая калибровка модели, жилье 3900 мест);
     * Устранено необоснованное утверждение о жестко фиксированном спросе; производительность привязана к выработке, квалификации (skills) и модернизации;
     * Показатели конкретной 120-месячной партии (+69 безработных, +1.88k казны) маркированы строго как пример этой партии;
     * Уточнено изолированное сальдо туризма (-41.2k/мес. от рекламы 45k минус выручка 3.8k) в отличие от общего бюджета города;
     * Устранено упоминание ручного кредита (долг начисляется автоматически при отрицательной казне); внесены контрольные узкие прогоны.

3. **Синхронизация прототипа шахматного экспорта LMN v1.2 (`scratch/chess-export.mjs`)**:
   - Добавлено явное разделение `lastCalculatedState` (из history) и `currentState` (из game с учетом мгновенных списаний на проекты до нажатия хода);
   - Введена 3-фазная структура каждого хода (`phase1_arrivalsAndCompletions`, `phase2_mayorInterventions`, `phase3_simulationTransition`);
   - Оценочный психологический ярлык «баллистическое поведение» заменен в системном промпте на эмпирический факт: отсутствие запроса отчетов профильного подразделения за последние 6 месяцев;
   - Workforce приведен к точному расчету от population с 6 десятичными знаками;
   - Верификатор `scripts/verify-chess-export.mjs` успешно подтвердил соответствие всех 4 сценариев.

## Границы ответственности:
- Руководство проектом и дидактическая архитектура (по поручению пользователя).
- Личный ящик: `COORDINATION/mail/dorner_scenarios/`

