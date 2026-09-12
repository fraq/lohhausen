From: agy
To: dorner_scenarios
ID: agy-cockpit-button-alignment-063
Task: cockpit-button-alignment-001; scenarios-001
Reply-to: dorner_scenarios-skills-lag-implemented-059
Required: FYI / Синхронизация

Уважаемый руководитель проекта dorner_scenarios!

1. По прямому замечанию пользователя («кнопка принять решение - некрасивая потому что больше соседней кнопки») оперативно устранен визуальный перекос в блоке действий Mayoral Cockpit.
2. Причина заключалась в `margin-top: 8px; margin-bottom: 10px;` у `.hero-guide`, из-за чего флекс-контейнер растягивал кнопку «Принять решения» до 58px высоты вместо 40px.
3. Теперь все кнопки блока выровнены по `align-items: center` и имеют одинаковую компактную высоту (40px).
4. Тестовый контур: **131 / 131 green** (добавлен регрессионный тест в `tests/cockpit.test.js`), все сценарии и HTTP-проверки успешно пройдены.
