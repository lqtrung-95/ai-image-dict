/**
 * Seeds bilingual public courses:
 *   - HSK 1–6 from MandarinBean New HSK PDFs
 *   - Thematic courses (Numbers & Time, Colors & Shapes, Kitchen & Food)
 *     with hardcoded bilingual word lists (no PDFs required)
 *
 * Required for real DB writes:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Optional:
 *   HSK1_PDF_PATH … HSK6_PDF_PATH
 *   PDFTOTEXT_BIN, EXPORT_JSON_PATH, TRANSLATION_CACHE_PATH, DRY_RUN=1
 *   TRANSLATION_PROVIDER=groq|openrouter|local
 *   GROQ_TEXT_MODEL, OPENROUTER_TEXT_MODEL
 *   SEED_LEVELS=1,2,3,4,5,6          (comma-separated HSK levels; default all)
 *   SEED_THEMATIC=1                   (also seed thematic courses; default 0)
 */

import fs from 'fs';
import https from 'https';
import path from 'path';
import { execFileSync } from 'child_process';

const ENV = process['env'];
const HOME_DIR = ENV['HOME'] || '/Users/lequoctrung';
const SUPABASE_URL = ENV['NEXT_PUBLIC_SUPABASE_URL'];
const SERVICE_KEY = ENV['SUPABASE_SERVICE_ROLE_KEY'];
const GROQ_API_KEY = ENV['GROQ_API_KEY'];
const OPENROUTER_API_KEY = ENV['OPENROUTER_API_KEY'];
const PDFTOTEXT_BIN = ENV['PDFTOTEXT_BIN'] || 'pdftotext';
const GROQ_TEXT_MODEL = ENV['GROQ_TEXT_MODEL'] || 'llama-3.3-70b-versatile';
const OPENROUTER_TEXT_MODEL = ENV['OPENROUTER_TEXT_MODEL'] || 'deepseek/deepseek-chat';
const DRY_RUN = ENV['DRY_RUN'] === '1' || ENV['DRY_RUN'] === 'true';
const EXPORT_JSON_PATH = ENV['EXPORT_JSON_PATH'];
const TRANSLATION_CACHE_PATH = ENV['TRANSLATION_CACHE_PATH'] || path.join('/tmp', 'hsk-vietnamese-translations-cache.json');
const REPLACE_HSK_WORDS = ENV['REPLACE_HSK_WORDS'] !== '0';
const USE_OPENROUTER_TRANSLATION = ENV['USE_OPENROUTER_TRANSLATION'] === '1' || ENV['USE_OPENROUTER_TRANSLATION'] === 'true';
const TRANSLATION_PROVIDER = ENV['TRANSLATION_PROVIDER']
  || (USE_OPENROUTER_TRANSLATION ? 'openrouter' : (GROQ_API_KEY ? 'groq' : 'local'));

const PDF_PATHS = {
  1: ENV['HSK1_PDF_PATH'] || path.join(HOME_DIR, 'Downloads/New-HSK-Vocabulary-Level-1.pdf'),
  2: ENV['HSK2_PDF_PATH'] || path.join(HOME_DIR, 'Downloads/New-HSK-Vocabulary-Level-2.pdf'),
  3: ENV['HSK3_PDF_PATH'] || path.join(HOME_DIR, 'Downloads/New-HSK-Vocabulary-Level-3.pdf'),
  4: ENV['HSK4_PDF_PATH'] || path.join(HOME_DIR, 'Downloads/New-HSK-Vocabulary-Level-4.pdf'),
  5: ENV['HSK5_PDF_PATH'] || path.join(HOME_DIR, 'Downloads/New-HSK-Vocabulary-Level-5.pdf'),
  6: ENV['HSK6_PDF_PATH'] || path.join(HOME_DIR, 'Downloads/New-HSK-Vocabulary-Level-6.pdf'),
};

const COURSE_META = {
  1: {
    name: 'HSK 1',
    name_vi: 'HSK 1',
    description: 'New HSK Level 1 vocabulary for beginner Mandarin learners.',
    description_vi: 'Từ vựng New HSK cấp 1 cho người mới học tiếng Trung.',
  },
  2: {
    name: 'HSK 2',
    name_vi: 'HSK 2',
    description: 'New HSK Level 2 vocabulary for elementary Mandarin learners.',
    description_vi: 'Từ vựng New HSK cấp 2 cho người học tiếng Trung sơ cấp.',
  },
  3: {
    name: 'HSK 3',
    name_vi: 'HSK 3',
    description: 'New HSK Level 3 vocabulary for lower-intermediate Mandarin learners.',
    description_vi: 'Từ vựng New HSK cấp 3 cho người học tiếng Trung tiền trung cấp.',
  },
  4: {
    name: 'HSK 4',
    name_vi: 'HSK 4',
    description: 'New HSK Level 4 vocabulary for intermediate Mandarin learners.',
    description_vi: 'Từ vựng New HSK cấp 4 cho người học tiếng Trung trung cấp.',
  },
  5: {
    name: 'HSK 5',
    name_vi: 'HSK 5',
    description: 'New HSK Level 5 vocabulary for upper-intermediate Mandarin learners.',
    description_vi: 'Từ vựng New HSK cấp 5 cho người học tiếng Trung trung cao cấp.',
  },
  6: {
    name: 'HSK 6',
    name_vi: 'HSK 6',
    description: 'New HSK Level 6 vocabulary for advanced Mandarin learners.',
    description_vi: 'Từ vựng New HSK cấp 6 cho người học tiếng Trung nâng cao.',
  },
};

const EXPECTED_COUNTS = { 1: 300, 2: 200, 3: 500, 4: 1000, 5: 1300, 6: 2500 };

