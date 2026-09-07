import en from './locales/en.js';
import de from './locales/de.js';
import fr from './locales/fr.js';
import extra from './locales/extra.js';

export const supportedLanguages = ['ru', 'en', 'de', 'fr'];
const dictionaries = { en: { ...en, ...extra.en }, de: { ...de, ...extra.de }, fr: { ...fr, ...extra.fr } };
const validLanguage = language => supportedLanguages.includes(language) ? language : 'ru';
const normalize = text => String(text).replace(/\s+/g, ' ').trim();
const numberPattern = '[+\\-−]?\\d+(?:[.,\\u00a0\\u202f ]\\d+)*';
const escapeRegex = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cache = new Map();
const fragments = new Map();

export function languageFrom(search, stored = 'ru') {
  const requested = new URLSearchParams(search).get('lang');
  return supportedLanguages.includes(requested) ? requested : validLanguage(stored);
}

export function localizedPath(path, language = 'ru') {
  const url = new URL(path, 'http://localhost');
  url.searchParams.set('lang', validLanguage(language));
  return `${url.pathname}${url.search}${url.hash}`;
}

function interpolate(template, numbers) {
  return template.replace(/\{n(\d+)\}/g, (_, index) => numbers[Number(index)] ?? '');
}

function fragmentPatterns(language) {
  if (!fragments.has(language)) {
    const patterns = Object.entries(dictionaries[language]).sort(([a], [b]) => b.length - a.length).map(([key, value]) => {
      const parts = key.split(/(\{n\d+\})/g);
      const names = [];
      const source = parts.map(part => {
        const match = part.match(/^\{n(\d+)\}$/);
        if (!match) return escapeRegex(part);
        names.push(Number(match[1]));
        return `(${numberPattern})`;
      }).join('');
      return { regex: new RegExp(`(?<![\\p{L}\\p{N}])${source}(?![\\p{L}\\p{N}])`, 'gu'), value, names };
    });
    fragments.set(language, patterns);
  }
  return fragments.get(language);
}

export function translate(text, language = 'ru') {
  if (validLanguage(language) === 'ru' || !/[А-Яа-яЁё]/.test(text)) return text;
  const source = normalize(text);
  const cacheKey = `${language}:${source}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  const numbers = [];
  const key = source.replace(new RegExp(numberPattern, 'g'), value => `{n${numbers.push(value) - 1}}`);
  const dictionary = dictionaries[language];
  let translated = Object.hasOwn(dictionary, source) ? dictionary[source] : Object.hasOwn(dictionary, key) ? interpolate(dictionary[key], numbers) : source;
  if (translated === source) {
    // Compose known message fragments, for example a translated error inside an alert.
    for (const { regex, value, names } of fragmentPatterns(language)) {
      translated = translated.replace(regex, (...args) => {
        const captures = [];
        names.forEach((name, index) => { captures[name] = args[index + 1]; });
        return interpolate(value, captures);
      });
    }
  }
  if (cache.size > 5000) cache.clear();
  cache.set(cacheKey, translated);
  return translated;
}

export function localizeDocument(root, language) {
  if (language === 'ru') return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement?.closest('[translate="no"], script, style, textarea')) continue;
    if (!/[А-Яа-яЁё]/.test(node.textContent)) continue;
    const original = node.textContent;
    node.textContent = `${original.match(/^\s*/)[0]}${translate(original.trim(), language)}${original.match(/\s*$/)[0]}`;
  }
  for (const element of root.querySelectorAll('[aria-label], [title], [placeholder]')) {
    if (element.closest('[translate="no"]')) continue;
    for (const attribute of ['aria-label', 'title', 'placeholder']) {
      const text = element.getAttribute(attribute);
      if (text) element.setAttribute(attribute, translate(text, language));
    }
  }
}

export function wikiFor(language) {
  if (language === 'ru') return { href: 'https://ru.wikipedia.org/wiki/Лоххаузен', title: 'Википедия об эксперименте' };
  if (language === 'de') return { href: 'https://de.wikipedia.org/wiki/Dietrich_D%C3%B6rner#Schriften_(Auswahl)', title: 'Википедия об авторе' };
  return { href: 'https://en.wikipedia.org/wiki/Dietrich_D%C3%B6rner#Books', title: language === 'fr' ? 'Википедия на английском' : 'Википедия об авторе' };
}
