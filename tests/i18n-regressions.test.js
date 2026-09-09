import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/i18n.js';

test('dynamic preview text remains translated when its decorative icon is a separate node', () => {
  const text = 'Точка компенсации текущего износа — около 19.2 тыс. м./мес.; фактический износ меняется вместе с выпуском.';
  for (const language of ['en', 'de', 'fr']) {
    const plain = translate(text, language);
    assert.doesNotMatch(plain, /[А-Яа-яЁё]/);
    assert.ok(plain.includes('19.2'));
    assert.equal(translate(`🔄 ${text}`, language), `🔄 ${plain}`);
  }
});

test('cash-funded deficits in the monthly digest translate in all interface languages', () => {
  const text = 'Дефицит в 29 тыс. марок полностью покрыт из свободной казны (осталось 523 тыс. м.).';
  for (const language of ['en', 'de', 'fr']) {
    const result = translate(text, language);
    assert.doesNotMatch(result, /[А-Яа-яЁё]/);
    assert.ok(result.includes('29') && result.includes('523'));
  }
});
