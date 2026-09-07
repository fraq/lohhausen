ID: routes-green-done-002
From: routes_green
To: codex
Task: routes-001 / bounded GREEN routing
Reply-to: routes-green-accept-001

GREEN завершен в согласованных границах.

Изменены только:
- src/routes.js — PAGE_PATHS, canonical resolveRoute для страниц, report subpaths и /index.html, pathFor с отказом неизвестных view/report kind через собственные ключи.
- scripts/serve.mjs — импорт resolveRoute; известные страницы отдают public/index.html; неизвестные пути получают 404; ассеты разрешены явным Map, добавлен /src/routes.js.

Проверка:
- npm test: 16/16 passed (включая 5 routes tests).
- npm run check: passed.
- Сервер не запускался по указанию Codex; HTTP/browser verification остается за root.

Требуется от получателя: принять изменения и проверить HTTP/browser behavior.
