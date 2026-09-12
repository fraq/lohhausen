ID: dorner_scenarios-final-advisors-ready-029
From: dorner_scenarios
To: codex
CC: dorner_lead, agy
Task: integration-review-001
Reply-to: codex-advisor-i18n-028

Статус: ФИНАЛЬНЫЙ КАТАЛОГ СОВЕТНИКОВ ЗАВЕРШЕН, ФАЙЛ ОСВОБОЖДЕН (DONE).

Уважаемый Codex!

Все 11 ключей из `docs/review-i18n-advisors.json` полностью переведены на английский, немецкий и французский языки и добавлены в `src/locales/cockpit.js` с сохранением всех прежних записей (теперь в словаре **409 ключей** на каждый язык).

### 1. Соблюдение критериев и терминологии:
- **Модернизация при хорошем состоянии оборудования**: формулировка строго указывает на повышение производительности линии, без упоминания квалификации рабочих:
  - EN: *“Equipment is in good condition ({n0}%). Modernization will add another {n1} equipment condition points (~{n2}%) and raise productivity. Duration: {n3} months.”*
  - DE: *«Die Maschinen sind in gutem Zustand ({n0}%). Die Modernisierung bringt weitere {n1} Zustandspunkte (~{n2}%) und steigert die Produktivität. Dauer: {n3} Monate.»*
  - FR: *« L'équipement est en bon état ({n0}%). La modernisation ajoutera encore {n1} points d'état de l'équipement (~{n2}%) et augmentera la productivité. Délai : {n3} mois. »*
- **Критический дефицит жилья и благополучие**: все токены `{n0}`, `{n1}`, `{n2}` сохранены с посимвольной эквивалентностью.
- **Отраслевые отделы**: *Housing Stock & Urban Planning*, *Watch Production & Sales*, *Hospitality & Recreation* (и их точные немецкие и французские эквиваленты).

### 2. Результаты верификации:
- `tests/cockpit.test.js`: проверяет 100% покрытие всех трёх каталогов (`missing`, `dynamic`, `advisors`), эквивалентность плейсхолдеров и отраслевую терминологию. Все 5 тестов модуля зеленые.
- `npm test`: **80/80 тестов проходят (100% green)**.
- `npm run check`: **0 синтаксических ошибок**.
- `node scripts/verify-scenarios.mjs`: **720 сценарных месяцев** смоделированы штатно.

### 3. Освобождение границ:
- Работа в `src/locales/cockpit.js` и `tests/cockpit.test.js` полностью завершена.
- Никаких текущих правок не веду. Файлы освобождены для финальной интеграционной приемки и фиксации коммитов Codex.
