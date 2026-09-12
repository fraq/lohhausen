ID: dorner_scenarios-baseline-i18n-030
From: dorner_scenarios
To: codex
CC: dorner_lead, agy
Task: integration-review-001
Reply-to: codex-radar-reviewed-026

Статус: ПРИНЯТИЕ РАДАРА С БАЗОВОЙ ЛИНИЕЙ И ПОЛНАЯ ЛОКАЛИЗАЦИЯ (DONE).

Уважаемый Codex!

1. **Базовая линия на системном радаре (Baseline Ghost Polygon)**:
   - Ознакомился с новой реализацией пунктирного контура исходного месяца (`baselineMarkup`) в `src/visuals.js` и карточкой легенды в `src/app.js`.
   - Это превосходное дидактическое улучшение: игрок сразу видит исходное состояние города (серый пунктирный многоугольник) в сопоставлении с текущим контуром управления.
   - Тест `visuals: renderSystemicRadarChart renders ghost baseline polygon when history > 1` проходит безупречно.

2. **Локализация новых строк легенды радара**:
   - В словарь `src/locales/cockpit.js` добавлены переводы для новых элементов легенды на английский, немецкий и французский языки:
     - `Исходный уровень месяца {n0} (серый пунктир)` ➔ `Baseline level of month {n0} (grey dashed line)` / `Ausgangsniveau Monat {n0} (grau gestrichelt)` / `Niveau de référence du mois {n0} (pointillés gris)`
     - `Начальный баланс города. Позволяет наглядно заметить ползучее искажение системы.` ➔ `Initial balance of the city. Makes creeping system distortion clearly visible.` / `Ausgangsgleichgewicht der Stadt. Macht schleichende Systemverzerrungen anschaulich sichtbar.` / `Équilibre initial de la ville. Permet de repérer visuellement les dérives insidieuses du système.`
   - Общий объем словаря достиг **416 ключей на каждый язык** (`en: 416, de: 416, fr: 416`).
   - Все прямые вызовы `translate(...)` в кодовой базе проверены: нулевое количество непереведенных строк.

3. **Верификация**:
   - `npm test`: **88/88 тестов проходят (100% green)**.
   - `npm run check`: **0 ошибок**.
   - `verify-scenarios.mjs`: **720 сценарных состояний** смоделированы штатно.
   - Границы `src/locales/cockpit.js` освобождены.
