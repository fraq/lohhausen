# Задача i18n-cockpit-001: Локализация кабинета бургомистра и системной динамики Дёрнера

## Паспорт задачи
- **ID**: `i18n-cockpit-001`
- **Исполнитель**: `dorner_analyst`
- **Заказчик / Куратор**: `dorner_scenarios` (Project Lead)
- **Статус**: `done`
- **Дата создания**: 2026-09-07
- **Дата завершения**: 2026-09-07

## Контекст и цель
Для максимальной аутентичности симулятора Лоххаузена и уважения к первоисточнику — немецкому оригинальному исследованию Дитриха Дёрнера («Die Logik des Mißlingens») — все разделы Mayoral Cockpit (советники, контуры системной динамики, дайджест хода, проверка гипотез, экспорт разбора) должны быть полноценно локализованы на аутентичный немецкий (`de`), английский (`en`) и французский (`fr`) языки.

## Реализация
1. **Словарь `src/locales/extra.js`**:
   - Добавлены аутентичные переводы:
     - Немецкий (de): `SYSTEMDYNAMIK NACH DÖRNER`, `Anatomie der Vernetzung: Warum hängt alles mit allem zusammen?`, `HYPOTHESENPRÜFUNG (TAGEBUCH)`, `Erwartung vs. Realität: Lehren abgeschlossener Projekte`, `BERATER DES BÜRGERMEISTERS`, `RUNDENCHRONIK: URSACHEN & WIRKUNGEN`, `BÜRGERMEISTER-COCKPIT`, `ZWISCHENBILANZ`, `ZEHN JAHRE SPÄTER`, `Debrief herunterladen (Markdown)`, `Sitzung exportieren (JSON)`.
     - Английский (en): `SYSTEM DYNAMICS (DÖRNER)`, `Anatomy of Feedback: Why does everything depend on everything?`, `LONG-TERM HYPOTHESIS CHECK (JOURNAL)`, `Expectation vs Reality: Lessons from Finished Projects`, `MAYORAL ADVISORS`, `TURN CHRONICLE: CAUSES & EFFECTS`, `MAYORAL COCKPIT`, `MID-TERM DEBRIEF`, `TEN YEARS LATER`, `Download Debrief (Markdown)`, `Export Session (JSON)`.
     - Французский (fr): `DYNAMIQUE DES SYSTÈMES SELON DÖRNER`, `Anatomie des rétroactions : pourquoi tout dépend de tout ?`, `VÉRIFICATION DES HYPOTHÈSES (JOURNAL)`, `Attente vs Réalité : Leçons des projets achevés`, `CONSEILLERS DU MAIRE`, `CHRONIQUE DU TOUR : CAUSES & EFFETS`, `BUREAU DU MAIRE`, `BILAN INTERMÉDIAIRE`, `DIX ANS PLUS TARD`, `Télécharger le bilan (Markdown)`, `Exporter la session (JSON)`.
2. **Тесты**:
   - В `tests/i18n.test.js` добавлен тест `AC-5` на локализацию терминов системной динамики и кабинета бургомистра.
3. **Верификация**:
   - Полный набор: **53/53 тестов проходят (100% green)**.
   - Синтаксис и запуск: 0 ошибок.
