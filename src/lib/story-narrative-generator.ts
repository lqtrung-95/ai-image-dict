import { aiClient, TEXT_MODEL } from './ai-client';

export interface NarrativeSentence {
  zh: string;
  pinyin: string;
  en: string;
}

export interface CulturalNote {
  term: string; // Chinese word/phrase the note is about
  note: string; // 1-2 sentence cultural/historical insight in English
}

export interface StoryNarrative {
  sentences: NarrativeSentence[];
  wordsUsed: string[];
  culturalNotes: CulturalNote[];
}

// Extract the first JSON object from a model response that may include
// markdown fences or surrounding prose.
function extractJson(content: string): string {
  let jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  const match = jsonStr.match(/\{[\s\S]*\}/);
  if (match) jsonStr = match[0];
  return jsonStr
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');
}

/**
 * Generate a short beginner-friendly Chinese narrative that weaves in the
 * story's vocabulary words. Sentence-segmented so the app can show pinyin
 * and translation per sentence and read each aloud.
 */
export async function generateStoryNarrative(
  title: string,
  words: { zh: string; pinyin: string; en: string }[]
): Promise<StoryNarrative> {
  // Cap the vocabulary list to keep the prompt focused and the story short
  const vocab = words.slice(0, 20);
  const vocabList = vocab.map((w) => `${w.zh} (${w.pinyin}, ${w.en})`).join('; ');

  const response = await aiClient.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'user',
        content: `Write a short, simple Chinese story (5-8 sentences, HSK 1-3 grammar) titled "${title}".

You MUST naturally use as many of these vocabulary words as possible:
${vocabList}

Rules:
- Simple, beginner-friendly Chinese. Short sentences.
- The story should feel like a small everyday scene, warm and concrete.
- Return ONLY valid JSON, one entry per sentence:
{
  "sentences": [
    { "zh": "今天我在厨房做饭。", "pinyin": "Jīntiān wǒ zài chúfáng zuòfàn.", "en": "Today I am cooking in the kitchen." }
  ],
  "wordsUsed": ["厨房", "做饭"],
  "culturalNotes": [
    { "term": "厨房", "note": "In traditional Chinese homes, the kitchen was considered the domain of the Kitchen God (灶神), who would report the family's behavior to the Jade Emperor each year." }
  ]
}
- "wordsUsed" lists which of the provided vocabulary words appear in the story.
- "culturalNotes" adds 1–3 fascinating cultural, historical, or usage insights tied to specific words/phrases actually used in the story. Each note should reveal something a learner wouldn't find in a dictionary — cultural symbolism, historical origin, or common social context. SKIP if nothing genuinely interesting applies — do NOT invent trivia.`,
      },
    ],
    max_tokens: 2000,
    temperature: 0.7,
  });

  const content = response.choices[0].message.content || '{}';
  const parsed = JSON.parse(extractJson(content));

  if (!Array.isArray(parsed.sentences) || parsed.sentences.length === 0) {
    throw new Error('Narrative generation returned no sentences');
  }

  return {
    sentences: parsed.sentences.filter(
      (s: NarrativeSentence) => s && typeof s.zh === 'string' && s.zh.length > 0
    ),
    wordsUsed: Array.isArray(parsed.wordsUsed) ? parsed.wordsUsed : [],
    culturalNotes: Array.isArray(parsed.culturalNotes) ? parsed.culturalNotes : [],
  };
}
