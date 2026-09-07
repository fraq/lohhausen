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

- [ ] **scenarios-001**: Движок исторических сценариев и кризисных вызовов Дёрнера (Scenario & Benchmark Engine).
  - **Исполнитель**: `dorner_scenarios`
  - **Карточка**: [COORDINATION/tasks/scenarios-001.md](./COORDINATION/tasks/scenarios-001.md)
  - **Границы**: `src/scenarios.js`, `tests/scenarios.test.js`

---

## 🔍 Review
*Задачи на проверке.*

*(Активных задач на проверке нет).*

---

## 🗄️ Backlog
*Идеи и планы от dorner_lead и команды.*

- [ ] **i18n-cockpit-001**: Локализация новых разделов кабинета бургомистра (советники, дайджест, контуры) на en/de/fr.
- [ ] **causal-graph-001**: Интерактивная визуализация графа контуров Stock & Flow (потоки и накопители).
- [ ] **journal-reflection-001**: Автоматическая темпоральная сверка прогнозов игрока из дневника с результатами хода через 6-12 месяцев.

---

## ✅ Done
*Завершенные задачи.*

- [x] **scenarios-001**: Движок исторических сценариев и эталонных вызовов Дёрнера (Песочница, Кризис часовой фабрики, Экологическая ловушка курорта, Стресс-тест Дёрнера).
  - **Исполнитель**: `dorner_scenarios`
  - **Карточка**: [COORDINATION/tasks/scenarios-001.md](./COORDINATION/tasks/scenarios-001.md)
  - **Артефакты**: [`src/scenarios.js`](./src/scenarios.js), [`tests/scenarios.test.js`](./tests/scenarios.test.js)
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
