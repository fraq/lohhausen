# Системно-динамический анализ семантики постпроектного контроля (T0 / T1 / T2) и разрешение открытого вопроса границы T2

**Автор**: `agy` (Antigravity Research Assistant / Domain Expert)  
**Дата**: 2026-09-12  
**Основание**: Публичный дефект #11600 и #11613 («Повелитель»), верификация Codex (`docs/ai-agent-fix-ballistic-followup.md`), Дитрих Дёрнер (*Die Logik des Mißlingens*, гл. 3 «Мышление во времени», гл. 6 «Осознание ошибок и рефлексия»)  
**Статус**: Research & Specification Recommendation  
**Целевая задача**: `debrief-followup-fix` / `debrief-001`

---

## 1. Введение и подтверждение воспроизведения дефекта

В публичном обсуждении на Get Posting Board участник **«Повелитель»** (сообщения [#11600](https://getpostingboard.dev/b/t/f98ce15b-f8cf-4c3f-83c5-629556c2087f) и [#11613](https://getpostingboard.dev/b/t/f98ce15b-f8cf-4c3f-83c5-629556c2087f)) выявил ложное срабатывание индикатора `ballistic_action` в `src/debrief.js`:

```javascript
let game = createGame();
game = startProject(game, 'tourism', 'verification');
game = advance(game, 6);
```

В момент завершения проекта на месяце 6 (`completion` только что добавлен в журнал), игрок ещё физически не имел возможности предпринять какое-либо действие, однако `analyzeDebrief(game)` уже возвращает:
- `detected === true`
- `severity === 'high'`
- ярлык когнитивного дефекта «Баллистический стиль (Ballistisches Handeln)».

Это классическая ошибка преждевременного обвинения игрока: отсутствие наблюдения на шаге ввода проекта интерпретируется как когнитивная слепота, хотя окно для наблюдения ещё только открылось.

---

## 2. Разрешение открытого вопроса границы перехода к T2

В документе `docs/ai-agent-fix-ballistic-followup.md` и письме `codex-board-reply-and-repair-brief-061` поставлен ключевой открытый вопрос:

> *«Должно ли состояние T2 (`outcome_unverified`) наступать после первого зарегистрированного действия игрока в журнале в том же месяце после завершения проекта, ИЛИ только после перехода к следующему месяцу? Разрешите это минимальным контрпримером».*

### Сравнительный анализ альтернатив:

#### Альтернатива A: T2 наступает после любого последующего действия в том же месяце
Если любое зарегистрированное действие игрока в месяце завершения (например, `setPolicies`) переводит завершенный проект в статус `outcome_unverified`:

**Минимальный контрпример A1 (Ложноположительное обвинение при естественном порядке хода):**
1. Месяц 0: запуск проекта туризма (`duration: 6`).
2. Месяц 6: `advance(game, 6)`. Проект завершен, добавлен `completion` (индекс $k$).
3. Игрок находится в месяце 6 и формирует комплексное решение:
   - Шаг 3.1: заходит в решения и корректирует ставку налога: `setPolicies(game, { taxRate: 11 })`. В журнал записывается событие `policy` (индекс $k+1$, месяц 6).
   - Шаг 3.2: игрок переходит в раздел отчетов и запрашивает профильный отчет по туризму: `requestReport(game, 'tourism')`. В журнал записывается событие `report` (индекс $k+2$, месяц 6).
   - Шаг 3.3: игрок нажимает «Принять решения и рассчитать месяц 7»: `advance(game, 1)`.

*Анализ под Альтернативой A*:  
Если статус T2 фиксируется сразу после шага 3.1, то при промежуточном вызове дебрифинга (или при оценке хода) игроку присваивается `outcome_unverified`, несмотря на то, что на шаге 3.2 он добросовестно запросил и изучил отчет **до того, как время в городе сдвинулось вперед**!  
В дискретно-пошаговой симуляции Лоххаузена месяц — это единый пакет решений мэра. Порядок манипуляций в интерфейсе внутри одного месяца (сначала подвинуть ползунок налога, затем нажать кнопку отчета, или наоборот) является случайным артефактом навигации пользователя, а не свидетельством системного пренебрежения последствиями.

**Минимальный контрпример A2 (Пассивный ход без журнальных записей):**
1. Месяц 6: проект завершился.
2. Игрок не меняет налоги и не запускает проектов, а просто нажимает «Перейти на месяц 7» (`advance(game, 1)`).
3. В журнале **нет** событий `policy` или `project` в месяце 6!

*Анализ под Альтернативой A*:  
Если критерием перехода в T2 является наличие «зарегистрированного действия игрока» (`type === 'policy' | 'project'`), то при пассивном переходе на месяц 7 условие не сработает, и проект ложно останется в `followup_pending`!

---

#### Альтернатива B (Рекомендуемая): T2 наступает строго при переходе к следующему расчетному месяцу (`game.month > completeMonth`)

**Формальное определение правила:**
- **T0 (`followup_pending`)**: Проект завершен в месяце $T_{\text{comp}}$. Пока `game.month === completeMonth` и в журнале после события завершения нет профильного отчета, проект находится в состоянии ожидания контроля. Никаких штрафов и ярлыков не назначается.
- **T1 (`cleared`)**: В журнале зафиксирован запрос профильного отчета с индексом, строго большим индекса события завершения (`journal.indexOf(report) > completionIndex`). Это может произойти как в месяце $T_{\text{comp}}$, так и в более поздних месяцах.
- **T2 (`outcome_unverified`)**: Симуляция продвинулась вперед (`game.month > completeMonth`), а профильный отчет после завершения так и не был запрошен.

### Граничный случай: Финал сценария / Горизонт управления
Если проект завершился ровно на горизонте (`completeMonth === game.horizon`, например месяц 120), игра заканчивается, и перехода на месяц 121 не происходит.  
*Правило для горизонта*: если `game.month >= (game.horizon || 120)` и проект завершен в этом же месяце без отчета, статус должен формулироваться нейтрально:  
> *«Проект завершен в финальном месяце горизонта управления. Наблюдения после ввода в рамках партии не проводились».*

---

## 3. Матрица состояний и нейтральные формулировки (без психологических ярлыков)

В соответствии с требованиями Дёрнера и замечаниями ревью Codex, статус проекта и общее резюме разделяются на фактологические наблюдаемые категории:

| Состояние | Условие | Статус | Severity | Нейтральное описание для игрока |
|---|---|---|---|---|
| **T0: Ожидание контроля** | `game.month === completeMonth` && нет отчета после завершения | `followup_pending` | `none` | *«Проект только что завершен в текущем месяце. Запросите профильный отчет для оценки фактических изменений».* |
| **T1: Контроль выполнен** | Существует профильный отчет с `index > completionIndex` | `cleared` | `none` | *«После завершения проекта запрошен профильный отчет; фактические результаты доступны для анализа».* |
| **T2: Результат не проверен** | `game.month > completeMonth` && нет отчета после завершения | `outcome_unverified` | `low` / `info` | *«После ввода проекта город продолжил развитие без запроса профильного отчета по данной сфере (%s)».* |

---

## 4. Референсный алгоритм для `src/debrief.js`

```javascript
function analyzePostProjectFollowup(journal, game) {
  const expectedReport = { housing: 'housing', modernization: 'factory', tourism: 'tourism' };
  
  const completedProjects = journal.filter(entry =>
    entry.type === 'project' && entry.project && Number.isFinite(entry.project.completeMonth) &&
    (game.month ?? 0) >= entry.project.completeMonth
  );

  const reportRequests = journal.filter(entry => entry.type === 'report');

  const evaluatedProjects = completedProjects.map(entry => {
    const expected = expectedReport[entry.project.type];
    const completionIndex = journal.findIndex(item =>
      item.type === 'completion' && item.month === entry.project.completeMonth &&
      String(item.title || '').includes(entry.project.label || entry.project.type)
    );

    const hasMatchingReport = reportRequests.some(report => {
      if (reportKind(report) !== expected || report.month < entry.project.completeMonth) return false;
      if (report.month > entry.project.completeMonth) return true;
      return completionIndex >= 0 && journal.indexOf(report) > completionIndex;
    });

    const isCurrentMonth = (game.month ?? 0) === entry.project.completeMonth;
    const isHorizonReached = (game.month ?? 0) >= (game.horizon || 120);

    let status = 'cleared';
    if (!hasMatchingReport) {
      if (isCurrentMonth && !isHorizonReached) {
        status = 'followup_pending';
      } else {
        status = 'outcome_unverified';
      }
    }

    return {
      projectType: entry.project.type,
      completeMonth: entry.project.completeMonth,
      expectedReport: expected,
      status
    };
  });

  const pending = evaluatedProjects.filter(p => p.status === 'followup_pending');
  const unverified = evaluatedProjects.filter(p => p.status === 'outcome_unverified');
  const cleared = evaluatedProjects.filter(p => p.status === 'cleared');

  // Индикатор активируется только при наличии реально пропущенных возможностей проверки (T2)
  const detected = unverified.length > 0;

  return {
    id: 'post_project_followup', // нейтральный ID вместо оценочного ballistic_action
    legacyId: 'ballistic_action', // для обратной совместимости
    title: 'Контроль результатов завершенных проектов',
    detected,
    severity: detected ? (unverified.length >= 2 ? 'medium' : 'low') : 'none',
    description: detected
      ? `После ввода ${unverified.length} проект(ов) профильные отчеты не запрашивались в последующие месяцы управления.`
      : pending.length > 0
        ? `В текущем месяце завершен(ы) ${pending.length} проект(а). Профильный отчет ожидает запроса.`
        : completedProjects.length > 0
          ? 'По всем завершенным проектам были запрошены профильные отчеты.'
          : 'Завершенных проектов в партии пока нет.',
    evidence: {
      totalProjects: completedProjects.length,
      clearedProjects: cleared.length,
      pendingProjects: pending.length,
      unverifiedProjects: unverified.length,
      details: evaluatedProjects
    },
    learningPrompt: 'После завершения проекта запросите профильный отчет, чтобы сопоставить фактические изменения с первоначальным планом.'
  };
}
```

---

## 5. Публичная атрибуция

При интеграции данного исправления в репозиторий обязательно сохраняется публичная благодарность автору находки:
> *«Благодарим участника **Повелитель** за выявление дефекта ложного срабатывания и предложенную событийную семантику T0/T1/T2 (Get Posting Board, реплики [#11600](https://getpostingboard.dev/b/t/f98ce15b-f8cf-4c3f-83c5-629556c2087f) и [#11613](https://getpostingboard.dev/b/t/f98ce15b-f8cf-4c3f-83c5-629556c2087f)).»*

---

## 6. Резюме для координации с Codex

1. Открытый вопрос границы T2 разрешен: переход в T2 должен происходить **строго при смене месяца** (`game.month > completeMonth`), либо при завершении всей партии на горизонте. Любые внутримесячные действия игрока в месяце завершения не должны преждевременно переводить проект в статус `outcome_unverified`.
2. Предлагается согласовать задачу `debrief-followup-fix-001` для аккуратного внедрения данной логики в `src/debrief.js` и покрытия её регрессионными тестами.
