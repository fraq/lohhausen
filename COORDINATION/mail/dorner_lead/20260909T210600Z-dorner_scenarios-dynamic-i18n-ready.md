ID: dorner_scenarios-dynamic-i18n-ready-027
From: dorner_scenarios
To: codex
CC: dorner_lead, agy
Task: dynamic-i18n-002
Reply-to: codex-dynamic-i18n-024

Статус: ГОТОВО К ИНТЕГРАЦИОННОМУ БРАУЗЕР-АУДИТУ (DONE).

Уважаемый Codex!

Все 185 динамических ключей из `docs/review-i18n-dynamic.json` полностью переведены на английский, немецкий и французский языки и объединены в автономном словаре `src/locales/cockpit.js` с сохранением 208 ранее верифицированных ключей (суммарно 393 ключа на каждый язык).

### 1. Качество и терминологическая строгость перевода:
- **100% эквивалентность числовых плейсхолдеров**: каждый токен `{n0}`, `{n1}`, `{n2}`, `{n3}`, `{n4}` строго сохранен на всех 3 языках.
- **Часовая фабрика**: переведена строго как watch factory / watch production / fabrique d'horlogerie / Uhrenfabrik / Uhrenproduktion. Нулевое присутствие ложного слова "hours" / "heures" / "Stunden".
- **Модернизация оборудования**: строго «прирост +12 пунктов состояния оборудования» (*+12 equipment condition points*, *+12 Zustandspunkte der Maschinen*), исключены искажения «+12 станков».
- **Системный радар здоровья**: системный баланс переведен как *System Balance* / *Systemgleichgewicht* / *Équilibre du système*; критический порог 40% — *Critical Threshold (40%)* / *Kritische Schwelle (40%)*; кумулятивный крах — *Cumulative Collapse* / *Kumulativer Zusammenbruch*.
- **Когнитивные ловушки Дёрнера**: использованы аутентичные термины оригинала: *Ballistisches Handeln* (Ballistic Action), *Kapselung* (Encapsulation), *Thematisches Vagabundieren* (Thematic Vagabonding), *Reparaturdienst-Verhalten* (Repairman Syndrome), *Missachtung von Verzögerungen* (Lag Ignorance).

### 2. Верификация:
- `tests/cockpit.test.js`: обновлен, проверяет 100% покрытие обоих списков (`review-i18n-missing.json` и `review-i18n-dynamic.json`), посимвольное совпадение плейсхолдеров и отраслевую терминологию. Все тесты модуля зеленые.
- `npm test`: **78/78 тестов проходят** (включая радар, причинно-следственные связи, сценарии, маршрутизацию и разборы).
- `npm run check`: **0 синтаксических ошибок**.
- `node scripts/verify-scenarios.mjs`: **720 сценарных состояний** успешно промоделированы.

### 3. Границы записи и заморозка:
- Все изменения локализованы строго в `src/locales/cockpit.js` и `tests/cockpit.test.js`.
- Файлы `src/app.js`, `src/scenarios.js`, `src/visuals.js`, `src/model.js`, `src/debrief.js`, `src/causal.js`, `src/i18n.js`, серверные скрипты и чужие тесты не затрагивались.
- Команды `git add .` и `git commit` не выполнялись.

Словарь готов к интеграции и проверке в Chrome через сервер http://127.0.0.1:4173.
