// Curated HSK 1-3 words for the "Word of the Day" feature so every user —
// including brand-new ones with an empty vocabulary — discovers a useful word
// each day. A word is chosen deterministically by date (see word-of-day route).

export interface HskSeedWord {
  word_zh: string;
  word_pinyin: string;
  word_en: string;
  word_vi?: string;
  hsk_level: number;
  example_sentence: string;
  example_sentence_en: string;
  example_sentence_vi?: string;
}

export const HSK_SEED_WORDS: HskSeedWord[] = [
  { word_zh: '朋友', word_pinyin: 'péngyǒu', word_en: 'friend', word_vi: 'bạn bè', hsk_level: 1, example_sentence: '他是我的好朋友。', example_sentence_en: 'He is my good friend.', example_sentence_vi: 'Anh ấy là người bạn tốt của tôi.' },
  { word_zh: '学习', word_pinyin: 'xuéxí', word_en: 'to study', word_vi: 'học tập', hsk_level: 1, example_sentence: '我每天学习中文。', example_sentence_en: 'I study Chinese every day.', example_sentence_vi: 'Tôi học tiếng Trung mỗi ngày.' },
  { word_zh: '喜欢', word_pinyin: 'xǐhuān', word_en: 'to like', word_vi: 'thích', hsk_level: 1, example_sentence: '我喜欢喝茶。', example_sentence_en: 'I like drinking tea.', example_sentence_vi: 'Tôi thích uống trà.' },
  { word_zh: '时间', word_pinyin: 'shíjiān', word_en: 'time', word_vi: 'thời gian', hsk_level: 2, example_sentence: '今天我没有时间。', example_sentence_en: 'I have no time today.', example_sentence_vi: 'Hôm nay tôi không có thời gian.' },
  { word_zh: '高兴', word_pinyin: 'gāoxìng', word_en: 'happy', word_vi: 'vui vẻ', hsk_level: 1, example_sentence: '见到你我很高兴。', example_sentence_en: 'I am very happy to see you.', example_sentence_vi: 'Tôi rất vui khi gặp bạn.' },
  { word_zh: '工作', word_pinyin: 'gōngzuò', word_en: 'work; to work', word_vi: 'công việc; làm việc', hsk_level: 1, example_sentence: '我在医院工作。', example_sentence_en: 'I work at a hospital.', example_sentence_vi: 'Tôi làm việc ở bệnh viện.' },
  { word_zh: '漂亮', word_pinyin: 'piàoliang', word_en: 'beautiful', word_vi: 'xinh đẹp', hsk_level: 1, example_sentence: '这件衣服很漂亮。', example_sentence_en: 'This outfit is very beautiful.', example_sentence_vi: 'Bộ quần áo này rất xinh đẹp.' },
  { word_zh: '帮助', word_pinyin: 'bāngzhù', word_en: 'to help', word_vi: 'giúp đỡ', hsk_level: 2, example_sentence: '谢谢你的帮助。', example_sentence_en: 'Thank you for your help.', example_sentence_vi: 'Cảm ơn bạn đã giúp đỡ.' },
  { word_zh: '重要', word_pinyin: 'zhòngyào', word_en: 'important', word_vi: 'quan trọng', hsk_level: 3, example_sentence: '这是一个重要的问题。', example_sentence_en: 'This is an important question.', example_sentence_vi: 'Đây là một câu hỏi quan trọng.' },
  { word_zh: '简单', word_pinyin: 'jiǎndān', word_en: 'simple', word_vi: 'đơn giản', hsk_level: 3, example_sentence: '这个问题很简单。', example_sentence_en: 'This problem is very simple.', example_sentence_vi: 'Vấn đề này rất đơn giản.' },
  { word_zh: '健康', word_pinyin: 'jiànkāng', word_en: 'health; healthy', word_vi: 'sức khỏe; khỏe mạnh', hsk_level: 3, example_sentence: '多运动对健康很好。', example_sentence_en: 'Exercising more is good for your health.', example_sentence_vi: 'Tập thể dục nhiều hơn rất tốt cho sức khỏe.' },
  { word_zh: '希望', word_pinyin: 'xīwàng', word_en: 'to hope', word_vi: 'hy vọng', hsk_level: 2, example_sentence: '我希望明天天气好。', example_sentence_en: 'I hope the weather is nice tomorrow.', example_sentence_vi: 'Tôi hy vọng ngày mai thời tiết đẹp.' },
  { word_zh: '问题', word_pinyin: 'wèntí', word_en: 'question; problem', word_vi: 'câu hỏi; vấn đề', hsk_level: 2, example_sentence: '我有一个问题。', example_sentence_en: 'I have a question.', example_sentence_vi: 'Tôi có một câu hỏi.' },
  { word_zh: '快乐', word_pinyin: 'kuàilè', word_en: 'happy; joyful', word_vi: 'vui vẻ; hạnh phúc', hsk_level: 2, example_sentence: '祝你生日快乐！', example_sentence_en: 'Happy birthday to you!', example_sentence_vi: 'Chúc mừng sinh nhật bạn!' },
  { word_zh: '聪明', word_pinyin: 'cōngmíng', word_en: 'clever; smart', word_vi: 'thông minh', hsk_level: 3, example_sentence: '这个孩子很聪明。', example_sentence_en: 'This child is very clever.', example_sentence_vi: 'Đứa trẻ này rất thông minh.' },
  { word_zh: '认识', word_pinyin: 'rènshi', word_en: 'to know (someone)', word_vi: 'quen biết', hsk_level: 1, example_sentence: '很高兴认识你。', example_sentence_en: 'Nice to meet you.', example_sentence_vi: 'Rất vui được làm quen với bạn.' },
  { word_zh: '一起', word_pinyin: 'yìqǐ', word_en: 'together', word_vi: 'cùng nhau', hsk_level: 2, example_sentence: '我们一起去吃饭吧。', example_sentence_en: "Let's go eat together.", example_sentence_vi: 'Chúng ta hãy cùng nhau đi ăn.' },
  { word_zh: '已经', word_pinyin: 'yǐjīng', word_en: 'already', word_vi: 'đã; rồi', hsk_level: 2, example_sentence: '我已经吃饭了。', example_sentence_en: 'I have already eaten.', example_sentence_vi: 'Tôi đã ăn cơm rồi.' },
  { word_zh: '因为', word_pinyin: 'yīnwèi', word_en: 'because', word_vi: 'vì; bởi vì', hsk_level: 2, example_sentence: '因为下雨，我没出去。', example_sentence_en: "Because it was raining, I didn't go out.", example_sentence_vi: 'Vì trời mưa nên tôi không ra ngoài.' },
  { word_zh: '所以', word_pinyin: 'suǒyǐ', word_en: 'so; therefore', word_vi: 'vì vậy; do đó', hsk_level: 2, example_sentence: '我累了，所以早点睡。', example_sentence_en: 'I was tired, so I went to sleep early.', example_sentence_vi: 'Tôi mệt nên đi ngủ sớm.' },
  { word_zh: '觉得', word_pinyin: 'juéde', word_en: 'to think; to feel', word_vi: 'cảm thấy; nghĩ rằng', hsk_level: 2, example_sentence: '我觉得这个很好。', example_sentence_en: 'I think this is very good.', example_sentence_vi: 'Tôi cảm thấy cái này rất tốt.' },
  { word_zh: '现在', word_pinyin: 'xiànzài', word_en: 'now', word_vi: 'bây giờ', hsk_level: 1, example_sentence: '现在几点了？', example_sentence_en: 'What time is it now?', example_sentence_vi: 'Bây giờ là mấy giờ rồi?' },
  { word_zh: '事情', word_pinyin: 'shìqing', word_en: 'matter; thing', word_vi: 'việc; chuyện', hsk_level: 2, example_sentence: '我有很多事情要做。', example_sentence_en: 'I have many things to do.', example_sentence_vi: 'Tôi có nhiều việc phải làm.' },
  { word_zh: '机会', word_pinyin: 'jīhuì', word_en: 'opportunity', word_vi: 'cơ hội', hsk_level: 3, example_sentence: '这是一个好机会。', example_sentence_en: 'This is a great opportunity.', example_sentence_vi: 'Đây là một cơ hội tốt.' },
  { word_zh: '努力', word_pinyin: 'nǔlì', word_en: 'to work hard', word_vi: 'cố gắng; nỗ lực', hsk_level: 3, example_sentence: '他学习很努力。', example_sentence_en: 'He studies very hard.', example_sentence_vi: 'Anh ấy học rất chăm chỉ.' },
  { word_zh: '决定', word_pinyin: 'juédìng', word_en: 'to decide', word_vi: 'quyết định', hsk_level: 3, example_sentence: '我决定去中国。', example_sentence_en: 'I decided to go to China.', example_sentence_vi: 'Tôi quyết định đi Trung Quốc.' },
  { word_zh: '习惯', word_pinyin: 'xíguàn', word_en: 'habit; to be used to', word_vi: 'thói quen', hsk_level: 3, example_sentence: '我习惯早起。', example_sentence_en: 'I am used to waking up early.', example_sentence_vi: 'Tôi có thói quen dậy sớm.' },
  { word_zh: '一定', word_pinyin: 'yídìng', word_en: 'certainly; must', word_vi: 'nhất định; chắc chắn', hsk_level: 3, example_sentence: '你一定要小心。', example_sentence_en: 'You must be careful.', example_sentence_vi: 'Bạn nhất định phải cẩn thận.' },
  { word_zh: '终于', word_pinyin: 'zhōngyú', word_en: 'finally; at last', word_vi: 'cuối cùng', hsk_level: 3, example_sentence: '我终于做完了。', example_sentence_en: 'I finally finished.', example_sentence_vi: 'Cuối cùng tôi cũng làm xong.' },
  { word_zh: '满意', word_pinyin: 'mǎnyì', word_en: 'satisfied', word_vi: 'hài lòng', hsk_level: 3, example_sentence: '我对结果很满意。', example_sentence_en: 'I am satisfied with the result.', example_sentence_vi: 'Tôi hài lòng với kết quả.' },
];
