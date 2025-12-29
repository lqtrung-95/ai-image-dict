import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function analyzeImage(base64Image: string) {
  const response = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Analyze this image and identify all visible objects, colors, and actions.

For each item, provide:
1. English label
2. Chinese translation (Simplified Chinese characters)
3. Pinyin with tone marks (e.g., píngguǒ, not pingguo)

Also provide a brief scene description in English.

Return ONLY valid JSON (no markdown, no code blocks, no explanation):
{
  "sceneDescription": "A brief description of the scene in English",
  "objects": [
    { "en": "apple", "zh": "苹果", "pinyin": "píngguǒ", "confidence": 0.95, "category": "object" }
  ],
  "colors": [
    { "en": "red", "zh": "红色", "pinyin": "hóngsè" }
  ],
  "actions": [
    { "en": "running", "zh": "跑步", "pinyin": "pǎobù" }
  ]
}`,
          },
          {
            type: 'image_url',
            image_url: { url: `data:image/jpeg;base64,${base64Image}` },
          },
        ],
      },
    ],
    max_tokens: 1500,
    temperature: 0.3,
  });

  const content = response.choices[0].message.content || '{}';
  
  // Clean up response in case model returns markdown code blocks
  const jsonStr = content
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();
  
  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error('Failed to parse AI response:', content);
    throw new Error('Failed to parse AI analysis response');
  }
}

