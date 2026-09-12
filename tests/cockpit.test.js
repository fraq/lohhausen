import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import cockpit from '../src/locales/cockpit.js';

test('cockpit: содержит переводы en, de, fr для всех ключей из review-i18n-missing.json', () => {
  const missingList = JSON.parse(fs.readFileSync('docs/review-i18n-missing.json', 'utf8'));

  assert.ok(cockpit.en, 'cockpit.en must exist');
  assert.ok(cockpit.de, 'cockpit.de must exist');
  assert.ok(cockpit.fr, 'cockpit.fr must exist');

  for (const key of missingList) {
    assert.ok(typeof cockpit.en[key] === 'string' && cockpit.en[key].length > 0, `Missing EN for: ${key}`);
    assert.ok(typeof cockpit.de[key] === 'string' && cockpit.de[key].length > 0, `Missing DE for: ${key}`);
    assert.ok(typeof cockpit.fr[key] === 'string' && cockpit.fr[key].length > 0, `Missing FR for: ${key}`);

    const expectedPlaceholders = [...key.matchAll(/\{n\d\}/g)].map(m => m[0]).sort();
    for (const [lang, dict] of [['en', cockpit.en], ['de', cockpit.de], ['fr', cockpit.fr]]) {
      const actualPlaceholders = [...dict[key].matchAll(/\{n\d\}/g)].map(m => m[0]).sort();
      assert.deepEqual(actualPlaceholders, expectedPlaceholders, `Placeholder mismatch in ${lang} for "${key}"`);
    }
  }
});

test('cockpit: содержит переводы en, de, fr для всех ключей из review-i18n-dynamic.json', () => {
  const dynamicList = JSON.parse(fs.readFileSync('docs/review-i18n-dynamic.json', 'utf8'));

  for (const key of dynamicList) {
    assert.ok(typeof cockpit.en[key] === 'string' && cockpit.en[key].length > 0, `Missing dynamic EN for: ${key}`);
    assert.ok(typeof cockpit.de[key] === 'string' && cockpit.de[key].length > 0, `Missing dynamic DE for: ${key}`);
    assert.ok(typeof cockpit.fr[key] === 'string' && cockpit.fr[key].length > 0, `Missing dynamic FR for: ${key}`);

    const expectedPlaceholders = [...key.matchAll(/\{n\d\}/g)].map(m => m[0]).sort();
    for (const [lang, dict] of [['en', cockpit.en], ['de', cockpit.de], ['fr', cockpit.fr]]) {
      const actualPlaceholders = [...dict[key].matchAll(/\{n\d\}/g)].map(m => m[0]).sort();
      assert.deepEqual(actualPlaceholders, expectedPlaceholders, `Placeholder mismatch in dynamic ${lang} for "${key}"`);
    }
  }
});

test('cockpit: содержит переводы en, de, fr для всех ключей из review-i18n-advisors.json', () => {
  const advisorsList = JSON.parse(fs.readFileSync('docs/review-i18n-advisors.json', 'utf8'));

  for (const key of advisorsList) {
    assert.ok(typeof cockpit.en[key] === 'string' && cockpit.en[key].length > 0, `Missing advisor EN for: ${key}`);
    assert.ok(typeof cockpit.de[key] === 'string' && cockpit.de[key].length > 0, `Missing advisor DE for: ${key}`);
    assert.ok(typeof cockpit.fr[key] === 'string' && cockpit.fr[key].length > 0, `Missing advisor FR for: ${key}`);

    const expectedPlaceholders = [...key.matchAll(/\{n\d+\}/g)].map(m => m[0]).sort();
    for (const [lang, dict] of [['en', cockpit.en], ['de', cockpit.de], ['fr', cockpit.fr]]) {
      const actualPlaceholders = [...dict[key].matchAll(/\{n\d+\}/g)].map(m => m[0]).sort();
      assert.deepEqual(actualPlaceholders, expectedPlaceholders, `Placeholder mismatch in advisor ${lang} for "${key}"`);
    }
  }
});

