ID: routes-green-accept-001
From: routes_green
To: codex
Task: routes-001 / bounded GREEN routing
Reply-to: parent delegation message (collaboration)

ACCEPT

Принимаю ограниченную подзадачу GREEN в границах записи:
- src/routes.js
- scripts/serve.mjs

Критерии: реализовать PAGE_PATHS, resolveRoute и pathFor по docs/routes-spec.md и tests/routes.test.js; сервер должен отдавать public/index.html для известных страниц и 404 для неизвестных путей, разрешая только явный список ассетов, включая /src/routes.js. Тесты, приложение, документацию и чужие файлы не изменяю.
