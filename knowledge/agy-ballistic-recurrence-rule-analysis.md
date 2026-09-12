# Системно-дидактический анализ правила рекуррентности баллистического действия (Ballistisches Handeln) через независимые эпохи решений

**Автор**: `agy` (Research Assistant / Domain Expert)  
**Дата**: 2026-09-12  
**Статус**: Доработанное экспертное заключение и проект решения для задачи `debrief-followup-fix-001`  
**Адресаты**: `dorner_scenarios` (Project Lead), `codex` (Senior Integrator)  
**Контекст**: Ответ на замечания ревью Codex `codex-recurrence-counterexample-069` и разрешение контрпримера спаренных проектов одного домена в одном месяце.

---

## 1. Научный фундамент: баллистический стиль по Дитриху Дёрнеру

В книге *«Die Logik des Mißlingens»* (гл. 5 «Планирование» и гл. 6 «Действие») Дитрих Дёрнер вводит концепцию **баллистического действия** (*Ballistisches Handeln*):

> *«Ballistisches Handeln gleicht dem Abfeuern einer Kanonenkugel: Ist sie einmal das Rohr verlassen, so kümmert sich der Schütze nicht mehr um ihren weiteren Flug. Er hofft einfach, dass sie trifft. Im Gegensatz dazu erfordert das Handeln in komplexen Systemen eine kontinuierliche Kurskorrektur und die ständige Kontrolle der Wirkungen.»*  
> *(«Баллистическое действие подобно выстрелу пушечным ядром: как только оно покинуло ствол, стрелок больше не заботится о его дальнейшем полете. Он просто надеется, что оно попадет в цель. Напротив, действие в сложных системах требует непрерывной коррекции курса и постоянного контроля следствий»)*.

### Коррекция обоснования: природа пропуска отчетов в симуляторе Лоххаузена

В предыдущей аналитической записке ошибочно упоминалась гипотеза об «экономии денег казны». В симуляторе Лоххаузена вызов `requestReport(game, kind)` **не имеет финансовой стоимости (стоимость = 0 марок)**.  
Следовательно, пропуск запроса отчета обусловлен исключительно когнитивными факторами:
1. **Распределение когнитивного внимания**: игрок считает задачу решенной фактом завершения строительства и переключает внимание на другие вызовы.
2. **Опора на общую поверхностную телеметрию**: игрок смотрит на верхнюю плашку экрана (счетчик жителей, казна, удовлетворенность), не осознавая, что скрытые побочные эффекты (например, деградация оборудования или нехватка отелей) не видны без углубленного профильного отчета.
3. **Цейтнот и туннельное зрение**: кризис в одной сфере (угроза банкротства) вытесняет необходимость плановой рефлексии по завершенным проектам в других сферах.

---

## 2. Разрешение контрпримера Codex: независимые возможности контроля vs. сырой подсчет проектов

### Контрпример Codex (письмо `codex-recurrence-counterexample-069`)
Рассмотрим минимальный трейс:
```javascript
let game = createGame();
game = startProject(game, 'tourism', 'Проект 1');
game = startProject(game, 'tourism', 'Проект 2');
game = advance(game, 6); // оба завершаются на месяце 6
game = advance(game, 1); // переход на месяц 7 без отчета
```
- Сырой подсчет строк проектов дает $N_{\text{unverified}} = 2$.
- При наивном правиле $N \ge 2$ игрок получил бы `severity: 'high'` и архетип `ballistic`.
- **Однако**: оба проекта относятся к одному домену (`tourism`) и завершились в один и тот же расчетный месяц (месяц 6).
- Запрос **одного-единственного** отчета по туризму на месяце 6 очищает **оба** проекта одновременно!
- Игрок упустил не 2 независимых случая контроля, а **ровно одну эпоху принятия решений / одну возможность обратной связи** (single missed decision epoch / follow-up opportunity).
- Присвоение статуса хронического когнитивного стиля за один упущенный клик является ложноположительным обвинением.

### Математическая формализация: ключ возможности контроля (Opportunity Key)

Каждый завершенный проект требует обратной связи определенного типа в определенный расчетный месяц. Мы определяем единичную возможность контроля как пару:
$$\text{Opportunity Key}(p) = \big(\text{expectedReportDomain}(p), \, \text{completeMonth}(p)\big)$$

Множество уникальных упущенных возможностей контроля:
$$\mathcal{O}_{\text{missed}} = \Big\{ \big(\text{expectedReportDomain}(p), \, \text{completeMonth}(p)\big) \;\Big|\; p \in \text{unverifiedProjects} \Big\}$$

Число независимых упущенных возможностей контроля:
$$M_{\text{opportunities}} = \big| \mathcal{O}_{\text{missed}} \big|$$

### Градация серьезности и варианты правила рекуррентности по Дёрнеру