test('cockpit: часовая фабрика и продукция переводятся как watch factory/watch production, а не hours', () => {
  const factoryKey = 'Муниципальная часовая фабрика — основа городской экономики.';
  assert.match(cockpit.en[factoryKey], /watch factory/i);
  assert.doesNotMatch(cockpit.en[factoryKey], /hours/i);

  const watchesDemandKey = 'Следите за балансом между объемом выпуска и внешним спросом на часы.';
  assert.match(cockpit.en[watchesDemandKey], /watch/i);
  assert.doesNotMatch(cockpit.en[watchesDemandKey], /hours/i);

  const salesMarketingKey = '⚡ Расходы на сбыт: {n0} тыс. м./мес. Расширяет спрос на ~{n1} часов/мес.';
  assert.match(cockpit.en[salesMarketingKey], /watches\/mo/i);
  assert.doesNotMatch(cockpit.en[salesMarketingKey], /hours/i);
});


test('cockpit: аутентичная терминология системной динамики и когнитивных ловушек Дёрнера', () => {
  const balanceKey = 'БАЛАНС СИСТЕМЫ';
  assert.equal(cockpit.en[balanceKey], 'SYSTEM BALANCE');
  assert.equal(cockpit.de[balanceKey], 'SYSTEMGLEICHGEWICHT');
  assert.equal(cockpit.fr[balanceKey], 'ÉQUILIBRE DU SYSTÈME');

  const urgentModernKey = 'Критически необходимо! Станки изношены до {n0}%. Модернизация добавит {n1} пунктов оборудования (до ~{n2}%) и повысит уровень производительности. Срок — {n3} месяцев.';
  assert.match(cockpit.en[urgentModernKey], /equipment condition points/i);
  assert.match(cockpit.de[urgentModernKey], /Punkte Maschinenzustand/i);
  assert.doesNotMatch(cockpit.en[urgentModernKey], /add \{n1\} machines/i);
  assert.doesNotMatch(cockpit.de[urgentModernKey], /bringt \{n1\} Maschinen/i);

  assert.equal(cockpit.en['Кумулятивный крах'], 'Cumulative collapse');
  assert.equal(cockpit.de['Кумулятивный крах'], 'Kumulativer Zusammenbruch');
  assert.equal(cockpit.fr['Кумулятивный крах'], 'Effondrement cumulatif');

  assert.equal(cockpit.en['Профиль города'], 'City Profile');
  assert.equal(cockpit.de['Профиль города'], 'Stadtsystemprofil');
  assert.equal(cockpit.fr['Профиль города'], 'Profil de la ville');

  assert.equal(cockpit.en['Критический порог'], 'Critical threshold');
  assert.equal(cockpit.de['Критический порог'], 'Kritische Schwelle');
  assert.equal(cockpit.fr['Критический порог'], 'Seuil critique');

  assert.equal(cockpit.en['Инерция системы'], 'System Inertia');
  assert.equal(cockpit.de['Инерция системы'], 'Systemträgheit');
  assert.equal(cockpit.fr['Инерция системы'], 'Inertie du système');
  assert.match(cockpit.de['Эффект от этих мер проявится только после завершения задержки. Не спешите менять налоги или запускать дублирующие стройки: по Дёрнеру, преждевременные вмешательства вызывают системную раскачку.'], /Systemaufschaukelung/);
});

test('cockpit: кнопки действий в hero-card сбалансированы по высоте и не растягиваются асимметрично', () => {
  const css = fs.readFileSync('public/styles.css', 'utf8');
  assert.match(css, /\.cockpit-actions\s*\{[^}]*align-items:\s*center/);
  assert.match(css, /\.cockpit-actions\s*\.button\s*\{[^}]*margin:\s*0/);
  assert.doesNotMatch(css, /\.hero-guide\s*\{[^}]*margin-top:\s*8px/);
});

test('cockpit: кнопка «Новая игра» размещена заметно в сайдбаре и шапке с четкими стилями', () => {
  const appHtml = fs.readFileSync('src/app.js', 'utf8');
  assert.match(appHtml, /class="button sidebar-new-game"\s+data-action="new-game"/);
  assert.match(appHtml, /class="button secondary header-new-game"\s+data-action="new-game"/);

  const css = fs.readFileSync('public/styles.css', 'utf8');
  assert.match(css, /\.sidebar-new-game\s*\{[^}]*font-weight:\s*700/);
  assert.match(css, /\.sidebar-new-game\s*\{[^}]*border:/);
  assert.match(css, /\.header-new-game\s*\{[^}]*min-height:/);
});


