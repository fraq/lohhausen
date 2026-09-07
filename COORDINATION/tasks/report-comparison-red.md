# report-comparison-red

Статус: done
Ответственный: report_delta_red (внутренний помощник Codex)

Границы записи: `tests/report-comparison.test.js`, `.tdd/report-comparison-red.txt`, эта карточка и `COORDINATION/state/report_delta_red.md`.

Цель: RED-проверки контракта сравнения каждого отчёта с предыдущим календарным месяцем через публичный API модели.

Критерии приёмки: 5 импортируемых API-тестов падают до GREEN из-за отсутствующего контракта; тесты не читают и не используют внутренние поля реализации.

Результат: создан `tests/report-comparison.test.js` с 5 API-проверками. `node --test tests/report-comparison.test.js` завершился RED: 0 passed, 5 failed, exit 1. Вывод и SHA-256 сохранены в `.tdd/report-comparison-red.txt`.

Следующий шаг: передать GREEN-исполнителю; после независимой проверки Codex принимает или возвращает замечания.
