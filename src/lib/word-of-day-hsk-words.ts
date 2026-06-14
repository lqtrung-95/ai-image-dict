// Curated HSK 1-3 words for the "Word of the Day" feature so every user —
// including brand-new ones with an empty vocabulary — discovers a useful word
// each day. A word is chosen deterministically by date (see word-of-day route).

export interface HskSeedWord {
  word_zh: string;
  word_pinyin: string;
  word_en: string;
  hsk_level: number;
  example_sentence: string;
  example_sentence_en: string;
}

export const HSK_SEED_WORDS: HskSeedWord[] = [
  { word_zh: '朋友', word_pinyin: 'péngyǒu', word_en: 'friend', hsk_level: 1, example_sentence: '他是我的好朋友。', example_sentence_en: 'He is my good friend.' },
  { word_zh: '学习', word_pinyin: 'xuéxí', word_en: 'to study', hsk_level: 1, example_sentence: '我每天学习中文。', example_sentence_en: 'I study Chinese every day.' },
  { word_zh: '喜欢', word_pinyin: 'xǐhuān', word_en: 'to like', hsk_level: 1, example_sentence: '我喜欢喝茶。', example_sentence_en: 'I like drinking tea.' },
  { word_zh: '时间', word_pinyin: 'shíjiān', word_en: 'time', hsk_level: 2, example_sentence: '今天我没有时间。', example_sentence_en: 'I have no time today.' },
  { word_zh: '高兴', word_pinyin: 'gāoxìng', word_en: 'happy', hsk_level: 1, example_sentence: '见到你我很高兴。', example_sentence_en: 'I am very happy to see you.' },
  { word_zh: '工作', word_pinyin: 'gōngzuò', word_en: 'work; to work', hsk_level: 1, example_sentence: '我在医院工作。', example_sentence_en: 'I work at a hospital.' },
  { word_zh: '漂亮', word_pinyin: 'piàoliang', word_en: 'beautiful', hsk_level: 1, example_sentence: '这件衣服很漂亮。', example_sentence_en: 'This outfit is very beautiful.' },
  { word_zh: '帮助', word_pinyin: 'bāngzhù', word_en: 'to help', hsk_level: 2, example_sentence: '谢谢你的帮助。', example_sentence_en: 'Thank you for your help.' },
  { word_zh: '重要', word_pinyin: 'zhòngyào', word_en: 'important', hsk_level: 3, example_sentence: '这是一个重要的问题。', example_sentence_en: 'This is an important question.' },
  { word_zh: '简单', word_pinyin: 'jiǎndān', word_en: 'simple', hsk_level: 3, example_sentence: '这个问题很简单。', example_sentence_en: 'This problem is very simple.' },
  { word_zh: '健康', word_pinyin: 'jiànkāng', word_en: 'health; healthy', hsk_level: 3, example_sentence: '多运动对健康很好。', example_sentence_en: 'Exercising more is good for your health.' },
  { word_zh: '希望', word_pinyin: 'xīwàng', word_en: 'to hope', hsk_level: 2, example_sentence: '我希望明天天气好。', example_sentence_en: 'I hope the weather is nice tomorrow.' },
  { word_zh: '问题', word_pinyin: 'wèntí', word_en: 'question; problem', hsk_level: 2, example_sentence: '我有一个问题。', example_sentence_en: 'I have a question.' },
  { word_zh: '快乐', word_pinyin: 'kuàilè', word_en: 'happy; joyful', hsk_level: 2, example_sentence: '祝你生日快乐！', example_sentence_en: 'Happy birthday to you!' },
  { word_zh: '聪明', word_pinyin: 'cōngmíng', word_en: 'clever; smart', hsk_level: 3, example_sentence: '这个孩子很聪明。', example_sentence_en: 'This child is very clever.' },
  { word_zh: '认识', word_pinyin: 'rènshi', word_en: 'to know (someone)', hsk_level: 1, example_sentence: '很高兴认识你。', example_sentence_en: 'Nice to meet you.' },
  { word_zh: '一起', word_pinyin: 'yìqǐ', word_en: 'together', hsk_level: 2, example_sentence: '我们一起去吃饭吧。', example_sentence_en: "Let's go eat together." },
  { word_zh: '已经', word_pinyin: 'yǐjīng', word_en: 'already', hsk_level: 2, example_sentence: '我已经吃饭了。', example_sentence_en: 'I have already eaten.' },
  { word_zh: '因为', word_pinyin: 'yīnwèi', word_en: 'because', hsk_level: 2, example_sentence: '因为下雨，我没出去。', example_sentence_en: "Because it was raining, I didn't go out." },
  { word_zh: '所以', word_pinyin: 'suǒyǐ', word_en: 'so; therefore', hsk_level: 2, example_sentence: '我累了，所以早点睡。', example_sentence_en: 'I was tired, so I went to sleep early.' },
  { word_zh: '觉得', word_pinyin: 'juéde', word_en: 'to think; to feel', hsk_level: 2, example_sentence: '我觉得这个很好。', example_sentence_en: 'I think this is very good.' },
  { word_zh: '现在', word_pinyin: 'xiànzài', word_en: 'now', hsk_level: 1, example_sentence: '现在几点了？', example_sentence_en: 'What time is it now?' },
  { word_zh: '事情', word_pinyin: 'shìqing', word_en: 'matter; thing', hsk_level: 2, example_sentence: '我有很多事情要做。', example_sentence_en: 'I have many things to do.' },
  { word_zh: '机会', word_pinyin: 'jīhuì', word_en: 'opportunity', hsk_level: 3, example_sentence: '这是一个好机会。', example_sentence_en: 'This is a great opportunity.' },
  { word_zh: '努力', word_pinyin: 'nǔlì', word_en: 'to work hard', hsk_level: 3, example_sentence: '他学习很努力。', example_sentence_en: 'He studies very hard.' },
  { word_zh: '决定', word_pinyin: 'juédìng', word_en: 'to decide', hsk_level: 3, example_sentence: '我决定去中国。', example_sentence_en: 'I decided to go to China.' },
  { word_zh: '习惯', word_pinyin: 'xíguàn', word_en: 'habit; to be used to', hsk_level: 3, example_sentence: '我习惯早起。', example_sentence_en: 'I am used to waking up early.' },
  { word_zh: '一定', word_pinyin: 'yídìng', word_en: 'certainly; must', hsk_level: 3, example_sentence: '你一定要小心。', example_sentence_en: 'You must be careful.' },
  { word_zh: '终于', word_pinyin: 'zhōngyú', word_en: 'finally; at last', hsk_level: 3, example_sentence: '我终于做完了。', example_sentence_en: 'I finally finished.' },
  { word_zh: '满意', word_pinyin: 'mǎnyì', word_en: 'satisfied', hsk_level: 3, example_sentence: '我对结果很满意。', example_sentence_en: 'I am satisfied with the result.' },
];