// ---------------------------------------------------------------------------
// Thematic courses — no PDFs; words are hardcoded with bilingual content.
// ---------------------------------------------------------------------------
const THEMATIC_COURSES = [
  {
    name: 'Numbers & Time',
    name_vi: 'Số & Thời gian',
    description: 'Essential numbers and time expressions for everyday Mandarin conversations.',
    description_vi: 'Số đếm và cách diễn đạt thời gian thiết yếu trong giao tiếp hàng ngày.',
    difficulty_level: 1,
    words: [
      { word_zh: '零', word_pinyin: 'líng', word_en: 'zero', word_vi: 'không; số không' },
      { word_zh: '一', word_pinyin: 'yī', word_en: 'one', word_vi: 'một' },
      { word_zh: '二', word_pinyin: 'èr', word_en: 'two', word_vi: 'hai' },
      { word_zh: '三', word_pinyin: 'sān', word_en: 'three', word_vi: 'ba' },
      { word_zh: '四', word_pinyin: 'sì', word_en: 'four', word_vi: 'bốn' },
      { word_zh: '五', word_pinyin: 'wǔ', word_en: 'five', word_vi: 'năm' },
      { word_zh: '六', word_pinyin: 'liù', word_en: 'six', word_vi: 'sáu' },
      { word_zh: '七', word_pinyin: 'qī', word_en: 'seven', word_vi: 'bảy' },
      { word_zh: '八', word_pinyin: 'bā', word_en: 'eight', word_vi: 'tám' },
      { word_zh: '九', word_pinyin: 'jiǔ', word_en: 'nine', word_vi: 'chín' },
      { word_zh: '十', word_pinyin: 'shí', word_en: 'ten', word_vi: 'mười' },
      { word_zh: '百', word_pinyin: 'bǎi', word_en: 'hundred', word_vi: 'một trăm' },
      { word_zh: '千', word_pinyin: 'qiān', word_en: 'thousand', word_vi: 'một nghìn' },
      { word_zh: '万', word_pinyin: 'wàn', word_en: 'ten thousand', word_vi: 'mười nghìn' },
      { word_zh: '亿', word_pinyin: 'yì', word_en: 'hundred million', word_vi: 'một trăm triệu' },
      { word_zh: '半', word_pinyin: 'bàn', word_en: 'half', word_vi: 'nửa; một nửa' },
      { word_zh: '第一', word_pinyin: 'dì yī', word_en: 'first', word_vi: 'thứ nhất' },
      { word_zh: '第二', word_pinyin: 'dì èr', word_en: 'second', word_vi: 'thứ hai' },
      { word_zh: '第三', word_pinyin: 'dì sān', word_en: 'third', word_vi: 'thứ ba' },
      { word_zh: '年', word_pinyin: 'nián', word_en: 'year', word_vi: 'năm' },
      { word_zh: '月', word_pinyin: 'yuè', word_en: 'month', word_vi: 'tháng' },
      { word_zh: '日', word_pinyin: 'rì', word_en: 'day (of month)', word_vi: 'ngày' },
      { word_zh: '号', word_pinyin: 'hào', word_en: 'day (spoken date)', word_vi: 'ngày (nói)' },
      { word_zh: '星期', word_pinyin: 'xīngqī', word_en: 'week; weekday', word_vi: 'tuần; ngày trong tuần' },
      { word_zh: '周', word_pinyin: 'zhōu', word_en: 'week', word_vi: 'tuần' },
      { word_zh: '时', word_pinyin: 'shí', word_en: "o'clock; hour", word_vi: 'giờ; tiếng' },
      { word_zh: '分', word_pinyin: 'fēn', word_en: 'minute', word_vi: 'phút' },
      { word_zh: '秒', word_pinyin: 'miǎo', word_en: 'second', word_vi: 'giây' },
      { word_zh: '小时', word_pinyin: 'xiǎoshí', word_en: 'hour', word_vi: 'tiếng đồng hồ' },
      { word_zh: '分钟', word_pinyin: 'fēnzhōng', word_en: 'minute', word_vi: 'phút' },
      { word_zh: '今天', word_pinyin: 'jīntiān', word_en: 'today', word_vi: 'hôm nay' },
      { word_zh: '明天', word_pinyin: 'míngtiān', word_en: 'tomorrow', word_vi: 'ngày mai' },
      { word_zh: '昨天', word_pinyin: 'zuótiān', word_en: 'yesterday', word_vi: 'hôm qua' },
      { word_zh: '后天', word_pinyin: 'hòutiān', word_en: 'day after tomorrow', word_vi: 'ngày kia' },
      { word_zh: '前天', word_pinyin: 'qiántiān', word_en: 'day before yesterday', word_vi: 'hôm kia' },
      { word_zh: '早上', word_pinyin: 'zǎoshang', word_en: 'early morning', word_vi: 'buổi sáng sớm' },
      { word_zh: '上午', word_pinyin: 'shàngwǔ', word_en: 'morning (a.m.)', word_vi: 'buổi sáng' },
      { word_zh: '中午', word_pinyin: 'zhōngwǔ', word_en: 'noon', word_vi: 'buổi trưa' },
      { word_zh: '下午', word_pinyin: 'xiàwǔ', word_en: 'afternoon', word_vi: 'buổi chiều' },
      { word_zh: '晚上', word_pinyin: 'wǎnshang', word_en: 'evening; night', word_vi: 'buổi tối' },
      { word_zh: '夜晚', word_pinyin: 'yèwǎn', word_en: 'night', word_vi: 'ban đêm' },
      { word_zh: '现在', word_pinyin: 'xiànzài', word_en: 'now', word_vi: 'bây giờ; hiện tại' },
      { word_zh: '以前', word_pinyin: 'yǐqián', word_en: 'before; in the past', word_vi: 'trước đây; trước kia' },
      { word_zh: '以后', word_pinyin: 'yǐhòu', word_en: 'after; in the future', word_vi: 'sau này; sau đó' },
      { word_zh: '刚才', word_pinyin: 'gāngcái', word_en: 'just now; a moment ago', word_vi: 'vừa xong; vừa rồi' },
      { word_zh: '马上', word_pinyin: 'mǎshàng', word_en: 'immediately; right away', word_vi: 'ngay lập tức; ngay bây giờ' },
      { word_zh: '春天', word_pinyin: 'chūntiān', word_en: 'spring', word_vi: 'mùa xuân' },
      { word_zh: '夏天', word_pinyin: 'xiàtiān', word_en: 'summer', word_vi: 'mùa hè' },
      { word_zh: '秋天', word_pinyin: 'qiūtiān', word_en: 'autumn; fall', word_vi: 'mùa thu' },
      { word_zh: '冬天', word_pinyin: 'dōngtiān', word_en: 'winter', word_vi: 'mùa đông' },
    ],
  },
  {
    name: 'Colors & Shapes',
    name_vi: 'Màu sắc & Hình dạng',
    description: 'Learn Chinese colors and geometric shapes with vivid vocabulary.',
    description_vi: 'Học màu sắc và các hình học trong tiếng Trung một cách sinh động.',
    difficulty_level: 1,
    words: [
      { word_zh: '颜色', word_pinyin: 'yánsè', word_en: 'color; colour', word_vi: 'màu sắc' },
      { word_zh: '红色', word_pinyin: 'hóngsè', word_en: 'red', word_vi: 'màu đỏ' },
      { word_zh: '橙色', word_pinyin: 'chéngsè', word_en: 'orange', word_vi: 'màu cam' },
      { word_zh: '黄色', word_pinyin: 'huángsè', word_en: 'yellow', word_vi: 'màu vàng' },
      { word_zh: '绿色', word_pinyin: 'lǜsè', word_en: 'green', word_vi: 'màu xanh lá' },
      { word_zh: '蓝色', word_pinyin: 'lánsè', word_en: 'blue', word_vi: 'màu xanh lam' },
      { word_zh: '紫色', word_pinyin: 'zǐsè', word_en: 'purple; violet', word_vi: 'màu tím' },
      { word_zh: '白色', word_pinyin: 'báisè', word_en: 'white', word_vi: 'màu trắng' },
      { word_zh: '黑色', word_pinyin: 'hēisè', word_en: 'black', word_vi: 'màu đen' },
      { word_zh: '灰色', word_pinyin: 'huīsè', word_en: 'grey; gray', word_vi: 'màu xám' },
      { word_zh: '粉色', word_pinyin: 'fěnsè', word_en: 'pink', word_vi: 'màu hồng' },
      { word_zh: '棕色', word_pinyin: 'zōngsè', word_en: 'brown', word_vi: 'màu nâu' },
      { word_zh: '金色', word_pinyin: 'jīnsè', word_en: 'gold; golden', word_vi: 'màu vàng kim' },
      { word_zh: '银色', word_pinyin: 'yínsè', word_en: 'silver', word_vi: 'màu bạc' },
      { word_zh: '深', word_pinyin: 'shēn', word_en: 'deep; dark (color)', word_vi: 'đậm; tối (màu)' },
      { word_zh: '浅', word_pinyin: 'qiǎn', word_en: 'light; pale (color)', word_vi: 'nhạt; sáng (màu)' },
      { word_zh: '亮', word_pinyin: 'liàng', word_en: 'bright; shiny', word_vi: 'sáng; bóng' },
      { word_zh: '形状', word_pinyin: 'xíngzhuàng', word_en: 'shape; form', word_vi: 'hình dạng' },
      { word_zh: '圆形', word_pinyin: 'yuánxíng', word_en: 'circle', word_vi: 'hình tròn' },
      { word_zh: '正方形', word_pinyin: 'zhèngfāngxíng', word_en: 'square', word_vi: 'hình vuông' },
      { word_zh: '长方形', word_pinyin: 'chángfāngxíng', word_en: 'rectangle', word_vi: 'hình chữ nhật' },
      { word_zh: '三角形', word_pinyin: 'sānjiǎoxíng', word_en: 'triangle', word_vi: 'hình tam giác' },
      { word_zh: '椭圆形', word_pinyin: 'tuǒyuánxíng', word_en: 'oval; ellipse', word_vi: 'hình bầu dục' },
      { word_zh: '菱形', word_pinyin: 'língxíng', word_en: 'diamond; rhombus', word_vi: 'hình thoi' },
      { word_zh: '五角形', word_pinyin: 'wǔjiǎoxíng', word_en: 'pentagon', word_vi: 'hình ngũ giác' },
      { word_zh: '六边形', word_pinyin: 'liùbiānxíng', word_en: 'hexagon', word_vi: 'hình lục giác' },
      { word_zh: '星形', word_pinyin: 'xīngxíng', word_en: 'star shape', word_vi: 'hình ngôi sao' },
      { word_zh: '心形', word_pinyin: 'xīnxíng', word_en: 'heart shape', word_vi: 'hình trái tim' },
      { word_zh: '大', word_pinyin: 'dà', word_en: 'big; large', word_vi: 'lớn; to' },
      { word_zh: '小', word_pinyin: 'xiǎo', word_en: 'small; little', word_vi: 'nhỏ; bé' },
      { word_zh: '长', word_pinyin: 'cháng', word_en: 'long', word_vi: 'dài' },
      { word_zh: '短', word_pinyin: 'duǎn', word_en: 'short; brief', word_vi: 'ngắn' },
      { word_zh: '高', word_pinyin: 'gāo', word_en: 'tall; high', word_vi: 'cao' },
      { word_zh: '低', word_pinyin: 'dī', word_en: 'low; short (height)', word_vi: 'thấp' },
      { word_zh: '宽', word_pinyin: 'kuān', word_en: 'wide; broad', word_vi: 'rộng' },
      { word_zh: '窄', word_pinyin: 'zhǎi', word_en: 'narrow', word_vi: 'hẹp' },
      { word_zh: '厚', word_pinyin: 'hòu', word_en: 'thick', word_vi: 'dày' },
      { word_zh: '薄', word_pinyin: 'báo', word_en: 'thin; slim', word_vi: 'mỏng' },
    ],
  },
  {
    name: 'Kitchen & Food',
    name_vi: 'Bếp & Thức ăn',
    description: 'Essential food and kitchen vocabulary for everyday life in China.',
    description_vi: 'Từ vựng thức ăn và nhà bếp thiết yếu cho cuộc sống hàng ngày.',
    difficulty_level: 1,
    words: [
      { word_zh: '厨房', word_pinyin: 'chúfáng', word_en: 'kitchen', word_vi: 'nhà bếp; bếp' },
      { word_zh: '餐厅', word_pinyin: 'cāntīng', word_en: 'restaurant; dining room', word_vi: 'nhà hàng; phòng ăn' },
      { word_zh: '锅', word_pinyin: 'guō', word_en: 'pot; wok', word_vi: 'nồi; chảo' },
      { word_zh: '碗', word_pinyin: 'wǎn', word_en: 'bowl', word_vi: 'bát; chén' },
      { word_zh: '盘子', word_pinyin: 'pánzi', word_en: 'plate; dish', word_vi: 'đĩa' },
      { word_zh: '筷子', word_pinyin: 'kuàizi', word_en: 'chopsticks', word_vi: 'đũa' },
      { word_zh: '勺子', word_pinyin: 'sháozi', word_en: 'spoon; ladle', word_vi: 'thìa; muỗng' },
      { word_zh: '刀', word_pinyin: 'dāo', word_en: 'knife', word_vi: 'dao' },
      { word_zh: '叉子', word_pinyin: 'chāzi', word_en: 'fork', word_vi: 'nĩa' },
      { word_zh: '菜板', word_pinyin: 'càibǎn', word_en: 'chopping board', word_vi: 'thớt' },
      { word_zh: '冰箱', word_pinyin: 'bīngxiāng', word_en: 'refrigerator; fridge', word_vi: 'tủ lạnh' },
      { word_zh: '微波炉', word_pinyin: 'wēibōlú', word_en: 'microwave oven', word_vi: 'lò vi sóng' },
      { word_zh: '烤箱', word_pinyin: 'kǎoxiāng', word_en: 'oven', word_vi: 'lò nướng' },
      { word_zh: '炉子', word_pinyin: 'lúzi', word_en: 'stove; cooker', word_vi: 'bếp lò' },
      { word_zh: '杯子', word_pinyin: 'bēizi', word_en: 'cup; glass', word_vi: 'cốc; ly' },
      { word_zh: '水', word_pinyin: 'shuǐ', word_en: 'water', word_vi: 'nước' },
      { word_zh: '米饭', word_pinyin: 'mǐfàn', word_en: 'cooked rice', word_vi: 'cơm' },
      { word_zh: '面条', word_pinyin: 'miàntiáo', word_en: 'noodles', word_vi: 'mì; bún' },
      { word_zh: '包子', word_pinyin: 'bāozi', word_en: 'steamed stuffed bun', word_vi: 'bánh bao' },
      { word_zh: '饺子', word_pinyin: 'jiǎozi', word_en: 'dumpling', word_vi: 'sủi cảo; bánh vằn thắn' },
      { word_zh: '馒头', word_pinyin: 'mántou', word_en: 'steamed bread', word_vi: 'bánh bao không nhân' },
      { word_zh: '汤', word_pinyin: 'tāng', word_en: 'soup; broth', word_vi: 'súp; canh' },
      { word_zh: '菜', word_pinyin: 'cài', word_en: 'vegetable; dish', word_vi: 'rau; món ăn' },
      { word_zh: '肉', word_pinyin: 'ròu', word_en: 'meat', word_vi: 'thịt' },
      { word_zh: '鸡肉', word_pinyin: 'jīròu', word_en: 'chicken (meat)', word_vi: 'thịt gà' },
      { word_zh: '猪肉', word_pinyin: 'zhūròu', word_en: 'pork', word_vi: 'thịt lợn; thịt heo' },
      { word_zh: '牛肉', word_pinyin: 'niúròu', word_en: 'beef', word_vi: 'thịt bò' },
      { word_zh: '羊肉', word_pinyin: 'yángròu', word_en: 'mutton; lamb', word_vi: 'thịt cừu; thịt dê' },
      { word_zh: '鱼', word_pinyin: 'yú', word_en: 'fish', word_vi: 'cá' },
      { word_zh: '虾', word_pinyin: 'xiā', word_en: 'shrimp; prawn', word_vi: 'tôm' },
      { word_zh: '鸡蛋', word_pinyin: 'jīdàn', word_en: 'egg', word_vi: 'trứng gà' },
      { word_zh: '豆腐', word_pinyin: 'dòufu', word_en: 'tofu; bean curd', word_vi: 'đậu phụ' },
      { word_zh: '蔬菜', word_pinyin: 'shūcài', word_en: 'vegetables', word_vi: 'rau củ' },
      { word_zh: '水果', word_pinyin: 'shuǐguǒ', word_en: 'fruit', word_vi: 'trái cây; hoa quả' },
      { word_zh: '苹果', word_pinyin: 'píngguǒ', word_en: 'apple', word_vi: 'táo' },
      { word_zh: '香蕉', word_pinyin: 'xiāngjiāo', word_en: 'banana', word_vi: 'chuối' },
      { word_zh: '橙子', word_pinyin: 'chéngzi', word_en: 'orange', word_vi: 'cam' },
      { word_zh: '葡萄', word_pinyin: 'pútao', word_en: 'grape', word_vi: 'nho' },
      { word_zh: '西瓜', word_pinyin: 'xīguā', word_en: 'watermelon', word_vi: 'dưa hấu' },
      { word_zh: '草莓', word_pinyin: 'cǎoméi', word_en: 'strawberry', word_vi: 'dâu tây' },
      { word_zh: '油', word_pinyin: 'yóu', word_en: 'oil', word_vi: 'dầu ăn' },
      { word_zh: '盐', word_pinyin: 'yán', word_en: 'salt', word_vi: 'muối' },
      { word_zh: '糖', word_pinyin: 'táng', word_en: 'sugar; candy', word_vi: 'đường; kẹo' },
      { word_zh: '醋', word_pinyin: 'cù', word_en: 'vinegar', word_vi: 'giấm' },
      { word_zh: '酱油', word_pinyin: 'jiàngyóu', word_en: 'soy sauce', word_vi: 'nước tương' },
      { word_zh: '辣椒', word_pinyin: 'làjiāo', word_en: 'chilli pepper', word_vi: 'ớt' },
      { word_zh: '大蒜', word_pinyin: 'dàsuàn', word_en: 'garlic', word_vi: 'tỏi' },
      { word_zh: '姜', word_pinyin: 'jiāng', word_en: 'ginger', word_vi: 'gừng' },
      { word_zh: '煮', word_pinyin: 'zhǔ', word_en: 'to boil; to cook', word_vi: 'luộc; nấu' },
      { word_zh: '炒', word_pinyin: 'chǎo', word_en: 'to stir-fry', word_vi: 'xào' },
      { word_zh: '烤', word_pinyin: 'kǎo', word_en: 'to roast; to grill; to bake', word_vi: 'nướng' },
      { word_zh: '蒸', word_pinyin: 'zhēng', word_en: 'to steam', word_vi: 'hấp' },
      { word_zh: '炸', word_pinyin: 'zhá', word_en: 'to deep-fry', word_vi: 'chiên ngập dầu' },
      { word_zh: '切', word_pinyin: 'qiē', word_en: 'to cut; to slice', word_vi: 'cắt; thái' },
      { word_zh: '好吃', word_pinyin: 'hǎochī', word_en: 'delicious; tasty', word_vi: 'ngon; ngon miệng' },
      { word_zh: '甜', word_pinyin: 'tián', word_en: 'sweet', word_vi: 'ngọt' },
      { word_zh: '咸', word_pinyin: 'xián', word_en: 'salty', word_vi: 'mặn' },
      { word_zh: '辣', word_pinyin: 'là', word_en: 'spicy; hot', word_vi: 'cay' },
      { word_zh: '酸', word_pinyin: 'suān', word_en: 'sour', word_vi: 'chua' },
      { word_zh: '苦', word_pinyin: 'kǔ', word_en: 'bitter', word_vi: 'đắng' },
    ],
  },
];

