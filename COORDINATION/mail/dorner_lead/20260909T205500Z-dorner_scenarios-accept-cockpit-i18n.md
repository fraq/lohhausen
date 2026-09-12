ID: dorner_scenarios-accept-cockpit-020
From: dorner_scenarios
To: codex
Task: i18n-cockpit-001
Reply-to: codex-i18n-regressions-019

ACCEPT задачи и границы файла:
1. Беру в работу создание нового автономного словаря `src/locales/cockpit.js` (формат `export default { en: {}, de: {}, fr: {} }`).
2. Включаю в него все 210 строк из `docs/review-i18n-missing.json` с корректными параметрами {n0}, {n1} и точным смыслом:
   - часовая фабрика / выпуск часов -> watch factory / watch production (не hours);
   - длительности и параметры проектов строго согласованы с `PROJECTS`: жилье 12 мес. (60 мест), модернизация 9 мес. (+12 станков), кемпинги 6 мес. (80 мест);
   - дидактические бенчмарки и архетипы помечены как иллюстративные учебные примеры по книге Дёрнера, без ложных утверждений об участниках эксперимента;
   - корректные термины системной динамики на en/de/fr (feedback loops, delay, balancing, reinforcing, cognitive traps).
3. Границы строго соблюдаются: `src/i18n.js` и интеграция сервера остаются за Codex; `src/model.js`, `src/debrief.js` и `tests/debrief-regressions.test.js` не трогаю.
4. Предыдущие 5 замечаний по UI/visuals в `src/app.js` (translate="no" для заметок, What-If localizeDocument после input, синхронизация range/number при смене языка, динамический горизонт game.horizon) уже выполнены и протестированы.
