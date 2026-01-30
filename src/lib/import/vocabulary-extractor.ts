/**
 * Vocabulary Extractor using Groq AI
 * Extracts Chinese vocabulary from text content
 */

import Groq from 'groq-sdk';
import { ExtractedWord } from '@/types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const EXTRACTION_PROMPT = `Extract Chinese vocabulary from the following text. Focus on useful nouns, verbs, adjectives, and common phrases.

For each word, provide:
- zh: Chinese characters (Simplified)
- pinyin: Pinyin with tone marks (e.g., "píngguǒ")
- en: English translation
- example: A simple example sentence in Chinese (optional)
- hskLevel: Estimated HSK level 1-6 (1=beginner, 6=advanced), or null if unsure

Return ONLY valid JSON (no markdown, no explanation):
{
  "words": [
    { "zh": "学习", "pinyin": "xuéxí", "en": "to study/learn", "example": "我每天学习中文。", "hskLevel": 1 }
  ]
}

Rules:
- Extract 30-50 most useful/common words
- Prioritize words that appear multiple times
- Include both single characters and compound words
- Skip proper nouns, numbers, and very rare words
- Ensure pinyin has correct tone marks

Text to analyze:
`;

/**
 * Extract vocabulary from text using Groq AI
 */
export async function extractVocabulary(text: string): Promise<ExtractedWord[]> {
  // Truncate text if too long
  const MAX_TEXT_LENGTH = 30000;
  const truncatedText = text.length > MAX_TEXT_LENGTH
    ? text.slice(0, MAX_TEXT_LENGTH) + '...'
    : text;

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'user',
          content: EXTRACTION_PROMPT + truncatedText,
        },
      ],
      max_tokens: 4000,
      temperature: 0.3,
    });

    const content = response.choices[0].message.content || '{}';

    // Clean up response in case model returns markdown code blocks
    const jsonStr = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    try {
      const result = JSON.parse(jsonStr);
      const words = result.words || [];

      // Validate and clean extracted words
      return words
        .filter((w: ExtractedWord) => w.zh && w.pinyin && w.en)
        .map((w: ExtractedWord) => ({
          zh: w.zh.trim(),
          pinyin: w.pinyin.trim(),
          en: w.en.trim(),
          example: w.example?.trim() || undefined,
          hskLevel: w.hskLevel && w.hskLevel >= 1 && w.hskLevel <= 6 ? w.hskLevel : undefined,
        }));
    } catch (parseError) {
      console.error('Failed to parse vocabulary extraction response:', content);
      throw new Error('Failed to parse AI vocabulary response');
    }
  } catch (error) {
    console.error('Vocabulary extraction error:', error);
    throw new Error(
      error instanceof Error
        ? `Vocabulary extraction failed: ${error.message}`
        : 'Failed to extract vocabulary'
    );
  }
}
