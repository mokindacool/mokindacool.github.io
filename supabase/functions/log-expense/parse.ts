// Mirrors CATEGORIES in dashboard.html.
export const CATEGORIES = ['rent', 'utilities', 'food', 'fun', 'subscriptions', 'other'];

const ALIASES: Record<string, string> = {
  sub: 'subscriptions',
  subs: 'subscriptions',
  subscription: 'subscriptions',
  util: 'utilities',
  utils: 'utilities',
  utility: 'utilities',
};

export const USAGE = 'Format: name amount [category], e.g. "chipotle 14.50 food"';

export type ParsedExpense = { name: string; amount: number; category: string };

// Parses "<name> <amount> [category]". The amount is the first number-like token;
// the category is the last remaining token if it's known, otherwise "other".
export function parseExpense(text: string): ParsedExpense | { error: string } {
  const tokens = (text || '').trim().split(/\s+/).filter(Boolean);

  const amountIdx = tokens.findIndex(t => /^\$?\d+(\.\d{1,2})?$/.test(t));
  if (amountIdx === -1) return { error: 'No amount found. ' + USAGE };
  const amount = Number(tokens[amountIdx].replace('$', ''));
  if (!(amount > 0)) return { error: 'Amount must be more than 0. ' + USAGE };
  tokens.splice(amountIdx, 1);

  let category = 'other';
  const last = tokens[tokens.length - 1]?.toLowerCase();
  if (last && (CATEGORIES.includes(last) || last in ALIASES)) {
    category = ALIASES[last] ?? last;
    tokens.pop();
  }

  const name = tokens.join(' ');
  if (!name) return { error: 'No name found. ' + USAGE };

  return { name, amount, category };
}
