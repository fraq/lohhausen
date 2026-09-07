# Project Task Board (Overview Index)

> **Workflow**: Backlog ➔ Ready for [Agent] ➔ In Progress ([Agent]) ➔ Review ➔ Done
> 
> *Примечание: Источником истины для статуса задач являются индивидуальные карточки в [COORDINATION/tasks/](./COORDINATION/tasks/). Настоящий файл поддерживается agy как сводный обзорный индекс.*

---

## 🚀 In Progress
*Активные задачи.*

- [ ] **debrief-001** (TASK-006): Модуль когнитивной ретроспективы и анализа ошибок мышления по книге Дёрнера (Dörner Debriefing Engine).
  - **Исполнитель**: `dorner_analyst` (при поддержке `debrief_agent`)
  - **Ведущий куратор**: `dorner_lead`
  - **Статус**: ACCEPT выдан 2026-09-07, границы согласованы (`src/debrief.js`, `tests/debrief.test.js`).
  - **Письмо согласования**: [COORDINATION/mail/dorner_analyst/20260907T211000Z-dorner_lead-accept-debrief.md](./COORDINATION/mail/dorner_analyst/20260907T211000Z-dorner_lead-accept-debrief.md)

---

## 🔍 Review
*Задачи на проверке.*

- [x] **research-001**: Исследование книги Дёрнера, реконструкция модели Лоххаузена и аудит спецификации.
  - **Исполнитель карточки**: `agy` (Assistant)
  - **Проверяющий**: `codex` (Lead)
  - **Карточка**: [COORDINATION/tasks/research-001.md](./COORDINATION/tasks/research-001.md)
  - **Артефакты**: [knowledge/agy-research.md](./knowledge/agy-research.md), [knowledge/agy-source-map.md](./knowledge/agy-source-map.md)
  - **Статус**: Материалы сданы, выполнена перекрестная сверка с `research-internal-001`.

---

## 🏛️ Руководство и координация (dorner_lead)
*Координатор проекта: `dorner_lead` (назначен 2026-09-07 по поручению пользователя).*
- Решение: [COORDINATION/decisions/20260907-leadership-and-roles.md](./COORDINATION/decisions/20260907-leadership-and-roles.md)
- Состояние: [COORDINATION/state/dorner_lead.md](./COORDINATION/state/dorner_lead.md)

---

## 🗄️ Backlog
*Идеи и будущие этапы.*

- [ ] Оптимизация и дальнейшее развитие сценариев симуляции при необходимости.

---

## ✅ Done
*Завершенные задачи.*

- [x] **i18n-001**: Локализация интерфейса (en / de / fr / ru), языковые ссылки и статьи Википедии.
  - **Исполнитель**: `codex` (с переводчиками)
  - **Карточка**: [COORDINATION/tasks/i18n-001.md](./COORDINATION/tasks/i18n-001.md)
  - **Отчет**: [docs/i18n-verification.md](./docs/i18n-verification.md)
  - **Статус**: Закрыта (26/26 тестов, Chrome desktop/mobile проверены).
- [x] **routes-001**: Отдельные URL для всех экранов симулятора, навигация history API, исправление прокрутки.
  - **Исполнитель**: `codex`
  - **Карточка**: [COORDINATION/tasks/routes-001.md](./COORDINATION/tasks/routes-001.md)
  - **Отчет**: [docs/routes-verification.md](./docs/routes-verification.md)
  - **Статус**: Закрыта.
- [x] **report-comparison-001**: Сравнение показателей отчетов с предыдущим календарным месяцем (дельта).
  - **Исполнитель**: `codex` (TDD: `report_delta_red` + `report_delta_green`)
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
  - **Результат**: [knowledge/internal-book-review.md](./knowledge/internal-book-review.md)
  - **Статус**: Закрыта.
- [x] **coordination-001** (TASK-001): Связь и совместная работа Codex & agy.
  - **Решение**: [COORDINATION/decisions/20260906-protocol-v1.md](./COORDINATION/decisions/20260906-protocol-v1.md)
  - **Карточка**: [COORDINATION/tasks/coordination-001.md](./COORDINATION/tasks/coordination-001.md)
  - **Статус**: Закрыта (протокол v1 согласован).
