/**
 * Dörner Cognitive Debriefing Engine
 * 
 * Deep temporal retrospective analysis of mayoral decision patterns
 * based on Dietrich Dörner's "The Logic of Failure" (Die Logik des Mißlingens).
 */

import { listProjectChoices, compareWithoutProject } from './counterfactual.js';

export function analyzeDebrief(gameOrHistory, maybeJournal, maybeState) {
  let game;
  let history;
  let journal;

  if (gameOrHistory && typeof gameOrHistory === 'object' && 'history' in gameOrHistory) {
    game = gameOrHistory;
    history = game.history || [];
    journal = game.journal || [];
  } else {
    history = Array.isArray(gameOrHistory) ? gameOrHistory : [];
    journal = Array.isArray(maybeJournal) ? maybeJournal : [];
    game = maybeState || {};
  }

  const traps = [
    detectThematicVagabonding(journal),
    detectEncapsulation(journal, history, game),
    detectBallisticAction(journal, history, game),
    detectLagIgnorance(journal),
  ];

  const highSeverityTraps = traps.filter(t => t.detected && t.severity === 'high');
  const anyTraps = traps.filter(t => t.detected);
  const observedActions = journal.filter(entry => entry.type === 'policy' || entry.type === 'policies' || entry.type === 'project').length;
  const observedReports = journal.filter(entry => entry.type === 'report').length;
  const evidenceSufficient = observedActions > 0 && (game.month ?? 0) > 0 && observedReports > 0;

  let archetype;
  if (!evidenceSufficient && anyTraps.length === 0) {
    archetype = {
      id: 'insufficient_evidence',
      name: 'Недостаточно данных',
      title: 'Нейтральный предварительный разбор',
      description: 'В журнале пока недостаточно решений, времени наблюдения и обратной связи, чтобы обоснованно характеризовать стиль управления.',
    };
  } else if (highSeverityTraps.length === 0 && anyTraps.length === 0) {
    archetype = {
      id: 'no_indicators_detected',
      name: 'Нет сработавших индикаторов',
      title: 'Проверка журнала',
      description: 'Проверены переключения между сферами, развороты налоговой ставки, внимание к туризму и запросы отчетов после завершения проектов.',
    };
  } else if (traps.find(t => t.id === 'encapsulation' && t.detected)) {
    archetype = {
      id: 'encapsulator',
      name: 'Инкапсулятор',
      title: 'Уход в комфортную частную сферу',
      description: 'В партии есть решения о туризме и признаки проблем фабрики или казны. Этот индикатор не устанавливает их последовательность или мотивы игрока.',
    };
  } else if (traps.find(t => t.id === 'thematic_vagabonding' && t.detected)) {
    archetype = {
      id: 'vagabond',
      name: 'Тематический бродяга',
      title: 'Хаотичное переключение фокуса',
      description: 'В журнале найдено много быстрых переключений между сферами. Этот индикатор не устанавливает причины поведения игрока.',
    };
  } else if (traps.find(t => t.id === 'ballistic_action' && t.detected && t.severity === 'high')) {
    archetype = {
      id: 'ballistic',
      name: 'Баллистический стрелок',
      title: 'Действие вслепую без обратной связи',
      description: 'После завершения крупных мер в журнале систематически отсутствуют профильные отчеты. Этот индикатор описывает только доступные записи партии.',
    };
  } else if (traps.find(t => t.id === 'lag_ignorance' && t.detected)) {
    archetype = {
      id: 'oversteerer',
      name: 'Нетерпеливый регулятор',
      title: 'Быстрые развороты налоговой ставки',
      description: 'В журнале есть частые коррекции параметров до истечения возможного периода отклика. Этот индикатор не доказывает мотивы игрока.',
    };
  } else {
    archetype = {
      id: 'no_indicators_detected',
      name: 'Нет выраженного профиля',
      title: 'Локальные наблюдения без устойчивого стиля',
      description: 'В журнале зафиксированы отдельные события (например, непроверенный исход проекта), но устойчивый когнитивный стиль или системная ловушка не выявлены.',
    };
  }

  const reflectionQuestions = generateReflectionQuestions(traps, game);
  const summary = generateSummary(archetype, traps, game);

  return {
    archetype,
    traps,
    reflectionQuestions,
    summary,
  };
}

function detectThematicVagabonding(journal) {
  const policyEntries = journal.filter(j => (j.type === 'policy' || j.type === 'policies') && (j.changes || j.patch));
  let switchesCount = 0;
  let lastDomain = null;

  for (const entry of policyEntries) {
    const patch = entry.changes || entry.patch || {};
    const keys = Object.keys(patch);
    if (keys.length === 0) continue;
    const currentDomain = getDomainForKeys(keys);
    if (lastDomain && currentDomain !== lastDomain) {
      switchesCount++;
    }
    lastDomain = currentDomain;
  }

  const detected = switchesCount >= 5;
  return {
    id: 'thematic_vagabonding',
    title: 'Тематическое блуждание (Themensprünge)',
    detected,
    severity: detected ? (switchesCount >= 7 ? 'high' : 'medium') : 'none',
    description: detected
      ? `В журнале зафиксировано переключений между сферами: ${switchesCount}. Сопоставьте их сроки с вашим планом; само число переключений не доказывает хаотичность управления.`
      : 'Порог частых переключений не достигнут в доступном журнале.',
    evidence: { switchesCount },
    learningPrompt: 'Проверьте, завершали ли вы начатую линию действий перед переключением на новую проблему.',
  };
}

function getDomainForKeys(keys) {
  if (keys.some(k => k.includes('tourism'))) return 'tourism';
  if (keys.some(k => k.includes('tax'))) return 'taxes';
  if (keys.some(k => k.includes('maintenance') || k.includes('wage') || k.includes('marketing'))) return 'factory';
  if (keys.some(k => k.includes('services') || k.includes('education'))) return 'social';
  return 'general';
}

