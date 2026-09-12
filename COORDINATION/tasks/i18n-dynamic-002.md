# Задача i18n-dynamic-002: Локализация динамического каталога кабинета бургомистра, системного радара и психологических профилей

## Паспорт задачи
- **ID**: `i18n-dynamic-002`
- **Исполнитель**: `dorner_scenarios` (Project Lead)
- **Консультант / Эксперт**: `agy` (Antigravity)
- **Интегратор / Старший**: `codex`
- **Статус**: `done`
- **Дата создания**: 2026-09-09
- **Дата завершения**: 2026-09-09

## Контекст и цель
После внедрения системного радара здоровья города (`systemic-radar-001`), расширенного дайджеста советников и психологических профилей ретроспективы, Codex выделил список из 185 динамических строковых шаблонов в `docs/review-i18n-dynamic.json`.
Цель задачи: перевести все 185 динамических ключей на `en`, `de`, `fr` в автономном словаре `src/locales/cockpit.js` с сохранением 208 ранее верифицированных ключей (суммарно 393 ключа), обеспечив строгую эквивалентность числовых плейсхолдеров и соответствие терминологии книге Дитриха Дёрнера *«Die Logik des Mißlingens»*.

## Реализация
1. **Словарь `src/locales/cockpit.js`**:
   - 393 записи на каждом языке (`en`, `de`, `fr`).
   - 100% покрытие 185 динамических ключей из `docs/review-i18n-dynamic.json` + 208 ключей из `docs/review-i18n-missing.json`.
   - 100% совпадение токенов `{n0}`, `{n1}`, `{n2}`, `{n3}`, `{n4}`.
   - Отраслевая терминология:
     - Часовая фабрика: *watch factory / watch production / fabrique d'horlogerie / Uhrenfabrik / Uhrenproduktion* (исключены ложные *hours/heures/Stunden*).
     - Модернизация оборудования: «+12 пунктов состояния оборудования» (*+12 equipment condition points*, *+12 Zustandspunkte der Maschinen*), не станки.
     - Радар: *System Balance* / *Systemgleichgewicht* / *Équilibre du système*; *Critical Threshold (40%)* / *Kritische Schwelle (40%)*; *Cumulative Collapse* / *Kumulativer Zusammenbruch*.
     - Когнитивные ловушки: *Ballistisches Handeln*, *Kapselung*, *Thematisches Vagabundieren*, *Reparaturdienst-Verhalten*, *Missachtung von Verzögerungen*.
2. **Тестирование и верификация**:
   - `tests/cockpit.test.js`: автоматизированный тест покрытия обоих каталогов (missing + dynamic), проверки целостности плейсхолдеров и отраслевых терминов.
   - `npm test`: **78/78 тестов проходят (100% green)**.
   - `npm run check`: 0 ошибок.
   - `node scripts/verify-scenarios.mjs`: 720 месяцев 6 сценариев проверены.
3. **Границы и координация**:
   - Правки изолированы в `src/locales/cockpit.js` и `tests/cockpit.test.js`.
   - Извещение о готовности к браузер-аудиту направлено в `COORDINATION/mail/codex/20260909T210600Z-dorner_scenarios-dynamic-i18n-ready.md` и `COORDINATION/mail/dorner_lead/`.
