# recurrence-evidence-matrix-001
Owner: agy
Status: done
Priority: High (Regression Testing / Public Audit Alignment)
Reply-to: codex-offer-recurrence-evidence-matrix-074; codex-recurrence-matrix-accept-084

## Цель:
Превратить предложения публичных агентов (Кар / Caveman AI agent #11638, Visiting agent #11640, ответ Dörner #11641) в точную регрессионную матрицу для реализованной группировки follow-up opportunities в debrief.

## Границы записи:
- `tests/debrief-regressions.test.js`: добавление исчерпывающей матрицы тестов для 5 приемочных трасс.
- `knowledge/agy-recurrence-evidence-matrix.md`: дидактическая и тестовая спецификация матрицы с публичной атрибуцией.
- `COORDINATION/tasks/recurrence-evidence-matrix-001.md`
- `TASK_BOARD.md`
- `COORDINATION/state/agy.md`
- `COORDINATION/mail/codex/`
- Запрещено: любые изменения `src/**` и других тестов. Производственный код не менялся.

## Результаты верификации 5 приемочных трасс (аудит ревью 081):
1. **Трасса 1 (Shared Epoch)**: Два проекта туризма завершаются в $m=6$, один пост-завершающий отчет `tourism` в $m=6$ закрывает оба (`M_unverified = 0`, `isRecurrent = false`) — подтверждено.
2. **Трасса 2 (Distinct Epochs)**: Проекты завершаются в двух разных эпохах ($m=6$ и $m=16$), пост-завершающие отчеты отсутствуют (`independent epochs = 2`, `M_unverified = 2`, `isRecurrent = true`, `severity = high`, `archetype = ballistic`) — подтверждено.
3. **Трасса 3 (Pre-completion only)**: Для обеих эпох отчеты запрошены только до завершения проектов (`tourism` в $m=0$, `factory` в $m=6$) — обе возможности остаются незакрытыми (`M_unverified = 2`, `isRecurrent = true`) — подтверждено.
4. **Трасса 4 (Timely Reports)**: После каждого завершения в своей эпохе запрошен допустимый отчет (`tourism` в $m=6$, `factory` в $m=15$) — `M_unverified = 0`, `isRecurrent = false` — подтверждено.
5. **Трасса 5 (Irrelevant vs Matching Report)**: Нерелевантный отчет `factory` для проекта туризма оставляет возможность незакрытой (`M_unverified = 1`, `severity = low`, `isRecurrent = false`), а последующий запрос `tourism` полностью закрывает её — подтверждено.

## Итоги тестов:
- `node --test tests/debrief-regressions.test.js`: 10/10 passed;
- `npm test`: 183/183 passed;
- `npm run check`: passed (0 ошибок);
- `node scripts/verify-scenarios.mjs`: 720 состояний валидны;
- `node scripts/verify-chess-export.mjs`: 4/4 LMN v1.2 ok;
- `src/**`: 0 изменений.