function detectEncapsulation(journal, history, game) {
  const eq = game.equipment ?? 50;
  const debt = game.debt ?? 0;
  const p = game.policies || {};

  const tourismFocused = (p.tourismMarketing >= 35) ||
    journal.some(j => (j.type === 'project' && (j.project?.type === 'tourism' || j.projectType === 'tourism')) || 
      ((j.changes?.tourismMarketing ?? j.patch?.tourismMarketing ?? 0) >= 35));

  const criticalCore = eq < 45 || debt > 2000 || journal.some(j => (j.changes?.maintenance === 0 || j.patch?.maintenance === 0));
  const detected = Boolean(tourismFocused && criticalCore);

  return {
    id: 'encapsulation',
    title: 'Инкапсуляция (Kapselung)',
    detected,
    severity: detected ? 'high' : 'none',
    description: detected
      ? 'В партии есть решения о туризме и признаки проблем фабрики или казны. Этот индикатор не устанавливает их последовательность или мотивы игрока.'
      : 'Сочетание туристического фокуса и кризиса ядра не найдено в доступных данных.',
    evidence: { equipment: eq, debt, tourismMarketing: p.tourismMarketing },
    learningPrompt: 'Сравните внимание к удобным частным задачам с состоянием основных ресурсов города.',
  };
}

/**
 * Detects ballistic action (Ballistisches Handeln) using event-based follow-up semantics (T0/T1/T2).
 * 
 * Semantics and state machine:
 * - T0 (followup_pending): Project completed in current month (game.month === completeMonth).
 *   The player has not yet had a post-completion decision opportunity. Not detected, severity none.
 * - T1 (cleared): A matching domain report was requested strictly after the completion event.
 * - T2 (outcome_unverified): The simulation advanced to subsequent months (game.month > completeMonth)
 *   without any matching report after completion. (Projects completing at the horizon remain followup_pending
 *   until a subsequent advance or report request). Detected true, severity low/medium for single, high for recurrent.
 * 
 * Public attribution:
 * Reported by community contributor «Повелитель» on Get Posting Board (replies #11600 and #11613),
 * with boundary B and same-month policy counterexample confirmed in reply #11628;
 * adversarial shared-report counterexample and decision-epoch grouping formulated by Codex
 * in docs/ai-agent-fix-ballistic-followup.md and reply #11637.
 */
function detectBallisticAction(journal, history, game) {
  const reportKind = (entry) => {
    const explicit = entry.kind || entry.reportKind || entry.request || entry.report?.kind;
    if (explicit) return explicit;
    const title = String(entry.title || '').toLowerCase();
    if (title.includes('жиль')) return 'housing';
    if (title.includes('фабрик')) return 'factory';
    if (title.includes('туризм')) return 'tourism';
    if (title.includes('финанс')) return 'finance';
    if (title.includes('социал')) return 'social';
    return null;
  };
  const expectedReport = { housing: 'housing', modernization: 'factory', tourism: 'tourism' };
  const currentMonth = Number.isFinite(game.month) ? game.month : 0;

  const completedProjects = journal.filter(entry =>
    entry.type === 'project' && entry.project && Number.isFinite(entry.project.completeMonth) &&
    currentMonth >= entry.project.completeMonth
  );
  const reportRequests = journal.filter(entry => entry.type === 'report');

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

  // Group unverified projects by independent follow-up opportunities (distinct domain per completion month)
  // and distinct completion decision epochs (distinct completion months).
  // A single missed decision epoch or shared report opportunity must not be counted as recurrence (AC-7, Codex 068).
  const unverifiedOpportunities = new Set(
    unverifiedProjects.map(p => `${p.completeMonth}:${p.expectedReport}`)
  );
  const unverifiedEpochs = new Set(
    unverifiedProjects.map(p => p.completeMonth)
  );
  const independentFollowupOpportunities = unverifiedOpportunities.size;
  const independentDecisionEpochs = unverifiedEpochs.size;
  const isRecurrent = independentFollowupOpportunities >= 2 && independentDecisionEpochs >= 2;

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
    description = `В ${independentDecisionEpochs} независимых периодах завершения проектов систематически не запрашивались профильные отчеты для проверки фактических результатов (${unmonitoredInterventions} завершенных проектов без контроля).`;
  } else if (unmonitoredInterventions > 0) {
    if (unmonitoredInterventions === 1) {
      description = `После завершения проекта «${unverifiedProjects[0].projectLabel}» не был запрошен последующий профильный отчет для проверки фактических результатов.`;
    } else {
      description = `После завершения ${unmonitoredInterventions} проектов в месяце ${unverifiedProjects[0].completeMonth} не был запрошен соответствующий отчет. Единичный пропуск в рамках одного периода завершения не является признаком устойчивого когнитивного стиля.`;
    }
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
      unmonitoredProjects: unverifiedProjects,
      unverifiedProjects,
      pendingProjects,
      clearedProjects,
      independentFollowupOpportunities,
      independentDecisionEpochs,
      isRecurrent,
      totalProjects: completedProjects.length,
      totalReports: reportRequests.length,
    },
    learningPrompt: 'После завершения крупной меры запросите профильный отчет и сравните наблюдения с исходным ожиданием.',
  };
}

function detectLagIgnorance(journal) {
  const taxChanges = journal.filter(j => (j.type === 'policy' || j.type === 'policies') && 
    typeof (j.changes?.taxRate ?? j.patch?.taxRate) === 'number');

  let rapidReversals = 0;
  for (let i = 2; i < taxChanges.length; i++) {
    const earlier = taxChanges[i - 2];
    const prev = taxChanges[i - 1];
    const curr = taxChanges[i];
    const earlierRate = earlier.changes?.taxRate ?? earlier.patch?.taxRate;
    const prevRate = prev.changes?.taxRate ?? prev.patch?.taxRate;
    const currRate = curr.changes?.taxRate ?? curr.patch?.taxRate;
    const previousDelta = prevRate - earlierRate;
    const currentDelta = currRate - prevRate;
    if (prev.month >= earlier.month && prev.month - earlier.month <= 2 &&
        curr.month >= prev.month && curr.month - prev.month <= 2 &&
        Math.abs(previousDelta) >= 5 && Math.abs(currentDelta) >= 5 && previousDelta * currentDelta < 0) {
      rapidReversals++;
    }
  }

  const detected = rapidReversals >= 1;
  return {
    id: 'lag_ignorance',
    title: 'Недооценка временных задержек (Lag Ignorance)',
    detected,
    severity: detected ? 'high' : 'none',
    description: detected
      ? 'В журнале найдены быстрые развороты налоговой ставки: изменения не менее 5 пунктов в противоположных направлениях с интервалами до 2 месяцев. Проверьте причины коррекций; журнал сам по себе не доказывает колебаний городской системы.'
      : 'Порог быстрых повторных изменений налоговой ставки не достигнут в доступном журнале.',
    evidence: { rapidReversals },
    learningPrompt: 'Перед новой коррекцией проверьте, успел ли проявиться отложенный эффект предыдущего решения.',
  };
}

