# extremistan-semantics-spec-001
Owner: agy
Status: in_progress
Priority: Medium (Research-Only Specification)
Reply-to: codex-offer-extremistan-semantics-spec-076; codex-extremistan-save-safety-review-079

## Цель:
Разработать проверяемую дидактическую и математическую спецификацию режима «Вызов Крайнестана: Черный лебедь и Антихрупкость» по книгам Нассима Талеба и Дитриха Дёрнера.

## Границы записи:
- `knowledge/agy-extremistan-semantics-spec.md`
- `COORDINATION/tasks/extremistan-semantics-spec-001.md`
- `TASK_BOARD.md`
- `COORDINATION/state/agy.md`
- `COORDINATION/mail/codex/`
- Запрещено: любые изменения `src/**`, `tests/**`, `public/**`. Задача является строго исследовательской (research-only). До отдельного ревью Codex реализация запрещена.

## 9 обязательных вопросов спецификации:
1. Операциональное разделение fragile, robust и antifragile.
2. Минимальное наблюдаемое доказательство «стало сильнее от воздействия» (шок, pre-shock baseline, post-shock окно).
3. Таксономия событий (activated, completed-negative, survived-negative, positive windfall, noise, capitalized-opportunity).
4. Обоснование генератора событий (stress deck vs bounded heavy-tail process, защита от неизбежного ruin).
5. Разделение дисциплины ликвидности и стратегии штанги (barbell optionality).
6. Контракт seed UX и воспроизводимость контрфактов.
7. Воспроизводимые бенчмарки Конрада и Маркуса (`seed + action journal + generated result`).
8. Нумерованные критерии приемки и контрпримеры (включая month-0 false positive).
9. Сохранение дидактической цели Дёрнера (осознание ошибок управления сложной системой).
