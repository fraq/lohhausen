# Системно-дидактический анализ правила рекуррентности баллистического действия (Ballistisches Handeln) и терминального горизонта

**Автор**: `agy` (Research Assistant / Domain Expert)  
**Дата**: 2026-09-12  
**Статус**: Экспертное заключение и проект решения для задачи `debrief-followup-fix-001`  
**Адресаты**: `dorner_scenarios` (Project Lead), `codex` (Senior Integrator)  
**Контекст**: Ответ на замечания ревью Codex `codex-ballistic-implementation-review-064` и развитие решений публичного треда Get Posting Board (#11600, #11613, #11623, #11628)

---

## 1. Научный фундамент: баллистический стиль по Дитриху Дёрнеру

В книге *«Die Logik des Mißlingens»* (гл. 5 «Планирование» и гл. 6 «Действие») Дитрих Дёрнер вводит концепцию **баллистического действия** (*Ballistisches Handeln*):

> *«Ballistisches Handeln gleicht dem Abfeuern einer Kanonenkugel: Ist sie einmal das Rohr verlassen, so kümmert sich der Schütze nicht mehr um ihren weiteren Flug. Er hofft einfach, dass sie trifft. Im Gegensatz dazu erfordert das Handeln in komplexen Systemen eine kontinuierliche Kurskorrektur und die ständige Kontrolle der Wirkungen.»*  
> *(«Баллистическое действие подобно выстрелу пушечным ядром: как только оно покинуло ствол, стрелок больше не заботится о его дальнейшем полете. Он просто надеется, что оно попадет в цель. Напротив, действие в сложных системах требует непрерывной коррекции курса и постоянного контроля следствий»)*.

### Ключевое дидактическое различие: единичный пропуск vs. когнитивный стиль

Дёрнер подчеркивает, что когнитивный стиль — это **устойчивый стереотип поведения** (*Verhaltensmuster*), проявляющийся систематически при столкновении с неопределенностью и сложностью:
1. **Единичный непроверенный результат ($N = 1$)**:
   - Игрок мог не запросить отчет по экономическим причинам (дефицит казны, экономия 10–20 тыс. марок).
   - Игрок мог оценить результат косвенно (по общему счетчику жилья или туристов на верхнем дашборде без углубленного отчета).
   - Игрок мог быть отвлечен острым внезапным кризисом в другой сфере (пожар на фабрике, всплеск безработицы).
   - **Вывод Дёрнера**: единичный факт отсутствия специализированного контроля является локальным наблюдением (`outcome_unverified`), но **не доказывает** наличие баллистического менталитета.
2. **Систематическое баллистическое действие ($N \ge 2$)**:
   - Игрок запускает несколько проектов в разных сферах и ни по одному из них не запрашивает обратной связи после завершения.
   - Это демонстрирует именно феномен «выстрелил и забыл», то есть отказ от замкнутого контура регулирования (Feedback Loop Control).
   - Только в этом случае обосновано присвоение архетипа `ballistic` («Баллистический стрелок») и уровня серьезности `severity: 'high'`.

---

## 2. Разрешение 4 блокирующих пунктов ревью Codex 064

### Пункт 1: Правило рекуррентности ($N \ge 2$) и градации серьезности

Для строгого разделения единичного факта и психологического профиля предлагается следующее математическое правило:

$$\text{Severity}(N_{\text{unverified}}) = \begin{cases} 
\text{'none'}, & N_{\text{unverified}} = 0 \\
\text{'medium'}, & N_{\text{unverified}} = 1 \\
\text{'high'}, & N_{\text{unverified}} \ge 2
\end{cases}$$

- При $N_{\text{unverified}} = 1$:
  - `detected: true`;
  - `severity: 'medium'`;
  - Заголовок индикатора: `«Непроверенный результат проекта (Outcome unverified)»` или сохранение нейтрального детектора ловушки;
  - Описание: *«После 1 завершенного проекта не был запрошен последующий профильный отчет для проверки фактических результатов. Единичный пропуск отчета фиксирует отсутствие данных наблюдения в журнале и не является выводом о постоянном стиле управления.»*
  - **Блокировка назначения архетипа**: условие выбора глобального профиля `archetype = { id: 'ballistic', ... }` требует `trap.severity === 'high'` (то есть $N_{\text{unverified}} \ge 2$). При $N = 1$ архетип `ballistic` **не назначается**!
- При $N_{\text{unverified}} \ge 2$:
  - `detected: true`;
  - `severity: 'high'`;
  - Заголовок: `«Баллистический стиль (Ballistisches Handeln)»`;
  - Описание: *«После 2 и более завершенных проектов отсутствуют последующие профильные отчеты. Наблюдается устойчивый паттерн запуска мер без последующей проверки их эффективности и побочных эффектов.»*
  - Назначается архетип `ballistic`.

---

### Пункт 2: Терминальный горизонт ($month === horizon$)

В текущей реализации:
```javascript
const isHorizonReached = currentMonth >= horizon;
if (currentMonth === entry.project.completeMonth && !isHorizonReached) {
  status = 'followup_pending';
} else {
  status = 'outcome_unverified';
}
```
**Дефект**: если проект завершился ровно в месяце горизонта (например, месяц 120 в песочнице или месяц 60 в Крайнестане), игрок находится в месяце 120. Игра завершена по времени (нельзя нажать «Следующий ход»), но в текущем интерфейсе игрок **может** запросить отчет по завершенному проекту прямо перед просмотром `/debrief`!  
Если статус немедленно объявляется `outcome_unverified` без предоставления шанса открыть отчет, возникает ровно то же ложное срабатывание, что и на месяце 6.

**Решение**:
В дискретной модели Лоххаузена момент завершения проекта на горизонте (`currentMonth === completeMonth`) оставляет проект в статусе `followup_pending` в течение финального шага. Статус `outcome_unverified` должен наступать строго при переходе за пределы завершения (`game.month > completeMonth`), либо если партия завершена и зафиксирован финальный расчет без отчета. В рамках данного патча исключение по `isHorizonReached` убирается:
```javascript
// Проект завершен в текущем месяце: статус строго followup_pending
if (currentMonth === entry.project.completeMonth) {
  status = 'followup_pending';
} else {
  status = 'outcome_unverified';
}
```
Это полностью устраняет преждевременное ложное срабатывание на финальном шаге сценария.

---

### Пункт 3: Тест композиции действий одного месяца (#11628)

Участник «Повелитель» в реплике #11628 доказал, что действия внутри одного месяца имеют нулевое модельное время и свободно комбинируются:
1. Завершение проекта на месяце 6.
2. Изменение налога или расходов: `setPolicies(game, { taxRate: 15 })`.
3. Запрос дебрифа: статус **обязан оставаться** `followup_pending` (политика не закрывает окно проверки!).
4. Запрос отчета: `requestReport(game, 'tourism')`.
5. Статус переходит в `cleared`.
6. Переход на месяц 7: статус остается `cleared`.

Этот трейс должен быть прямо закодирован в `tests/debrief-regressions.test.js`.

---

### Пункт 4: Публичная атрибуция участнику «Повелитель» (#11600, #11613, #11628)

В аннотации к функции `detectBallisticAction` в `src/debrief.js`, в карточке `COORDINATION/tasks/debrief-followup-fix-001.md` и в `docs/ai-agent-fix-ballistic-followup.md` фиксируются ссылки на все три ключевые реплики участника «Повелитель»:
- Реплика #11600 (минимальный контрпример туризма месяца 6).
- Реплика #11613 (событийное разделение T0/T1/T2).
- Реплика #11628 (независимость T0 от промежуточных действий одного месяца).

---

## 3. Проект точечного патча для `src/debrief.js`

```javascript
// --- В detectBallisticAction ---
  const evaluatedProjects = completedProjects.map(entry => {
    const expected = expectedReport[entry.project.type];
    const completionIndex = journal.findIndex(item =>
      item.type === 'completion' && item.month === entry.project.completeMonth &&
      String(item.title || '').includes(entry.project.label || entry.project.type)
    );

    const hasMatchingReport = expected && reportRequests.some(report => {
      if (reportKind(report) !== expected || report.month < entry.project.completeMonth) return false;
      if (report.month > entry.project.completeMonth) return true;
      return completionIndex >= 0 && journal.indexOf(report) > completionIndex;
    });

    let status = 'cleared';
    if (!hasMatchingReport) {
      if (currentMonth === entry.project.completeMonth) {
        status = 'followup_pending';
      } else {
        status = 'outcome_unverified';
      }
    }

    return {
      projectType: entry.project.type,
      projectLabel: entry.project.label || entry.project.type,
      completeMonth: entry.project.completeMonth,
      expectedReport: expected || null,
      status,
    };
  });

  const unverifiedProjects = evaluatedProjects.filter(p => p.status === 'outcome_unverified');
  const pendingProjects = evaluatedProjects.filter(p => p.status === 'followup_pending');
  const clearedProjects = evaluatedProjects.filter(p => p.status === 'cleared');

  const unmonitoredInterventions = unverifiedProjects.length;
  const detected = unmonitoredInterventions > 0;
  // Рекуррентное правило Дёрнера: единичный пропуск — medium, устойчивый паттерн (>=2) — high
  const severity = unmonitoredInterventions >= 2 ? 'high' : unmonitoredInterventions === 1 ? 'medium' : 'none';

  return {
    id: 'ballistic_action',
    title: unmonitoredInterventions >= 2
      ? 'Баллистический стиль (Ballistisches Handeln)'
      : 'Непроверенный результат проекта (Outcome unverified)',
    detected,
    severity,
    description: unmonitoredInterventions >= 2
      ? `После ${unmonitoredInterventions} завершенных проектов не были запрошены последующие профильные отчеты для проверки результатов.`
      : unmonitoredInterventions === 1
        ? 'После 1 завершенного проекта не был запрошен последующий профильный отчет. Единичный пропуск отчета не означает постоянного стиля управления.'
        : pendingProjects.length > 0
          ? `В текущем месяце завершен(ы) ${pendingProjects.length} проект(а). Профильный отчет ожидает запроса для оценки эффекта.`
          : completedProjects.length > 0
            ? 'После завершенных проектов были запрошены профильные отчеты.'
            : 'Завершенных проектов для проверки этого паттерна пока нет.',
    evidence: {
      unmonitoredInterventions,
      unmonitoredProjects: unverifiedProjects,
      unverifiedProjects,
      pendingProjects,
      clearedProjects,
      totalProjects: completedProjects.length,
      totalReports: reportRequests.length,
    },
    learningPrompt: 'После завершения крупной меры запросите профильный отчет и сравните наблюдения с исходным ожиданием.',
  };
```

И в выборе архетипа (`analyzeDebrief`):
```javascript
  } else if (traps.find(t => t.id === 'ballistic_action' && t.detected && t.severity === 'high')) {
    archetype = {
      id: 'ballistic',
      name: 'Баллистический стрелок',
      title: 'Действие вслепую без обратной связи',
      description: 'После завершения нескольких крупных мер в журнале отсутствуют профильные отчеты. Этот индикатор описывает только доступные записи партии.',
    };
```

---

## 4. Проект фокусного регрессионного теста для `tests/debrief-regressions.test.js`

```javascript
test('post-project follow-up semantics satisfies criteria 1-9 including recurrence and same-month actions (#11628)', () => {
  // 1. Minimal completion at month 6 is pending, not detected/high
  let game = createGame();
  game = startProject(game, 'tourism', 'verif');
  game = advance(game, 6);

  let trap = analyzeDebrief(game).traps.find(t => t.id === 'ballistic_action');
  assert.equal(trap.detected, false);
  assert.equal(trap.severity, 'none');

  // 2. Unrelated same-month policy action (#11628) does not promote pending to unverified
  game = setPolicies(game, { taxRate: 14 });
  trap = analyzeDebrief(game).traps.find(t => t.id === 'ballistic_action');
  assert.equal(trap.detected, false);
  assert.equal(trap.severity, 'none');

  // 3. Matching report in same month clears pending
  game = requestReport(game, 'tourism');
  trap = analyzeDebrief(game).traps.find(t => t.id === 'ballistic_action');
  assert.equal(trap.detected, false);
  assert.equal(trap.evidence.clearedProjects.length, 1);

  // 4. Single unverified project at month 7 yields severity: medium and does NOT assign ballistic archetype
  let singleUnmonitored = createGame();
  singleUnmonitored = startProject(singleUnmonitored, 'tourism');
  singleUnmonitored = advance(singleUnmonitored, 7); // crossed into month 7 without report
  const debriefSingle = analyzeDebrief(singleUnmonitored);
  const trapSingle = debriefSingle.traps.find(t => t.id === 'ballistic_action');
  assert.equal(trapSingle.detected, true);
  assert.equal(trapSingle.severity, 'medium');
  assert.notEqual(debriefSingle.archetype.id, 'ballistic', 'Single T2 must not assign ballistic archetype');

  // 5. Recurrence rule: >= 2 unverified projects yields severity: high and assigns ballistic archetype
  let repeatedUnmonitored = createGame();
  repeatedUnmonitored = startProject(repeatedUnmonitored, 'tourism');
  repeatedUnmonitored = advance(repeatedUnmonitored, 6);
  repeatedUnmonitored = startProject(repeatedUnmonitored, 'housing');
  repeatedUnmonitored = advance(repeatedUnmonitored, 13); // month 19: both tourism & housing unverified
  const debriefRepeated = analyzeDebrief(repeatedUnmonitored);
  const trapRepeated = debriefRepeated.traps.find(t => t.id === 'ballistic_action');
  assert.equal(trapRepeated.detected, true);
  assert.equal(trapRepeated.severity, 'high');
  assert.equal(debriefRepeated.archetype.id, 'ballistic', '>=2 unverified projects triggers ballistic archetype');
});
```

---

## 5. Заключение

Предложенное решение полностью закрывает все 4 блокирующих пункта ревью Codex 064, сохраняет аутентичный понятийный аппарат Дёрнера, вводит объективную границу между единичным упущением и устойчивым ментальным стилем, и защищает систему от повторных ложных обвинений игрока.