function generateReflectionQuestions(traps, game) {
  const questions = [
    'Какую главную цель вы преследовали в этой партии, и менялась ли она по ходу времени?',
    'Случалось ли так, что меры по спасению одной сферы неожиданно разрушали баланс в соседней?',
    'Какое из принятых вами решений принесло максимальный отложенный эффект — позитивный или разрушительный?',
  ];

  if (traps.some(t => t.id === 'thematic_vagabonding' && t.detected)) {
    questions.push('Замечали ли вы за собой желание браться за «самый громкий» симптом вместо планомерной работы?');
  }
  if (traps.some(t => t.id === 'encapsulation' && t.detected)) {
    questions.push('Не казалось ли вам, что развивать туризм проще и приятнее, чем заниматься изношенными станками фабрики?');
  }
  if (traps.some(t => t.id === 'ballistic_action' && t.detected)) {
    questions.push('Почему вы не проверяли отчеты подразделений после запуска многомесячных строек?');
  }

  return questions;
}

function generateSummary(archetype, traps, game) {
  if (archetype.id === 'insufficient_evidence') {
    return 'Недостаточно данных для вывода о стиле управления или наличии психологических закономерностей. Продолжите игру и фиксируйте решения вместе с последующими проверками.';
  }
  const activeTraps = traps.filter(t => t.detected);
  if (activeTraps.length === 0) {
    return 'В доступном журнале пороги выбранных индикаторов не достигнуты. Это не доказывает отсутствие когнитивных ловушек и не является оценкой личности игрока.';
  }
  return `В доступном журнале сработало индикаторов: ${activeTraps.length}. Профиль «${archetype.name}» описывает наблюдаемые решения этой партии и не является психологическим заключением.`;
}

export function formatDebriefMarkdown(game, analysis, evaluation = {}, localize = text => text) {
  const scenarioTitle = game.scenarioId ? String(game.scenarioId) : 'sandbox';
  const lines = [
    `# Итоговый разбор управления городом Лоххаузен`,
    `**Сценарий:** ${scenarioTitle} | **Месяц:** ${game.month} из ${game.horizon || 120}`,
    `**Статус сценария:** ${evaluation.status === 'victory' ? 'Победа' : evaluation.status === 'defeat' ? 'Поражение' : game.month < game.horizon ? 'Продолжается' : 'Завершено'}`,
    '',
    `## 1. Наблюдения по журналу решений`,
    `### ${analysis.archetype.name} — ${analysis.archetype.title}`,
    `${analysis.archetype.description}`,
    `*${analysis.summary}*`,
    '',
    `## 2. Ловушки мышления и системная динамика`,
  ];

  const detected = analysis.traps.filter(t => t.detected);
  if (detected.length === 0) {
    lines.push(analysis.archetype.id === 'insufficient_evidence'
      ? '- Недостаточно данных для оценки: продолжите игру и сопоставляйте решения с последующей обратной связью.'
      : '- Пороги выбранных индикаторов не достигнуты в доступном журнале; это не доказывает отсутствие ловушек.');
  } else {
    for (const trap of detected) {
      lines.push(`### ⚠️ ${trap.title || trap.name}`);
      lines.push(`${trap.description}`);
      if (trap.learningPrompt) {
        lines.push(`Учебный вопрос: ${trap.learningPrompt}`);
      }
      lines.push('');
    }
  }

  lines.push('## 3. Ключевые показатели города');
  lines.push(`- Население: ${Math.round(game.population)}`);
  lines.push(`- Казна: ${Math.round(game.treasury)} тыс. марок`);
  lines.push(`- Долг: ${Math.round(game.debt)} тыс. марок`);
  lines.push(`- Оборудование фабрики: ${Math.round(game.equipment)}%`);
  lines.push(`- Общая удовлетворенность: ${Math.round(game.satisfaction)}%`);
  lines.push('');

  lines.push('## 4. Вопросы для саморефлексии (по книге «Логика неудачи»)');
  for (const q of (analysis.reflectionQuestions || [])) {
    lines.push(`- ${q}`);
  }

  return lines.map(localize).join('\n');
}

export function formatDebriefJSON(game, analysis, evaluation = {}) {
  return JSON.stringify({
    scenario: game.scenarioId || 'sandbox',
    month: game.month,
    horizon: game.horizon || 120,
    status: evaluation.status || (game.month >= game.horizon ? 'complete' : 'active'),
    game: structuredClone(game),
    archetype: analysis.archetype,
    summary: analysis.summary,
    traps: analysis.traps,
    reflectionQuestions: analysis.reflectionQuestions,
    finalMetrics: {
      population: game.population,
      treasury: game.treasury,
      debt: game.debt,
      equipment: game.equipment,
      production: game.production,
      satisfaction: game.satisfaction,
    },
    journal: game.journal,
  }, null, 2);
}

