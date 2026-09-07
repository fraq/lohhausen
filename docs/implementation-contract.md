# Контракт первого цикла

Спецификация docs/simulator-spec.md подтверждена пользователем. Стек: JavaScript ES modules, node:test, без зависимостей. Браузерная приемка через Chrome DevTools. Это уточнение API и селекторов для независимой работы; критерии спецификации не меняются.

## Модель: src/model.js

Именованные экспорты:
- `createGame()` → новое состояние.
- `setPolicies(game, patch, note = '')` → новое состояние с принятой политикой и записью журнала.
- `startProject(game, type, note = '')` → новое состояние с оплаченным проектом; типы `housing`, `modernization`, `tourism`. Для жилья срок 12 месяцев и +60 мест по AC-3. Нехватка денег: понятная Error, без мутации.
- `advance(game, months = 1)` → новое состояние, максимум month=120.
- `requestReport(game, kind)` → новое состояние с датированным снимком в `reports[kind]`; kind: `finance`, `factory`, `housing`, `social`, `tourism`. Снимок содержит `month` и `data`, текстовые `observations` допустимы.
- `trade({production, inventory, demand, price})` → `{sales, inventory, revenue}`. Единицы производства и денег согласованы с входом.
- `serializeGame(game)` → JSON string; `deserializeGame(raw)` → проверенное состояние либо Error.
- `summarize(game)` → `{metrics, lessons}`; metrics содержит 5 объектов `{key,label,initial,final,change,unit}` с ключами `finance`, `production`, `unemployment`, `housing`, `satisfaction`. Финансы = treasury−debt; UI также показывает оба компонента. Lessons — текстовые наблюдения без диагностики личности.
- `POLICY_CONFIG` → объект с ключами политики, каждый `{label,min,max,step,unit,description}`.
- `PROJECTS` → объект типов, каждый `{label,cost,duration,description}`.

Состояние — простой JSON-объект: `version:1`, `month`, `horizon:120`, `population`, `treasury`, `debt`, `housingCapacity`, `workforce`, `factoryJobs`, `otherJobs`, `tourismJobs`, `unemployment`, `housingShortage`, `equipment`, `skills`, `production`, `inventory`, `sales`, `demand`, `serviceQuality`, `health`, `education`, `satisfactionGroups` (workers/families/seniors), `satisfaction`, `tourismCapacity`, `tourismDemand`, `visitors`, `policies`, `projects`, `reports`, `history`, `journal`, `events`, `lastBudget`.

Проценты состояния equipment/skills/serviceQuality/health/education/satisfaction и групп — 0..100. Денежные значения — тысячи условных марок. Численность — люди, выпуск/запасы/продажи — часы. Остальные служебные поля модели допустимы. Политики: `taxRate` (проценты), `wage` (проценты базовой зарплаты), `maintenance`, `services`, `education`, `marketing`, `tourismMarketing` (тыс. марок/месяц). Точные разумные диапазоны определяет POLICY_CONFIG.

Проект: `{id,type,label,cost,startMonth,completeMonth}`. Завершенные проекты удаляются из активной очереди; итог остается в journal. История: снимки месяца 0 и каждого рассчитанного месяца; минимум month, population, treasury, debt, production, unemployment, housingShortage, satisfaction. Журнал: `{month,type,title,note}` плюс любые объясняющие поля. Events — массив строк последних событий. LastBudget — `{income,expenses,net,...}` с данными последнего месяца.

Модель не импортирует DOM/хранилище. Операции не мутируют входы. Для нулевого населения никакой самопроизвольной иммиграции в пустой город. Нулевая казна допустима, долг сохраняется. Проверка сохранений должна отвергать не только невалидный JSON, но и некорректную структуру вложенных политик, проектов и истории.

## Интерфейс: public/index.html, public/styles.css, src/app.js

Страница при первом открытии показывает активную новую игру месяца 0; сохранение автоматически восстанавливается при наличии корректных данных. Ключ localStorage: `lohhausen-save-v1`. Поврежденный ключ не перезаписывается автоматически: до явного нового старта игра предлагает восстановление/сброс и сообщает ошибку.

Стабильные селекторы для браузерных проверок:
- `[data-testid="month"]` содержит номер месяца в `data-month`.
- `[data-testid="population"]` содержит число в `data-value`.
- `[data-testid="housing-capacity"]` в разделе решений содержит вместимость жилья в `data-value`.
- `[data-testid="advance-1"]`, `[data-testid="advance-3"]` — кнопки хода.
- `[data-testid="nav-reports"]` открывает отчеты; `[data-testid="report-factory"]` выбирает фабрику; `[data-testid="request-report"]` запрашивает выбранный отчет; `[data-testid="report-date"]` содержит дату снимка в `data-month`.
- `[data-testid="nav-decisions"]` открывает решения, `[name="taxRate"]` — поле налога, `[data-testid="apply-policies"]` — применение.
- `[data-testid="project-housing"]` — явный запуск жилья после показанных стоимости/срока (дополнительного confirm не нужно).
- `[data-testid="save"]` — явное сохранение, `[data-testid="new-game"]` открывает диалог, `[data-testid="confirm-new-game"]` подтверждает сброс.
- `[data-testid="nav-debrief"]` открывает разбор; `[data-testid="debrief"]` содержит итог/текущий разбор, `[data-testid="metric-finance"]` и аналоги остальных 4 метрик доступны в разборе.
- `[data-testid="nav-model"]` открывает раздел модели, `[data-testid="model-info"]` содержит обозначение учебной реконструкции.
- `[data-testid="error"]` содержит видимую ошибку загрузки/действия при ее наличии.

Браузерные проверки проверяют действия и значения DOM, а не вызывают модель в обход UI. Для перезагрузки — отдельные подготовительный и проверочный этапы, которые выполнит руководитель через Chrome. Модуль тестов может быть доступен локально как /tests/browser-checks.js; книги и переписка сервером не раздаются.
