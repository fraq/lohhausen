# Project Task Board (Overview Index)

> **Workflow**: Backlog ➔ Ready for [Agent] ➔ In Progress ([Agent]) ➔ Review ➔ Done
> 
> *Примечание: Источником истины для статуса задач являются индивидуальные карточки в [COORDINATION/tasks/](./COORDINATION/tasks/). Настоящий файл поддерживается руководителем проекта `dorner_scenarios`.*

---

## 🏛️ Руководство и координация (dorner_scenarios)
*Руководитель проекта: `dorner_scenarios` (назначен 2026-09-07 по прямому поручению пользователя о передаче управления от `dorner_lead`).*
- Решение о лидерстве: [COORDINATION/decisions/20260907-leadership-transfer.md](./COORDINATION/decisions/20260907-leadership-transfer.md)
- Состояние: [COORDINATION/state/dorner_scenarios.md](./COORDINATION/state/dorner_scenarios.md)

---

## 🚀 In Progress
*Активные задачи.*

*(В данный момент активных задач в разработке нет; задачи переданы на ревью).*

---


### 🔍 Review & Proposed
*Задачи на согласовании и проверке.*


- [ ] **debrief-followup-fix-001**: Устранение ложного срабатывания индикатора `ballistic_action` непосредственно в момент завершения проекта до появления у игрока возможности действия (находка участника «Повелитель» на Get Posting Board #11600/#11613). Внедрение событийной модели T0 (`followup_pending`), T1 (`cleared`), T2 (`outcome_unverified`) со сменой статуса на T2 строго при переходе на следующий расчетный месяц (`game.month > completeMonth`) и нейтральными формулировками без ярлыков.
  - **Инициатор**: Публичное ревью («Повелитель»), верифицировано `codex`
  - **Исполнитель**: `dorner_scenarios` (при исследовательской поддержке `agy`)
  - **Спецификация**: [`docs/ai-agent-fix-ballistic-followup.md`](./docs/ai-agent-fix-ballistic-followup.md), [`knowledge/agy-ballistic-t2-counterexample-analysis.md`](./knowledge/agy-ballistic-t2-counterexample-analysis.md), [`knowledge/agy-ballistic-recurrence-rule-analysis.md`](./knowledge/agy-ballistic-recurrence-rule-analysis.md)
  - **Карточка**: [`COORDINATION/tasks/debrief-followup-fix-001.md`](./COORDINATION/tasks/debrief-followup-fix-001.md)
  - **Статус**: review (Codex в codex-recurrence-counterexample-068/069 отверг наивный подсчет проектов $N \ge 2$; agy в `knowledge/agy-ballistic-recurrence-rule-analysis.md` формализовал каноническое правило рекуррентности Дёрнера через независимые возможности проверки $M_{\text{opp}} \ge 2$ и раздельные эпохи $E_{\text{epochs}} \ge 2$, устраняющее ложные обвинения на параллельных проектах; подготовлен негативный контрольный тест; 166/166 passing tests).

- [ ] **chess-export-ai-001**: Внедрение экспорта шахматной записи партии (LMN v1.2) со встроенной алгоритмической классификацией ходов (`!!`, `!`, `—`, `?!`, `?`, `??`) и доказательным промптом для системного разбора в Claude/ChatGPT/Gemini.
  - **Инициатор**: `dorner_scenarios` (по поручению пользователя)
  - **Спецификация**: [`knowledge/dorner-chess-export-spec.md`](./knowledge/dorner-chess-export-spec.md), [`knowledge/dorner-move-evaluation-engine.md`](./knowledge/dorner-move-evaluation-engine.md)
  - **Прототип**: [`scratch/chess-export.mjs`](./scratch/chess-export.mjs)
  - **Верификатор**: [`scripts/verify-chess-export.mjs`](./scripts/verify-chess-export.mjs)
  - **Статус**: verified_ready (все 4 сценария успешно протестированы, соответствие всем критериям подтверждено).

- [ ] **competing-hypotheses-journal-001**: Внедрение в журнал решений фиксации структурированных гипотез ($H_1$: целевой выигрыш vs $H_2$: сопутствующий риск/побочный эффект) перед запуском инвестиционных проектов с автоматической верификацией в `/debrief` (`verifyHypotheses`) без оценочных суждений и психологических ярлыков (`consistent`, `inconsistent`, `too_early`, `no_data`).
  - **Инициатор**: Дидактическая инициатива Дёрнера, специфицировано `agy`, верифицировано с учетом ревью `codex` (055)
  - **Исполнитель**: `agy`
  - **Спецификация**: [`knowledge/agy-competing-hypotheses-journal-spec.md`](./knowledge/agy-competing-hypotheses-journal-spec.md)
  - **Карточка**: [`COORDINATION/tasks/competing-hypotheses-journal-001.md`](./COORDINATION/tasks/competing-hypotheses-journal-001.md)
  - **Артефакты**: `src/model.js`, `src/debrief.js`, `tests/hypotheses.test.js`
  - **Статус**: review (коммит `cc7be0e` находится на отдельном ревью у Codex, НЕ принят; выкатка приостановлена; 4/4 тестов модуля проходят, 177/177 green).

- [ ] **binding-constraints-001**: Анализ связывающих ограничений (Binding Constraints) и эффективности капитальных вложений по Дёрнеру и Голдратту: выявление преждевременного омертвления дефицитной ликвидности в ненапряженных фондах (`evaluateProjectConstraint`), точный расчет времени буфера исчерпания запаса в месяцах ($\text{surplus} / \max(0.1, \text{growthRate})$), предотвращение ложных призывов строить жилье при избыточном резерве (200 мест на 100 месяцев), интеграция в `getProjectAdvisorEndorsement` с оценкой ликвидности казны.
  - **Инициатор**: Дидактическая инициатива по гл. 4 Дёрнера
  - **Исполнитель**: `agy`
  - **Спецификация**: [`knowledge/agy-binding-constraints-and-capital-allocation.md`](./knowledge/agy-binding-constraints-and-capital-allocation.md)
  - **Карточка**: [`COORDINATION/tasks/binding-constraints-001.md`](./COORDINATION/tasks/binding-constraints-001.md)
  - **Артефакты**: `src/causal.js`, `tests/binding-constraints.test.js`
  - **Статус**: review (предложено в коммите `cc7be0e`, ожидает отдельного ревью Codex; 5/5 тестов модуля проходят, 177/177 green).

- [ ] **taleb-antifragile-mode**: Внедрение игрового режима «Вызов Крайнестана: Черный лебедь и Антихрупкость» (`extremistan_challenge`) по книгам Нассима Талеба: детерминированный генератор псевдослучайных чисел Mulberry32 со степенным распределением Парето (`src/prng.js`), каталог положительных/отрицательных Черных лебедей и ятрогенного шума (`src/taleb-events.js`), интеграция в модель (`src/model.js`) и сценарии (`src/scenarios.js`), эталоны Конрада и Маркуса, панель метрик Антихрупкости (Slack, Turkey Index, Barbell Strategy) в Debrief (`src/app.js`), полная локализация (`src/locales/extra.js`) и тестовый набор (`tests/prng.test.js`, `tests/taleb-events.test.js`, `tests/taleb-mode.test.js`).
  - **Инициатор**: Запрос пользователя
  - **Исполнитель**: `agy`
  - **Спецификация**: [`knowledge/agy-taleb-black-swan-antifragile-mode-feasibility.md`](./knowledge/agy-taleb-black-swan-antifragile-mode-feasibility.md)
  - **Ревью**: [`docs/extremistan-review-20260912.md`](./docs/extremistan-review-20260912.md) (Codex)
  - **Артефакты**: `src/prng.js`, `src/taleb-events.js`, `src/model.js`, `src/scenarios.js`, `src/app.js`, `src/locales/extra.js`
  - **Статус**: review (CHANGES_REQUESTED по ревью Codex; по прямому указанию пользователя режим изолирован, аварийные дефекты deserialization/month-0 antifragile выделяются в отдельную согласованную задачу).

- [ ] **model-calibration-audit-001**: Исследовательский аудит калибровки модели Лоххаузена (рекуррентность миграции, окупаемость жилья, потолок занятости) на коммите `0fdc5de` по ветке обсуждения Get Posting Board (#11816, #11840, #11861, #11867, #11875). Доказан храповик миграции (7.5:1, 164 мес. на восстановление), доказана ловушка капитала в жилье (0 аренды, 0 удовлетворенности, -375k чистый убыток), фальсифицирован жесткий потолок занятости 86% (достижимо 100% при P=2500).
  - **Инициатор**: Предложение Codex (`codex-offer-model-calibration-audit-088`, директива 090)
  - **Исполнитель**: `agy`
  - **Карточка**: [`COORDINATION/tasks/model-calibration-audit-001.md`](./COORDINATION/tasks/model-calibration-audit-001.md)
  - **Артефакты**: [`knowledge/agy-model-calibration-audit.md`](./knowledge/agy-model-calibration-audit.md)
  - **Статус**: review_ready (исследование завершено, отчет сдан Codex письмом 091, 0 правок в коде).

- [ ] **extremistan-semantics-spec-001**: Проверяемая теоретическая спецификация понятий Крайнестана и Антихрупкости Талеба (разграничение fragile/robust/antifragile, pre-shock baseline, post-shock окно, классификация шоков, stress deck vs bounded heavy-tail) до реализации в коде.
  - **Инициатор**: Предложение Codex (`codex-offer-extremistan-semantics-spec-076`)
  - **Исполнитель**: `agy`
  - **Карточка**: [`COORDINATION/tasks/extremistan-semantics-spec-001.md`](./COORDINATION/tasks/extremistan-semantics-spec-001.md)
  - **Артефакты**: [`knowledge/agy-extremistan-semantics-spec.md`](./knowledge/agy-extremistan-semantics-spec.md)
  - **Статус**: in_progress (на доработке по 9 замечаниям CHANGES_REQUESTED письма Codex 087: контрфактический контроль, единая функция полезности/потерь, конечный автомат, проверка цитат).

- [ ] **extremistan-engine-antifragility-001** *(Proposed)*: Реализация в `src/taleb-events.js` строгой формулы `computeAntifragilityMetrics` (устранение month-0 false positive, требование $N_{\text{survived}} \ge 1$, pre-shock baseline и post-shock delta), дифференциация 5 счетчиков событий и исключение автоматического списания опциона.
  - **Инициатор**: Поручение пользователя по модульному распределению
  - **Предлагаемый исполнитель**: `agy` (или Codex)
  - **Статус**: proposed

- [ ] **extremistan-benchmarks-001** *(Proposed)*: Реализация в `src/scenarios.js` динамических воспроизводимых бенчмарков Конрада и Маркуса на базе детерминированных `actionJournal`, формулировка условий победы через преодоление шоков и подключение к `verify-scenarios.mjs`.
  - **Инициатор**: Поручение пользователя по модульному распределению
  - **Предлагаемый исполнитель**: `dorner_scenarios`
  - **Статус**: proposed

- [ ] **extremistan-ui-debrief-001** *(Proposed)*: Интеграция в `src/app.js` селектора сида (случайный / ручной ввод), возврат сценария в селектор диалога новой игры после готовности движка и бенчмарков, обновленная debrief-панель Талеба и выверка локализации `src/locales/extra.js`.
  - **Инициатор**: Поручение пользователя по модульному распределению
  - **Предлагаемый исполнитель**: `dorner_scenarios` (при участии `agy`)
  - **Статус**: proposed

---

## 🗄️ Backlog (Дидактические инициативы и системные улучшения)
*Стратегические предложения по системному обучению (спецификация: [`knowledge/dorner-v1.2-didactic-roadmap.md`](./knowledge/dorner-v1.2-didactic-roadmap.md), атлас отказов: [`knowledge/dorner-scenario-failure-atlas.md`](./knowledge/dorner-scenario-failure-atlas.md), гроссмейстерский кейс: [`knowledge/agy-grandmaster-case-study-20260912.md`](./knowledge/agy-grandmaster-case-study-20260912.md)).*

- [ ] **ai-debrief-methodology**: Методология системного аудита и оценки партий в ИИ (Claude, Gemini, Codex) по канонам Дёрнера и Стермана: 6-фазный протокол, чек-лист анти-галлюцинаций для LLM (руководство: [`knowledge/agy-ai-debrief-evaluation-methodology.md`](./knowledge/agy-ai-debrief-evaluation-methodology.md)).
- [ ] **pseudo-stability-diagnostics**: Анализ латентных кризисов и выявление псевдостабильности (*Scheingleichgewicht*) vs истинного равновесия (*Systemgleichgewicht*), предостережение от синдрома «ремонтной мастерской» (*Reparaturdienst-Verhalten*) (руководство: [`knowledge/agy-pseudo-stability-and-repair-mentality.md`](./knowledge/agy-pseudo-stability-and-repair-mentality.md)).
- [ ] **reality-shock-prompt**: Рефлексивный диалог при критическом расхождении (>30%) между прогнозом игрока в журнале и фактическим результатом проекта (архитектура: [`knowledge/agy-reality-shock-and-error-awareness-architecture.md`](./knowledge/agy-reality-shock-and-error-awareness-architecture.md)).
- [ ] **feedback-loop-explorer**: Интерактивная трассировка контуров в CLD при клике на переменные (пошаговая подсветка замкнутых петель обратной связи и задержек).
- [ ] **radar-delta-tooltip**: Интерактивные тултипы дельт на вершинах системного радара (сопоставление с базовой линией месяца 0 и вывод конкретного фактора износа/падения).
- [ ] **counterfactual-trajectory-trace**: Опциональное отображение эталонного коридора Конрада на графиках истории для раннего обнаружения точки системной бифуркации.

## ✅ Done
*Завершенные задачи.*

- [x] **extremistan-ui-isolation-001**: Временное сокрытие экспериментального режима `extremistan_challenge` из публичного диалога новой игры (new-game dialog) до завершения и приемки спецификации `extremistan-semantics-spec-001`. Публичный вызов `getScenariosList()` отображает только 4 канонических сценария Дёрнера; режим, тесты (13/13) и загрузка существующих партий сохранены.
  - **Инициатор**: Продуктовое решение Codex (`codex-offer-extremistan-ui-isolation-083`)
  - **Исполнитель**: `agy`
  - **Карточка**: [`COORDINATION/tasks/extremistan-ui-isolation-001.md`](./COORDINATION/tasks/extremistan-ui-isolation-001.md)
  - **Артефакты**: `src/app.js`, `tests/cockpit.test.js`
  - **Статус**: Закрыта (принята Codex письмом `codex-ui-accept-release-freeze-semantics-review-087`, включена в коммит `0fdc5de`, 184/184 тестов green).

- [x] **recurrence-evidence-matrix-001**: Фиксация 5-точечной регрессионной матрицы для двухуровневой модели группировки возможностей контроля (`independentFollowupOpportunities`, `independentDecisionEpochs`) по предложению Codex 074 и публичной дискуссии (#11638, #11640, #11641): покрытие всех сценариев контроля (общая возможность, раздельные эпохи, предварительный контроль, последовательный контроль, нерелевантный отчет) без изменения `src/**`.
  - **Инициатор**: Предложение Codex (`codex-offer-recurrence-evidence-matrix-074`)
  - **Исполнитель**: `agy`
  - **Спецификация**: [`knowledge/agy-recurrence-evidence-matrix.md`](./knowledge/agy-recurrence-evidence-matrix.md)
  - **Карточка**: [`COORDINATION/tasks/recurrence-evidence-matrix-001.md`](./COORDINATION/tasks/recurrence-evidence-matrix-001.md)
  - **Артефакты**: `tests/debrief-regressions.test.js`, `knowledge/agy-recurrence-evidence-matrix.md`
  - **Статус**: Закрыта (принята Codex письмом `codex-recurrence-matrix-accept-084`, 10/10 тестов debrief-regressions passing, zero source changes).


- [x] **extremistan-save-safety-001**: Устранение аварийного дефекта валидации сохранений Крайнестана (`talebState: {}`) и рассинхронизации seed contract (`rawSeed >>> 0`) по предложению Codex 075 и ревью 079: строгий валидатор `validateTalebState` (проверка `history.month <= currentMonth`, строгая числовая проверка `effects`, соответствие `game.seed` и `talebState.seed`, обязательность uint32 `prngState`), удаление repair-присваиваний в `processTalebPreStep`, scope addendum для `src/prng.js` (`return s >>> 0`) и assert в `tests/prng.test.js`.
  - **Инициатор**: Предложение Codex (`codex-offer-extremistan-save-safety-075`, ревью `codex-extremistan-save-safety-review-079`)
  - **Исполнитель**: `agy`
  - **Карточка**: [`COORDINATION/tasks/extremistan-save-safety-001.md`](./COORDINATION/tasks/extremistan-save-safety-001.md)
  - **Статус**: Закрыта (принята Codex письмом `codex-extremistan-save-safety-accept-082`, 183/183 тестов green, 720 состояний ok, HTTP 200 OK).

- [x] **fiscal-squeeze-diagnostics**: Предостережение от фискальной ловушки завышения налогов (кривая Лаффера по Дёрнеру): нелинейный штраф при превышении порога 20% ($\Delta \text{taxRate} \times 0.55$), асимметрия миграционных потоков ($[-15, +2]$ чел./мес., коэффициент восстановления 7.5:1), расчет чистого располагаемого дохода домохозяйств (`taxForecast`), интеграция в `getPolicyWhatIf` и предупреждение казначея фрау Вебер до запуска необратимого оттока населения.
  - **Исполнитель**: `agy` (в рамках Кайдзен-цикла 35)
  - **Артефакты**: `src/causal.js`, `tests/fiscal-squeeze-tax.test.js`, [`knowledge/agy-fiscal-squeeze-and-laffer-trap.md`](./knowledge/agy-fiscal-squeeze-and-laffer-trap.md)
  - **Статус**: Закрыта (3/3 тестов модуля, 164/164 тестов green, HTTP 200 OK).

- [x] **services-health-diagnostics**: Предостережение от когнитивной ловушки секвестра общественных услуг («синдром донора бюджета»): расчет инерционного лага качества услуг ($t_{1/2} = 5.9$ мес., $\tau = 8.6$ мес.), прямой мультипликатор муниципальной занятости ($\Delta \text{jobs} = \text{pop} \times \Delta \text{services} / 850$), упреждающее предупреждение советника Хельги Мейер до обрушения здоровья и учет веса пожилых ($61\%$) в `getPolicyWhatIf`.
  - **Исполнитель**: `agy` (в рамках Кайдзен-цикла 31)
  - **Артефакты**: `src/causal.js`, `tests/services-health-lag.test.js`, [`knowledge/agy-municipal-services-health-feedback-loop.md`](./knowledge/agy-municipal-services-health-feedback-loop.md)
  - **Статус**: Закрыта (4/4 тестов модуля, 161/161 тестов green, HTTP 200 OK).

- [x] **new-game-discoverability-001**: Повышение заметности и доступности кнопки «Новая игра» по прямому замечанию пользователя: вынос кнопки в отдельный блок действий сайдбара `.sidebar-action` прямо под основным меню навигации со стильным оформлением (высота 42px, фон glassmorphism, контрастная обводка, теплая латунная иконка сброса), а также добавление аккуратной кнопки перезапуска в верхнюю панель управления `.language-control` (`.header-new-game`).
  - **Исполнитель**: `agy` (по прямому поручению пользователя)
  - **Артефакты**: `src/app.js`, `public/styles.css`, `tests/cockpit.test.js`
  - **Статус**: Закрыта (133/133 тестов green, регрессионный тест в `tests/cockpit.test.js`, HTTP 200 OK).

- [x] **cockpit-button-alignment-001**: Устранение визуального дефекта асимметричной высоты кнопок в Mayoral Cockpit: удаление вертикальных марджинов `.hero-guide` (8px/10px), центрирование элементов по поперечной оси (`align-items: center`), сброс марджинов дочерних кнопок `.cockpit-actions .button { margin: 0; }` и приведение всех кнопок главного экрана к единой высоте (40px).
  - **Исполнитель**: `agy` (по прямому замечанию пользователя)
  - **Артефакты**: `public/styles.css`, `src/app.js`, `tests/cockpit.test.js`
  - **Статус**: Закрыта (133/133 тестов green, регрессионный тест добавлен в `tests/cockpit.test.js`, HTTP 200 OK).

- [x] **skills-lag-diagnostics**: Предостережение от когнитивной ловушки «бесплатной экономии на обучении»: расчет инерционного лага человеческого капитала ($\tau = 13.3$ мес., $t_{1/2} = 8.89$ мес.), интеграция `skillsForecast`, диагностика советника по социальной сфере, квалификация рабочих в сводке и таблице траектории ИИ-промпта, учет квалификации в `preActionState`, дельтах и шахматной нотации LMN v1.2. Устранены замечания ревью Codex 054/056: точная синхронизация с дробным расчетом модели (`45.12`), дискретные формулы лагов, условность прогнозов и сохранение `null` для legacy-партий.
  - **Исполнитель**: `dorner_scenarios`
  - **Карточка**: [`COORDINATION/tasks/skills-lag-diagnostics-001.md`](./COORDINATION/tasks/skills-lag-diagnostics-001.md)
  - **Исследование**: [`knowledge/agy-education-skills-lag-analysis.md`](./knowledge/agy-education-skills-lag-analysis.md)
  - **Артефакты**: `src/causal.js`, `src/debrief.js`, `src/model.js`, `tests/skills-education-lag.test.js`
  - **Статус**: feedback_addressed (135/135 тестов green, 7/7 тестов модуля, 720 состояний, HTTP 200 OK).

- [x] **ai-prompt-export-001**: Реализация прямого экспорта итогов партии с системным научно-обоснованным промптом по методологии Дёрнера/Стермана для анализа в Claude, Gemini, ChatGPT и Codex (кнопки «📋 Скопировать промпт для ИИ», «🤖 Скачать для ИИ (Markdown + Промпт)», «🧠 LMN (JSON для ИИ)») с автоматическим включением контрфактического моделирования завершенных проектов. Устранены замечания ревью Codex 054: строгая научная структура разбора, эвристические индикаторы ходов, безопасная работа с legacy-партиями без подмены на ноль.
  - **Исполнитель**: `dorner_scenarios`
  - **Карточка**: [`COORDINATION/tasks/ai-prompt-export-001.md`](./COORDINATION/tasks/ai-prompt-export-001.md)
  - **Артефакты**: `src/debrief.js`, `src/app.js`, `src/locales/extra.js`, `tests/debrief.test.js`, `tests/skills-education-lag.test.js`
  - **Статус**: feedback_addressed (135/135 тестов green, локализация на 4 языка, прямая поддержка буфера обмена, fallback скачивания и контрфактические срезы альтернативных реальностей).

- [x] **project-counterfactual-001**: Контрфактический анализ партии: проверка «Что было бы без этого проекта?» в разделе `/debrief` при сохранении неизменным остального журнала решений.
  - **Исполнитель**: `codex` (Senior Integrator)
  - **Спецификация и верификация**: [`docs/project-counterfactual-spec.md`](./docs/project-counterfactual-spec.md), [`docs/project-counterfactual-verification.md`](./docs/project-counterfactual-verification.md)
  - **Артефакты**: `src/counterfactual.js`, `tests/counterfactual.test.js`, `src/app.js`, `src/locales/extra.js`, `public/styles.css`
  - **Дидактическое сопровождение**: [`knowledge/agy-counterfactual-analysis-guide.md`](./knowledge/agy-counterfactual-analysis-guide.md), [`knowledge/agy-project-counterfactual-didactics.md`](./knowledge/agy-project-counterfactual-didactics.md), [`knowledge/agy-dorner-13-lessons-error-mastery.md`](./knowledge/agy-dorner-13-lessons-error-mastery.md)
  - **Статус**: Закрыта (16 тестов модуля, 121/121 тестов green, коммит `0a2ba43`).

- [x] **causal-wear-integration-001**: Интеграция дидактического объяснения динамики износа оборудования в `src/causal.js`, устранение ложного вывода об «обслуживании, компенсирующем износ», учет интервалов журнала и устранение ошибок `modernizationLevel` и статического порога 18k.
  - **Исполнитель**: `codex` (Senior Integrator)
  - **Спецификация и верификация**: [`docs/project-counterfactual-verification.md`](./docs/project-counterfactual-verification.md), [`COORDINATION/tasks/causal-wear-integration-001.md`](./COORDINATION/tasks/causal-wear-integration-001.md)
  - **Артефакты**: `src/causal.js`, `src/locales/extra.js`, `tests/causal-wear.test.js`, `tests/causal-wear-regression.test.js`
  - **Статус**: Закрыта (10 тестов износа, 121/121 тестов green, коммит `0a2ba43`).

- [x] **causal-wear-digest-001**: Устранение ложного утверждения «обслуживание компенсирует износ» при недостаточном обслуживании ($M=14$), учет длительности шага (`monthsElapsed`), разделение валового ввода модернизации и граничных состояний (0/100).
  - **Инициатор**: `dorner_scenarios` (при аналитической поддержке `agy` и аудите `codex`)
  - **Карточка**: [`COORDINATION/tasks/causal-wear-digest-001.md`](./COORDINATION/tasks/causal-wear-digest-001.md)
  - **Статус**: Закрыта (полностью интегрирована в кодовую базу в рамках `causal-wear-integration-001`, коммит `0a2ba43`).

- [x] **party-audit-002**: Аудит внешнего разбора партии, исправление долга в `party-review-20260911.md` (долг 18–24 мес., пик 46.26 в 21), строгое контрфактическое моделирование 2-й модернизации и жилья месяца 65, замена `id: conrad` на `no_indicators_detected` в JSON.
  - **Исполнитель**: `codex` (при участии `review_simulation` и `repair_debrief`)
  - **Артефакты**: [`docs/party-analysis-audit-20260911.md`](./docs/party-analysis-audit-20260911.md), [`src/debrief.js`](./src/debrief.js), [`tests/export-regressions.test.js`](./tests/export-regressions.test.js)
  - **Статус**: Закрыта (95/95 тестов зеленые, все 3 контрфакта подтверждены в модели).
- [x] **party-feedback-001**: Разбор реальной 120-месячной партии пользователя (117 действий, 3/3 целей), устранение необоснованных оценок игрока, калибровка объяснения стартового выпуска (890 vs расчет месяца 1) и объяснение технологической безработицы при модернизации фабрики.
  - **Исполнитель**: `codex` (при участии `review_simulation` и `dorner_scenarios`)
  - **Артефакты**: [`docs/party-review-20260911.md`](./docs/party-review-20260911.md), [`tests/party-feedback.test.js`](./tests/party-feedback.test.js), [`src/model.js`](./src/model.js), [`src/debrief.js`](./src/debrief.js), [`src/scenarios.js`](./src/scenarios.js)
  - **Статус**: Закрыта (94/94 тестов зеленые, коммит `d44d38a`).
- [x] **chronicle-navigation-001**: Связывание уведомлений о ходе с помесячной хроникой (`/?lang=ru#turn-digest`, автофокус, поддержка клавиатуры и 4 языков).
  - **Исполнитель**: `codex` (при независимом review `repair_debrief`)
  - **Артефакты**: [`src/app.js`](./src/app.js), [`public/styles.css`](./public/styles.css), [`src/locales/extra.js`](./src/locales/extra.js)
  - **Статус**: Закрыта (90/90 тестов, коммит `f783193`).
- [x] **integration-review-001**: Финальная интеграционная приемка релиза v1.1.0 (калибровка верстки радара при 1280px, строгий валидатор `hasRadarBaseline`, независимый Chrome аудит на 4 языках, валидация месяца 0).
  - **Исполнитель**: `codex` (Senior Integrator)
  - **Артефакты**: [`docs/integration-review-20260909.md`](./docs/integration-review-20260909.md), [`src/visuals.js`](./src/visuals.js), [`tests/visuals.test.js`](./tests/visuals.test.js)
  - **Статус**: Закрыта (90/90 тестов, 720 месяцев, HTTP 12/13, коммит `0e1bfd7`).


- [x] **time-lag-inertia-banner-001**: Индикатор скрытой инерции и активных проектов с временным лагом на экране решений (`decisionsView`), предостерегающий от нетерпеливого перерегулирования (*Übersteuerung*) и раскачки системы.
  - **Исполнитель**: `dorner_scenarios`
  - **Артефакты**: [`src/app.js`](./src/app.js), [`src/locales/cockpit.js`](./src/locales/cockpit.js), [`tests/cockpit.test.js`](./tests/cockpit.test.js)
  - **Статус**: Закрыта (88/88 тестов проходят, словарь расширен до 416 ключей на en/de/fr, валидация `npm test`).
- [x] **i18n-advisors-004**: Финальный каталог редких состояний советников (`src/locales/cockpit.js`, 11 ключей из `docs/review-i18n-advisors.json`, суммарно 409 ключей на ru/en/de/fr, корректная формулировка модернизации при исправных станках «повышает производительность», без утверждений о квалификации).
  - **Исполнитель**: `dorner_scenarios`
  - **Артефакты**: [`src/locales/cockpit.js`](./src/locales/cockpit.js), [`tests/cockpit.test.js`](./tests/cockpit.test.js)
  - **Статус**: Закрыта (87/87 тестов проходят, 100% покрытие 409 ключей, границы освобождены).
- [x] **i18n-dynamic-002**: Полная мультиязычная локализация динамических ключей, радара и психологических профилей (`src/locales/cockpit.js`, 185 ключей из `docs/review-i18n-dynamic.json`, суммарно 398 ключей на ru/en/de/fr, строгая эквивалентность `{n0}`–`{n4}`, аутентичные термины Дёрнера: *Ballistisches Handeln*, *Kapselung*, *Thematisches Vagabundieren*, *Reparaturdienst-Verhalten*, *Systemgleichgewicht*).
  - **Исполнитель**: `dorner_scenarios` (при терминологической поддержке `agy`)
  - **Артефакты**: [`src/locales/cockpit.js`](./src/locales/cockpit.js), [`tests/cockpit.test.js`](./tests/cockpit.test.js), [`knowledge/agy-dynamic-glossary.md`](./knowledge/agy-dynamic-glossary.md)
  - **Статус**: Закрыта (80/80 тестов проходят, валидация `npm test`).
- [x] **systemic-radar-001**: Пятиосевой радар системного здоровья города (Systemic Health Radar Chart) с критическим порогом 40%, взвешенной нормализацией осей и дидактической легендой.
  - **Исполнитель**: `agy` (Antigravity)
  - **Артефакты**: [`src/visuals.js`](./src/visuals.js), [`src/app.js`](./src/app.js), [`public/styles.css`](./public/styles.css), [`tests/visuals.test.js`](./tests/visuals.test.js)
  - **Статус**: Закрыта (78/78 тестов проходят, адаптивный SVG-компонент встроен в Overview Cockpit).
- [x] **i18n-cockpit-dynamic-003**: Расширение автономного каталога локализации всеми 185 динамическими фразами советников, радара и сценариев (`src/locales/cockpit.js`, всего 393 ключа на ru/en/de/fr, строгая проверка соответствия плейсхолдеров).
  - **Исполнитель**: `dorner_scenarios` (при участии терминологического глоссария `agy`)
  - **Артефакты**: [`src/locales/cockpit.js`](./src/locales/cockpit.js), [`tests/cockpit.test.js`](./tests/cockpit.test.js)
  - **Статус**: Закрыта (78/78 тестов проходят, 100% покрытие 393 ключей, валидация `npm test`).
- [x] **i18n-cockpit-catalog-002**: Полный автономный каталог переводов для всех экранов кабинета, сценариев и системной динамики (`src/locales/cockpit.js`, 208 базовых ключей на ru/en/de/fr, строгая проверка плейсхолдеров и часовой фабрики).
  - **Исполнитель**: `dorner_scenarios`
  - **Артефакты**: [`src/locales/cockpit.js`](./src/locales/cockpit.js), [`tests/cockpit.test.js`](./tests/cockpit.test.js)
  - **Статус**: Закрыта (78/78 тестов проходят, 100% покрытие, валидация `npm test`).
- [x] **debrief-ui-hardening-001**: Дидактическое обозначение эталонов и сценариев как учебных примеров по книге Дёрнера, защита заметок игрока `translate="no"`, живой What-If `localizeDocument`, синхронизация ползунков и динамический горизонт.
  - **Исполнитель**: `dorner_scenarios`
  - **Артефакты**: [`src/app.js`](./src/app.js), [`src/causal.js`](./src/causal.js), [`src/locales/extra.js`](./src/locales/extra.js), [`tests/i18n.test.js`](./tests/i18n.test.js)
  - **Статус**: Закрыта (устранены любые подмены метрик, заметки изолированы от перевода, What-If и range/number синхронизированы).
- [x] **advisor-guidance-shortcuts-001**: Живые памятки советников в экране решений (`decisionsView`), одобрение инвестиционных проектов с учетом лагов и полноценная клавиатурная доступность с горячими клавишами.
  - **Исполнитель**: `dorner_scenarios`
  - **Артефакты**: [`src/causal.js`](./src/causal.js), [`src/app.js`](./src/app.js), [`src/locales/extra.js`](./src/locales/extra.js), [`public/styles.css`](./public/styles.css), [`tests/causal.test.js`](./tests/causal.test.js), [`tests/i18n.test.js`](./tests/i18n.test.js)
  - **Статус**: Закрыта (советники и горячие клавиши интегрированы).
- [x] **i18n-cockpit-001**: Локализация ключевых терминов кабинета бургомистра, советников, ретроспективы и системной динамики Дёрнера на немецкий (de), английский (en) и французский (fr) языки.
  - **Исполнитель**: `dorner_analyst`
  - **Карточка**: [COORDINATION/tasks/i18n-cockpit-001.md](./COORDINATION/tasks/i18n-cockpit-001.md)
  - **Артефакты**: [`src/locales/extra.js`](./src/locales/extra.js), [`tests/i18n.test.js`](./tests/i18n.test.js)
  - **Статус**: Закрыта (53/53 тестов проходят, аутентичные немецкие термины Дёрнера включены в словарь).
- [x] **journal-reflection-001**: Автоматическая сверка долгосрочных гипотез игрока из дневника решений с фактическими исходами проектов («Ожидание vs Реальность») и визуализация эталонных траекторий Конрада/Маркуса.
  - **Исполнитель**: `debrief_agent`
  - **Карточка**: [COORDINATION/tasks/journal-reflection-001.md](./COORDINATION/tasks/journal-reflection-001.md)
  - **Артефакты**: [`src/debrief.js`](./src/debrief.js), [`src/visuals.js`](./src/visuals.js), [`src/app.js`](./src/app.js), [`tests/debrief.test.js`](./tests/debrief.test.js), [`tests/visuals.test.js`](./tests/visuals.test.js)
  - **Статус**: Закрыта (46/46 тестов проходят, 720 месяцев верифицированы, блок внедрен в `debriefView`).
- [x] **causal-graph-001**: Интерактивная векторная визуализация (SVG) контуров системной динамики (Stock & Flow loops), балансирующих и усиливающих петель с лагами времени.
  - **Исполнитель**: `dorner_analyst`
  - **Карточка**: [COORDINATION/tasks/causal-graph-001.md](./COORDINATION/tasks/causal-graph-001.md)
  - **Артефакты**: [`src/visuals.js`](./src/visuals.js), [`src/causal.js`](./src/causal.js), [`tests/visuals.test.js`](./tests/visuals.test.js), [`src/app.js`](./src/app.js)
  - **Статус**: Закрыта (44/44 тестов проходят, 720 месяцев верифицированы, SVG интегрирован в Mayoral Cockpit).
- [x] **scenarios-001**: Движок исторических сценариев и эталонных вызовов Дёрнера (Песочница, Кризис часовой фабрики, Экологическая ловушка курорта, Стресс-тест Дёрнера).
  - **Исполнитель**: `dorner_scenarios`
  - **Карточка**: [COORDINATION/tasks/scenarios-001.md](./COORDINATION/tasks/scenarios-001.md)
  - **Артефакты**: [`src/scenarios.js`](./src/scenarios.js), [`tests/scenarios.test.js`](./tests/scenarios.test.js), [`knowledge/agy-factory-crisis-recapitalization-analysis.md`](./knowledge/agy-factory-crisis-recapitalization-analysis.md), [`knowledge/agy-tourism-bottleneck-analysis.md`](./knowledge/agy-tourism-bottleneck-analysis.md), [`knowledge/agy-dorner-challenge-multi-criteria-analysis.md`](./knowledge/agy-dorner-challenge-multi-criteria-analysis.md)
  - **Статус**: Закрыта (38/38 тестов проходят, 4 канонических сценария с целями и бенчмарками).
- [x] **debrief-001** (TASK-006): Модуль когнитивной ретроспективы и анализа ошибок мышления по книге Дёрнера (Dörner Debriefing Engine).
  - **Исполнитель**: `dorner_analyst` (при поддержке `debrief_agent`)
  - **Куратор**: `dorner_scenarios` (принято от `dorner_lead`)
  - **Артефакты**: [`src/debrief.js`](./src/debrief.js), [`tests/debrief.test.js`](./tests/debrief.test.js)
  - **Статус**: Закрыта (38/38 тестов проходят, интеграция в `debriefView` завершена).
- [x] **ux-cockpit-001**: Реконцептуализация симулятора Лоххаузена: единый Mayoral Cockpit, живые советники, Causal Turn Digest, What-If предпросмотр решений, интерактивный исследователь контуров системной динамики (Causal Loops).
  - **Исполнитель**: `dorner_lead` (по прямому поручению пользователя от 2026-09-07)
  - **Артефакты**: [`src/causal.js`](./src/causal.js), [`src/app.js`](./src/app.js), [`src/visuals.js`](./src/visuals.js), [`public/styles.css`](./public/styles.css)
  - **Статус**: Закрыта (26/26 тестов, 720 шагов сценариев верифицированы, HTTP 200).
- [x] **git-init-001**: Инициализация Git, настройка .gitignore и создание начального коммита проекта.
  - **Исполнитель**: `dorner_lead` / `debrief_agent`
  - **Решение**: [COORDINATION/decisions/20260907-git-versioning.md](./COORDINATION/decisions/20260907-git-versioning.md)
  - **Статус**: Закрыта.
- [x] **research-001**: Исследование книги Дёрнера, реконструкция модели Лоххаузена и аудит спецификации.
  - **Исполнитель**: `agy` (Assistant)
  - **Проверяющий**: `codex` (Lead)
  - **Карточка**: [COORDINATION/tasks/research-001.md](./COORDINATION/tasks/research-001.md)
  - **Артефакты**: [knowledge/agy-research.md](./knowledge/agy-research.md), [knowledge/agy-source-map.md](./knowledge/agy-source-map.md), [knowledge/internal-book-review.md](./knowledge/internal-book-review.md)
  - **Статус**: Закрыта.
- [x] **i18n-001**: Локализация интерфейса (en / de / fr / ru), языковые ссылки и статьи Википедии.
  - **Исполнитель**: `codex` (с переводчиками)
  - **Карточка**: [COORDINATION/tasks/i18n-001.md](./COORDINATION/tasks/i18n-001.md)
  - **Статус**: Закрыта.
- [x] **routes-001**: Отдельные URL для всех экранов симулятора, навигация history API, исправление прокрутки.
  - **Исполнитель**: `codex`
  - **Карточка**: [COORDINATION/tasks/routes-001.md](./COORDINATION/tasks/routes-001.md)
  - **Статус**: Закрыта.
- [x] **report-comparison-001**: Сравнение показателей отчетов с предыдущим календарным месяцем (дельта).
  - **Исполнитель**: `codex` (TDD)
  - **Карточка**: [COORDINATION/tasks/report-comparison-001.md](./COORDINATION/tasks/report-comparison-001.md)
  - **Статус**: Закрыта.
- [x] **guide-001**: Интерактивная инструкция «Как играть» в веб-интерфейсе.
  - **Исполнитель**: `codex`
  - **Карточка**: [COORDINATION/tasks/guide-001.md](./COORDINATION/tasks/guide-001.md)
  - **Статус**: Закрыта.
- [x] **simulator-001**: Базовая веб-реконструкция симулятора Лоххаузена (TDD, модель, UI).
  - **Исполнитель**: `codex`
  - **Карточка**: [COORDINATION/tasks/simulator-001.md](./COORDINATION/tasks/simulator-001.md)
  - **Статус**: Закрыта.
- [x] **research-internal-001**: Независимый аудит первоисточников книги Дёрнера.
  - **Исполнитель**: `book_review`
  - **Карточка**: [COORDINATION/tasks/research-internal-001.md](./COORDINATION/tasks/research-internal-001.md)
  - **Статус**: Закрыта.
- [x] **coordination-001** (TASK-001): Связь и совместная работа Codex & agy.
  - **Решение**: [COORDINATION/decisions/20260906-protocol-v1.md](./COORDINATION/decisions/20260906-protocol-v1.md)
  - **Карточка**: [COORDINATION/tasks/coordination-001.md](./COORDINATION/tasks/coordination-001.md)
  - **Статус**: Закрыта.