export function formatDebriefAIPrompt(game, analysis, evaluation = {}, localize = text => text) {
  const scenarioTitle = game.scenarioId ? String(game.scenarioId) : 'sandbox';
  const statusLabel = evaluation.status === 'victory' ? 'Победа' : evaluation.status === 'defeat' ? 'Поражение' : game.month < (game.horizon || 120) ? 'Продолжается' : 'Завершено';

  const lines = [
    `# Запрос для системного ИИ-разбора партии Лоххаузена (Claude / Gemini / Codex / ChatGPT)`,
    '',
    `## СИСТЕМНЫЙ ПРОМПТ ДЛЯ ИИ-АНАЛИТИКА:`,
    '```text',
    'Ты — ведущий эксперт по системному мышлению, анализу сложных динамических систем и когнитивной психологии принятия решений (методология Дитриха Дёрнера, «Логика неудачи», 1989, и системная динамика Джона Стермана, 1994).',
    'Перед тобой пошаговая хроника управления виртуальным городом Лоххаузен.',
    '',
    'Твоя задача — провести глубокий системный разбор решений бургомистра (игрока).',
    '',
    'МЕТОДОЛОГИЧЕСКИЕ ТРЕБОВАНИЯ:',
    '1. Опирайся на объективные числа и наблюдаемую динамику: казну, долг, состояние оборудования, выпуск часов/мес., безработицу, дефицит жилья и удовлетворенность.',
    '2. Разделяй временные горизонты: единовременные капитальные затраты в момент запуска проекта и отложенный эффект через лаги (жилье: 12 мес., модернизация оборудования: 9 мес., туризм: 6 мес.).',
    '3. Анализируй системные компромиссы (trade-offs): соотношение модернизации и технологической безработицы (рост выработки при стабильном спросе высвобождает рабочие места).',
    '4. Проверяй эффективность связывающих ограничений (Binding Constraints): было ли расширение запаса своевременным узким местом системы или преждевременной заморозкой ликвидности в неизбыточном ресурсе (например, жилье при наличии свободных мест).',
    '5. Сопоставляй записанные ожидания игрока в журнале с фактическим исходом симуляции. Если поле заметки не заполнено, фиксируй это нейтрально: «ожидание не записано» (пустая запись не доказывает отсутствие размышления).',
    '6. Не приписывай игроку вымышленных эмоций, психологических ярлыков или неявных мотивов, если они прямо не зафиксированы в журнале.',
    '',
    'РЕКОМЕНДУЕМАЯ СТРУКТУРА ТВОЕГО АНАЛИЗА:',
    '1. Наблюдение и общий баланс сфер (динамика показателей города по 5 направлениям, сопоставление с профилем решений).',
    '2. Шахматный разбор ключевых ходов и связывающих ограничений (фактические решения бургомистра в контексте узких мест системы; эвристические отметки ?/??/! носят технический характер, а не оценку интеллекта игрока).',
    '3. Записанные ожидания vs фактические результаты (сверка зафиксированных гипотез с динамикой переменных; при отсутствии заметки констатируй «ожидание не записано»).',
    '4. Анализ причинности и проверка гипотез (Точка бифуркации / поворотный момент: проверяемые гипотезы о причинах ключевых изменений; если переломный режим или единственная причина не подтверждаются данными — прямо укажи на неопределенность).',
    '5. Ограничения модели и выводы для будущих партий (учет инерционных лагов, ограничений обратной связи и предотвращение задержек регулирования).',
    '```',
    '',
    '## 1. Метаданные партии',
    `- Сценарий: ${scenarioTitle}`,
    `- Месяц: ${game.month} из ${game.horizon || 120}`,
    `- Итоговый статус: ${statusLabel}`,
    `- Профиль решений (по симулятору): ${analysis.archetype.name} — ${analysis.archetype.title}`,
    `- Сводка симулятора: ${analysis.summary}`,
    '',
    '## 2. Итоговые показатели города',
    `- Население: ${Math.round(game.population)} чел.`,
    `- Казна: ${Math.round(game.treasury * 10) / 10} тыс. марок`,
    `- Долг: ${Math.round(game.debt * 10) / 10} тыс. марок`,
    `- Оборудование фабрики: ${Math.round(game.equipment * 10) / 10}%`,
    `- Квалификация рабочих (Skills): ${Number.isFinite(game.skills) ? `${Math.round(game.skills * 10) / 10}%` : 'нет данных (legacy)'}`,
    `- Выпуск часов: ${Math.round(game.production * 10) / 10} часов/мес.`,
    `- Безработица: ${Math.round((game.unemployment || 0) * 10) / 10} чел.`,
    `- Общая удовлетворенность: ${Math.round(game.satisfaction * 10) / 10}%`,
    `- Дефицит жилья: ${Math.round(game.housingShortage || 0)} мест`,
    '',
    '## 3. Сработавшие индикаторы когнитивных ловушек',
  ];

  const detected = analysis.traps.filter(t => t.detected);
  if (detected.length === 0) {
    lines.push('- Пороги выбранных индикаторов не превышены в доступном журнале.');
  } else {
    for (const trap of detected) {
      lines.push(`- **⚠️ ${trap.title || trap.name}**: ${trap.description}`);
      if (trap.learningPrompt) {
        lines.push(`  *Учебный вопрос: ${trap.learningPrompt}*`);
      }
    }
  }

  lines.push('');
  lines.push('## 4. Хроника решений и заметок игрока');
  const journal = Array.isArray(game.journal) ? game.journal : [];
  if (journal.length === 0) {
    lines.push('- В журнале нет зафиксированных действий.');
  } else {
    for (const entry of journal) {
      const noteStr = entry.note ? ` [Заметка/Гипотеза: "${entry.note}"]` : '';
      lines.push(`- [Месяц ${entry.month ?? 0}] ${entry.title || entry.type}${noteStr}`);
    }
  }

  lines.push('');
  lines.push('## 5. Динамика показателей по ключевым точкам');
  lines.push('| Месяц | Население | Казна | Долг | Станки (%) | Квалификация (%) | Выпуск | Безработица | Удовл. (%) |');
  lines.push('|---|---:|---:|---:|---:|---:|---:|---:|---:|');
  const history = Array.isArray(game.history) ? game.history : [];
  const historyByMonth = new Map(history.map(s => [s.month, s]));
  const sampledMonths = new Set([0, game.month]);
  for (let m = 12; m < game.month; m += 12) sampledMonths.add(m);
  for (const entry of journal) {
    if (entry.month !== undefined && entry.month <= game.month) sampledMonths.add(entry.month);
  }
  const sortedMonths = Array.from(sampledMonths).sort((a, b) => a - b);
  for (const m of sortedMonths) {
    const s = historyByMonth.get(m) || (m === game.month ? game : null);
    if (!s) continue;
    const skillsCell = Number.isFinite(s.skills) ? `${Math.round(s.skills)}%` : '—';
    lines.push(`| ${m} | ${Math.round(s.population)} | ${Math.round(s.treasury)} | ${Math.round(s.debt)} | ${Math.round(s.equipment)}% | ${skillsCell} | ${Math.round(s.production)} | ${Math.round(s.unemployment || 0)} | ${Math.round(s.satisfaction)}% |`);
  }

  lines.push('');
  lines.push('## 6. Вопросы для системной саморефлексии');
  for (const q of (analysis.reflectionQuestions || [])) {
    lines.push(`- ${q}`);
  }

  try {
    const choices = listProjectChoices(game);
    if (choices.length > 0) {
      lines.push('');
      lines.push('## 7. Контрфактический анализ завершенных проектов (Что было бы без проекта?)');
      for (const choice of choices) {
        const comparison = compareWithoutProject(game, choice.journalIndex);
        if (comparison && comparison.status === 'available') {
          const act = comparison.actual;
          const alt = comparison.alternative;
          lines.push(`### Проект: «${choice.label}» (запущен в месяце ${choice.startMonth}, завершен в месяце ${choice.completeMonth})`);
          if (choice.note) {
            lines.push(`- Ожидание игрока перед стартом: "${choice.note}"`);
          }
          const treasuryDiff = Math.round((act.treasury - alt.treasury) * 10) / 10;
          const unempDiff = Math.round(((act.unemployment || 0) - (alt.unemployment || 0)) * 10) / 10;
          lines.push(`- Казна к месяцу ${game.month}: с проектом ${Math.round(act.treasury * 10) / 10} тыс. м., без проекта ${Math.round(alt.treasury * 10) / 10} тыс. м. (разница: ${treasuryDiff > 0 ? '+' : ''}${treasuryDiff})`);
          lines.push(`- Безработица: с проектом ${Math.round((act.unemployment || 0) * 10) / 10} чел., без проекта ${Math.round((alt.unemployment || 0) * 10) / 10} чел. (разница: ${unempDiff > 0 ? '+' : ''}${unempDiff})`);
          lines.push(`- Оборудование: с проектом ${Math.round(act.equipment * 10) / 10}%, без проекта ${Math.round(alt.equipment * 10) / 10}%`);
          lines.push(`- Вместимость жилья: с проектом ${Math.round(act.housingCapacity || 0)}, без проекта ${Math.round(alt.housingCapacity || 0)}`);
          lines.push(`- Общая удовлетворенность: с проектом ${Math.round(act.satisfaction * 10) / 10}%, без проекта ${Math.round(alt.satisfaction * 10) / 10}%`);
          lines.push('');
        }
      }
    }
  } catch {
    // Non-blocking in case of unsupported custom game formats
  }

  return lines.map(localize).join('\n');
}