if (!DRY_RUN && !EXPORT_JSON_PATH && (!SUPABASE_URL || !SERVICE_KEY)) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const SUPABASE_HOST = SUPABASE_URL ? new URL(SUPABASE_URL).hostname : '';

function wordKey(word) {
  return `${word.word_zh}|${word.word_pinyin}`;
}

function req(method, requestPath, body, prefer = 'return=representation') {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const r = https.request({
      hostname: SUPABASE_HOST,
      port: 443,
      path: `/rest/v1${requestPath}`,
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        Prefer: prefer,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    }, (res) => {
      let buf = '';
      res.on('data', (chunk) => { buf += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, body: buf }));
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function readTextFromPdf(pdfPath) {
  if (!fs.existsSync(pdfPath)) throw new Error(`PDF not found: ${pdfPath}`);
  return execFileSync(PDFTOTEXT_BIN, ['-layout', pdfPath, '-'], {
    encoding: 'utf8',
    maxBuffer: 128 * 1024 * 1024,
  });
}

function isHeaderOrFooter(line) {
  return !line
    || /^>{2}$/.test(line)
    || /^New HSK Vocabulary/i.test(line)
    || /^NEW HSK VOCABULARY/i.test(line)
    || /^Level \d/i.test(line)
    || /^ENTRIES$/i.test(line)
    || /^NO\./i.test(line)
    || /^MandarinBean\.com/i.test(line)
    || /^Page \d+/i.test(line)
    || /^⇨/.test(line);
}

function looksLikePartOfSpeech(text) {
  return /\b(verb|noun|adjective|adverb|number|classifier|preposition|conjunction|pronoun|auxiliary|interjection|prefix|suffix|particle)\b/i.test(text)
    || /^[、（）()，,; ]+$/.test(text);
}

function splitRow(line) {
  const columns = line.trim().split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
  if (!/^\d+$/.test(columns[0] || '') || columns.length < 4) return null;

  const no = Number(columns[0]);
  const word_zh = columns[1];
  const word_pinyin = columns[2];
  const rest = columns.slice(3);
  const hasPos = looksLikePartOfSpeech(rest[0] || '');
  const word_en = (hasPos ? rest.slice(1) : rest).join(' ').trim();

  return {
    no,
    word_zh,
    word_pinyin,
    word_en,
  };
}

function continuationText(line) {
  const columns = line.trim().split(/\s{2,}/).map((part) => part.trim()).filter(Boolean);
  if (columns.length > 1) return columns.at(-1);
  return columns[0] || '';
}

function cleanEnglish(value) {
  return value
    .replace(/[（）]/g, (char) => char === '（' ? '(' : ')')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
}

function parseVocabularyPdf(level) {
  const text = readTextFromPdf(PDF_PATHS[level]);
  const rows = [];
  let current = null;

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\f/g, '').trimEnd();
    const trimmed = line.trim();
    if (isHeaderOrFooter(trimmed)) continue;

    const row = splitRow(line);
    if (row) {
      if (current) rows.push(current);
      current = row;
      continue;
    }

    if (!current) continue;
    const continuation = continuationText(line);
    if (!continuation || looksLikePartOfSpeech(continuation)) continue;
    current.word_en = cleanEnglish(`${current.word_en} ${continuation}`);
  }

  if (current) rows.push(current);

  return rows
    .filter((row) => row.word_zh && row.word_pinyin && row.word_en)
    .map((row, index) => ({
      word_zh: row.word_zh,
      word_pinyin: row.word_pinyin,
      word_en: cleanEnglish(row.word_en),
      word_vi: null,
      hsk_level: level,
      sort_order: index + 1,
    }));
}

