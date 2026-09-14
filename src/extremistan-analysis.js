import { createGame, advance, setPolicies, startProject, deserializeGame, PROJECTS } from './model.js';
import { applyScenario } from './scenarios.js';
import { getTalebEventSummary, talebEventInstanceId, resolveTalebOpportunity } from './taleb-events.js';

const EPSILON = 0.01;
const ACTION_TYPES = new Set(['system', 'scenario', 'policy', 'policies', 'project', 'report', 'completion', 'note', 'reflection',
  'taleb_shock', 'taleb_windfall', 'taleb_noise', 'taleb_offer', 'taleb_choice', 'taleb_positive', 'taleb_missed']);
const STATE_FIELDS = ['month', 'horizon', 'population', 'treasury', 'debt', 'housingCapacity', 'workforce', 'factoryJobs', 'otherJobs',
  'tourismJobs', 'unemployment', 'housingShortage', 'equipment', 'skills', 'production', 'inventory', 'sales', 'demand',
  'serviceQuality', 'health', 'education', 'satisfaction', 'satisfactionGroups', 'tourismCapacity', 'tourismDemand', 'visitors',
  'modernizationLevel', 'migrationPressure', 'policies', 'lastBudget', 'history', 'projects'];
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function matches(recorded, replayed) {
  if (typeof recorded === 'number') return Number.isFinite(recorded) && Number.isFinite(replayed) && Math.abs(recorded - replayed) <= 0.000001;
  if (Array.isArray(recorded)) return Array.isArray(replayed) && recorded.length === replayed.length && recorded.every((v, i) => matches(v, replayed[i]));
  if (object(recorded)) return object(replayed) && Object.entries(recorded).every(([key, value]) => matches(value, replayed[key]));
  return recorded === replayed;
}

function validateJournal(game) {
  let month = -1;
  for (const entry of game.journal) {
    if (!ACTION_TYPES.has(entry.type) || entry.month < month) throw new Error('unverifiable');
    month = entry.month;
    if (entry.type === 'project') {
      const project = entry.project;
      const def = PROJECTS[project?.type];
      if (!def || project.cost !== def.cost || project.startMonth !== entry.month || project.completeMonth !== entry.month + def.duration) throw new Error('unverifiable');
    }
    if (['policy', 'policies'].includes(entry.type) && (!object(entry.changes ?? entry.patch) || (entry.changes && entry.patch))) throw new Error('unverifiable');
    if (entry.type === 'taleb_choice' && (typeof entry.instanceId !== 'string' || !['buy', 'decline'].includes(entry.choice))) throw new Error('unverifiable');
  }
}

/** Replays the recorded decisions, never adapts them to the alternative world. */
export function replayTalebGame(source, { omitInstanceId = null, throughMonth = source.month, includeCurrentActions = true } = {}) {
  validateJournal(source);
  let replayed = applyScenario(createGame(), 'extremistan_challenge', source.seed);
  replayed.talebState.scheduledEvents = source.talebState.scheduledEvents.map((item, index) => ({ ...item, instanceId: talebEventInstanceId(item, index) }))
    .filter(item => item.instanceId !== omitInstanceId);
  replayed.talebState.prngState = source.talebState.prngState;
  for (const entry of source.journal) {
    if (entry.month > throughMonth || (!includeCurrentActions && entry.month === throughMonth)) continue;
    if (!['policy', 'policies', 'project', 'taleb_choice'].includes(entry.type)) continue;
    if (entry.month > replayed.month) replayed = advance(replayed, entry.month - replayed.month);
    if (entry.month !== replayed.month) throw new Error('unverifiable');
    if (entry.type === 'policy' || entry.type === 'policies') replayed = setPolicies(replayed, entry.changes ?? entry.patch, entry.note);
    if (entry.type === 'project') replayed = startProject(replayed, entry.project.type, entry.note, entry.hypotheses);
    if (entry.type === 'taleb_choice') replayed = resolveTalebOpportunity(replayed, entry.instanceId, entry.choice);
  }
  return advance(replayed, throughMonth - replayed.month);
}