export function buildChessMatchRecord(sessionData) {
  const game = sessionData.game || sessionData;
  const history = Array.isArray(game.history) ? game.history : [];
  const journal = Array.isArray(game.journal) ? game.journal : [];
  const horizon = game.horizon || 120;
  const scenario = game.scenarioId || 'sandbox';

  const journalByMonth = new Map();
  for (let i = 0; i < journal.length; i++) {
    const entry = journal[i];
    const m = entry.month ?? 0;
    if (!journalByMonth.has(m)) journalByMonth.set(m, []);
    journalByMonth.get(m).push({ ...entry, _seq: i + 1 });
  }

  const historyByMonth = new Map();
  for (const snap of history) {
    if (snap && Number.isFinite(snap.month)) {
      historyByMonth.set(snap.month, snap);
    }
  }

  const moves = [];
  const maxMonth = game.month ?? (history.length > 0 ? history.at(-1).month : 0);

  for (let m = 0; m <= maxMonth; m++) {
    const currentState = historyByMonth.get(m) || null;
    const nextState = historyByMonth.get(m + 1) || null;
    const rawEntries = journalByMonth.get(m) || [];

    const orderedActions = rawEntries
      .filter(e => e.type === 'report' || e.type === 'policy' || e.type === 'project')
      .map((e, idx) => {
        const action = {
          seq: idx + 1,
          type: e.type,
          title: e.title,
          note: e.note ? e.note.trim() : null,
        };
        if (e.type === 'policy') {
          action.policyChanges = e.changes || e.patch || null;
        } else if (e.type === 'project') {
          action.project = {
            id: e.project?.id || null,
            type: e.project?.type || null,
            label: e.project?.label || e.title,
            cost: e.project?.cost ?? 0,
            duration: e.project?.completeMonth ? (e.project.completeMonth - (e.project.startMonth ?? m)) : null,
            startMonth: e.project?.startMonth ?? m,
            completeMonth: e.project?.completeMonth ?? null,
          };
        }
        return action;
      });

    const immediateProjectCost = orderedActions
      .filter(a => a.type === 'project')
      .reduce((sum, a) => sum + (a.project?.cost || 0), 0);

    const completionsThisMonth = rawEntries
      .filter(e => e.type === 'completion')
      .map(e => e.title);

    let transition = null;
    if (currentState && nextState) {
      const deltaTreasury = Math.round((nextState.treasury - currentState.treasury) * 1000) / 1000;
      const deltaDebt = Math.round((nextState.debt - currentState.debt) * 1000) / 1000;
      const deltaEquipment = Math.round((nextState.equipment - currentState.equipment) * 1000) / 1000;
      const hasSkillsDelta = Number.isFinite(nextState.skills) && Number.isFinite(currentState.skills);
      const deltaSkills = hasSkillsDelta ? Math.round((nextState.skills - currentState.skills) * 1000) / 1000 : null;
      const deltaProduction = Math.round((nextState.production - currentState.production) * 1000) / 1000;
      const deltaUnemployment = Math.round((nextState.unemployment - currentState.unemployment) * 1000) / 1000;
      const deltaSatisfaction = Math.round((nextState.satisfaction - currentState.satisfaction) * 1000) / 1000;
      const operatingCashDelta = Math.round((deltaTreasury + immediateProjectCost) * 1000) / 1000;

      transition = {
        toMonth: m + 1,
        intervalMonths: 1,
        immediateProjectCost,
        delta: {
          treasury: deltaTreasury,
          operatingCashDelta: immediateProjectCost > 0 ? operatingCashDelta : deltaTreasury,
          debt: deltaDebt,
          equipment: deltaEquipment,
          skills: deltaSkills,
          production: deltaProduction,
          unemployment: deltaUnemployment,
          satisfaction: deltaSatisfaction,
        },
      };
    }

    const empiricalSignals = [];
    if (currentState) {
      const pop = currentState.population || 0;
      const estWorkforce = currentState.workforce ?? (pop ? Math.round(pop * 0.555 * 1e6) / 1e6 : null);
      if (currentState.equipment < 40) {
        empiricalSignals.push(`Оборудование фабрики: ${Math.round(currentState.equipment * 10) / 10}% (ниже ориентира 40% на радарной шкале)`);
      }
      if (Number.isFinite(currentState.skills) && currentState.skills < 38) {
        empiricalSignals.push(`Квалификация рабочих: ${Math.round(currentState.skills * 10) / 10}% (ниже ориентира эффективной производительности 38%)`);
      }
      if (currentState.debt > 0) {
        empiricalSignals.push(`Городской долг: ${Math.round(currentState.debt * 10) / 10} тыс. марок`);
      }
      if (currentState.housingShortage > 0) {
        empiricalSignals.push(`Дефицит муниципального жилья: ${Math.round(currentState.housingShortage)} мест`);
      }
      if (estWorkforce && currentState.unemployment > estWorkforce * 0.15) {
        const pct = Math.round((currentState.unemployment / estWorkforce) * 1000) / 10;
        empiricalSignals.push(`Безработица: ${Math.round(currentState.unemployment)} чел. (${pct}% рабочей силы)`);
      }
    }

    let moveEvaluation = { tag: '—', label: 'Штатное наблюдение' };
    if (orderedActions.length > 0) {
      moveEvaluation = { tag: '!', label: 'Действие бургомистра' };
      const policyActions = orderedActions.filter(a => a.type === 'policy');
      const projectActions = orderedActions.filter(a => a.type === 'project');

      if (currentState) {
        const hasHighTourismAds = policyActions.some(a => a.policyChanges && a.policyChanges.tourismMarketing >= 40);
        if (hasHighTourismAds && currentState.tourismCapacity <= 25) {
          moveEvaluation = {
            tag: '??',
            label: 'Эвристический риск: сжигание бюджета в узком горлышке туризма (реклама >= 40k при емкости <= 25 мест)',
          };
        }
        const hasLowMaintenance = policyActions.some(a => a.policyChanges && a.policyChanges.maintenance < 10);
        if (hasLowMaintenance && currentState.equipment < 30) {
          moveEvaluation = {
            tag: '??',
            label: 'Эвристический риск: урезание обслуживания станков ниже 10k при износе оборудования < 30%',
          };
        }
        const hasZeroEducation = policyActions.some(a => a.policyChanges && a.policyChanges.education === 0);
        if (hasZeroEducation && Number.isFinite(currentState.skills) && currentState.skills > 40) {
          moveEvaluation = {
            tag: '??',
            label: 'Эвристический риск: обнуление расходов на образование при квалификации > 40% (скрытый лаг деградации кадров)',
          };
        }
      }

      if (moveEvaluation.tag !== '??') {
        const hypothesisProject = projectActions.find(a => a.note && a.note.trim().length >= 5);
        if (hypothesisProject) {
          moveEvaluation = {
            tag: '!',
            label: `Действие с зафиксированным ожиданием (проект «${hypothesisProject.project?.label || 'Инвестиция'}» запущен с комментарием в журнале)`,
          };
        }
      }
    }

    moves.push({
      turnMonth: m,
      preActionState: currentState ? {
        month: currentState.month,
        population: Math.round(currentState.population),
        treasury: Math.round(currentState.treasury * 10) / 10,
        debt: Math.round(currentState.debt * 10) / 10,
        equipment: Math.round(currentState.equipment * 10) / 10,
        skills: Number.isFinite(currentState.skills) ? Math.round(currentState.skills * 10) / 10 : null,
        production: Math.round(currentState.production * 10) / 10,
        unemployment: Math.round(currentState.unemployment * 10) / 10,
        satisfaction: Math.round(currentState.satisfaction * 10) / 10,
        housingShortage: Math.round(currentState.housingShortage || 0),
      } : null,
      phases: {
        phase1_arrivalsAndCompletions: completionsThisMonth,
        phase2_mayorInterventions: orderedActions,
        phase3_simulationTransition: transition,
      },
      completionsThisMonth,
      mayorActions: {
        hasIntervention: orderedActions.length > 0,
        count: orderedActions.length,
        orderedEvents: orderedActions,
      },
      systemicEvaluation: moveEvaluation,
      transitionToNextMonth: transition,
      empiricalSignals,
    });
  }

  const activeTraps = Array.isArray(sessionData.traps)
    ? sessionData.traps.filter(t => t && t.detected).map(t => t.title || t.id || 'Неизвестный индикатор')
    : [];

  return {
    $format: "Lohhausen Match Notation (LMN v1.2)",
    aiAnalysisSystemPrompt: `Ты — аналитик системного мышления и когнитивной психологии сложных систем (по методологии Дитриха Дёрнера, «Логика неудачи»).
Перед тобой пошаговая запись управления городом Лоххаузен (LMN v1.2: Lohhausen Match Notation).

Инструкции для системного разбора:
1. ОПИРАЙСЯ ТОЛЬКО НА НАБЛЮДАЕМЫЕ ДАННЫЕ И ЧИСЛА:
   - Не приписывай игроку неявных психологических мотивов (страх, лень, эйфория, «технологический оптимизм»), если они не записаны прямым текстом в заметках игрока (note).
   - Не классифицируй игрока категоричными оценочными ярлыками. Анализируй наблюдаемые действия, динамику и системные эффекты.

2. АНАЛИЗ ПЕРЕХОДОВ И ДИНАМИКИ (ХОД ЗА ХОДОМ):
   - Разделяй немедленные капитальные затраты (оплата проектов в месяц m) и последующий операционный результат перехода m -> m+1.
   - Обрати внимание на временные лаги: какие инвестиции дали эффект с задержкой (жилье: 12 мес., модернизация: 9 мес., туризм: 6 мес.)?
   - Проверь, запрашивал ли игрок отчеты перед принятием крупных решений (информационная подготовка) или действовал без свежих данных.

3. СВЕРКА ГИПОТЕЗ (ЗАМЕТКИ В ЖУРНАЛЕ VS ФАКТИЧЕСКИЙ РЕЗУЛЬТАТ):
   - Если игрок записал гипотезу перед стартом проекта, сопоставь прогноз с наблюдаемым состоянием системы на момент завершения проекта.
   - Проверь наблюдаемый факт: запрашивались ли отчеты профильного подразделения после запуска проекта, или проект реализовывался без сверки отчетов за 6+ месяцев?

4. СИСТЕМНЫЕ КОМПРОМИССЫ (TRADE-OFFS) И АЛЬТЕРНАТИВНЫЕ ОБЪЯСНЕНИЯ:
   - Избегай однофакторных оценок («ход хороший» / «ход плохой»). Анализируй компромиссы по нескольким осям (например, модернизация снижает износ и повышает выпуск, но может сократить рабочие места при фиксированном спросе).
   - Если наблюдается перелом траектории (например, выход из долга или рост безработицы), укажи несколько возможных факторов влияния вместо категоричного утверждения об одной причине.
   - Маркируй любую причинную гипотезу как требующую контрфактической проверки.

5. 3 КОНКРЕТНЫХ СИСТЕМНЫХ РЕКОМЕНДАЦИИ:
   - Какие обратные связи, пороги или лаги остались без внимания?
   - Какие параметры политики позволили бы сбалансировать систему эффективнее?`,
    matchMetadata: {
      scenario,
      durationMonths: maxMonth,
      horizon,
      finalOutcome: sessionData.status || (maxMonth >= horizon ? 'complete' : 'active'),
      archetype: sessionData.archetype ? {
        id: sessionData.archetype.id || 'unknown',
        title: sessionData.archetype.title || sessionData.archetype.name || 'Не определен',
      } : null,
      cognitiveTrapsDetected: activeTraps,
      lastCalculatedState: history.length > 0 ? {
        month: history.at(-1).month,
        population: history.at(-1).population,
        treasury: history.at(-1).treasury,
        debt: history.at(-1).debt,
        equipment: history.at(-1).equipment,
        production: history.at(-1).production,
        unemployment: history.at(-1).unemployment,
        satisfaction: history.at(-1).satisfaction,
      } : null,
      currentState: {
        month: game.month ?? (history.length > 0 ? history.at(-1).month : 0),
        population: game.population ?? (history.length > 0 ? history.at(-1).population : 0),
        treasury: game.treasury ?? (history.length > 0 ? history.at(-1).treasury : 0),
        debt: game.debt ?? (history.length > 0 ? history.at(-1).debt : 0),
        equipment: game.equipment ?? (history.length > 0 ? history.at(-1).equipment : 0),
        production: game.production ?? (history.length > 0 ? history.at(-1).production : 0),
        unemployment: game.unemployment ?? (history.length > 0 ? history.at(-1).unemployment : 0),
        satisfaction: game.satisfaction ?? (history.length > 0 ? history.at(-1).satisfaction : 0),
      },
      hasUnadvancedInterventions: Boolean(history.length > 0 && game.month === history.at(-1).month && (journalByMonth.get(game.month)?.some(e => ['policy', 'project'].includes(e.type)) || game.treasury !== history.at(-1).treasury)),
      finalState: history.length > 0 ? {
        month: history.at(-1).month,
        population: history.at(-1).population,
        treasury: history.at(-1).treasury,
        debt: history.at(-1).debt,
        equipment: history.at(-1).equipment,
        production: history.at(-1).production,
        unemployment: history.at(-1).unemployment,
        satisfaction: history.at(-1).satisfaction,
      } : null,
    },
    moves,
  };
}

