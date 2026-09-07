const SAVE_KEY = 'lohhausen-save-v1';
const CORRUPT_SAVE = '{"version":1,"policies":';

function required(selector) {
  const node = document.querySelector(selector);
  if (!node) throw new Error(`Не найден обязательный элемент: ${selector}`);
  return node;
}

function click(selector) {
  required(selector).click();
}

function month() {
  return Number(required('[data-testid="month"]').dataset.month);
}

function value(selector) {
  return Number(required(selector).dataset.value);
}

function text(selector) {
  const result = required(selector).textContent.trim();
  if (!result) throw new Error(`Элемент не содержит текста: ${selector}`);
  return result;
}

function setField(selector, nextValue) {
  const field = required(selector);
  field.value = String(nextValue);
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
  return field.value;
}

function advanceThreeUntil(targetMonth) {
  let attempts = 0;
  while (month() < targetMonth && attempts < 41) {
    click('[data-testid="advance-3"]');
    attempts += 1;
  }
  if (month() !== targetMonth) throw new Error(`Ожидался месяц ${targetMonth}, получен ${month()}`);
}

/**
 * Проверяет AC-1, AC-3, AC-5 и AC-7 только
 * через пользовательские действия и DOM. Вызывается в открытой странице игры.
 */
export function runFlowChecks() {
  const results = [];

  // AC-1
  if (month() !== 0 || value('[data-testid="population"]') !== 3700) {
    throw new Error('AC-1: новая игра должна открыть месяц 0 с населением 3700');
  }
  results.push('AC-1');

  // AC-5
  click('[data-testid="nav-reports"]');
  click('[data-testid="report-factory"]');
  click('[data-testid="request-report"]');
  if (Number(required('[data-testid="report-date"]').dataset.month) !== 0) {
    throw new Error('AC-5: первый отчёт фабрики должен быть датирован месяцем 0');
  }
  click('[data-testid="advance-1"]');
  if (month() !== 1 || Number(required('[data-testid="report-date"]').dataset.month) !== 0) {
    throw new Error('AC-5: отчёт должен остаться снимком месяца 0 после хода');
  }
  click('[data-testid="request-report"]');
  if (Number(required('[data-testid="report-date"]').dataset.month) !== 1) {
    throw new Error('AC-5: обновлённый отчёт должен быть снимком месяца 1');
  }
  results.push('AC-5');

  // Решение и жильё нужны для наблюдаемой части AC-3.
  click('[data-testid="nav-decisions"]');
  setField('[name="taxRate"]', 20);
  click('[data-testid="apply-policies"]');
  const beforeCapacity = value('[data-testid="housing-capacity"]');
  click('[data-testid="project-housing"]');
  advanceThreeUntil(10);
  click('[data-testid="advance-1"]');
  click('[data-testid="advance-1"]'); // месяц 12: ещё только 11 полных месяцев после запуска в месяце 1
  if (value('[data-testid="housing-capacity"]') !== beforeCapacity) {
    throw new Error('AC-3: вместимость жилья изменилась до достижения 12 месяцев после запуска');
  }
  click('[data-testid="advance-1"]'); // месяц 13: прошло 12 месяцев после запуска
  const afterCapacity = value('[data-testid="housing-capacity"]');
  if (afterCapacity !== beforeCapacity + 60) {
    throw new Error(`AC-3: вместимость жилья должна вырасти на 60, получено ${afterCapacity - beforeCapacity}`);
  }
  results.push('AC-3');

  // AC-7
  advanceThreeUntil(120);
  click('[data-testid="nav-debrief"]');
  text('[data-testid="debrief"]');
  for (const key of ['finance', 'production', 'unemployment', 'housing', 'satisfaction']) {
    text(`[data-testid="metric-${key}"]`);
  }
  results.push('AC-7');
  return { ok: true, results, month: month() };
}

/** Prepares a month-7 saved game and returns the values to compare after reload. */
export function preparePersistenceCheck() {
  click('[data-testid="nav-decisions"]');
  const taxRate = setField('[name="taxRate"]', 23);
  click('[data-testid="apply-policies"]');
  click('[data-testid="project-housing"]');
  while (month() < 7) click('[data-testid="advance-1"]');
  if (month() !== 7) throw new Error(`AC-6: ожидался месяц 7, получен ${month()}`);
  click('[data-testid="save"]');
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) throw new Error('AC-6: кнопка сохранения не создала localStorage-запись');
  return { month: month(), population: value('[data-testid="population"]'), taxRate, raw };
}

/** Call after page reload, passing the object returned by preparePersistenceCheck(). */
export function verifyPersistenceCheck(expected) {
  if (!expected || typeof expected !== 'object') throw new Error('AC-6: передайте snapshot из preparePersistenceCheck()');
  if (month() !== expected.month || value('[data-testid="population"]') !== expected.population) {
    throw new Error('AC-6: после reload не восстановлены месяц или население');
  }
  click('[data-testid="nav-decisions"]');
  if (required('[name="taxRate"]').value !== String(expected.taxRate)) {
    throw new Error('AC-6: после reload не восстановлено действующее налоговое решение');
  }
  if (localStorage.getItem(SAVE_KEY) !== expected.raw) {
    throw new Error('AC-6: сохранение было неожиданно изменено при восстановлении');
  }
  return { ok: true, month: month(), population: value('[data-testid="population"]') };
}

/** Prepare corrupt localStorage before reloading, then run verifyCorruptSaveCheck(). */
export function prepareCorruptSaveCheck() {
  localStorage.setItem(SAVE_KEY, CORRUPT_SAVE);
  return { raw: CORRUPT_SAVE, reloadRequired: true };
}

/** Call after prepareCorruptSaveCheck() and a page reload to verify ERR-1 through the UI. */
export function verifyCorruptSaveCheck(expected = CORRUPT_SAVE) {
  const expectedRaw = typeof expected === 'string' ? expected : expected?.raw;
  if (expectedRaw !== CORRUPT_SAVE) throw new Error('ERR-1: передана неверная контрольная повреждённая запись');
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) throw new Error('ERR-1: тест требует сохранённую повреждённую запись');
  const message = text('[data-testid="error"]');
  if (!/сохран|повреж|прочит|загруз/i.test(message)) {
    throw new Error(`ERR-1: непонятное сообщение о повреждённом сохранении: ${message}`);
  }
  if (raw !== expectedRaw) {
    throw new Error('ERR-1: приложение автоматически перезаписало повреждённое сохранение');
  }
  return { ok: true, error: message, raw };
}