function parseJsonObject(content) {
  const clean = content.replace(/```json|```/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  return JSON.parse(match ? match[0] : clean);
}

function loadTranslationCache() {
  if (!TRANSLATION_CACHE_PATH || !fs.existsSync(TRANSLATION_CACHE_PATH)) return {};
  return JSON.parse(fs.readFileSync(TRANSLATION_CACHE_PATH, 'utf8'));
}

function saveTranslationCache(cache) {
  if (!TRANSLATION_CACHE_PATH) return;
  fs.writeFileSync(TRANSLATION_CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJsonWithRetry(url, options, label) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const res = await fetch(url, options);
    if (res.ok) return res.json();

    const text = await res.text();
    if (res.status !== 429 && res.status < 500) {
      throw new Error(`${label} failed: ${res.status} ${text}`);
    }

    const retryAfter = Number(res.headers.get('retry-after'));
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : 1500 * (attempt + 1);
    console.log(`${label} throttled (${res.status}); retrying in ${waitMs}ms`);
    await sleep(waitMs);
  }

  throw new Error(`${label} failed after retries.`);
}

const EXACT_VI = new Map(Object.entries({
  'ah, oh': 'à, ồ',
  'all, both': 'tất cả; cả hai',
  'almost, similar; nearly': 'gần như; tương tự; suýt',
  'aunt': 'dì; cô',
  'backpack': 'ba lô',
  'bad, poor; to lack': 'kém; thiếu',
  'bed': 'giường',
  'big': 'lớn; to',
  'black': 'màu đen',
  'bus': 'xe buýt',
  'cinema': 'rạp chiếu phim',
  'class, grade': 'lớp; khối lớp',
  'class, team; (measure word for groups)': 'lớp; đội; lượng từ cho nhóm',
  'common': 'phổ biến; thường gặp',
  'commonly used': 'thường dùng',
  'company': 'công ty',
  'computer': 'máy tính',
  'correct, right; to, toward, for; (to treat; pair)': 'đúng; đối với; cặp',
  'cup, glass': 'cốc; ly',
  'dad': 'bố; ba',
  'daytime': 'ban ngày',
  'different': 'khác nhau',
  'eight': 'tám',
  'everyone': 'mọi người',
  'for example': 'ví dụ',
  'from childhood': 'từ nhỏ',
  'happy, glad': 'vui; phấn khởi',
  'height, stature': 'chiều cao; vóc dáng',
  'help': 'giúp đỡ',
  'hotel': 'khách sạn',
  'hundred': 'một trăm',
  'illness, disease; to be ill': 'bệnh; bị bệnh',
  'ice cream': 'kem',
  'menu': 'thực đơn',
  'movie, film': 'phim',
  'newspaper': 'báo',
  'not, no': 'không',
  'not bad, pretty good': 'khá tốt; không tệ',
  'not allowed, won\'t do; not good': 'không được; không ổn',
  'not only': 'không những',
  'notebook': 'vở; sổ tay',
  'office': 'văn phòng',
  'on time, on schedule': 'đúng giờ; đúng lịch',
  'other': 'khác',
  'other people': 'người khác',
  'patient': 'bệnh nhân',
  'pen; (measure word for writing tools)': 'bút; lượng từ cho bút',
  'quiet': 'yên tĩnh',
  'safe': 'an toàn',
  'side; suffix indicating direction': 'bên; phía',
  'song': 'bài hát',
  'sorry': 'xin lỗi',
  'sorry, apologetic': 'xin lỗi; áy náy',
  'spouse': 'vợ/chồng',
  'station': 'nhà ga; trạm',
  'supermarket': 'siêu thị',
  'taxi': 'taxi',
  'tea': 'trà',
  'telephone, phone call': 'điện thoại; cuộc gọi',
  'television': 'tivi; truyền hình',
  'thing, object': 'đồ vật; sự vật',
  'to arrive': 'đến; tới',
  'to arrange': 'sắp xếp',
  'to be convenient for, to facilitate': 'thuận tiện cho; tạo điều kiện',
  'to become, to turn into': 'trở thành; biến thành',
  'to broadcast, to play': 'phát sóng; phát',
  'to carry on the back': 'đeo; cõng',
  'to celebrate the New Year': 'ăn Tết; đón năm mới',
  'to change, to become': 'thay đổi; trở thành',
  'to check': 'kiểm tra; tra cứu',
  'to come out': 'đi ra; xuất hiện',
  'to come over': 'đến đây; lại đây',
  'to compare; quite, relatively; than': 'so sánh; khá; hơn',
  'to compete; game, match': 'thi đấu; trận đấu',
  'to disappear, to not see': 'biến mất; không thấy',
  'to do, to handle': 'làm; xử lý',
  'to eat': 'ăn',
  'to fly': 'bay',
  'to freeze': 'đóng băng',
  'to give; (to, for)': 'cho; đưa cho',
  'to go abroad': 'ra nước ngoài',
  'to go out': 'đi ra ngoài',
  'to go out, to leave': 'đi ra; rời đi',
  'to go over': 'đi qua; đi tới',
  'to guarantee, to ensure; guarantee, assurance': 'bảo đảm; cam đoan; sự bảo đảm',
  'to handle matters, to take care of things': 'xử lý công việc; làm việc',
  'to help': 'giúp; giúp đỡ',
  'to hit, to play, to make': 'đánh; chơi; gọi/làm',
  'to hold, to embrace, to hug': 'ôm; bế',
  'to join, to attend': 'tham gia; tham dự',
  'to light, to ignite; (point, dot; to order)': 'châm; đốt; điểm; gọi món',
  'to like; hobby': 'thích; sở thích',
  'to love': 'yêu',
  'to make a phone call': 'gọi điện thoại',
  'to move house': 'chuyển nhà',
  'to move, to act': 'di chuyển; hành động',
  'to open': 'mở',
  'to perform, to act': 'biểu diễn; diễn',
  'to press, to push; according to': 'ấn; nhấn; theo',
  'to protect': 'bảo vệ',
  'to read': 'đọc',
  'to read a book': 'đọc sách',
  'to sing': 'hát',
  'to sign up, to register': 'đăng ký',
  'to taste': 'nếm',
  'to tell': 'nói cho biết; kể',
  'to understand': 'hiểu',
  'to wait; (and so on, until)': 'đợi; chờ; vân vân; đến khi',
  'to wear': 'mặc; đội; đeo',
  'university': 'đại học',
  'university student': 'sinh viên đại học',
  'vehicle, car': 'xe; ô tô',
  'very, extremely': 'rất; cực kỳ',
  'way, solution': 'cách; giải pháp',
  'white': 'màu trắng',
  'word, term': 'từ; thuật ngữ',
  'work; to work': 'công việc; làm việc',
  'wrong, mistaken': 'sai; nhầm',
  'you\'re welcome': 'không có gì; đừng khách sáo',
  'younger brother': 'em trai',
}));

const VI_REPLACEMENTS = [
  ['measure word for', 'lượng từ cho'],
  ['particle indicating', 'trợ từ biểu thị'],
  ['according to', 'theo'],
  ['in accordance with', 'theo đúng'],
  ['no matter', 'bất kể'],
  ['regardless of', 'bất kể'],
  ['not necessary', 'không cần thiết'],
  ['need not', 'không cần'],
  ['not enough', 'không đủ'],
  ['continuous', 'liên tục'],
  ['constantly', 'không ngừng'],
  ['inconvenient', 'bất tiện'],
  ['to be short of money', 'thiếu tiền'],
  ['to take a taxi', 'đi taxi'],
  ['to wrap', 'gói'],
  ['to pack', 'đóng gói'],
  ['to compare', 'so sánh'],
  ['to understand', 'hiểu'],
  ['to move', 'di chuyển'],
  ['to act', 'hành động'],
  ['to pass', 'đi qua'],
  ['to cross', 'băng qua'],
  ['to follow', 'theo'],
  ['to accompany', 'đi cùng'],
  ['to change', 'thay đổi'],
  ['to become', 'trở thành'],
  ['to perform', 'biểu diễn'],
  ['to disappear', 'biến mất'],
  ['to attend', 'tham dự'],
  ['to join', 'tham gia'],
  ['to taste', 'nếm'],
  ['to protect', 'bảo vệ'],
  ['to guarantee', 'bảo đảm'],
  ['to ensure', 'đảm bảo'],
  ['to arrange', 'sắp xếp'],
  ['to handle', 'xử lý'],
  ['to apply for', 'đăng ký'],
  ['to register', 'đăng ký'],
  ['to broadcast', 'phát sóng'],
  ['to play', 'chơi; phát'],
  ['to combine', 'kết hợp'],
  ['to merge', 'gộp lại'],
  ['to press', 'ấn'],
  ['to push', 'đẩy'],
  ['to carry', 'mang; cầm'],
  ['to love', 'yêu'],
  ['to like', 'thích'],
  ['to help', 'giúp đỡ'],
  ['to sing', 'hát'],
  ['to wear', 'mặc; đội; đeo'],
  ['to arrive', 'đến'],
  ['to read', 'đọc'],
  ['to eat', 'ăn'],
  ['to fly', 'bay'],
  ['to give', 'cho'],
  ['to hit', 'đánh'],
  ['to make', 'làm'],
  ['to tell', 'nói cho biết'],
  ['to wait', 'đợi'],
  ['actually', 'thực ra'],
  ['adverb', 'trạng từ'],
  ['adjective', 'tính từ'],
  ['auxiliary', 'trợ từ'],
  ['classifier', 'lượng từ'],
  ['conjunction', 'liên từ'],
  ['interjection', 'thán từ'],
  ['number', 'số từ'],
  ['noun', 'danh từ'],
  ['particle', 'trợ từ'],
  ['preposition', 'giới từ'],
  ['pronoun', 'đại từ'],
  ['suffix', 'hậu tố'],
  ['prefix', 'tiền tố'],
  ['verb', 'động từ'],
  ['actually', 'thực ra'],
  ['again', 'lại; lần nữa'],
  ['airplane', 'máy bay'],
  ['all', 'tất cả'],
  ['almost', 'gần như'],
  ['assurance', 'sự bảo đảm'],
  ['backpack', 'ba lô'],
  ['bad', 'kém; xấu'],
  ['bag', 'túi'],
  ['bed', 'giường'],
  ['black', 'màu đen'],
  ['brother', 'anh/em trai'],
  ['bus', 'xe buýt'],
  ['car', 'ô tô'],
  ['cinema', 'rạp chiếu phim'],
  ['class', 'lớp'],
  ['company', 'công ty'],
  ['compassion', 'lòng trắc ẩn'],
  ['computer', 'máy tính'],
  ['confirmation', 'xác nhận'],
  ['correct', 'đúng'],
  ['cup', 'cốc'],
  ['dad', 'bố'],
  ['daytime', 'ban ngày'],
  ['degree', 'mức độ'],
  ['department', 'bộ phận; phòng ban'],
  ['direction', 'phương hướng'],
  ['disease', 'bệnh'],
  ['doctor', 'tiến sĩ; bác sĩ'],
  ['eight', 'tám'],
  ['everyone', 'mọi người'],
  ['excellent', 'xuất sắc'],
  ['excessive', 'quá mức'],
  ['exam', 'kỳ thi'],
  ['film', 'phim'],
  ['floor', 'tầng'],
  ['former', 'trước đây'],
  ['frequent', 'thường xuyên'],
  ['game', 'trận đấu; trò chơi'],
  ['glass', 'ly'],
  ['grade', 'khối lớp'],
  ['great', 'tuyệt; lớn'],
  ['grassland', 'bãi cỏ'],
  ['grass', 'cỏ'],
  ['guarantee', 'sự bảo đảm'],
  ['handle', 'tay cầm; xử lý'],
  ['height', 'chiều cao'],
  ['hesitation', 'do dự'],
  ['hobby', 'sở thích'],
  ['hundred', 'trăm'],
  ['illness', 'bệnh'],
  ['layer', 'lớp'],
  ['liquor', 'rượu mạnh'],
  ['love', 'tình yêu'],
  ['menu', 'thực đơn'],
  ['metro', 'tàu điện ngầm'],
  ['movie', 'phim'],
  ['newspaper', 'báo'],
  ['north', 'phía bắc'],
  ['notebook', 'vở; sổ tay'],
  ['office', 'văn phòng'],
  ['original', 'ban đầu'],
  ['patient', 'bệnh nhân'],
  ['pen', 'bút'],
  ['point', 'điểm'],
  ['quiet', 'yên tĩnh'],
  ['restaurant', 'nhà hàng'],
  ['right', 'đúng'],
  ['safe', 'an toàn'],
  ['security check', 'kiểm tra an ninh'],
  ['shop', 'cửa hàng'],
  ['solution', 'giải pháp'],
  ['song', 'bài hát'],
  ['sorry', 'xin lỗi'],
  ['spouse', 'vợ/chồng'],
  ['station', 'nhà ga; trạm'],
  ['student', 'sinh viên; học sinh'],
  ['suggestion', 'gợi ý'],
  ['supermarket', 'siêu thị'],
  ['team', 'đội'],
  ['telephone', 'điện thoại'],
  ['television', 'tivi'],
  ['thing', 'đồ vật'],
  ['university', 'đại học'],
  ['vehicle', 'xe cộ'],
  ['white', 'màu trắng'],
  ['word', 'từ'],
  ['work', 'công việc; làm việc'],
  ['wrong', 'sai'],
];

function generateVietnameseMeaning(word) {
  const exact = EXACT_VI.get(word.word_en.toLowerCase());
  if (exact) return exact;

  const parts = word.word_en
    .split(/;|,(?![^()]*\))/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase().replace(/[()]/g, '').trim();
      if (EXACT_VI.has(lower)) return EXACT_VI.get(lower);
      let translated = lower;
      for (const [en, vi] of VI_REPLACEMENTS) {
        translated = translated.replace(new RegExp(`\\b${en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi'), vi);
      }
      return translated;
    });

  return [...new Set(parts)].join('; ');
}

async function translateWithOpenRouter(words) {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY is required to generate Vietnamese translations.');
  }

  const cache = loadTranslationCache();
  for (const word of words) word.word_vi = cache[wordKey(word)] || null;

  const missingWords = words.filter((word) => !word.word_vi);
  for (let i = 0; i < missingWords.length; i += 50) {
    const batch = missingWords.slice(i, i + 50);
    const json = await fetchJsonWithRetry('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_TEXT_MODEL,
        temperature: 0,
        messages: [{
          role: 'user',
          content: [
            'Translate these Mandarin vocabulary definitions to Vietnamese.',
            'Return only a JSON object mapping each id to a concise Vietnamese meaning.',
            'Keep the learner-facing meaning short but preserve multiple senses when important.',
            JSON.stringify(batch.map((word) => ({
              id: wordKey(word),
              word_zh: word.word_zh,
              word_pinyin: word.word_pinyin,
              word_en: word.word_en,
            }))),
          ].join('\n'),
        }],
      }),
    }, 'OpenRouter Vietnamese translation');
    const translations = parseJsonObject(json.choices?.[0]?.message?.content || '{}');
    for (const word of batch) {
      word.word_vi = translations[wordKey(word)] || null;
      if (word.word_vi) cache[wordKey(word)] = word.word_vi;
    }
    saveTranslationCache(cache);
    console.log(`Translated ${Math.min(i + batch.length, missingWords.length)}/${missingWords.length} missing rows with OpenRouter`);
  }

  const missing = words.filter((word) => !word.word_vi);
  if (missing.length) {
    throw new Error(`Vietnamese translation incomplete for ${missing.length} rows. First missing: ${missing[0].word_zh}`);
  }
}

async function translateWithGroq(words) {
  if (!GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is required for TRANSLATION_PROVIDER=groq.');
  }

  const cache = loadTranslationCache();
  for (const word of words) word.word_vi = cache[wordKey(word)] || null;

  const missingWords = words.filter((word) => !word.word_vi);
  for (let i = 0; i < missingWords.length; i += 25) {
    const batch = missingWords.slice(i, i + 25);
    const json = await fetchJsonWithRetry('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_TEXT_MODEL,
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [{
          role: 'user',
          content: [
            'Translate these Mandarin vocabulary definitions to Vietnamese for a language-learning app.',
            'Return only a JSON object mapping each id to a concise Vietnamese meaning.',
            'Preserve multiple senses when useful, separated by semicolons.',
            'Do not include English unless it is a standard Vietnamese loanword or proper name.',
            JSON.stringify(batch.map((word) => ({
              id: wordKey(word),
              word_zh: word.word_zh,
              word_pinyin: word.word_pinyin,
              word_en: word.word_en,
            }))),
          ].join('\n'),
        }],
      }),
    }, 'Groq Vietnamese translation');
    const translations = parseJsonObject(json.choices?.[0]?.message?.content || '{}');
    for (const word of batch) {
      word.word_vi = translations[wordKey(word)] || null;
      if (word.word_vi) cache[wordKey(word)] = word.word_vi;
    }
    saveTranslationCache(cache);
    console.log(`Translated ${Math.min(i + batch.length, missingWords.length)}/${missingWords.length} missing rows with Groq`);
  }

  const missing = words.filter((word) => !word.word_vi);
  if (missing.length) {
    throw new Error(`Vietnamese translation incomplete for ${missing.length} rows. First missing: ${missing[0].word_zh}`);
  }
}

async function translateToVietnamese(words) {
  if (TRANSLATION_PROVIDER === 'groq') {
    await translateWithGroq(words);
    return;
  }

  if (TRANSLATION_PROVIDER === 'openrouter') {
    await translateWithOpenRouter(words);
    return;
  }

  if (TRANSLATION_PROVIDER !== 'local') {
    throw new Error(`Unsupported TRANSLATION_PROVIDER: ${TRANSLATION_PROVIDER}`);
  }

  for (const word of words) word.word_vi = generateVietnameseMeaning(word);
}

async function upsertCourse(level) {
  const meta = COURSE_META[level];
  const found = await req('GET', `/vocabulary_courses?select=id&creator_id=is.null&name=eq.${encodeURIComponent(meta.name)}&limit=1`, null, 'return=representation');
  if (found.status >= 300) throw new Error(`Course lookup failed for HSK ${level}: ${found.body}`);
  const existing = JSON.parse(found.body)[0];

  if (existing?.id) {
    const patched = await req('PATCH', `/vocabulary_courses?id=eq.${existing.id}`, {
      ...meta,
      difficulty_level: level,
      is_published: true,
      creator_id: null,
    }, 'return=minimal');
    if (patched.status >= 300) throw new Error(`Course update failed for HSK ${level}: ${patched.body}`);
    return existing.id;
  }

  const created = await req('POST', '/vocabulary_courses', {
    ...meta,
    difficulty_level: level,
    is_published: true,
    creator_id: null,
  });
  if (created.status >= 300) throw new Error(`Course insert failed for HSK ${level}: ${created.body}`);
  return JSON.parse(created.body)[0].id;
}

async function upsertWords(courseId, words) {
  const existingRes = await req('GET', `/course_vocabulary_items?select=id,word_zh,word_pinyin&course_id=eq.${courseId}`);
  if (existingRes.status >= 300) throw new Error(`Existing word lookup failed: ${existingRes.body}`);
  const existingRows = JSON.parse(existingRes.body);

  if (REPLACE_HSK_WORDS && existingRows.length) {
    let deleted = 0;
    for (let i = 0; i < existingRows.length; i += 100) {
      const ids = existingRows.slice(i, i + 100).map((row) => row.id).join(',');
      const res = await req('DELETE', `/course_vocabulary_items?id=in.(${ids})`, null, 'return=minimal');
      if (res.status >= 300) throw new Error(`Existing word clear failed: ${res.body}`);
      deleted += existingRows.slice(i, i + 100).length;
    }

    let inserted = 0;
    for (let i = 0; i < words.length; i += 100) {
      const batch = words.slice(i, i + 100).map((word) => ({ course_id: courseId, ...word }));
      const res = await req('POST', '/course_vocabulary_items', batch, 'return=minimal');
      if (res.status >= 300) throw new Error(`Word insert batch failed: ${res.body}`);
      inserted += batch.length;
    }

    return { inserted, updated: 0, deleted };
  }

  const existing = new Map(existingRows.map((row) => [`${row.word_zh}|${row.word_pinyin}`, row.id]));
  const desiredKeys = new Set(words.map(wordKey));

  const inserts = [];
  let updated = 0;
  for (const word of words) {
    const id = existing.get(wordKey(word));
    if (!id) {
      inserts.push({ course_id: courseId, ...word });
      continue;
    }
    const patched = await req('PATCH', `/course_vocabulary_items?id=eq.${id}`, word, 'return=minimal');
    if (patched.status >= 300) throw new Error(`Word update failed for ${word.word_zh}: ${patched.body}`);
    updated += 1;
  }

  let inserted = 0;
  for (let i = 0; i < inserts.length; i += 100) {
    const batch = inserts.slice(i, i + 100);
    const res = await req('POST', '/course_vocabulary_items', batch, 'return=minimal');
    if (res.status >= 300) throw new Error(`Word insert batch failed: ${res.body}`);
    inserted += batch.length;
  }

  const staleIds = [...existing.entries()]
    .filter(([key]) => !desiredKeys.has(key))
    .map(([, id]) => id);
  let deleted = 0;
  for (let i = 0; i < staleIds.length; i += 100) {
    const ids = staleIds.slice(i, i + 100).join(',');
    const res = await req('DELETE', `/course_vocabulary_items?id=in.(${ids})`, null, 'return=minimal');
    if (res.status >= 300) throw new Error(`Stale word delete failed: ${res.body}`);
    deleted += staleIds.slice(i, i + 100).length;
  }

  return { inserted, updated, deleted };
}

async function seedThematicCourse(courseData) {
  const { name, name_vi, description, description_vi, difficulty_level, words } = courseData;

  // Look up existing course by name
  const found = await req('GET', `/vocabulary_courses?select=id&creator_id=is.null&name=eq.${encodeURIComponent(name)}&limit=1`, null, 'return=representation');
  if (found.status >= 300) throw new Error(`Thematic course lookup failed for "${name}": ${found.body}`);
  const existing = JSON.parse(found.body)[0];

  let courseId;
  if (existing?.id) {
    const patched = await req('PATCH', `/vocabulary_courses?id=eq.${existing.id}`, {
      name, name_vi, description, description_vi, difficulty_level, is_published: true, creator_id: null,
    }, 'return=minimal');
    if (patched.status >= 300) throw new Error(`Thematic course update failed for "${name}": ${patched.body}`);
    courseId = existing.id;
  } else {
    const created = await req('POST', '/vocabulary_courses', {
      name, name_vi, description, description_vi, difficulty_level, is_published: true, creator_id: null,
    });
    if (created.status >= 300) throw new Error(`Thematic course insert failed for "${name}": ${created.body}`);
    courseId = JSON.parse(created.body)[0].id;
  }

  // Fetch existing words to decide insert vs update
  const existingWordsRes = await req('GET', `/course_vocabulary_items?select=id,word_zh&course_id=eq.${courseId}`);
  if (existingWordsRes.status >= 300) throw new Error(`Word lookup failed for "${name}": ${existingWordsRes.body}`);
  const existingWords = JSON.parse(existingWordsRes.body);
  const existingMap = new Map(existingWords.map((w) => [w.word_zh, w.id]));

  let inserted = 0, updated = 0;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const row = { course_id: courseId, word_zh: w.word_zh, word_pinyin: w.word_pinyin, word_en: w.word_en, word_vi: w.word_vi, sort_order: i + 1 };
    if (existingMap.has(w.word_zh)) {
      const upd = await req('PATCH', `/course_vocabulary_items?id=eq.${existingMap.get(w.word_zh)}`, row, 'return=minimal');
      if (upd.status >= 300) throw new Error(`Word update failed: ${upd.body}`);
      updated++;
    } else {
      const ins = await req('POST', '/course_vocabulary_items', row);
      if (ins.status >= 300) throw new Error(`Word insert failed: ${ins.body}`);
      inserted++;
    }
  }

  return { courseId, inserted, updated };
}

async function main() {
  const exportCourses = [];
  const hskLevels = [1, 2, 3, 4, 5, 6];

  for (const level of hskLevels) {
    const pdfPath = PDF_PATHS[level];
    if (!fs.existsSync(pdfPath)) {
      console.log(`HSK ${level}: PDF not found at ${pdfPath}, skipping.`);
      continue;
    }

    const words = parseVocabularyPdf(level);
    const expected = EXPECTED_COUNTS[level];
    const countStatus = words.length === expected ? 'ok' : `expected ${expected}`;
    console.log(`HSK ${level}: parsed ${words.length} rows (${countStatus})`);

    if (DRY_RUN && !EXPORT_JSON_PATH) continue;

    await translateToVietnamese(words);

    if (EXPORT_JSON_PATH) {
      exportCourses.push({
        ...COURSE_META[level],
        difficulty_level: level,
        words,
      });
      continue;
    }

    const courseId = await upsertCourse(level);
    const result = await upsertWords(courseId, words);
    console.log(`HSK ${level}: ${result.inserted} inserted, ${result.updated} updated, ${result.deleted} stale deleted`);
  }

  if (EXPORT_JSON_PATH) {
    fs.writeFileSync(EXPORT_JSON_PATH, `${JSON.stringify(exportCourses, null, 2)}\n`);
    console.log(`Exported bilingual course content to ${EXPORT_JSON_PATH}`);
    return;
  }

  // Seed thematic courses (no PDFs required; always run unless DRY_RUN without SEED_THEMATIC=1)
  if (!DRY_RUN || ENV['SEED_THEMATIC'] === '1') {
    console.log('\nSeeding thematic courses…');
    for (const courseData of THEMATIC_COURSES) {
      if (DRY_RUN) {
        console.log(`[DRY RUN] Would seed thematic course: "${courseData.name}" (${courseData.words.length} words)`);
        continue;
      }
      const { courseId, inserted, updated } = await seedThematicCourse(courseData);
      console.log(`Thematic "${courseData.name}": ${inserted} inserted, ${updated} updated (id=${courseId})`);
    }
  }

  console.log(DRY_RUN ? 'Dry run complete. No translations or DB writes performed.' : 'Seed complete.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