export function formatDebriefLMN(game, analysis, evaluation = {}) {
  const sessionData = {
    scenario: game.scenarioId || 'sandbox',
    month: game.month,
    horizon: game.horizon || 120,
    status: evaluation.status || (game.month >= (game.horizon || 120) ? 'complete' : 'active'),
    game,
    archetype: analysis.archetype,
    summary: analysis.summary,
    traps: analysis.traps,
    reflectionQuestions: analysis.reflectionQuestions,
  };
  return buildChessMatchRecord(sessionData);
}

function evaluateSingleHypothesis(hyp, startSnapshot, completionSnapshot, isTarget = true) {
  if (!hyp || typeof hyp !== 'object') return null;
  const metric = hyp.metric;
  if (!metric || typeof metric !== 'string') return null;

  const startVal = startSnapshot && Number.isFinite(startSnapshot[metric]) ? startSnapshot[metric] : null;
  const compVal = completionSnapshot && Number.isFinite(completionSnapshot[metric]) ? completionSnapshot[metric] : null;

  if (startVal === null || compVal === null) {
    return {
      status: 'no_data',
      metric,
      details: `Наблюдения по показателю "${metric}" недоступны в истории для сопоставления.`,
    };
  }

  const observedDelta = Number((compVal - startVal).toFixed(2));
  let isConsistent = false;

  if (Number.isFinite(hyp.expectedDelta)) {
    if (hyp.expectedDelta === 0) {
      isConsistent = Math.abs(observedDelta) <= 2;
    } else {
      const signMatch = Math.sign(observedDelta) === Math.sign(hyp.expectedDelta);
      isConsistent = signMatch && Math.abs(observedDelta) >= Math.abs(hyp.expectedDelta) * 0.7;
    }
  } else if (hyp.expectedDirection) {
    if (hyp.expectedDirection === 'increase') {
      isConsistent = observedDelta > 0.5;
    } else if (hyp.expectedDirection === 'decrease') {
      isConsistent = observedDelta < -0.5;
    } else if (hyp.expectedDirection === 'neutral') {
      isConsistent = Math.abs(observedDelta) <= 5;
    }
  } else {
    isConsistent = isTarget ? observedDelta >= 0 : Math.abs(observedDelta) <= 5;
  }

  const deltaStr = observedDelta >= 0 ? `+${observedDelta}` : `${observedDelta}`;
  let explanation = '';
  if (isConsistent) {
    explanation = isTarget
      ? `Наблюдаемый показатель (${metric}: ${deltaStr}) согласуется с зафиксированным ожиданием игрока. Причинная связь требует отдельного факторного анализа.`
      : `Сопутствующий показатель (${metric}: ${deltaStr}) согласуется с предварительным прогнозом риска.`;
  } else {
    explanation = isTarget
      ? `Наблюдаемый показатель (${metric}: ${deltaStr}) разошелся с зафиксированным ожиданием игрока. Возможные факторы: сопряженные контуры, изменение рыночного спроса или динамические лаги.`
      : `Сопутствующий показатель (${metric}: ${deltaStr}) разошелся с ожиданием: проявилось побочное влияние в сопряженном контуре.`;
  }

  return {
    status: isConsistent ? 'consistent' : 'inconsistent',
    metric,
    startValue: startVal,
    completionValue: compVal,
    observedDelta,
    expectedDelta: Number.isFinite(hyp.expectedDelta) ? hyp.expectedDelta : undefined,
    expectedDirection: hyp.expectedDirection || undefined,
    rationale: hyp.rationale || hyp.anticipatedCost || undefined,
    details: explanation,
  };
}

