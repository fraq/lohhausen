/**
 * Dörner Cognitive Debriefing Engine
 * 
 * Deep temporal retrospective analysis of mayoral decision patterns
 * based on Dietrich Dörner's "The Logic of Failure" (Die Logik des Mißlingens).
 */

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
  } else if (traps.find(t => t.id === 'ballistic_action' && t.detected)) {
    archetype = {
      id: 'ballistic',
      name: 'Баллистический стрелок',
      title: 'Действие вслепую без обратной связи',
      description: 'После завершения крупных мер в журнале отсутствуют профильные отчеты. Этот индикатор описывает только доступные записи партии.',
    };
  } else {
    archetype = {
      id: 'oversteerer',
      name: 'Нетерпеливый регулятор',
      title: 'Быстрые развороты налоговой ставки',
      description: 'В журнале есть частые коррекции параметров до истечения возможного периода отклика. Этот индикатор не доказывает мотивы игрока.',
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
  const completedProjects = journal.filter(entry =>
    entry.type === 'project' && entry.project && Number.isFinite(entry.project.completeMonth) &&
    (game.month ?? 0) >= entry.project.completeMonth
  );
  const reportRequests = journal.filter(entry => entry.type === 'report');
  const unmonitoredProjects = completedProjects.filter(entry => {
    const expected = expectedReport[entry.project.type];
    const completionIndex = journal.findIndex(item =>
      item.type === 'completion' && item.month === entry.project.completeMonth &&
      String(item.title || '').includes(entry.project.label || entry.project.type)
    );
    return !expected || !reportRequests.some(report => {
      if (reportKind(report) !== expected || report.month < entry.project.completeMonth) return false;
      if (report.month > entry.project.completeMonth) return true;
      return completionIndex >= 0 && journal.indexOf(report) > completionIndex;
    });
  }).map(entry => ({
    projectType: entry.project.type,
    completeMonth: entry.project.completeMonth,
    expectedReport: expectedReport[entry.project.type] || null,
  }));
  const unmonitoredInterventions = unmonitoredProjects.length;

  const detected = unmonitoredInterventions > 0;
  return {
    id: 'ballistic_action',
    title: 'Баллистический стиль (Ballistisches Handeln)',
    detected,
    severity: detected ? 'high' : 'none',
    description: detected
      ? `После ${unmonitoredInterventions} завершенных проектов не найден последующий профильный отчет для проверки наблюдаемого результата.`
      : completedProjects.length > 0
        ? 'После завершенных проектов были запрошены профильные отчеты.'
        : 'Завершенных проектов для проверки этого паттерна пока нет.',
    evidence: { unmonitoredInterventions, unmonitoredProjects, totalProjects: completedProjects.length, totalReports: reportRequests.length },
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
        });
      }
    }
  }

  return completedProjects;
}