Рассматриваются три математических варианта критерия рекуррентности:

1. **Вариант А (По уникальным возможностям проверки):**  
   $$M_{\text{opportunities}} \ge 2$$  
   *Логика*: каждый профильный отчет требует отдельного обращения к советнику. Если игрок завершил и туризм, и жилье, но не проверил ни то, ни другое — пропущены две содержательные проверки.  
   *Преимущество*: устраняет ложное срабатывание контрпримера Codex (2 туризма в одном месяце дают $M=1$).

2. **Вариант Б (По временным эпохам решений):**  
   $$E_{\text{epochs}} = \big| \{ p.\text{completeMonth} \mid p \in \text{unverifiedProjects} \} \big| \ge 2$$  
   *Логика*: стиль — это свойство устойчивости во времени. Пропуск проверки в один месяц (даже по двум проектам) может быть результатом ситуативной спешки на одном ходе. Рекуррентность доказана только если игрок повторил эту ошибку в разные календарные месяцы ($M_1 \ne M_2$).

3. **Вариант В (Канонический синтез Дёрнера — Рекомендуемый):**  
   $$M_{\text{opportunities}} \ge 2 \quad \land \quad E_{\text{epochs}} \ge 2$$  
   *Логика*: требует одновременного наличия как минимум 2 независимых возможностей контроля, распределенных как минимум по 2 отдельным временным эпохам. Это полностью исключает любые ложноположительные обвинения игрока, строящего несколько объектов в один месяц.

$$\text{Severity} = \begin{cases} 
\text{'none'}, & M_{\text{opportunities}} = 0 \\
\text{'low'}, & M_{\text{opportunities}} = 1 \;\lor\; E_{\text{epochs}} < 2 \\
\text{'high'}, & M_{\text{opportunities}} \ge 2 \;\land\; E_{\text{epochs}} \ge 2 \quad (\text{для Варианта В})
\end{cases}$$

- **$M_{\text{opportunities}} = 0$**:
  - `detected = false`, `severity = 'none'`, `title = 'Контроль результатов проектов'`.
- **Единичный локальный пропуск контроля**:
  - `detected = true`, `severity = 'low'`.
  - Заголовок: `«Непроверенный исход проекта»` (`title = 'Непроверенный исход проекта'`).
  - Описание: фактологическая констатация отсутствия отчета без обобщения до черты личности.
  - **Архетип `ballistic` НЕ назначается** (условие выбора требует `severity === 'high'`).
- **Систематический баллистический стиль**:
  - `detected = true`, `severity = 'high'`.
  - Заголовок: `«Баллистический стиль (Ballistisches Handeln)»`.
  - Описание: констатация систематического уклонения от контроля по $M$ независимым направлениям и временным эпохам.
  - **Назначается глобальный архетип `ballistic`** («Баллистический стрелок»).

---

## 3. Анализ сценариев и тестовая матрица

| Трейс | Проекты | $M_{\text{opp}}$ | $E_{\text{epochs}}$ | Итог (Вар. А) | Итог (Вар. В, Канон) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| 1 туризм на м6, переход на м7 | Tourism (м6) | **1** | **1** | `low` (не ballistic) | `low` (не ballistic) |
| **Контрпример Codex**: 2 туризма на м6, переход на м7 | Tourism 1 (м6), Tourism 2 (м6) | **1** | **1** | `low` (не ballistic) | `low` (не ballistic) |
| Туризм на м6 + Жилье на м6, переход на м7 | Tourism (м6), Housing (м6) | **2** | **1** | `high` (ballistic) | `low` (не ballistic) |
| Туризм на м6 + Туризм на м12, переход на м13 | Tourism (м6), Tourism (м12) | **2** | **2** | `high` (ballistic) | `high` (ballistic) |
| 3 проекта жилья на м12, переход на м13 | Housing 1, 2, 3 (м12) | **1** | **1** | `low` (не ballistic) | `low` (не ballistic) |

---

## 4. Решение для `src/debrief.js`

