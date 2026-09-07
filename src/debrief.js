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

  let archetype;
  if (highSeverityTraps.length === 0 && anyTraps.length === 0) {
    archetype = {
      id: 'conrad',
      name: 'Конрад (Системный мыслитель)',
      title: 'Вдумчивое системное управление',
      description: 'Вы проявили терпение, учитывали временные лаги и контролировали последствия решений через доклады подразделений.',
    };
  } else if (traps.find(t => t.id === 'encapsulation' && t.detected)) {
    archetype = {
      id: 'encapsulator',
      name: 'Инкапсулятор',
      title: 'Уход в комфортную частную сферу',
      description: 'Склонность концентрироваться на второстепенных понятных вопросах (например, туризме) в моменты, когда базис города требовал срочного внимания.',
    };
  } else if (traps.find(t => t.id === 'thematic_vagabonding' && t.detected)) {
    archetype = {
      id: 'vagabond',
      name: 'Тематический бродяга',
      title: 'Хаотичное переключение фокуса',
      description: 'Постоянные скачки между несвязанными проблемами без доведения начатых реформ до устойчивого результата.',
    };
  } else if (traps.find(t => t.id === 'ballistic_action' && t.detected)) {
    archetype = {
      id: 'ballistic',
      name: 'Баллистический стрелок',
      title: 'Действие вслепую без обратной связи',
      description: 'Запуск масштабных мер без последующей проверки фактического положения дел по отчетам служб.',
    };
  } else {
    archetype = {
      id: 'oversteerer',
      name: 'Нетерпеливый регулятор',
      title: 'Раскачка системы из-за игнорирования задержек',
      description: 'Частая коррекция параметров до того, как успели проявиться отложенные эффекты предыдущих шагов.',
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
      ? `Зафиксировано ${switchesCount} импульсивных переключений между разными сферами. Игрок скачет от одной темы к другой, не давая системе стабилизироваться.`
      : 'Фокус управления оставался последовательным.',
    evidence: { switchesCount },
    dornerQuote: '«Участники переходили от одной проблемы к другой, бросая начатое дело сразу, как только на горизонте появлялась новая трудность» (Глава 3).',
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
      ? 'Обнаружен уход во второстепенную сферу (туризм) при наличии глубокого системного кризиса на фабрике или в казне. Бургомистр укрывается в решении второстепенных задач, избегая сложных структурных проблем.'
      : 'Признаков инкапсуляции и бегства от ключевых проблем не выявлено.',
    evidence: { equipment: eq, debt, tourismMarketing: p.tourismMarketing },
    dornerQuote: '«Испытуемые замыкались в маленькой, уютной области, где они чувствовали себя компетентными, полностью игнорируя катастрофу в масштабах всей системы» (Глава 4).',
  };
}

function detectBallisticAction(journal, history, game) {
  const majorInterventions = journal.filter(j => 
    j.type === 'project' || 
    ((j.type === 'policy' || j.type === 'policies') && (
      (j.changes?.taxRate ?? j.patch?.taxRate ?? 15) > 25 || 
      (j.changes?.taxRate ?? j.patch?.taxRate ?? 15) < 12
    ))
  );

  const reportRequests = journal.filter(j => j.type === 'report');

  let unmonitoredInterventions = 0;
  if (majorInterventions.length > 0 && reportRequests.length === 0) {
    unmonitoredInterventions = majorInterventions.length;
  }

  const detected = unmonitoredInterventions > 0;
  return {
    id: 'ballistic_action',
    title: 'Баллистический стиль (Ballistisches Handeln)',
    detected,
    severity: detected ? 'high' : 'none',
    description: detected
      ? `Зафиксировано ${unmonitoredInterventions} масштабных вмешательств (проекты, резкие налоговые реформы), после которых игрок ни разу не запросил отчеты подразделений для контроля последствий.`
      : 'Ключевые решения сопровождались контролем через отчеты профильных служб.',
    evidence: { unmonitoredInterventions, totalProjects: majorInterventions.length, totalReports: reportRequests.length },
    dornerQuote: '«Подобно пушечному ядру, выпущенному из жерла, решение отправлялось в путь, а бургомистр больше никогда не интересовался тем, куда оно попало» (Глава 5).',
  };
}

function detectLagIgnorance(journal) {
  const taxChanges = journal.filter(j => (j.type === 'policy' || j.type === 'policies') && 
    typeof (j.changes?.taxRate ?? j.patch?.taxRate) === 'number');

  let rapidReversals = 0;
  for (let i = 1; i < taxChanges.length; i++) {
    const prev = taxChanges[i - 1];
    const curr = taxChanges[i];
    const prevRate = prev.changes?.taxRate ?? prev.patch?.taxRate;
    const currRate = curr.changes?.taxRate ?? curr.patch?.taxRate;
    if (curr.month - prev.month <= 2 && Math.abs(currRate - prevRate) >= 5) {
      rapidReversals++;
    }
  }

  const detected = rapidReversals >= 2;
  return {
    id: 'lag_ignorance',
    title: 'Недооценка временных задержек (Lag Ignorance)',
    detected,
    severity: detected ? 'high' : 'none',
    description: detected
      ? 'Многократное нервное изменение параметров регулятора (налоговой ставки) без выдержки паузы на проявление эффекта. Это приводит к искусственной раскачке колебаний в городской системе.'
      : 'Регуляторы изменялись с достаточной паузой для стабилизации системы.',
    evidence: { rapidReversals },
    dornerQuote: '«Система с запаздыванием отклика неизбежно входит в резонанс и раскачивается, если управляющий не имеет терпения дождаться реакции на предыдущее действие» (Глава 6).',
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
  const activeTraps = traps.filter(t => t.detected);
  if (activeTraps.length === 0) {
    return 'Ваш стиль управления Лоххаузеном отличается высокой системной дисциплиной. Вы избежали типичных психологических ловушек, описанных Дёрнером, и продемонстрировали способность мыслить контурами обратной связи.';
  }
  return `В ходе управления выявлено ${activeTraps.length} характерных системных ловушек мышления. Ваш преобладающий паттерн — «${archetype.name}». Симулятор наглядно показал, как естественные психологические реакции человека могут непреднамеренно приводить к дестабилизации сложной среды.`;
}
