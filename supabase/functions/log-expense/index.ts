// Receives expenses from the iOS Shortcut and queues them in expense_inbox.
// The dashboard merges the inbox into its expenses on sync.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { parseExpense } from './parse.ts';

const LOG_TOKEN = Deno.env.get('LOG_TOKEN') ?? '';
const OWNER_USER_ID = Deno.env.get('OWNER_USER_ID') ?? '';
const SECRET_KEY = Deno.env.get('SB_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const sb = createClient(Deno.env.get('SUPABASE_URL')!, SECRET_KEY, { auth: { persistSession: false } });

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

function safeEqual(a: string, b: string) {
  if (!a || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// "2026-10-21", "14:05" -> "Oct 21, 2:05 PM"
function prettyWhen(date: string, time: string | null) {
  const [, m, d] = date.split('-').map(Number);
  let out = `${MONTHS[m - 1]} ${d}`;
  if (time) {
    const [h, min] = time.split(':').map(Number);
    out += `, ${h % 12 || 12}:${String(min).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return text('Use POST.', 405);
  if (!LOG_TOKEN || !safeEqual(req.headers.get('x-log-token') ?? '', LOG_TOKEN)) return text('Unauthorized.', 401);

  let body: { text?: string; date?: string; time?: string };
  try { body = await req.json(); } catch { return text('Body must be JSON: {"text": "chipotle 14.50 food"}', 400); }

  const parsed = parseExpense(body.text ?? '');
  if ('error' in parsed) return text(parsed.error, 400);

  // The Shortcut sends the phone's local date/time; fall back to server time (UTC) if missing.
  const now = new Date().toISOString();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(body.date ?? '') ? body.date! : now.slice(0, 10);
  const time = /^\d{2}:\d{2}$/.test(body.time ?? '') ? body.time! : now.slice(11, 16);

  const { error } = await sb.from('expense_inbox').insert({ user_id: OWNER_USER_ID, ...parsed, date, time });
  if (error) {
    console.error(error);
    return text('Could not save: ' + error.message, 500);
  }

  return text(`Logged ${parsed.name} – $${parsed.amount.toFixed(2)} (${parsed.category}) · ${prettyWhen(date, time)}`);
});