export function verifyHypotheses(game) {
  if (!game || !Array.isArray(game.journal)) return [];

  const completedProjects = [];
  for (const entry of game.journal) {
    if (entry.type === 'project' && entry.project) {
      const proj = entry.project;
      if (game.month >= proj.completeMonth) {
        const snapshot = Array.isArray(game.history)
          ? game.history.find(item => item && item.month === proj.completeMonth)
          : null;
        const requiredFields = {
          housing: ['housingCapacity', 'housingShortage'],
          modernization: ['equipment', 'production'],
          tourism: ['tourismCapacity', 'visitors'],
        }[proj.type] || [];
        const evidenceAvailable = Boolean(snapshot && requiredFields.length > 0 && requiredFields.every(field => Number.isFinite(snapshot[field])));
        let outcomeSummary;

        if (!evidenceAvailable) {
          outcomeSummary = `Наблюдения за месяц завершения (${proj.completeMonth}) недоступны: в истории нет полного профильного снимка.`;
        } else if (proj.type === 'housing') {
          outcomeSummary = `В месяце завершения зафиксированы вместимость жилья ${Math.round(snapshot.housingCapacity)} мест и дефицит ${Math.max(0, Math.round(snapshot.housingShortage))} мест.`;
        } else if (proj.type === 'modernization') {
          outcomeSummary = `В месяце завершения зафиксированы состояние оборудования ${Math.round(snapshot.equipment)}% и производство ${Math.round(snapshot.production)}.`;
        } else {
          outcomeSummary = `В месяце завершения зафиксированы туристическая вместимость ${Math.round(snapshot.tourismCapacity)} мест и ${Math.round(snapshot.visitors)} посетителей.`;
        }

        const playerNote = entry.note ? entry.note.trim() : '';
        const hindsightLesson = playerNote
          ? 'Автоматическая сверка показывает только наблюдаемые значения и не доказывает, что записанная гипотеза верна или что проект был их единственной причиной.'
          : 'Исходное ожидание не записано. Автоматическая сверка показывает только наблюдаемые значения и не устанавливает причинную связь.';

        let hypothesisVerification;
        if (!entry.hypotheses || typeof entry.hypotheses !== 'object') {
          hypothesisVerification = {
            status: 'no_data',
            details: 'Ожидание не записано. Автоматическая сверка показывает только наблюдаемые значения и не устанавливает причинную связь.',
            h1Result: null,
            h2Result: null,
          };
        } else {
          const startSnapshot = Array.isArray(game.history)
            ? game.history.find(item => item && item.month === proj.startMonth)
            : null;
          const h1Result = evaluateSingleHypothesis(entry.hypotheses.h1Target, startSnapshot, snapshot, true);
          const h2Result = evaluateSingleHypothesis(entry.hypotheses.h2Risk, startSnapshot, snapshot, false);

          let status = 'no_data';
          let details = '';

          if (h1Result && h1Result.status !== 'no_data') {
            if (h1Result.status === 'consistent' && (!h2Result || h2Result.status === 'consistent')) {
              status = 'consistent';
              details = 'Наблюдаемые показатели согласуются с зафиксированными ожиданиями и прогнозом рисков. Причинная связь требует подтверждения.';
            } else {
              status = 'inconsistent';
              details = 'Один или несколько наблюдаемых показателей разошлись с зафиксированным ожиданием игрока в целевом или сопряженном контуре.';
            }
          } else {
            status = 'no_data';
            details = 'Недостаточно данных для верификации гипотезы.';
          }

          hypothesisVerification = {
            status,
            details,
            h1Result,
            h2Result,
          };
        }

        completedProjects.push({
          projectType: proj.type,
          projectLabel: proj.label || proj.type,
          startMonth: proj.startMonth,
          completeMonth: proj.completeMonth,
          playerNote,
          outcomeSummary,
          hindsightLesson,
          evidenceStatus: evidenceAvailable ? 'observed' : 'unavailable',
          completionSnapshot: snapshot ? structuredClone(snapshot) : null,
          hypotheses: entry.hypotheses ? structuredClone(entry.hypotheses) : null,
          hypothesisVerification,
        });
      }
    }
  }

  return completedProjects;
}
