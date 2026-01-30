-- Seed HSK 1-6 vocabulary courses with real Chinese vocabulary words
-- Actual schema: vocabulary_courses(name, difficulty_level, creator_id refs profiles)
-- course_vocabulary_items stores words directly (word_zh, word_pinyin, word_en, hsk_level, sort_order)

-- First, allow system courses without a real creator
ALTER TABLE vocabulary_courses ALTER COLUMN creator_id DROP NOT NULL;

DO $$
DECLARE
  c1 uuid; c2 uuid; c3 uuid; c4 uuid; c5 uuid; c6 uuid;
BEGIN
  -- Insert 6 HSK courses
  INSERT INTO vocabulary_courses (id, creator_id, name, description, difficulty_level, is_published, created_at, updated_at)
  VALUES
    (gen_random_uuid(), NULL, 'HSK 1', 'Beginner - basic daily conversations, greetings, essential words', 1, true, now(), now()),
    (gen_random_uuid(), NULL, 'HSK 2', 'Elementary - simple sentences about daily routines, family, work', 2, true, now(), now()),
    (gen_random_uuid(), NULL, 'HSK 3', 'Intermediate - communicate about society, culture, education', 3, true, now(), now()),
    (gen_random_uuid(), NULL, 'HSK 4', 'Upper Intermediate - express opinions on science, technology, abstract topics', 4, true, now(), now()),
    (gen_random_uuid(), NULL, 'HSK 5', 'Advanced - academic language, philosophy, analysis', 5, true, now(), now()),
    (gen_random_uuid(), NULL, 'HSK 6', 'Mastery - advanced academic, dialectical reasoning, formal writing', 6, true, now(), now());

  -- Get course IDs
  SELECT id INTO c1 FROM vocabulary_courses WHERE name = 'HSK 1' AND creator_id IS NULL LIMIT 1;
  SELECT id INTO c2 FROM vocabulary_courses WHERE name = 'HSK 2' AND creator_id IS NULL LIMIT 1;
  SELECT id INTO c3 FROM vocabulary_courses WHERE name = 'HSK 3' AND creator_id IS NULL LIMIT 1;
  SELECT id INTO c4 FROM vocabulary_courses WHERE name = 'HSK 4' AND creator_id IS NULL LIMIT 1;
  SELECT id INTO c5 FROM vocabulary_courses WHERE name = 'HSK 5' AND creator_id IS NULL LIMIT 1;
  SELECT id INTO c6 FROM vocabulary_courses WHERE name = 'HSK 6' AND creator_id IS NULL LIMIT 1;

  -- HSK 1 words
  INSERT INTO course_vocabulary_items (course_id, word_zh, word_pinyin, word_en, hsk_level, sort_order) VALUES
    (c1, '你', 'nǐ', 'you', 1, 1), (c1, '好', 'hǎo', 'good', 1, 2),
    (c1, '我', 'wǒ', 'I/me', 1, 3), (c1, '是', 'shì', 'to be', 1, 4),
    (c1, '不', 'bù', 'not', 1, 5), (c1, '他', 'tā', 'he', 1, 6),
    (c1, '她', 'tā', 'she', 1, 7), (c1, '的', 'de', 'possessive particle', 1, 8),
    (c1, '了', 'le', 'past tense particle', 1, 9), (c1, '在', 'zài', 'at/in', 1, 10),
    (c1, '人', 'rén', 'person', 1, 11), (c1, '大', 'dà', 'big', 1, 12),
    (c1, '这', 'zhè', 'this', 1, 13), (c1, '中', 'zhōng', 'middle/China', 1, 14),
    (c1, '学', 'xué', 'to study', 1, 15), (c1, '国', 'guó', 'country', 1, 16),
    (c1, '什么', 'shénme', 'what', 1, 17), (c1, '没有', 'méiyǒu', 'don''t have', 1, 18),
    (c1, '一', 'yī', 'one', 1, 19), (c1, '会', 'huì', 'can/will', 1, 20);

  -- HSK 2 words
  INSERT INTO course_vocabulary_items (course_id, word_zh, word_pinyin, word_en, hsk_level, sort_order) VALUES
    (c2, '因为', 'yīnwèi', 'because', 2, 1), (c2, '所以', 'suǒyǐ', 'therefore', 2, 2),
    (c2, '但是', 'dànshì', 'but', 2, 3), (c2, '已经', 'yǐjīng', 'already', 2, 4),
    (c2, '可能', 'kěnéng', 'maybe', 2, 5), (c2, '准备', 'zhǔnbèi', 'prepare', 2, 6),
    (c2, '觉得', 'juéde', 'feel/think', 2, 7), (c2, '告诉', 'gàosù', 'tell', 2, 8),
    (c2, '希望', 'xīwàng', 'hope', 2, 9), (c2, '开始', 'kāishǐ', 'start', 2, 10),
    (c2, '帮助', 'bāngzhù', 'help', 2, 11), (c2, '认为', 'rènwéi', 'think/believe', 2, 12),
    (c2, '问题', 'wèntí', 'question/problem', 2, 13), (c2, '时间', 'shíjiān', 'time', 2, 14),
    (c2, '非常', 'fēicháng', 'very', 2, 15), (c2, '公司', 'gōngsī', 'company', 2, 16),
    (c2, '孩子', 'háizi', 'child', 2, 17), (c2, '男人', 'nánrén', 'man', 2, 18),
    (c2, '女人', 'nǚrén', 'woman', 2, 19), (c2, '生日', 'shēngrì', 'birthday', 2, 20);

  -- HSK 3 words
  INSERT INTO course_vocabulary_items (course_id, word_zh, word_pinyin, word_en, hsk_level, sort_order) VALUES
    (c3, '环境', 'huánjìng', 'environment', 3, 1), (c3, '经验', 'jīngyàn', 'experience', 3, 2),
    (c3, '决定', 'juédìng', 'decide', 3, 3), (c3, '选择', 'xuǎnzé', 'choose', 3, 4),
    (c3, '办法', 'bànfǎ', 'method', 3, 5), (c3, '关系', 'guānxì', 'relationship', 3, 6),
    (c3, '历史', 'lìshǐ', 'history', 3, 7), (c3, '文化', 'wénhuà', 'culture', 3, 8),
    (c3, '教育', 'jiàoyù', 'education', 3, 9), (c3, '社会', 'shèhuì', 'society', 3, 10),
    (c3, '世界', 'shìjiè', 'world', 3, 11), (c3, '经济', 'jīngjì', 'economy', 3, 12),
    (c3, '发展', 'fāzhǎn', 'develop', 3, 13), (c3, '研究', 'yánjiū', 'research', 3, 14),
    (c3, '新闻', 'xīnwén', 'news', 3, 15), (c3, '作用', 'zuòyòng', 'function/role', 3, 16),
    (c3, '影响', 'yǐngxiǎng', 'influence', 3, 17), (c3, '容易', 'róngyì', 'easy', 3, 18),
    (c3, '解决', 'jiějué', 'solve', 3, 19), (c3, '保护', 'bǎohù', 'protect', 3, 20);

  -- HSK 4 words
  INSERT INTO course_vocabulary_items (course_id, word_zh, word_pinyin, word_en, hsk_level, sort_order) VALUES
    (c4, '丰富', 'fēngfù', 'rich/abundant', 4, 1), (c4, '深刻', 'shēnkè', 'profound', 4, 2),
    (c4, '复杂', 'fùzá', 'complex', 4, 3), (c4, '普通', 'pǔtōng', 'ordinary', 4, 4),
    (c4, '积极', 'jījí', 'positive/active', 4, 5), (c4, '科学', 'kēxué', 'science', 4, 6),
    (c4, '技术', 'jìshù', 'technology', 4, 7), (c4, '材料', 'cáiliào', 'material', 4, 8),
    (c4, '标准', 'biāozhǔn', 'standard', 4, 9), (c4, '过程', 'guòchéng', 'process', 4, 10),
    (c4, '表达', 'biǎodá', 'express', 4, 11), (c4, '讨论', 'tǎolùn', 'discuss', 4, 12),
    (c4, '联系', 'liánxì', 'contact', 4, 13), (c4, '调查', 'diàochá', 'investigate', 4, 14),
    (c4, '推荐', 'tuījiàn', 'recommend', 4, 15), (c4, '提供', 'tígōng', 'provide', 4, 16),
    (c4, '实际', 'shíjì', 'practical', 4, 17), (c4, '原因', 'yuányīn', 'reason', 4, 18),
    (c4, '结果', 'jiéguǒ', 'result', 4, 19), (c4, '态度', 'tàidù', 'attitude', 4, 20);

  -- HSK 5 words
  INSERT INTO course_vocabulary_items (course_id, word_zh, word_pinyin, word_en, hsk_level, sort_order) VALUES
    (c5, '现象', 'xiànxiàng', 'phenomenon', 5, 1), (c5, '本质', 'běnzhì', 'essence', 5, 2),
    (c5, '概念', 'gàiniàn', 'concept', 5, 3), (c5, '逻辑', 'luójí', 'logic', 5, 4),
    (c5, '分析', 'fēnxī', 'analyze', 5, 5), (c5, '结构', 'jiégòu', 'structure', 5, 6),
    (c5, '系统', 'xìtǒng', 'system', 5, 7), (c5, '观念', 'guānniàn', 'notion', 5, 8),
    (c5, '哲学', 'zhéxué', 'philosophy', 5, 9), (c5, '效率', 'xiàolǜ', 'efficiency', 5, 10),
    (c5, '贡献', 'gòngxiàn', 'contribute', 5, 11), (c5, '承担', 'chéngdān', 'undertake', 5, 12),
    (c5, '维护', 'wéihù', 'maintain', 5, 13), (c5, '探索', 'tànsuǒ', 'explore', 5, 14),
    (c5, '创造', 'chuàngzào', 'create', 5, 15), (c5, '促进', 'cùjìn', 'promote', 5, 16),
    (c5, '反映', 'fǎnyìng', 'reflect', 5, 17), (c5, '证明', 'zhèngmíng', 'prove', 5, 18),
    (c5, '评价', 'píngjià', 'evaluate', 5, 19), (c5, '克服', 'kèfú', 'overcome', 5, 20);

  -- HSK 6 words
  INSERT INTO course_vocabulary_items (course_id, word_zh, word_pinyin, word_en, hsk_level, sort_order) VALUES
    (c6, '辩证', 'biànzhèng', 'dialectical', 6, 1), (c6, '抽象', 'chōuxiàng', 'abstract', 6, 2),
    (c6, '典型', 'diǎnxíng', 'typical', 6, 3), (c6, '根本', 'gēnběn', 'fundamental', 6, 4),
    (c6, '客观', 'kèguān', 'objective', 6, 5), (c6, '具体', 'jùtǐ', 'concrete', 6, 6),
    (c6, '灵活', 'línghuó', 'flexible', 6, 7), (c6, '明确', 'míngquè', 'clear/explicit', 6, 8),
    (c6, '全面', 'quánmiàn', 'comprehensive', 6, 9), (c6, '深入', 'shēnrù', 'in-depth', 6, 10),
    (c6, '严格', 'yángé', 'strict', 6, 11), (c6, '优秀', 'yōuxiù', 'excellent', 6, 12),
    (c6, '主观', 'zhǔguān', 'subjective', 6, 13), (c6, '自觉', 'zìjué', 'conscious', 6, 14),
    (c6, '综合', 'zōnghé', 'comprehensive', 6, 15), (c6, '尊重', 'zūnzhòng', 'respect', 6, 16),
    (c6, '把握', 'bǎwò', 'grasp', 6, 17), (c6, '发挥', 'fāhuī', 'demonstrate', 6, 18),
    (c6, '规范', 'guīfàn', 'standard/norm', 6, 19), (c6, '激发', 'jīfā', 'inspire', 6, 20);

  RAISE NOTICE 'HSK 1-6 courses seeded with 120 vocabulary words';
END $$;
