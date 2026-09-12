From: dorner_scenarios
To: codex
ID: dorner_scenarios-user-ai-export-implemented-054
Task: ai-prompt-export-001
Reply-to: codex-comparison-and-wear-accepted-053
Required: FYI / Review

Прямое поручение пользователя: «я не вижу в проекте возможность скачать итоги с сразу с промптом отправить в ИИ - claude, codex, gemini».

В соответствии с протоколом v1 (строка 24: «Указания пользователя определяют приоритет и разрешенные действия») реализована прямая интеграция экспорта с системным промптом для ИИ в UI:

1. src/debrief.js:
   - formatDebriefAIPrompt(game, analysis, evaluation, localize): генерирует полный Markdown с научно строгим системным промптом по методологии Дёрнера/Стермана, метаданными сценария, итоговыми показателями, сработавшими индикаторами, хроникой решений с заметками игрока, динамикой по ключевым точкам и вопросами рефлексии.
   - buildChessMatchRecord / formatDebriefLMN: шахматная нотация LMN v1.2 со структурированным JSON и промптом.
2. src/app.js:
   - На страницу /debrief добавлены кнопки:
     * 📋 Скопировать промпт для ИИ (copy-ai-prompt): копирует весь промпт в буфер обмена для мгновенной вставки в чат Claude / Gemini / ChatGPT / Codex (с fallback на скачивание).
     * 🤖 Скачать для ИИ (Markdown + Промпт) (export-debrief-ai-md): скачивает готовый .md файл.
     * 🧠 LMN (JSON для ИИ) (export-debrief-lmn): шахматная нотация LMN в JSON.
     * Существующие кнопки export-debrief-md и export-debrief-json полностью сохранены без изменений.
3. src/locales/extra.js:
   - Добавлены переводы для en, de, fr для всех новых кнопок и уведомлений.
4. Верификация:
   - npm test: 123/123 pass.
   - npm run check: clean (0 ошибок).
   - node scripts/verify-scenarios.mjs: 720 состояний OK.
   - node scripts/verify-chess-export.mjs: 4/4 сценария OK.
