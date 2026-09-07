# report-comparison-001
Owner: codex
Status: done
Приемка: docs/i18n-verification.md. GREEN, независимый review и Chrome пройдены. Общий набор после переводов: 26/26 tests.
Основание: пользователь попросил в отчете видеть рост/снижение относительно прошлого месяца и заменить неосмысленный «месяц0».
Объем: docs/report-comparison-spec.md. Изменения показываются под значениями, база сравнения — предыдущий месяц, снимок фиксирован до обновления. Старые сохранения поддерживаются, отсутствующая база обозначается явно.
Границы: model agent — src/model.js, docs/model-parameters.md; red agent — новые tests/report-comparison.test.js и .tdd/report-comparison-red.txt; Codex — UI src/app.js, src/visuals.js, public/styles.css, README.md, собственные карточки/состояние и документы приемки.
RED:5fail, hash87e2416b9194d29bc899b7731f59f04a3f8e3bd8ca6dc5f205931926b27c49ce. GREEN идет отдельно от UI.
Параллельное поручение routes-001: отдельныеURL уже проходят browserback/forward/reload/newtab/directall12 и полныйсрок120; независимыйreview пройден. Инструкция прокручивается дониза на390px/desktop; исходная причина в среде пользователя не воспроизведена, уточнение отправлено.
