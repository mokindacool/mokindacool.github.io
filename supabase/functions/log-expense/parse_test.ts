import { parseExpense } from './parse.ts';

function assertEquals(actual: unknown, expected: unknown) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

Deno.test('name, amount, category', () => {
  assertEquals(parseExpense('chipotle 14.50 food'), { name: 'chipotle', amount: 14.5, category: 'food' });
});

Deno.test('multi-word name, dollar sign, uppercase category', () => {
  assertEquals(parseExpense('trader joes $45.20 FOOD'), { name: 'trader joes', amount: 45.2, category: 'food' });
});

Deno.test('category alias', () => {
  assertEquals(parseExpense('netflix 15.49 subs'), { name: 'netflix', amount: 15.49, category: 'subscriptions' });
});

Deno.test('missing category defaults to other', () => {
  assertEquals(parseExpense('gas 40'), { name: 'gas', amount: 40, category: 'other' });
});

Deno.test('unknown trailing word stays in the name', () => {
  assertEquals(parseExpense('uber 22 airport'), { name: 'uber airport', amount: 22, category: 'other' });
});

Deno.test('missing amount is an error', () => {
  const r = parseExpense('coffee');
  if (!('error' in r)) throw new Error('expected error');
});

Deno.test('missing name is an error', () => {
  const r = parseExpense('14.50 food');
  if (!('error' in r)) throw new Error('expected error');
});

Deno.test('zero amount is an error', () => {
  const r = parseExpense('coffee 0 food');
  if (!('error' in r)) throw new Error('expected error');
});
