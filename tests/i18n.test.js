import assert from 'node:assert/strict';
import test from 'node:test';

import {
  languageFrom,
  localizedPath,
  supportedLanguages,
  translate,
} from '../src/i18n.js';

test('AC-1: поддерживаются ru/en/de/fr и локализуется метка «Как играть»', () => {
  assert.deepEqual(supportedLanguages, ['ru', 'en', 'de', 'fr']);
  assert.deepEqual(
    supportedLanguages.map((language) => translate('Как играть', language)),
    ['Как играть', 'How to play', 'Spielanleitung', 'Comment jouer'],
  );
});

test('AC-2: шаблонная строка «Месяц 4» локализуется для всех поддержанных языков', () => {
  assert.deepEqual(
    supportedLanguages.map((language) => translate('Месяц 4', language)),
    ['Месяц 4', 'Month 4', 'Monat 4', 'Mois 4'],
  );
});

test('AC-3: lang из query имеет приоритет, а неизвестные query и stored откатываются', () => {
  assert.equal(languageFrom('?lang=en', 'de'), 'en');
  assert.equal(languageFrom('?lang=xx', 'de'), 'de');
  assert.equal(languageFrom('?lang=xx', 'xx'), 'ru');
  assert.equal(languageFrom('', 'fr'), 'fr');
});

test('AC-4: localizedPath сохраняет query/hash и всегда добавляет валидный lang', () => {
  assert.equal(
    localizedPath('/guide?foo=1#part', 'de'),
    '/guide?foo=1&lang=de#part',
  );
  assert.equal(localizedPath('/guide', 'ru'), '/guide?lang=ru');
});

test('EC-1: неизвестный язык использует ru, а неизвестный текст остается без изменений', () => {
  assert.equal(translate('Как играть', 'xx'), 'Как играть');
  assert.equal(translate('Пользовательский текст', 'en'), 'Пользовательский текст');
  assert.equal(localizedPath('/guide', 'xx'), '/guide?lang=ru');
});
