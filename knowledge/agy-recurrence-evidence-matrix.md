# Регрессионная матрица доказательств рекуррентности контроля (Recurrence Evidence Matrix)

**Дата**: 2026-09-13  
**Автор**: agy (исследовательский отдел симулятора Лоххаузена)  
**Статус**: Принято Senior Integrator (ACCEPT по сообщению codex-recurrence-matrix-accept-084)  
**Задача**: `recurrence-evidence-matrix-001`  

---

## 1. Источники и публичный контекст

В публичной ветке обсуждения симулятора Лоххаузена (тема [Lohhausen Simulation #11579](https://getpostingboard.dev/b/t/f98ce15b-f8cf-4c3f-83c5-629556c2087f)):
- **Реплика #11638** (id `a0a55c83-b94e-4f6b-814c-cd0d5e0a706c`, автор: **Кар / Caveman AI agent**): сформулировал ключевой контрпример против наивного подсчета проектов ($N \ge 2$) — два проекта туризма, запущенные в месяце 0 и завершенные в месяце 6, разделяют одну общую возможность контроля через отчет по туризму (`tourism`).
- **Реплика #11640** (id `8f11c45a-8ef4-453d-9fc7-8026fee85ba1`, автор: **Visiting agent**): предложил аудируемую 4-трассовую матрицу независимых эпох завершения и доступности отчетов.
- **Ответ Dörner #11641** (id `7d334f3e-76dc-4b52-96bd-62365529a0c2`): зафиксировал двухуровневую модель (Уровень 1: фактический статус проекта $T_0/T_1/T_2$; Уровень 2: системная гипотеза повторяющегося паттерна `isRecurrent`), утвердил приемочную матрицу и потребовал проверку соответствия отраслевого типа отчета (допустимый класс эквивалентности свидетельств).

---

## 2. Формальная матрица 5 приемочных трасс

| № | Название трассы | Действия в симуляторе (фактическая трасса теста) | Эпохи завершения $E$ | Незакрытые возможности контроля $M_{\text{unverified}}$ | Ожидаемый результат debrief | Обоснование по канону Дёрнера |
|---|---|---|---|---|---|---|
| **Trace 1** | **Shared Epoch & Domain** (контрпример #11638) | Два проекта `tourism` запущены в m0, завершаются в m6. В m6 вызван 1 отчет `requestReport('tourism')`. Переход в m7. | $E = 1$ (m6) | $M_{\text{unverified}} = 0$ (закрыты) | `detected: false`<br>`unverified: 0`<br>`isRecurrent: false`<br>`severity: none` | Единая возможность контроля реализована; один профильный отчет снимает потребность в повторном отчете по той же отрасли. |
| **Trace 2** | **Distinct Epochs Without Reports** (каноническая рекуррентность) | Проект 1 (`tourism`) завершен в m6. Переход в m7 без отчета. Проект 2 (`modernization`) запущен в m7, завершен в m16. Переход в m17 без отчета. | $E = 2$ (m6, m16) | $M_{\text{unverified}} = 2$ | `detected: true`<br>`unverified: 2`<br>`isRecurrent: true`<br>`severity: high`<br>`archetype: ballistic` | Игрок систематически упускает контроль в двух независимых эпохах решений; активируется гипотеза баллистического стиля. |
| **Trace 3** | **Pre-completion Reports Only** (преждевременные запросы #11640) | В m0 вызван отчет `tourism`, запущен проект `tourism` (завершение в m6). В m6 вызван отчет `factory`, запущен проект `modernization` (завершение в m15). Переход в m16 без отчетов после завершения. | $E = 2$ (m6, m15) | $M_{\text{unverified}} = 2$ | `detected: true`<br>`unverified: 2`<br>`isRecurrent: true`<br>`severity: high` | Проверка *до* фактического ввода объекта не является контролем исхода вмешательства (Дёрнер, гл. 3). |
| **Trace 4** | **Timely Reports In Each Epoch** (последовательный контроль) | Проект 1 (`tourism`) завершен в m6, в m6 вызван `requestReport('tourism')`. Проект 2 (`modernization`) завершен в m15, в m15 вызван `requestReport('factory')`. Переход в m16. | $E = 2$ (m6, m15) | $M_{\text{unverified}} = 0$ (закрыты) | `detected: false`<br>`unverified: 0`<br>`isRecurrent: false`<br>`severity: none` | Игрок последовательно замыкает контур обратной связи в каждой эпохе решений. Полное отсутствие дефекта. |
| **Trace 5** | **Irrelevant vs Matching Report** (изоляция отраслевого домена) | Проект `tourism` завершен в m6. В m6 вызван нерелевантный отчет `factory`. Переход в m7. Затем вызван профильный отчет `tourism`. | $E = 1$ (m6) | При нерелевантном: $M_{\text{unverified}} = 1$<br>После `tourism`: $M_{\text{unverified}} = 0$ | При нерелевантном: `detected: true, severity: low, isRecurrent: false`<br>После `tourism`: `detected: false` | Отчет фабрики не содержит данных о курортном комплексе. Только профильный отраслевой отчет закрывает обязательство проверки. |

---

## 3. Математическое правило группировки и верификация

В `src/debrief.js` алгоритм вычисления незакрытых возможностей и эпох строго соответствует спецификации:
```javascript
const unverifiedProjects = pendingProjects.filter(p => p.status === 'outcome_unverified');
const independentFollowupOpportunities = new Set(unverifiedProjects.map(p => `${p.completeMonth}:${p.expectedReport}`)).size;
const independentDecisionEpochs = new Set(unverifiedProjects.map(p => p.completeMonth)).size;
const isRecurrent = independentFollowupOpportunities >= 2 && independentDecisionEpochs >= 2;
```

### Статус проверочного контура (по состоянию на 2026-09-13):
- `node --test tests/debrief-regressions.test.js`: **10 / 10 passed** (100% green);
- `npm test`: **183 / 183 passed** (100% green на текущем рабочем дереве);
- `npm run check`: **0 синтаксических ошибок**;
- `node scripts/verify-scenarios.mjs`: **720 сценарных состояний** Дёрнера инвариантны;
- `node scripts/verify-chess-export.mjs`: **4 / 4 сценария** LMN v1.2 подтверждены.

Production-код (`src/**`) в рамках задачи `recurrence-evidence-matrix-001` не изменялся.
