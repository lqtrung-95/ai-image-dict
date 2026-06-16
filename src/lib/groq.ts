import { aiClient, VISION_MODEL, TEXT_MODEL } from './ai-client';

export async function analyzeImage(base64Image: string) {
  const response = await aiClient.chat.completions.create({
    model: VISION_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this image and identify all visible objects, colors, and items.

IMPORTANT RULES - FOLLOW STRICTLY:
1. For "zh" field: Return ONLY the single Chinese WORD (noun/adjective), NEVER a sentence. Examples: "盘子" (plate), "叉子" (fork), "刀" (knife), "书" (book), "包" (bag), "蓝色" (blue). ABSOLUTELY NO SENTENCES like "我用盘子装菜" or "我喜欢看书".
2. For "example" field: This is where you put the complete sentence using the word.
3. Objects should be physical items visible in the image (nouns only).
4. Colors should be color adjectives visible.

For each item, provide:
- en: English word (single noun or adjective)
- zh: Chinese word ONLY (1-3 characters max for objects, 2 characters for colors). NEVER include 我, 用, 喜欢, 是, etc.
- pinyin: Pinyin with tone marks for the word only
- hskLevel: 1-6 or null
- example: Complete sentence USING the word (different from zh field)

Example CORRECT output:
{ "en": "plate", "zh": "盘子", "pinyin": "pánzi", "hskLevel": 2, "example": { "zh": "我用盘子装菜。", "pinyin": "Wǒ yòng pánzi zhuāng cài.", "en": "I use a plate to serve food." } }

Example INCORRECT (NEVER DO THIS):
{ "zh": "我用盘子装菜" } - This is a sentence, NOT a word!

Return ONLY valid JSON:
{
  "sceneDescription": "Scene description in English",
  "sceneDescriptionZh": "中文描述",
  "sceneDescriptionPinyin": "Zhōngwén miáoshù",
  "objects": [
    { "en": "word", "zh": "词", "pinyin": "cí", "confidence": 0.95, "hskLevel": 1, "example": { "zh": "Example sentence.", "pinyin": "Example pinyin.", "en": "Example translation." } }
  ],
  "colors": [
    { "en": "color", "zh": "颜色", "pinyin": "yánsè", "hskLevel": 1, "example": { "zh": "Example.", "pinyin": "Example.", "en": "Example." } }
  ],
  "actions": []
}`,
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
        ],
      },
    ],
    max_tokens: 2500,
    temperature: 0.3,
  });

  const content = response.choices[0].message.content || '{}';

  // Clean up response in case model returns markdown code blocks
  let jsonStr = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // Try to extract JSON if wrapped in other text
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  // Fix common JSON syntax errors from AI
  jsonStr = jsonStr
    // Fix missing commas between objects (e.g., "} {")
    .replace(/}\s*{/g, '},{')
    // Fix trailing commas before closing brackets
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']')
    // Fix typos in property names
    .replace(/"pinyi"?:/g, '"pinyin":')
    .replace(/"pinyinz"?:/g, '"pinyin":')
    // Fix unquoted property names
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // Fix double commas
    .replace(/,,+/g, ',');

  try {
    const parsed = JSON.parse(jsonStr);
    // Validate and clean up words - remove any that are sentences instead of single words
    parsed.objects = (parsed.objects || []).filter((obj: { zh?: string }) => {
      if (!obj.zh) return false;
      // Filter out sentences (contain common sentence markers)
      const sentenceMarkers = ['我', '你', '他', '她', '用', '是', '喜欢', '有', '在', '去', '来'];
      const isSentence = sentenceMarkers.some(marker => obj.zh!.includes(marker)) && obj.zh!.length > 4;
      if (isSentence) {
        console.warn('Filtering out sentence instead of word:', obj.zh);
      }
      return !isSentence;
    });
    parsed.colors = (parsed.colors || []).filter((obj: { zh?: string }) => {
      if (!obj.zh) return false;
      // Colors should be 2-4 characters max and not be full sentences
      const sentenceMarkers = ['我', '你', '他', '她', '喜欢', '是'];
      const isSentence = sentenceMarkers.some(marker => obj.zh!.includes(marker));
      return !isSentence;
    });
    return parsed;
  } catch (parseError) {
    // Try more aggressive repair
    console.warn('Initial JSON parse failed, attempting aggressive repair...');

    // Try to extract valid objects from the broken JSON
    const repaired = attemptAggressiveRepair(jsonStr);
    if (repaired) {
      return repaired;
    }

    console.error('Failed to parse AI response:', content);
    console.error('Attempted to parse:', jsonStr);
    console.error('Parse error:', parseError);
    throw new Error('Failed to parse AI analysis response');
  }
}

// Aggressive JSON repair for badly malformed responses
function attemptAggressiveRepair(jsonStr: string): Record<string, unknown> | null {
  try {
    const result: Record<string, unknown> = {
      sceneDescription: '',
      sceneDescriptionZh: '',
      sceneDescriptionPinyin: '',
      objects: [],
      colors: [],
      actions: [],
    };

    // Extract scene description
    const sceneMatch = jsonStr.match(/"sceneDescription"\s*:\s*"([^"]*)"/);
    if (sceneMatch) result.sceneDescription = sceneMatch[1];

    const sceneZhMatch = jsonStr.match(/"sceneDescriptionZh"\s*:\s*"([^"]*)"/);
    if (sceneZhMatch) result.sceneDescriptionZh = sceneZhMatch[1];

    const scenePinyinMatch = jsonStr.match(/"sceneDescriptionPinyin"\s*:\s*"([^"]*)"/);
    if (scenePinyinMatch) result.sceneDescriptionPinyin = scenePinyinMatch[1];

    // Extract objects array
    const objectsMatch = jsonStr.match(/"objects"\s*:\s*\[([\s\S]*?)\](?=,\s*"colors"|\})/);
    if (objectsMatch) {
      result.objects = extractItems(objectsMatch[1]);
    }

    // Extract colors array
    const colorsMatch = jsonStr.match(/"colors"\s*:\s*\[([\s\S]*?)\](?=,\s*"actions"|\})/);
    if (colorsMatch) {
      result.colors = extractItems(colorsMatch[1]);
    }

    // Extract actions array
    const actionsMatch = jsonStr.match(/"actions"\s*:\s*\[([\s\S]*?)\]\s*\}/);
    if (actionsMatch) {
      result.actions = extractItems(actionsMatch[1]);
    }

    return result;
  } catch {
    return null;
  }
}

// Extract items from array content
function extractItems(arrayContent: string): Array<Record<string, unknown>> {
  const items: Array<Record<string, unknown>> = [];

  // Match individual objects in the array
  const objectRegex = /\{[^{}]*\}/g;
  const matches = arrayContent.match(objectRegex);

  if (!matches) return items;

  for (const match of matches) {
    try {
      // Clean up the object string
      const cleanObj = match
        .replace(/"pinyi"?:/g, '"pinyin":')
        .replace(/"pinyinz"?:/g, '"pinyin":')
        .replace(/,\s*}/g, '}');

      const obj = JSON.parse(cleanObj);
      // Only add if it has required fields
      if (obj.en && obj.zh && obj.pinyin) {
        items.push(obj);
      }
    } catch {
      // Skip malformed objects
    }
  }

  return items;
}

export async function generateStoryFromWords(
  words: Array<{ zh: string; pinyin: string; en: string }>,
  storyTitle: string
) {
  const wordList = words.map(w => `${w.zh} (${w.pinyin}) - ${w.en}`).join('\n');

  const response = await aiClient.chat.completions.create({
    model: TEXT_MODEL,
    messages: [
      {
        role: 'user',
        content: `You are a Chinese language teacher writing a short story to help learners remember vocabulary.

Story title: "${storyTitle}"

Vocabulary words to weave in:
${wordList}

Write a COHESIVE, FLOWING story in Chinese (5-8 sentences). The story must:
- Read as a single continuous narrative — NOT as separate, disconnected sentences for each word
- Have a clear setting, progression, and a natural ending
- Use the vocabulary words naturally, as a skilled author would, so they feel essential to the story rather than bolted on
- Be appropriate for intermediate Chinese learners (mostly HSK 3-4 level sentence structures)
- Avoid listing words mechanically; instead, let the story carry them organically

BAD example (disconnected): "我看到一只猫。猫是黑色的。桌子在房间里。..."
GOOD example (cohesive): "昨天傍晚，小明走在回家的路上，突然看到一只黑色的猫坐在路边的桌子旁边…"

REQUIRED OUTPUT FORMAT — return EXACTLY this JSON, nothing else:
{
  "storyZh": "Complete Chinese story as a single string",
  "storyPinyin": "Full pinyin with tone marks as a single string",
  "storyEn": "Natural English translation as a single string",
  "usedWords": ["list", "of", "Chinese", "words", "actually", "used"]
}

IMPORTANT:
- storyZh, storyPinyin, storyEn must each be a single string — no arrays, no truncation
- usedWords is an array of the Chinese vocabulary words you incorporated`,
      },
    ],
    max_tokens: 2000,
    temperature: 0.5,
  });

  const content = response.choices[0].message.content || '{}';

  // Clean up response - remove markdown code blocks
  let jsonStr = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  // Extract JSON object (handle nested braces by finding the outermost)
  const jsonMatch = jsonStr.match(/\{[\s\S]*?\}(?=\s*$|\s*\{)/) || jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  // Fix common JSON errors from AI
  jsonStr = jsonStr
    // Fix double opening braces
    .replace(/\{\s*\{/g, '{')
    // Fix double closing braces
    .replace(/\}\s*\}/g, '}')
    // Fix malformed usedWords arrays that got mixed with other fields
    .replace(/"storyEn"\s*:\s*"([^"]*)"\s*\[/g, '"storyEn": "$1", "usedWords": [')
    // Remove trailing commas
    .replace(/,\s*}/g, '}')
    .replace(/,\s*]/g, ']');

  try {
    const parsed = JSON.parse(jsonStr);
    // Ensure all required fields exist and are correct types
    return {
      storyZh: String(parsed.storyZh || parsed.story_zh || ''),
      storyPinyin: String(parsed.storyPinyin || parsed.story_pinyin || parsed.pinyin || ''),
      storyEn: String(parsed.storyEn || parsed.story_en || parsed.translation || ''),
      usedWords: Array.isArray(parsed.usedWords) ? parsed.usedWords :
                 Array.isArray(parsed.used_words) ? parsed.used_words : [],
    };
  } catch (e) {
    console.error('Failed to parse story JSON:', e);
    console.error('Raw content:', content);
    console.error('Attempted to parse:', jsonStr);

    // Extract story parts using more robust regex as fallback
    const zhMatch = content.match(/"storyZh"\s*:\s*"([^"]+)"/);
    const pinyinMatch = content.match(/"storyPinyin"\s*:\s*"([^"]+)"/);
    const enMatch = content.match(/"storyEn"\s*:\s*"([^"]+)"/);
    const wordsMatch = content.match(/"usedWords"\s*:\s*\[([^\]]*)\]/);

    return {
      storyZh: zhMatch?.[1]?.replace(/\\n/g, ' ') || '',
      storyPinyin: pinyinMatch?.[1]?.replace(/\\n/g, ' ') || '',
      storyEn: enMatch?.[1]?.replace(/\\n/g, ' ') || 'Story generated but formatting incomplete.',
      usedWords: wordsMatch?.[1]?.split(',').map(w => w.trim().replace(/"/g, '')).filter(Boolean) || [],
    };
  }
}
