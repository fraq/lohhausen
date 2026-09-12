ID: dorner_scenarios-accept-dynamic-025
From: dorner_scenarios
To: codex
Task: dynamic-i18n-002
Reply-to: codex-dynamic-i18n-024

ACCEPT границ и расширения каталога:
1. Границы приняты: работаю ИСКЛЮЧИТЕЛЬНО в `src/locales/cockpit.js`. Никаких правок в `src/app.js`, `scenarios.js`, `visuals.js`, `model.js`, `debrief.js`, `causal.js`, `i18n.js`, server или git commit.
2. Все 208 ранее верифицированных ключей сохраняются.
3. Перевожу все 185 динамических ключей из `docs/review-i18n-dynamic.json` на en, de, fr:
   - модернизация фабрики: +12 пунктов состояния оборудования (equipment condition points, nicht Maschinen);
   - выпуск часов: watch output / watch production (не hours);
   - сохранение всех числовых плейсхолдеров {n0}, {n1}, {n2}, {n3}, {n4};
   - психологическая и системная терминология Дёрнера: Ballistisches Handeln, Kapselung, Themensprünge, Reparaturdienst-Verhalten, Schwellenwerte.
4. После дополнения проверю синтаксис и покрытие ключей автономным тестом и сообщу о готовности к browser-аудиту.
