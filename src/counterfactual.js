import { PROJECTS, advance, createGame, deserializeGame, requestReport, setPolicies, startProject } from './model.js';
import { SCENARIOS, createScenarioGame } from './scenarios.js';

const EPSILON = 0.000001;
const ACTION_TYPES = new Set(['system', 'scenario', 'policy', 'policies', 'project', 'report', 'completion', 'note', 'reflection']);
const REPORT_KIND_BY_TITLE = Object.freeze({ 'финансы': 'finance', 'фабрика': 'factory', 'жильё': 'housing', 'социальная сфера': 'social', 'туризм': 'tourism' });
const unavailable = (reason, extra = {}) => ({ status: 'unavailable', reason, ...extra });
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const clone = (value) => structuredClone(value);

function projectFactsAreCanonical(entry) {
  if (!isObject(entry.project) || !Object.hasOwn(PROJECTS, entry.project.type)) return false;
  const definition = PROJECTS[entry.project.type];
  return entry.project.startMonth === entry.month
    && entry.project.completeMonth === entry.month + definition.duration
    && entry.project.cost === definition.cost
    && entry.project.label === definition.label;
}

function policyPatch(entry) {
  if (Object.hasOwn(entry, 'changes') && Object.hasOwn(entry, 'patch')) return null;
  if (isObject(entry.changes)) return entry.changes;
  if (isObject(entry.patch)) return entry.patch;
  return null;
}

function validJournal(game) {
  if (!Array.isArray(game.journal)) return false;
  let lastMonth = -1;
  for (const entry of game.journal) {
    if (!isObject(entry) || !Number.isInteger(entry.month) || entry.month < lastMonth || entry.month < 0 || entry.month > game.month
      || typeof entry.type !== 'string' || typeof entry.title !== 'string' || typeof entry.note !== 'string' || !ACTION_TYPES.has(entry.type)) return false;
    lastMonth = entry.month;
    if (entry.type === 'project' && !projectFactsAreCanonical(entry)) return false;
    if ((entry.type === 'policy' || entry.type === 'policies') && !policyPatch(entry)) return false;
  }
  return true;
}

function initialGame(game) {
  if (game.scenarioId === undefined) return createGame();
  if (!Object.hasOwn(SCENARIOS, game.scenarioId)) throw new Error('unknown scenario');
  return createScenarioGame(game.scenarioId);
}

function reportKind(entry) {
  const prefix = 'Запрошен отчёт: ';
  return entry.title.startsWith(prefix) ? REPORT_KIND_BY_TITLE[entry.title.slice(prefix.length)] : undefined;
}

function appendNoOp(game, entry) {
  const next = clone(game);
  next.journal.push(clone(entry));
  return next;
}

function replay(game, omittedIndex = -1) {
  let replayed = initialGame(game);
  for (let index = 0; index < game.journal.length; index += 1) {
    const entry = game.journal[index];
    if (entry.type === 'system' || entry.type === 'scenario' || entry.type === 'completion') continue;
    if (entry.month > replayed.month) replayed = advance(replayed, entry.month - replayed.month);
    if (replayed.month !== entry.month) throw new Error('chronology');
    if (index === omittedIndex) continue;
    if (entry.type === 'policy' || entry.type === 'policies') replayed = setPolicies(replayed, policyPatch(entry), entry.note);
    else if (entry.type === 'project') {
      try {
        replayed = startProject(replayed, entry.project.type, entry.note);
      } catch (error) {
        error.counterfactualProject = { month: entry.month, projectType: entry.project.type };
        throw error;
      }
    }
    else if (entry.type === 'report') {
      const kind = reportKind(entry);
      if (!kind) throw new Error('unknown report');
      replayed = requestReport(replayed, kind);
    } else replayed = appendNoOp(replayed, entry);
  }
  if (game.month > replayed.month) replayed = advance(replayed, game.month - replayed.month);
  if (replayed.month !== game.month) throw new Error('chronology');
  return replayed;
}

function numbersMatch(recorded, replayed) {
  if (typeof recorded === 'number') return Number.isFinite(recorded) && typeof replayed === 'number' && Number.isFinite(replayed) && Math.abs(recorded - replayed) <= EPSILON;
  if (Array.isArray(recorded)) return Array.isArray(replayed) && recorded.length === replayed.length && recorded.every((value, index) => numbersMatch(value, replayed[index]));
  if (isObject(recorded)) return isObject(replayed) && Object.entries(recorded).every(([key, value]) => numbersMatch(value, replayed[key]));
  return true;
}

function historyIsComplete(game) {
  return Array.isArray(game.history) && game.history.length === game.month + 1
    && game.history.every((snapshot, month) => isObject(snapshot) && snapshot.month === month);
}

function replayMatches(game, replayed) {
  return Object.entries(game).every(([key, value]) => key === 'journal' || numbersMatch(value, replayed[key]));
}

export function listProjectChoices(game) {
  if (!isObject(game) || !Number.isInteger(game.month) || !Array.isArray(game.journal)) return [];
  const choices = [];
  game.journal.forEach((entry, journalIndex) => {
    if (!isObject(entry) || entry.type !== 'project' || !isObject(entry.project)) return;
    const project = entry.project;
    if (!projectFactsAreCanonical(entry) || project.completeMonth > game.month) return;
    choices.push({ journalIndex, type: project.type, label: project.label, startMonth: project.startMonth, completeMonth: project.completeMonth, note: typeof entry.note === 'string' ? entry.note : '' });
  });
  return choices;
}

export function compareWithoutProject(game, journalIndex) {
  try {
    if (!isObject(game) || deserializeGame(JSON.stringify(game)) instanceof Error
      || !Number.isInteger(game.month) || !historyIsComplete(game) || !validJournal(game)) return unavailable('unverifiable');
    const project = listProjectChoices(game).find((choice) => choice.journalIndex === journalIndex);
    if (!project) return unavailable('invalid_selection');
    const verified = replay(game);
    if (!replayMatches(game, verified)) return unavailable('unverifiable');
    let alternative;
    try {
      alternative = replay(game, journalIndex);
    } catch (error) {
      const failed = error.counterfactualProject;
      if (failed) return unavailable('infeasible', failed);
      throw error;
    }
    return { status: 'available', month: game.month, project, actual: clone(game), alternative };
  } catch {
    return unavailable('unverifiable');
  }
}
