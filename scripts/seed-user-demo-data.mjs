/**
 * Seeds realistic demo vocabulary, practice sessions, and stats for a user.
 * Compatible with Node 16 (uses https module, no fetch).
 * Run: node scripts/seed-user-demo-data.mjs
 */

import https from 'https';

const SUPABASE_HOST = 'ajoppazfwadrmqfirhhn.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqb3BwYXpmd2Fkcm1xZmlyaGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAyODQ2OSwiZXhwIjoyMDgyNjA0NDY5fQ.-FjdL26z6Tpg2YsnV_3ek9bOY5kcVHhxQft6oS11zH8';
const USER_ID = 'eb397f53-d903-42ee-9634-d5fbe158afc0';

function req(method, path, body, prefer = 'return=minimal') {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: SUPABASE_HOST, port: 443,
      path: '/rest/v1' + path, method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + SERVICE_KEY,
        apikey: SERVICE_KEY,
        Prefer: prefer,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const r = https.request(opts, (res) => {
      let buf = '';
      res.on('data', (c) => { buf += c; });
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function daysAgo(n, h = 10) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(h, 0, 0, 0);
  return d.toISOString();
}

function dateFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

function dateAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// ─── Vocabulary ───────────────────────────────────────────────────────────────

const WORDS = [
  // HSK 1 — mastered (high easiness, long intervals, is_learned=true)
  { word_zh: '你好',   word_pinyin: 'nǐ hǎo',     word_en: 'hello',            example_sentence: '你好！很高兴认识你。',              hsk_level: 1, is_learned: true,  easiness_factor: 2.8, interval_days: 21, repetitions: 8, next_review_date: dateFromNow(14), correct_streak: 8, created_at: daysAgo(62) },
  { word_zh: '谢谢',   word_pinyin: 'xièxiè',      word_en: 'thank you',        example_sentence: '谢谢你的帮助！',                    hsk_level: 1, is_learned: true,  easiness_factor: 2.7, interval_days: 18, repetitions: 7, next_review_date: dateFromNow(11), correct_streak: 7, created_at: daysAgo(59) },
  { word_zh: '对不起', word_pinyin: 'duìbuqǐ',     word_en: 'sorry',            example_sentence: '对不起，我迟到了。',                  hsk_level: 1, is_learned: true,  easiness_factor: 2.6, interval_days: 15, repetitions: 6, next_review_date: dateFromNow(8),  correct_streak: 6, created_at: daysAgo(56) },
  { word_zh: '再见',   word_pinyin: 'zàijiàn',     word_en: 'goodbye',          example_sentence: '明天见！再见！',                    hsk_level: 1, is_learned: true,  easiness_factor: 2.9, interval_days: 25, repetitions: 9, next_review_date: dateFromNow(18), correct_streak: 9, created_at: daysAgo(53) },
  { word_zh: '中国',   word_pinyin: 'zhōngguó',    word_en: 'China',            example_sentence: '我想去中国旅行。',                   hsk_level: 1, is_learned: true,  easiness_factor: 2.7, interval_days: 20, repetitions: 7, next_review_date: dateFromNow(13), correct_streak: 7, created_at: daysAgo(50) },
  { word_zh: '学生',   word_pinyin: 'xuéshēng',    word_en: 'student',          example_sentence: '她是一名优秀的学生。',                hsk_level: 1, is_learned: true,  easiness_factor: 2.6, interval_days: 16, repetitions: 6, next_review_date: dateFromNow(9),  correct_streak: 6, created_at: daysAgo(48) },
  { word_zh: '老师',   word_pinyin: 'lǎoshī',      word_en: 'teacher',          example_sentence: '我的老师非常有耐心。',                hsk_level: 1, is_learned: true,  easiness_factor: 2.8, interval_days: 22, repetitions: 8, next_review_date: dateFromNow(15), correct_streak: 8, created_at: daysAgo(46) },
  { word_zh: '朋友',   word_pinyin: 'péngyǒu',     word_en: 'friend',           example_sentence: '他是我最好的朋友。',                  hsk_level: 1, is_learned: true,  easiness_factor: 2.7, interval_days: 19, repetitions: 7, next_review_date: dateFromNow(12), correct_streak: 7, created_at: daysAgo(44) },
  { word_zh: '家',     word_pinyin: 'jiā',          word_en: 'home; family',     example_sentence: '我的家在北京附近。',                  hsk_level: 1, is_learned: true,  easiness_factor: 2.9, interval_days: 26, repetitions: 9, next_review_date: dateFromNow(19), correct_streak: 9, created_at: daysAgo(42) },
  { word_zh: '水',     word_pinyin: 'shuǐ',        word_en: 'water',            example_sentence: '请给我一杯水。',                     hsk_level: 1, is_learned: true,  easiness_factor: 2.8, interval_days: 23, repetitions: 8, next_review_date: dateFromNow(16), correct_streak: 8, created_at: daysAgo(40) },
  { word_zh: '吃',     word_pinyin: 'chī',          word_en: 'to eat',           example_sentence: '我们去吃饭吧。',                     hsk_level: 1, is_learned: true,  easiness_factor: 2.6, interval_days: 17, repetitions: 7, next_review_date: dateFromNow(10), correct_streak: 7, created_at: daysAgo(38) },
  { word_zh: '喝',     word_pinyin: 'hē',           word_en: 'to drink',         example_sentence: '他每天早上喝咖啡。',                  hsk_level: 1, is_learned: true,  easiness_factor: 2.7, interval_days: 20, repetitions: 7, next_review_date: dateFromNow(14), correct_streak: 7, created_at: daysAgo(36) },

  // HSK 2 — mastered
  { word_zh: '时候',   word_pinyin: 'shíhou',      word_en: 'time; moment',     example_sentence: '你什么时候有空？',                   hsk_level: 2, is_learned: true,  easiness_factor: 2.5, interval_days: 12, repetitions: 5, next_review_date: dateFromNow(5),  correct_streak: 5, created_at: daysAgo(34) },
  { word_zh: '身体',   word_pinyin: 'shēntǐ',      word_en: 'body; health',     example_sentence: '锻炼对身体很有好处。',                hsk_level: 2, is_learned: true,  easiness_factor: 2.6, interval_days: 14, repetitions: 6, next_review_date: dateFromNow(7),  correct_streak: 6, created_at: daysAgo(32) },
  { word_zh: '觉得',   word_pinyin: 'juéde',       word_en: 'to feel; to think', example_sentence: '我觉得这道菜很好吃。',               hsk_level: 2, is_learned: true,  easiness_factor: 2.5, interval_days: 11, repetitions: 5, next_review_date: dateFromNow(4),  correct_streak: 5, created_at: daysAgo(30) },
  { word_zh: '知道',   word_pinyin: 'zhīdào',      word_en: 'to know',          example_sentence: '我不知道他去哪里了。',                hsk_level: 2, is_learned: true,  easiness_factor: 2.7, interval_days: 16, repetitions: 6, next_review_date: dateFromNow(10), correct_streak: 6, created_at: daysAgo(28) },
  { word_zh: '准备',   word_pinyin: 'zhǔnbèi',     word_en: 'to prepare; ready', example_sentence: '我们要好好准备这次考试。',            hsk_level: 2, is_learned: true,  easiness_factor: 2.5, interval_days: 13, repetitions: 5, next_review_date: dateFromNow(6),  correct_streak: 5, created_at: daysAgo(26) },
  { word_zh: '帮助',   word_pinyin: 'bāngzhù',     word_en: 'to help; help',    example_sentence: '谢谢你帮助我解决问题。',              hsk_level: 2, is_learned: true,  easiness_factor: 2.6, interval_days: 15, repetitions: 6, next_review_date: dateFromNow(8),  correct_streak: 6, created_at: daysAgo(24) },
  { word_zh: '明白',   word_pinyin: 'míngbai',     word_en: 'to understand',    example_sentence: '我明白你的意思了。',                  hsk_level: 2, is_learned: true,  easiness_factor: 2.5, interval_days: 12, repetitions: 5, next_review_date: dateFromNow(5),  correct_streak: 5, created_at: daysAgo(22) },

  // HSK 3 — actively learning (short intervals, due soon)
  { word_zh: '环境',   word_pinyin: 'huánjìng',    word_en: 'environment',      example_sentence: '保护环境是每个人的责任。',            hsk_level: 3, is_learned: false, easiness_factor: 2.3, interval_days: 4,  repetitions: 3, next_review_date: dateFromNow(2),  correct_streak: 3, created_at: daysAgo(15) },
  { word_zh: '经验',   word_pinyin: 'jīngyàn',     word_en: 'experience',       example_sentence: '他有丰富的工作经验。',                hsk_level: 3, is_learned: false, easiness_factor: 2.2, interval_days: 3,  repetitions: 2, next_review_date: dateFromNow(1),  correct_streak: 2, created_at: daysAgo(13) },
  { word_zh: '解决',   word_pinyin: 'jiějué',      word_en: 'to solve; resolve', example_sentence: '我们必须解决这个问题。',             hsk_level: 3, is_learned: false, easiness_factor: 2.4, interval_days: 5,  repetitions: 3, next_review_date: dateFromNow(3),  correct_streak: 3, created_at: daysAgo(11) },
  { word_zh: '发展',   word_pinyin: 'fāzhǎn',      word_en: 'development',      example_sentence: '城市发展越来越快。',                  hsk_level: 3, is_learned: false, easiness_factor: 2.2, interval_days: 2,  repetitions: 2, next_review_date: dateAgo(1),      correct_streak: 2, created_at: daysAgo(10) },
  { word_zh: '影响',   word_pinyin: 'yǐngxiǎng',   word_en: 'influence; affect', example_sentence: '天气对心情有很大影响。',            hsk_level: 3, is_learned: false, easiness_factor: 2.3, interval_days: 3,  repetitions: 2, next_review_date: dateAgo(0),      correct_streak: 2, created_at: daysAgo(9)  },
  { word_zh: '感谢',   word_pinyin: 'gǎnxiè',      word_en: 'to be grateful',   example_sentence: '我非常感谢你的支持。',                hsk_level: 3, is_learned: false, easiness_factor: 2.4, interval_days: 4,  repetitions: 3, next_review_date: dateFromNow(1),  correct_streak: 3, created_at: daysAgo(8)  },
  { word_zh: '成功',   word_pinyin: 'chénggōng',   word_en: 'to succeed; success', example_sentence: '努力是成功的关键。',             hsk_level: 3, is_learned: false, easiness_factor: 2.2, interval_days: 1,  repetitions: 1, next_review_date: dateAgo(0),      correct_streak: 1, created_at: daysAgo(7)  },
  { word_zh: '社会',   word_pinyin: 'shèhuì',      word_en: 'society',          example_sentence: '我们每个人都是社会的一员。',          hsk_level: 3, is_learned: false, easiness_factor: 2.1, interval_days: 1,  repetitions: 1, next_review_date: dateAgo(0),      correct_streak: 1, created_at: daysAgo(6)  },

  // HSK 4 — brand new (just added, not yet reviewed)
  { word_zh: '传统',   word_pinyin: 'chuántǒng',   word_en: 'tradition; traditional', example_sentence: '春节是中国最重要的传统节日。', hsk_level: 4, is_learned: false, easiness_factor: 2.5, interval_days: 0, repetitions: 0, next_review_date: dateAgo(0), correct_streak: 0, created_at: daysAgo(5) },
  { word_zh: '文化',   word_pinyin: 'wénhuà',      word_en: 'culture',          example_sentence: '中国文化历史悠久。',                  hsk_level: 4, is_learned: false, easiness_factor: 2.5, interval_days: 0, repetitions: 0, next_review_date: dateAgo(0), correct_streak: 0, created_at: daysAgo(5) },
  { word_zh: '政府',   word_pinyin: 'zhèngfǔ',     word_en: 'government',       example_sentence: '政府正在制定新的经济政策。',          hsk_level: 4, is_learned: false, easiness_factor: 2.5, interval_days: 0, repetitions: 0, next_review_date: dateAgo(0), correct_streak: 0, created_at: daysAgo(4) },
  { word_zh: '经济',   word_pinyin: 'jīngjì',      word_en: 'economy; economics', example_sentence: '全球经济正在逐步恢复。',           hsk_level: 4, is_learned: false, easiness_factor: 2.5, interval_days: 0, repetitions: 0, next_review_date: dateAgo(0), correct_streak: 0, created_at: daysAgo(4) },
  { word_zh: '技术',   word_pinyin: 'jìshù',       word_en: 'technology',       example_sentence: '现代技术改变了我们的生活。',          hsk_level: 4, is_learned: false, easiness_factor: 2.5, interval_days: 0, repetitions: 0, next_review_date: dateAgo(0), correct_streak: 0, created_at: daysAgo(3) },
  { word_zh: '教育',   word_pinyin: 'jiàoyù',      word_en: 'education',        example_sentence: '教育是国家发展的基础。',              hsk_level: 4, is_learned: false, easiness_factor: 2.5, interval_days: 0, repetitions: 0, next_review_date: dateAgo(0), correct_streak: 0, created_at: daysAgo(3) },
  { word_zh: '科学',   word_pinyin: 'kēxué',       word_en: 'science',          example_sentence: '科学的发展推动了社会进步。',          hsk_level: 4, is_learned: false, easiness_factor: 2.5, interval_days: 0, repetitions: 0, next_review_date: dateAgo(0), correct_streak: 0, created_at: daysAgo(2) },
  { word_zh: '历史',   word_pinyin: 'lìshǐ',       word_en: 'history',          example_sentence: '学习历史帮助我们了解现在。',          hsk_level: 4, is_learned: false, easiness_factor: 2.5, interval_days: 0, repetitions: 0, next_review_date: dateAgo(0), correct_streak: 0, created_at: daysAgo(2) },
  { word_zh: '自然',   word_pinyin: 'zìrán',       word_en: 'nature; natural',  example_sentence: '我们应该爱护大自然。',                hsk_level: 4, is_learned: false, easiness_factor: 2.5, interval_days: 0, repetitions: 0, next_review_date: dateAgo(0), correct_streak: 0, created_at: daysAgo(1) },
  { word_zh: '机器',   word_pinyin: 'jīqì',        word_en: 'machine',          example_sentence: '这台机器需要定期维修。',              hsk_level: 4, is_learned: false, easiness_factor: 2.5, interval_days: 0, repetitions: 0, next_review_date: dateAgo(0), correct_streak: 0, created_at: daysAgo(1) },
];

// ─── Practice sessions — 15 consecutive days ──────────────────────────────────
const PRACTICE_SESSIONS = Array.from({ length: 15 }, (_, i) => ({
  user_id: USER_ID,
  words_practiced: 8 + ((i * 3) % 12),
  words_known: 5 + ((i * 2) % 8),
  duration_seconds: 240 + (i * 30),
  created_at: daysAgo(14 - i, 9 + (i % 3)),
}));

async function assert(res, label) {
  if (res.status >= 300) throw new Error(`${label} failed ${res.status}: ${res.body}`);
  console.log(`  ✅ ${label}`);
}

async function main() {
  console.log('🌱 Seeding demo data for user', USER_ID, '\n');

  // 1. Vocabulary items (upsert, ignore duplicates by word_zh per user)
  console.log(`📚 Inserting ${WORDS.length} vocabulary items…`);
  const vocabPayload = WORDS.map((w) => ({ ...w, user_id: USER_ID }));
  const v = await req('POST', '/vocabulary_items', vocabPayload, 'resolution=ignore-duplicates,return=minimal');
  await assert(v, `${WORDS.length} words`);

  // 2. Practice sessions
  console.log(`\n🏋️  Inserting ${PRACTICE_SESSIONS.length} practice sessions…`);
  const ps = await req('POST', '/practice_sessions', PRACTICE_SESSIONS, 'resolution=ignore-duplicates,return=minimal');
  await assert(ps, `${PRACTICE_SESSIONS.length} sessions`);

  // 3. Upsert user_stats
  console.log('\n📊 Upserting user_stats…');
  const today = new Date().toISOString().split('T')[0];
  const st = await req('POST', '/user_stats', {
    id: USER_ID,
    current_streak: 15,
    longest_streak: 15,
    last_practice_date: today,
    total_practice_sessions: PRACTICE_SESSIONS.length,
  }, 'resolution=merge-duplicates,return=minimal');
  await assert(st, 'user_stats');

  // 4. Profile display name
  console.log('\n👤 Updating profile…');
  const pr = await req('PATCH', `/profiles?id=eq.${USER_ID}`, { display_name: 'Trung Lê' });
  await assert(pr, 'display_name → Trung Lê');

  const mastered = WORDS.filter(w => w.is_learned).length;
  const learning = WORDS.filter(w => !w.is_learned).length;
  const hsk = [1, 2, 3, 4].map(l => `HSK${l}:${WORDS.filter(w => w.hsk_level === l).length}`).join('  ');

  console.log(`
🎉 Done!
   ${mastered} mastered  |  ${learning} learning
   ${hsk}
   15-day streak  |  ${PRACTICE_SESSIONS.length} practice sessions
`);
}

main().catch((err) => { console.error('❌', err.message); process.exit(1); });