/** Fixed scales have no data-dependent or zero denominators. Larger means better. */
export function compareTalebPerformance(actual, control) {
  const financeDelta = (actual.treasury - actual.debt) - (control.treasury - control.debt);
  const productionDelta = actual.production - control.production;
  const satisfactionDelta = actual.satisfaction - control.satisfaction;
  return { financeDelta, productionDelta, satisfactionDelta,
    delta: 0.5 * financeDelta / 800 + 0.25 * productionDelta / 800 + 0.25 * satisfactionDelta / 100 };
}

export function classifyTalebEvidence(observations) {
  if (!observations.length || observations.some(row => row.status === 'unavailable'
    || (row.status === 'available' && (typeof row.survived !== 'boolean' || !Number.isFinite(row.delta))))) return 'insufficient_evidence';
  const evaluated = observations.filter(row => row.status === 'available');
  if (evaluated.some(row => row.survived === false || row.delta < -EPSILON)) return 'fragile';
  if (observations.some(row => row.status === 'pending') || !evaluated.length) return 'insufficient_evidence';
  if (evaluated.some(row => row.delta > EPSILON)) return 'antifragile';
  return 'robust';
}

export function computeAntifragilityMetrics(game) {
  const history = game.history || [];
  const summary = getTalebEventSummary(game);
  let streak = 0, turkeyIndex = 0;
  for (const snap of history) {
    streak = snap.satisfaction >= 80 && (snap.treasury < 400 || snap.debt > 0) ? streak + 1 : 0;
    turkeyIndex = Math.max(turkeyIndex, streak);
  }
  const count = history.length || 1;
  const liquidityDiscipline = Math.round(100 * history.filter(snap => snap.treasury >= 600 && snap.debt === 0).length / count);
  const slackScore = Math.round(history.reduce((sum, snap) => sum + Math.max(0, Math.min(100, snap.treasury / 800 * 100)), 0) / count);
  let observations = summary.negativeShocks.map(row => ({ ...row, status: 'pending', reason: 'pending_window' }));
  let evidenceStatus = observations.length ? 'pending_window' : 'no_negative_shocks';
  if (observations.length) {
    try {
      if (game.scenarioId !== 'extremistan_challenge' || deserializeGame(JSON.stringify(game)) instanceof Error) throw new Error('unverifiable');
      const factual = replayTalebGame(game);
      if (!STATE_FIELDS.every(key => matches(game[key], factual[key])) || !matches(game.talebState.history, factual.talebState.history)
        || !matches(game.talebState.activeShocks, factual.talebState.activeShocks)) throw new Error('unverifiable');
      observations = observations.map(row => {
        if (row.completed && row.survived === null) return { ...row, status: 'unavailable', reason: 'missing_history' };
        if (row.observationMonth > game.month) return row;
        try {
          const control = replayTalebGame(game, { omitInstanceId: row.instanceId, throughMonth: row.observationMonth, includeCurrentActions: false });
          return { ...row, status: 'available', reason: null,
            ...compareTalebPerformance(game.history[row.observationMonth], control.history[row.observationMonth]) };
        } catch {
          return { ...row, status: 'unavailable', reason: 'infeasible_control' };
        }
      });
      evidenceStatus = observations.find(row => row.status === 'unavailable')?.reason
        ?? (observations.some(row => row.status === 'pending') ? 'pending_window' : 'available');
    } catch {
      evidenceStatus = 'unverifiable';
      observations = observations.map(row => ({ ...row, status: 'unavailable', reason: evidenceStatus }));
    }
  }
  const classification = classifyTalebEvidence(observations);
  const descriptions = {
    insufficient_evidence: ['Недостаточно данных', 'Для оценки нужен завершённый период наблюдения и воспроизводимое сравнение без шока.'],
    fragile: ['Потери в наблюдаемом сравнении', 'В проверенном интервале нарушены пределы выживания или результат хуже варианта без шока.'],
    robust: ['Устойчивость в наблюдаемом сравнении', 'Шоки пережиты; разница с вариантом без шока находится в пределах порога.'],
    antifragile: ['Польза в наблюдаемом сравнении', 'Шоки пережиты; хотя бы одно сравнение показывает пользу. Это локальный результат, а не доказательство общей антихрупкости.'],
  };
  return { ...summary, classification, triadTitle: descriptions[classification][0], verdict: descriptions[classification][1],
    liquidityDiscipline, slackScore, turkeyIndex, observations, evidenceStatus, epsilon: EPSILON };
}
