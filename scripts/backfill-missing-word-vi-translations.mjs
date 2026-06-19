/**
 * Backfills word_vi for course_vocabulary_items rows that have word_vi=null.
 * Fetches English meanings, translates in batches via Groq, then PATCHes each row.
 *
 * Usage:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... GROQ_API_KEY=... \
 *   node scripts/backfill-missing-word-vi-translations.mjs [courseId1] [courseId2] ...
 */

import https from 'https';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SUPABASE_HOST = new URL(SUPABASE_URL).hostname;
const MODEL = 'deepseek/deepseek-chat';
const BATCH_SIZE = 20;

const courseIds = process.argv.slice(2);
if (!courseIds.length) {
  console.error('Usage: node scripts/backfill-missing-word-vi-translations.mjs <courseId> [courseId...]');
  process.exit(1);
}

function req(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = https.request({
      hostname: SUPABASE_HOST, port: 443,
      path: `/rest/v1${path}`, method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        Prefer: 'return=minimal',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function llmRequest(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });
    const r = https.request({
      hostname: 'openrouter.ai', port: 443,
      path: '/api/v1/chat/completions', method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => resolve(JSON.parse(buf)));
    });
    r.on('error', reject);
    r.write(body);
    r.end();
  });
}

async function groqTranslateBatch(words) {
  const list = words.map((w, i) => `${i + 1}. ${w.word_en} (${w.word_zh})`).join('\n');
  const prompt = `Translate these Chinese vocabulary words into Vietnamese. Return ONLY a JSON array of strings in the same order, one Vietnamese meaning per entry. Be concise — 1-4 words per translation.\n\n${list}`;

  while (true) {
    const json = await llmRequest(prompt);
    if (json.error) {
      const retryMatch = json.error?.message?.match(/try again in (\d+)m([\d.]+)s/);
      if (retryMatch) {
        const waitMs = (parseInt(retryMatch[1]) * 60 + parseFloat(retryMatch[2])) * 1000 + 5000;
        console.log(`  Rate limited — waiting ${Math.ceil(waitMs / 1000)}s…`);
        await sleep(waitMs);
        continue;
      }
      throw new Error(`Groq error: ${JSON.stringify(json.error)}`);
    }
    const text = json.choices?.[0]?.message?.content || '';
    const match = text.match(/\[[\s\S]*?\]/);
    if (!match) throw new Error(`No JSON array in response: ${text.slice(0, 200)}`);
    return JSON.parse(match[0]);
  }
}

async function backfillCourse(courseId) {
  const res = await req('GET', `/course_vocabulary_items?select=id,word_zh,word_en&course_id=eq.${courseId}&word_vi=is.null&limit=1000`);
  if (res.status >= 300) throw new Error(`Fetch failed: ${res.body}`);
  const words = JSON.parse(res.body.replace(/\n/g, ''));
  if (!words.length) { console.log(`  No missing translations.`); return; }
  console.log(`  ${words.length} words to translate…`);

  for (let i = 0; i < words.length; i += BATCH_SIZE) {
    const batch = words.slice(i, i + BATCH_SIZE);
    const translations = await groqTranslateBatch(batch);
    for (let j = 0; j < batch.length; j++) {
      const word_vi = translations[j] || null;
      if (!word_vi) continue;
      const upd = await req('PATCH', `/course_vocabulary_items?id=eq.${batch[j].id}`, { word_vi });
      if (upd.status >= 300) console.warn(`  Patch failed for ${batch[j].word_zh}: ${upd.body}`);
    }
    console.log(`  Translated ${Math.min(i + BATCH_SIZE, words.length)}/${words.length}`);
  }
}

(async () => {
  for (const courseId of courseIds) {
    console.log(`\nBackfilling course ${courseId}…`);
    await backfillCourse(courseId);
  }
  console.log('\nDone.');
})().catch((e) => { console.error(e); process.exit(1); });
