/**
 * Seeds HSK 1-6 public courses + vocabulary words into vocabulary_courses
 * and course_vocabulary_items tables in production Supabase.
 * Run: node scripts/seed-public-courses.mjs
 */

import https from 'https';

const SUPABASE_HOST = 'ajoppazfwadrmqfirhhn.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFqb3BwYXpmd2Fkcm1xZmlyaGhuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NzAyODQ2OSwiZXhwIjoyMDgyNjA0NDY5fQ.-FjdL26z6Tpg2YsnV_3ek9bOY5kcVHhxQft6oS11zH8';

function req(method, path, body, prefer = 'return=representation') {
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

// ─── Course definitions ───────────────────────────────────────────────────────

const COURSES = [
  {
    name: 'HSK 1 — Absolute Beginner',
    description: 'Master 150 essential words for daily greetings, numbers, family, and basic needs. The perfect starting point for Mandarin learners.',
    difficulty_level: 1,
    words: [
      { word_zh: '你', word_pinyin: 'nǐ', word_en: 'you', example_sentence: '你好吗？' },
      { word_zh: '好', word_pinyin: 'hǎo', word_en: 'good; well', example_sentence: '今天天气很好。' },
      { word_zh: '我', word_pinyin: 'wǒ', word_en: 'I; me', example_sentence: '我是学生。' },
      { word_zh: '是', word_pinyin: 'shì', word_en: 'to be; am/is/are', example_sentence: '他是老师。' },
      { word_zh: '不', word_pinyin: 'bù', word_en: 'not; no', example_sentence: '我不喜欢喝酒。' },
      { word_zh: '的', word_pinyin: 'de', word_en: 'possessive particle', example_sentence: '这是我的书。' },
      { word_zh: '他', word_pinyin: 'tā', word_en: 'he; him', example_sentence: '他是我的朋友。' },
      { word_zh: '她', word_pinyin: 'tā', word_en: 'she; her', example_sentence: '她很漂亮。' },
      { word_zh: '在', word_pinyin: 'zài', word_en: 'at; in; on', example_sentence: '他在图书馆学习。' },
      { word_zh: '人', word_pinyin: 'rén', word_en: 'person; people', example_sentence: '这里有很多人。' },
      { word_zh: '大', word_pinyin: 'dà', word_en: 'big; large', example_sentence: '这个城市很大。' },
      { word_zh: '这', word_pinyin: 'zhè', word_en: 'this', example_sentence: '这是什么？' },
      { word_zh: '学', word_pinyin: 'xué', word_en: 'to study; to learn', example_sentence: '我在学中文。' },
      { word_zh: '什么', word_pinyin: 'shénme', word_en: 'what', example_sentence: '你叫什么名字？' },
      { word_zh: '一', word_pinyin: 'yī', word_en: 'one', example_sentence: '我有一个姐姐。' },
      { word_zh: '来', word_pinyin: 'lái', word_en: 'to come', example_sentence: '他明天来这里。' },
      { word_zh: '上', word_pinyin: 'shàng', word_en: 'up; above; on', example_sentence: '书在桌子上。' },
      { word_zh: '国', word_pinyin: 'guó', word_en: 'country; nation', example_sentence: '中国是一个大国。' },
      { word_zh: '到', word_pinyin: 'dào', word_en: 'to arrive; to reach', example_sentence: '我到家了。' },
      { word_zh: '出', word_pinyin: 'chū', word_en: 'to go out; out', example_sentence: '请出去！' },
      { word_zh: '说', word_pinyin: 'shuō', word_en: 'to say; to speak', example_sentence: '他说中文说得很好。' },
      { word_zh: '时', word_pinyin: 'shí', word_en: 'time; hour', example_sentence: '现在几时了？' },
      { word_zh: '没有', word_pinyin: 'méiyǒu', word_en: "don't have; there isn't", example_sentence: '我没有钱。' },
      { word_zh: '会', word_pinyin: 'huì', word_en: 'can; will; to know how', example_sentence: '我会说英语。' },
      { word_zh: '工作', word_pinyin: 'gōngzuò', word_en: 'to work; work; job', example_sentence: '我在医院工作。' },
      { word_zh: '朋友', word_pinyin: 'péngyǒu', word_en: 'friend', example_sentence: '他是我的好朋友。' },
      { word_zh: '吃饭', word_pinyin: 'chīfàn', word_en: 'to eat a meal', example_sentence: '我们去吃饭吧。' },
      { word_zh: '学生', word_pinyin: 'xuéshēng', word_en: 'student', example_sentence: '她是大学生。' },
      { word_zh: '老师', word_pinyin: 'lǎoshī', word_en: 'teacher', example_sentence: '我的老师很耐心。' },
      { word_zh: '中国', word_pinyin: 'zhōngguó', word_en: 'China', example_sentence: '我想去中国旅行。' },
    ],
  },
  {
    name: 'HSK 2 — Elementary',
    description: 'Build fluency with 300 words covering daily routines, family, shopping, time expressions, and simple conversations.',
    difficulty_level: 2,
    words: [
      { word_zh: '因为', word_pinyin: 'yīnwèi', word_en: 'because', example_sentence: '因为下雨，我没有出去。' },
      { word_zh: '所以', word_pinyin: 'suǒyǐ', word_en: 'therefore; so', example_sentence: '我累了，所以早点睡。' },
      { word_zh: '但是', word_pinyin: 'dànshì', word_en: 'but; however', example_sentence: '他很聪明，但是不努力。' },
      { word_zh: '已经', word_pinyin: 'yǐjīng', word_en: 'already', example_sentence: '我已经吃饭了。' },
      { word_zh: '可能', word_pinyin: 'kěnéng', word_en: 'maybe; possibly', example_sentence: '明天可能会下雨。' },
      { word_zh: '准备', word_pinyin: 'zhǔnbèi', word_en: 'to prepare; ready', example_sentence: '我已经准备好了。' },
      { word_zh: '觉得', word_pinyin: 'juéde', word_en: 'to feel; to think', example_sentence: '我觉得这道菜很好吃。' },
      { word_zh: '告诉', word_pinyin: 'gàosù', word_en: 'to tell', example_sentence: '请告诉我你的地址。' },
      { word_zh: '希望', word_pinyin: 'xīwàng', word_en: 'to hope; hope', example_sentence: '我希望你身体健康。' },
      { word_zh: '开始', word_pinyin: 'kāishǐ', word_en: 'to start; beginning', example_sentence: '课程明天开始。' },
      { word_zh: '帮助', word_pinyin: 'bāngzhù', word_en: 'to help; help', example_sentence: '谢谢你帮助我。' },
      { word_zh: '问题', word_pinyin: 'wèntí', word_en: 'question; problem', example_sentence: '我有一个问题。' },
      { word_zh: '时间', word_pinyin: 'shíjiān', word_en: 'time', example_sentence: '我没有时间。' },
      { word_zh: '非常', word_pinyin: 'fēicháng', word_en: 'very; extremely', example_sentence: '他非常聪明。' },
      { word_zh: '公司', word_pinyin: 'gōngsī', word_en: 'company; firm', example_sentence: '我在这家公司工作了三年。' },
      { word_zh: '生日', word_pinyin: 'shēngrì', word_en: 'birthday', example_sentence: '今天是我的生日。' },
      { word_zh: '快乐', word_pinyin: 'kuàilè', word_en: 'happy; joyful', example_sentence: '祝你生日快乐！' },
      { word_zh: '身体', word_pinyin: 'shēntǐ', word_en: 'body; health', example_sentence: '你要注意身体。' },
      { word_zh: '知道', word_pinyin: 'zhīdào', word_en: 'to know', example_sentence: '我不知道他去哪里了。' },
      { word_zh: '认为', word_pinyin: 'rènwéi', word_en: 'to think; to believe', example_sentence: '我认为这个方法很好。' },
      { word_zh: '一起', word_pinyin: 'yìqǐ', word_en: 'together', example_sentence: '我们一起去吃饭吧。' },
      { word_zh: '高兴', word_pinyin: 'gāoxìng', word_en: 'happy; glad', example_sentence: '见到你我很高兴。' },
      { word_zh: '漂亮', word_pinyin: 'piàoliang', word_en: 'beautiful; pretty', example_sentence: '这件衣服很漂亮。' },
      { word_zh: '认识', word_pinyin: 'rènshi', word_en: 'to know; to recognize', example_sentence: '很高兴认识你。' },
      { word_zh: '喜欢', word_pinyin: 'xǐhuān', word_en: 'to like', example_sentence: '我喜欢学中文。' },
      { word_zh: '明白', word_pinyin: 'míngbai', word_en: 'to understand; clear', example_sentence: '我明白你的意思了。' },
      { word_zh: '机会', word_pinyin: 'jīhuì', word_en: 'opportunity; chance', example_sentence: '这是一个好机会。' },
      { word_zh: '方法', word_pinyin: 'fāngfǎ', word_en: 'method; way', example_sentence: '这个方法很有效。' },
      { word_zh: '以后', word_pinyin: 'yǐhòu', word_en: 'after; afterwards', example_sentence: '以后我们常联系。' },
      { word_zh: '以前', word_pinyin: 'yǐqián', word_en: 'before; previously', example_sentence: '以前我住在上海。' },
    ],
  },
  {
    name: 'HSK 3 — Intermediate',
    description: 'Expand to 600 words to discuss society, culture, education, environment, and express opinions with nuance.',
    difficulty_level: 3,
    words: [
      { word_zh: '环境', word_pinyin: 'huánjìng', word_en: 'environment; surroundings', example_sentence: '保护环境是我们的责任。' },
      { word_zh: '经验', word_pinyin: 'jīngyàn', word_en: 'experience', example_sentence: '他有丰富的工作经验。' },
      { word_zh: '决定', word_pinyin: 'juédìng', word_en: 'to decide; decision', example_sentence: '我决定去中国留学。' },
      { word_zh: '选择', word_pinyin: 'xuǎnzé', word_en: 'to choose; choice', example_sentence: '这是一个艰难的选择。' },
      { word_zh: '关系', word_pinyin: 'guānxì', word_en: 'relationship; connection', example_sentence: '我们的关系很好。' },
      { word_zh: '解决', word_pinyin: 'jiějué', word_en: 'to solve; to resolve', example_sentence: '我们需要解决这个问题。' },
      { word_zh: '发展', word_pinyin: 'fāzhǎn', word_en: 'to develop; development', example_sentence: '城市发展越来越快。' },
      { word_zh: '影响', word_pinyin: 'yǐngxiǎng', word_en: 'to influence; influence', example_sentence: '天气对心情有影响。' },
      { word_zh: '感谢', word_pinyin: 'gǎnxiè', word_en: 'to be grateful; thanks', example_sentence: '我非常感谢你的帮助。' },
      { word_zh: '成功', word_pinyin: 'chénggōng', word_en: 'to succeed; success', example_sentence: '努力工作是成功的关键。' },
      { word_zh: '社会', word_pinyin: 'shèhuì', word_en: 'society', example_sentence: '我们都是社会的一员。' },
      { word_zh: '文化', word_pinyin: 'wénhuà', word_en: 'culture', example_sentence: '中国文化历史悠久。' },
      { word_zh: '教育', word_pinyin: 'jiàoyù', word_en: 'education', example_sentence: '教育是国家发展的根本。' },
      { word_zh: '健康', word_pinyin: 'jiànkāng', word_en: 'health; healthy', example_sentence: '多运动对健康很有好处。' },
      { word_zh: '努力', word_pinyin: 'nǔlì', word_en: 'to work hard; effort', example_sentence: '他学习非常努力。' },
      { word_zh: '态度', word_pinyin: 'tàidu', word_en: 'attitude; manner', example_sentence: '他对工作的态度很认真。' },
      { word_zh: '情况', word_pinyin: 'qíngkuàng', word_en: 'situation; condition', example_sentence: '请介绍一下情况。' },
      { word_zh: '质量', word_pinyin: 'zhìliàng', word_en: 'quality', example_sentence: '这个产品质量很高。' },
      { word_zh: '增加', word_pinyin: 'zēngjiā', word_en: 'to increase; to add', example_sentence: '收入每年都在增加。' },
      { word_zh: '表示', word_pinyin: 'biǎoshì', word_en: 'to express; to indicate', example_sentence: '他表示很愿意帮忙。' },
      { word_zh: '完成', word_pinyin: 'wánchéng', word_en: 'to complete; to finish', example_sentence: '我终于完成了任务。' },
      { word_zh: '负责', word_pinyin: 'fùzé', word_en: 'responsible; to be in charge', example_sentence: '他负责这个项目。' },
      { word_zh: '研究', word_pinyin: 'yánjiū', word_en: 'to research; research', example_sentence: '他在研究中国历史。' },
      { word_zh: '提高', word_pinyin: 'tígāo', word_en: 'to improve; to raise', example_sentence: '我想提高我的中文水平。' },
      { word_zh: '重要', word_pinyin: 'zhòngyào', word_en: 'important', example_sentence: '这是一个重要的问题。' },
      { word_zh: '发现', word_pinyin: 'fāxiàn', word_en: 'to discover; to find', example_sentence: '我发现了一个有趣的现象。' },
      { word_zh: '考虑', word_pinyin: 'kǎolǜ', word_en: 'to consider; to think about', example_sentence: '我需要好好考虑一下。' },
      { word_zh: '联系', word_pinyin: 'liánxì', word_en: 'to contact; connection', example_sentence: '我们要保持联系。' },
      { word_zh: '继续', word_pinyin: 'jìxù', word_en: 'to continue', example_sentence: '请继续说。' },
      { word_zh: '产生', word_pinyin: 'chǎnshēng', word_en: 'to produce; to generate', example_sentence: '这件事产生了很大的影响。' },
    ],
  },
  {
    name: 'HSK 4 — Upper Intermediate',
    description: 'Master 1,200 words to express complex opinions on science, technology, politics, and abstract concepts with confidence.',
    difficulty_level: 4,
    words: [
      { word_zh: '传统', word_pinyin: 'chuántǒng', word_en: 'tradition; traditional', example_sentence: '春节是中国最重要的传统节日。' },
      { word_zh: '政府', word_pinyin: 'zhèngfǔ', word_en: 'government', example_sentence: '政府正在制定新的经济政策。' },
      { word_zh: '经济', word_pinyin: 'jīngjì', word_en: 'economy; economics', example_sentence: '全球经济正在逐步恢复。' },
      { word_zh: '技术', word_pinyin: 'jìshù', word_en: 'technology; technique', example_sentence: '现代技术改变了我们的生活。' },
      { word_zh: '科学', word_pinyin: 'kēxué', word_en: 'science', example_sentence: '科学的发展推动了社会进步。' },
      { word_zh: '历史', word_pinyin: 'lìshǐ', word_en: 'history', example_sentence: '了解历史有助于我们理解现在。' },
      { word_zh: '自然', word_pinyin: 'zìrán', word_en: 'nature; natural', example_sentence: '我们应该爱护大自然。' },
      { word_zh: '文明', word_pinyin: 'wénmíng', word_en: 'civilization; civilized', example_sentence: '中华文明有五千年的历史。' },
      { word_zh: '民主', word_pinyin: 'mínzhǔ', word_en: 'democracy; democratic', example_sentence: '民主是现代政治的基础。' },
      { word_zh: '改革', word_pinyin: 'gǎigé', word_en: 'reform; to reform', example_sentence: '经济改革带来了很大变化。' },
      { word_zh: '竞争', word_pinyin: 'jìngzhēng', word_en: 'competition; to compete', example_sentence: '市场竞争越来越激烈。' },
      { word_zh: '资源', word_pinyin: 'zīyuán', word_en: 'resource; resources', example_sentence: '我们要合理利用自然资源。' },
      { word_zh: '矛盾', word_pinyin: 'máodùn', word_en: 'contradiction; conflict', example_sentence: '这两个观点存在矛盾。' },
      { word_zh: '现象', word_pinyin: 'xiànxiàng', word_en: 'phenomenon', example_sentence: '这是一个普遍的社会现象。' },
      { word_zh: '原则', word_pinyin: 'yuánzé', word_en: 'principle', example_sentence: '我们要坚持公平的原则。' },
      { word_zh: '实现', word_pinyin: 'shíxiàn', word_en: 'to realize; to achieve', example_sentence: '我实现了我的梦想。' },
      { word_zh: '积累', word_pinyin: 'jīlěi', word_en: 'to accumulate; accumulation', example_sentence: '知识需要长期积累。' },
      { word_zh: '承担', word_pinyin: 'chéngdān', word_en: 'to undertake; to bear', example_sentence: '你要承担后果。' },
      { word_zh: '促进', word_pinyin: 'cùjìn', word_en: 'to promote; to accelerate', example_sentence: '贸易促进了经济发展。' },
      { word_zh: '维护', word_pinyin: 'wéihù', word_en: 'to maintain; to defend', example_sentence: '我们要维护社会稳定。' },
      { word_zh: '逐渐', word_pinyin: 'zhújiàn', word_en: 'gradually', example_sentence: '他的病情逐渐好转。' },
      { word_zh: '客观', word_pinyin: 'kèguān', word_en: 'objective; unbiased', example_sentence: '我们要客观地分析问题。' },
      { word_zh: '主观', word_pinyin: 'zhǔguān', word_en: 'subjective', example_sentence: '这只是他的主观看法。' },
      { word_zh: '普遍', word_pinyin: 'pǔbiàn', word_en: 'universal; widespread', example_sentence: '这是一种普遍的观点。' },
      { word_zh: '具体', word_pinyin: 'jùtǐ', word_en: 'specific; concrete', example_sentence: '请说明具体情况。' },
      { word_zh: '复杂', word_pinyin: 'fùzá', word_en: 'complex; complicated', example_sentence: '这个问题非常复杂。' },
      { word_zh: '简单', word_pinyin: 'jiǎndān', word_en: 'simple; easy', example_sentence: '这道题很简单。' },
      { word_zh: '消费', word_pinyin: 'xiāofèi', word_en: 'to consume; consumption', example_sentence: '消费水平不断提高。' },
      { word_zh: '投资', word_pinyin: 'tóuzī', word_en: 'to invest; investment', example_sentence: '教育投资是最值得的。' },
      { word_zh: '创新', word_pinyin: 'chuàngxīn', word_en: 'innovation; to innovate', example_sentence: '创新是发展的动力。' },
    ],
  },
  {
    name: 'HSK 5 — Advanced',
    description: 'Command 2,500 words for academic reading, formal writing, and nuanced discussion of philosophy, law, and literature.',
    difficulty_level: 5,
    words: [
      { word_zh: '哲学', word_pinyin: 'zhéxué', word_en: 'philosophy', example_sentence: '哲学探讨生命的意义。' },
      { word_zh: '辩证', word_pinyin: 'biànzhèng', word_en: 'dialectical', example_sentence: '我们要辩证地看待问题。' },
      { word_zh: '抽象', word_pinyin: 'chōuxiàng', word_en: 'abstract', example_sentence: '这个概念非常抽象。' },
      { word_zh: '本质', word_pinyin: 'běnzhì', word_en: 'essence; nature', example_sentence: '我们要看清事物的本质。' },
      { word_zh: '规律', word_pinyin: 'guīlǜ', word_en: 'law; rule; pattern', example_sentence: '这是自然界的规律。' },
      { word_zh: '逻辑', word_pinyin: 'luójí', word_en: 'logic', example_sentence: '他的推理很有逻辑。' },
      { word_zh: '辩论', word_pinyin: 'biànlùn', word_en: 'debate; to debate', example_sentence: '他们就这个问题展开了辩论。' },
      { word_zh: '论证', word_pinyin: 'lùnzhèng', word_en: 'to argue; to prove', example_sentence: '他的论证很有说服力。' },
      { word_zh: '假设', word_pinyin: 'jiǎshè', word_en: 'hypothesis; to assume', example_sentence: '这只是一个假设。' },
      { word_zh: '推断', word_pinyin: 'tuīduàn', word_en: 'to deduce; inference', example_sentence: '根据证据可以推断结论。' },
      { word_zh: '阐述', word_pinyin: 'chǎnshù', word_en: 'to expound; to elaborate', example_sentence: '请详细阐述你的观点。' },
      { word_zh: '批判', word_pinyin: 'pīpàn', word_en: 'to criticize; criticism', example_sentence: '他对这种现象进行了批判。' },
      { word_zh: '综合', word_pinyin: 'zōnghé', word_en: 'comprehensive; synthesis', example_sentence: '我们要进行综合分析。' },
      { word_zh: '归纳', word_pinyin: 'guīnà', word_en: 'to induct; induction', example_sentence: '通过归纳，我们得出结论。' },
      { word_zh: '演绎', word_pinyin: 'yǎnyì', word_en: 'deduction; to deduce', example_sentence: '演绎法是从一般到特殊的推理。' },
      { word_zh: '理性', word_pinyin: 'lǐxìng', word_en: 'reason; rational', example_sentence: '我们要理性地看待这件事。' },
      { word_zh: '感性', word_pinyin: 'gǎnxìng', word_en: 'emotional; perceptual', example_sentence: '她是一个感性的人。' },
      { word_zh: '价值观', word_pinyin: 'jiàzhíguān', word_en: 'values; value system', example_sentence: '每个人都有自己的价值观。' },
      { word_zh: '世界观', word_pinyin: 'shìjièguān', word_en: 'worldview', example_sentence: '教育影响一个人的世界观。' },
      { word_zh: '人生观', word_pinyin: 'rénshēngguān', word_en: 'outlook on life', example_sentence: '他的人生观很积极。' },
      { word_zh: '契约', word_pinyin: 'qìyuē', word_en: 'contract; covenant', example_sentence: '社会契约是法律的基础。' },
      { word_zh: '权力', word_pinyin: 'quánlì', word_en: 'power; authority', example_sentence: '权力应该受到监督。' },
      { word_zh: '权利', word_pinyin: 'quánlì', word_en: 'right; rights', example_sentence: '每个人都有受教育的权利。' },
      { word_zh: '义务', word_pinyin: 'yìwù', word_en: 'obligation; duty', example_sentence: '纳税是公民的义务。' },
      { word_zh: '道德', word_pinyin: 'dàodé', word_en: 'morality; ethics', example_sentence: '道德是社会的基石。' },
      { word_zh: '伦理', word_pinyin: 'lúnlǐ', word_en: 'ethics; morals', example_sentence: '医学伦理非常重要。' },
      { word_zh: '公正', word_pinyin: 'gōngzhèng', word_en: 'just; fair', example_sentence: '法律应该是公正的。' },
      { word_zh: '平等', word_pinyin: 'píngděng', word_en: 'equal; equality', example_sentence: '人人生而平等。' },
      { word_zh: '自由', word_pinyin: 'zìyóu', word_en: 'freedom; liberty', example_sentence: '自由不是没有界限的。' },
      { word_zh: '责任', word_pinyin: 'zérèn', word_en: 'responsibility; duty', example_sentence: '我们要承担自己的责任。' },
    ],
  },
  {
    name: 'HSK 6 — Mastery',
    description: 'Achieve native-level fluency with 5,000+ words for academic prose, formal debate, literary analysis, and professional communication.',
    difficulty_level: 6,
    words: [
      { word_zh: '博弈', word_pinyin: 'bóyì', word_en: 'game theory; contest', example_sentence: '国际关系就像一场博弈。' },
      { word_zh: '范畴', word_pinyin: 'fànchóu', word_en: 'category; domain', example_sentence: '这属于哲学的范畴。' },
      { word_zh: '悖论', word_pinyin: 'bèilùn', word_en: 'paradox', example_sentence: '这是一个经典的悖论。' },
      { word_zh: '诠释', word_pinyin: 'quánshì', word_en: 'to interpret; interpretation', example_sentence: '他对这首诗做了独特的诠释。' },
      { word_zh: '隐喻', word_pinyin: 'yǐnyù', word_en: 'metaphor', example_sentence: '这是一个关于人生的隐喻。' },
      { word_zh: '意识形态', word_pinyin: 'yìshí xíngtài', word_en: 'ideology', example_sentence: '不同的意识形态影响政策方向。' },
      { word_zh: '辩证法', word_pinyin: 'biànzhèngfǎ', word_en: 'dialectics', example_sentence: '辩证法要求我们全面地看问题。' },
      { word_zh: '认识论', word_pinyin: 'rènshílùn', word_en: 'epistemology', example_sentence: '认识论研究知识的本质和来源。' },
      { word_zh: '存在主义', word_pinyin: 'cúnzài zhǔyì', word_en: 'existentialism', example_sentence: '存在主义强调个人的自由和选择。' },
      { word_zh: '后现代主义', word_pinyin: 'hòu xiàndài zhǔyì', word_en: 'postmodernism', example_sentence: '后现代主义质疑传统的权威和真理。' },
      { word_zh: '辩驳', word_pinyin: 'biànbó', word_en: 'to refute; to argue against', example_sentence: '他有力地辩驳了对方的观点。' },
      { word_zh: '阐释', word_pinyin: 'chǎnshì', word_en: 'to expound; to elucidate', example_sentence: '学者们对此进行了深入阐释。' },
      { word_zh: '斡旋', word_pinyin: 'wòxuán', word_en: 'to mediate; mediation', example_sentence: '外交官进行了积极的斡旋。' },
      { word_zh: '折衷', word_pinyin: 'zhézhōng', word_en: 'compromise; eclectic', example_sentence: '双方达成了折衷的方案。' },
      { word_zh: '渗透', word_pinyin: 'shèntòu', word_en: 'to permeate; to infiltrate', example_sentence: '文化已渗透到生活的各个方面。' },
      { word_zh: '颠覆', word_pinyin: 'diānfù', word_en: 'to subvert; to overturn', example_sentence: '这个发现颠覆了传统观念。' },
      { word_zh: '演变', word_pinyin: 'yǎnbiàn', word_en: 'to evolve; evolution', example_sentence: '语言随着时代的演变而变化。' },
      { word_zh: '蕴含', word_pinyin: 'yùnhán', word_en: 'to imply; to embody', example_sentence: '这句话蕴含了深刻的哲理。' },
      { word_zh: '凸显', word_pinyin: 'tūxiǎn', word_en: 'to highlight; to show prominently', example_sentence: '这件事凸显了教育的重要性。' },
      { word_zh: '契合', word_pinyin: 'qìhé', word_en: 'to fit; to match', example_sentence: '他的想法与我的理念契合。' },
      { word_zh: '践行', word_pinyin: 'jiànxíng', word_en: 'to practice; to put into action', example_sentence: '我们要践行自己的承诺。' },
      { word_zh: '应运而生', word_pinyin: 'yìngyùn ér shēng', word_en: 'to emerge as the times require', example_sentence: '网络购物应运而生。' },
      { word_zh: '与时俱进', word_pinyin: 'yǔshí jùjìn', word_en: 'to keep pace with the times', example_sentence: '企业要与时俱进，不断创新。' },
      { word_zh: '兼收并蓄', word_pinyin: 'jiān shōu bìng xù', word_en: 'to absorb and adopt eclectically', example_sentence: '中国文化兼收并蓄，博大精深。' },
      { word_zh: '举足轻重', word_pinyin: 'jǔzú qīngzhòng', word_en: 'to be of decisive importance', example_sentence: '他在公司里举足轻重。' },
      { word_zh: '错综复杂', word_pinyin: 'cuòzōng fùzá', word_en: 'intricate; complicated', example_sentence: '国际局势错综复杂。' },
      { word_zh: '截然不同', word_pinyin: 'jiérán bùtóng', word_en: 'entirely different', example_sentence: '他们两人的性格截然不同。' },
      { word_zh: '层出不穷', word_pinyin: 'céng chū bù qióng', word_en: 'to emerge in an endless stream', example_sentence: '新技术层出不穷。' },
      { word_zh: '一脉相承', word_pinyin: 'yī mài xiāng chéng', word_en: 'to come from the same origin', example_sentence: '这两种思想一脉相承。' },
      { word_zh: '触类旁通', word_pinyin: 'chù lèi páng tōng', word_en: 'to master one and understand all', example_sentence: '学好方法，就能触类旁通。' },
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Seeding public HSK courses…\n');

  for (const course of COURSES) {
    // 1. Insert course
    const cr = await req('POST', '/vocabulary_courses', {
      name: course.name,
      description: course.description,
      difficulty_level: course.difficulty_level,
      is_published: true,
      creator_id: null,
    }, 'return=representation,resolution=ignore-duplicates');

    if (cr.status >= 300) {
      console.error(`❌ Failed to insert course "${course.name}": ${cr.body}`);
      continue;
    }

    let courseId;
    try {
      const parsed = JSON.parse(cr.body);
      courseId = Array.isArray(parsed) ? parsed[0]?.id : parsed?.id;
    } catch {
      console.error(`❌ Could not parse course ID for "${course.name}"`);
      continue;
    }

    if (!courseId) {
      console.error(`❌ No ID returned for "${course.name}"`);
      continue;
    }

    console.log(`  ✅ Course: "${course.name}" (${courseId})`);

    // 2. Insert vocabulary items for this course
    const items = course.words.map((w, i) => ({
      course_id: courseId,
      word_zh: w.word_zh,
      word_pinyin: w.word_pinyin,
      word_en: w.word_en,
      example_sentence: w.example_sentence,
      hsk_level: course.difficulty_level,
      sort_order: i + 1,
    }));

    const ir = await req('POST', '/course_vocabulary_items', items, 'resolution=ignore-duplicates,return=minimal');
    if (ir.status >= 300) {
      console.error(`   ❌ Words failed: ${ir.body.slice(0, 120)}`);
    } else {
      console.log(`     📚 ${items.length} words inserted`);
    }
  }

  console.log('\n🎉 Done! 6 public courses seeded (HSK 1–6), 30 words each.');
}

main().catch((err) => { console.error('❌', err.message); process.exit(1); });