```javascript
  const unverifiedProjects = evaluatedProjects.filter(p => p.status === 'outcome_unverified');
  const pendingProjects = evaluatedProjects.filter(p => p.status === 'followup_pending');
  const clearedProjects = evaluatedProjects.filter(p => p.status === 'cleared');

  const unmonitoredInterventions = unverifiedProjects.length;
  const detected = unmonitoredInterventions > 0;

  // Группировка по независимым возможностям контроля (домен отчета + месяц завершения)
  const uniqueMissedOpportunities = new Set(
    unverifiedProjects.map(p => `${p.expectedReport || p.projectType}@${p.completeMonth}`)
  ).size;
  const uniqueMissedEpochs = new Set(
    unverifiedProjects.map(p => p.completeMonth)
  ).size;

  // Каноническое правило рекуррентности: >= 2 независимых возможностей в >= 2 расчетных эпохах
  const isRecurrent = uniqueMissedOpportunities >= 2 && uniqueMissedEpochs >= 2;

  let title = 'Контроль результатов проектов';
  if (isRecurrent) {
    title = 'Баллистический стиль (Ballistisches Handeln)';
  } else if (unmonitoredInterventions > 0) {
    title = 'Непроверенный исход проекта';
  } else if (pendingProjects.length > 0) {
    title = 'Ожидание проверки результатов';
  }

  const severity = isRecurrent ? 'high' : (detected ? 'low' : 'none');

  let description = '';
  if (isRecurrent) {
    description = `После ${unmonitoredInterventions} завершенных проектов в ${uniqueMissedEpochs} различных расчетных эпохах систематически не запрашивались профильные отчеты для проверки фактических результатов.`;
  } else if (unmonitoredInterventions > 0) {
    const projLabel = unverifiedProjects.length === 1 
      ? `«${unverifiedProjects[0].projectLabel}»`
      : `${unverifiedProjects.length} проектов одного направления`;
    description = `После завершения ${projLabel} не был запрошен последующий профильный отчет для проверки фактических результатов. Единичный пропуск отчета фиксирует отсутствие данных наблюдения в журнале и не является выводом о постоянном стиле управления.`;
  } else if (pendingProjects.length > 0) {
    description = `В текущем месяце завершен(ы) ${pendingProjects.length} проект(а). Профильный отчет ожидает запроса для оценки эффекта.`;
  } else if (completedProjects.length > 0) {
    description = 'После завершенных проектов были запрошены профильные отчеты.';
  } else {
    description = 'Завершенных проектов для проверки этого паттерна пока нет.';
  }

  return {
    id: 'ballistic_action',
    title,
    detected,
    severity,
    description,
    evidence: {
      unmonitoredInterventions,
      uniqueMissedOpportunities,
      uniqueMissedEpochs,
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

---

## 5. Проверочный TDD-тест (Negative Control по контрпримеру Codex)

```javascript
test('ballistic recurrence rule counts independent decision epochs rather than raw project count (Codex #069)', () => {
  // Negative control: 2 tourism projects completing in the same month (month 6)
  let game = createGame();
  game = startProject(game, 'tourism', 'Гостиница А');
  game = startProject(game, 'tourism', 'Гостиница Б');
  game = advance(game, 6); // оба завершились на месяце 6
  game = advance(game, 1); // переход на месяц 7 без отчета

  const debriefSameMonth = analyzeDebrief(game);
  const trapSameMonth = debriefSameMonth.traps.find(t => t.id === 'ballistic_action');
  assert.equal(trapSameMonth.detected, true);
  assert.equal(trapSameMonth.evidence.unmonitoredInterventions, 2, 'Raw project count is 2');
  assert.equal(trapSameMonth.evidence.uniqueMissedOpportunities, 1, 'Independent opportunities is 1');
  assert.equal(trapSameMonth.severity, 'low', 'Must be severity: low for single missed decision epoch');
  assert.equal(trapSameMonth.title, 'Непроверенный исход проекта');
  assert.notEqual(debriefSameMonth.archetype.id, 'ballistic', 'Must NOT select ballistic archetype for 1 epoch');

  // Positive control: 2 projects in different decision epochs (month 6 and month 12)
  let recurrentGame = createGame();
  recurrentGame = startProject(recurrentGame, 'tourism', 'Гостиница');
  recurrentGame = advance(recurrentGame, 6);
  recurrentGame = startProject(recurrentGame, 'housing', 'Жилой комплекс');
  recurrentGame = advance(recurrentGame, 7); // month 13: tourism m6 unverified, housing m12 unverified

  const debriefRecurrent = analyzeDebrief(recurrentGame);
  const trapRecurrent = debriefRecurrent.traps.find(t => t.id === 'ballistic_action');
  assert.equal(trapRecurrent.detected, true);
  assert.equal(trapRecurrent.evidence.uniqueMissedOpportunities, 2);
  assert.equal(trapRecurrent.severity, 'high', 'Must be severity: high for >= 2 independent opportunities');
  assert.equal(trapRecurrent.title, 'Баллистический стиль (Ballistisches Handeln)');
  assert.equal(debriefRecurrent.archetype.id, 'ballistic', 'Must select ballistic archetype for recurrent epochs');
});
```

---

## 6. Выводы

1. Контрпример Codex полностью доказан и математически разрешен через концепцию **уникальных возможностей контроля (Opportunity Keys)**.
2. Исключены ложные обвинения при пакетном строительстве однотипных объектов.
3. Исправлена неточность в отношении «стоимости отчетов».
4. Предложен готовый компактный патч и TDD-тест с отрицательным контролем для `dorner_scenarios` и `codex`.
