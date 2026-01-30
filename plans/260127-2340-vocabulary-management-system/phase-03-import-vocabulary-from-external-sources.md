# Phase 3: Import Vocabulary from External Sources

## Context Links

- [URL Extraction Research](./research/researcher-url-extraction.md)
- [Phase 1: Database Schema](./phase-01-database-schema-and-migrations.md)
- [Groq API Integration](../../src/lib/groq.ts)
- [Code Standards](../../docs/code-standards.md)

## Overview

| Field | Value |
|-------|-------|
| Priority | P2 |
| Status | pending |
| Effort | 8h |
| Dependencies | Phase 1 complete |

Enable users to import Chinese vocabulary from YouTube videos (transcripts), web articles, and manual text input. Uses Groq AI to extract vocabulary with definitions and Pinyin.

## Key Insights

From research report:
- **YouTube**: Use `youtube-transcript-plus` (custom userAgent, caching, error types)
- **Web scraping**: Use `cheerio` (40KB, jQuery-like) + `readability-js` (content extraction)
- **AI extraction**: Groq API with JSON response format for vocabulary
- **Caching**: Upstash Redis with 60-min TTL to avoid re-fetching
- **Rate limiting**: 100 req/hour per user via @upstash/ratelimit

## Requirements

### Functional
- [ ] Import from YouTube video URL (extract Chinese transcript)
- [ ] Import from web article URL (scrape main content)
- [ ] Import from manual text input (paste Chinese text)
- [ ] AI extracts vocabulary: word, pinyin, definition, example sentence
- [ ] Preview extracted words before saving
- [ ] Save selected words to vocabulary or specific list
- [ ] Track import history with source attribution

### Non-Functional
- [ ] Rate limit: 10 imports/hour per user
- [ ] Max content size: 50KB text (avoid timeout/cost)
- [ ] Cache extracted content for 60 minutes
- [ ] Graceful error handling for unavailable sources

## Architecture

### Import Flow

```
1. User submits URL/text
   ↓
2. API validates input, checks rate limit
   ↓
3. Create vocabulary_imports record (status: processing)
   ↓
4. Extract content:
   - YouTube → youtube-transcript-plus → transcript text
   - URL → fetch + cheerio → main content text
   - Text → use directly
   ↓
5. Send to Groq API for vocabulary extraction
   ↓
6. Return preview (word list) to user
   ↓
7. User selects words to save
   ↓
8. Save to vocabulary_items, update import record (status: completed)
```

### Groq Prompt for Extraction

```
Extract Chinese vocabulary from the following text. Return JSON:
{
  "words": [
    {
      "zh": "中文词",
      "pinyin": "zhōng wén cí",
      "en": "Chinese word",
      "example": "这是一个例句。",
      "hskLevel": 3
    }
  ]
}
Focus on: nouns, verbs, adjectives, common phrases.
Limit: 50 most useful words.
Text: {content}
```

## Related Code Files

### Files to Create
- `src/app/api/import/route.ts` - Main import endpoint
- `src/app/api/import/preview/route.ts` - Preview extracted words
- `src/app/api/import/save/route.ts` - Save selected words
- `src/app/(protected)/import/page.tsx` - Import page UI
- `src/components/import/import-source-selector.tsx` - URL/text tabs
- `src/components/import/import-preview-table.tsx` - Word preview with checkboxes
- `src/lib/import/youtube-transcript-extractor.ts` - YouTube helper
- `src/lib/import/web-article-extractor.ts` - Web scraping helper
- `src/lib/import/vocabulary-extractor.ts` - Groq extraction logic

### Files to Modify
- `src/types/index.ts` - Add import-related types
- `src/app/(protected)/layout.tsx` - Add Import nav item
- `package.json` - Add new dependencies

## Implementation Steps

### 1. Install Dependencies (0.5h)

```bash
npm install youtube-transcript-plus cheerio readability-js @upstash/ratelimit @upstash/redis
```

### 2. Environment Variables

```env
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx
```

### 3. Content Extractors (2h)

```typescript
// src/lib/import/youtube-transcript-extractor.ts
import { fetchTranscript } from 'youtube-transcript-plus';

export async function extractYouTubeTranscript(videoId: string): Promise<string> {
  const transcript = await fetchTranscript(videoId, { cache: 'memory' });
  return transcript.map(t => t.text).join(' ');
}

// src/lib/import/web-article-extractor.ts
import cheerio from 'cheerio';

export async function extractWebArticle(url: string): Promise<{ title: string; content: string }> {
  const html = await fetch(url).then(r => r.text());
  const $ = cheerio.load(html);
  // Remove scripts, styles, nav, footer
  $('script, style, nav, footer, header, aside').remove();
  const title = $('h1').first().text() || $('title').text();
  const content = $('article, main, .content, .post-content').text() || $('body').text();
  return { title: title.trim(), content: content.trim().slice(0, 50000) };
}
```

### 4. Vocabulary Extraction (2h)

```typescript
// src/lib/import/vocabulary-extractor.ts
import Groq from 'groq-sdk';

export async function extractVocabulary(text: string): Promise<ExtractedWord[]> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const response = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{
      role: 'user',
      content: `Extract Chinese vocabulary from text. Return JSON: {"words":[{"zh":"","pinyin":"","en":"","example":"","hskLevel":null}]}. Limit 50 words.\n\nText: ${text.slice(0, 30000)}`
    }],
    response_format: { type: 'json_object' },
    temperature: 0.3
  });

  const result = JSON.parse(response.choices[0].message.content || '{}');
  return result.words || [];
}
```

### 5. API Routes (2h)

```typescript
// POST /api/import - Start import process
// Body: { type: 'youtube' | 'url' | 'text', source: string }
// Returns: { importId, preview: ExtractedWord[] }

// POST /api/import/save
// Body: { importId: string, words: ExtractedWord[], listId?: string }
// Returns: { saved: number }
```

### 6. UI Components (1.5h)

- `import-source-selector.tsx`: Tabs for YouTube/URL/Text with input fields
- `import-preview-table.tsx`: Table with checkboxes, shows zh/pinyin/en/example

### 7. Import Page (1h)

```typescript
// src/app/(protected)/import/page.tsx
// Steps: 1. Enter source → 2. Preview words → 3. Select & save
```

## Todo List

- [ ] Install npm packages
- [ ] Configure Upstash Redis environment variables
- [ ] Create YouTube transcript extractor
- [ ] Create web article extractor
- [ ] Create Groq vocabulary extraction service
- [ ] Build POST /api/import endpoint with rate limiting
- [ ] Build POST /api/import/save endpoint
- [ ] Create ImportSourceSelector component
- [ ] Create ImportPreviewTable component
- [ ] Build /import page with step wizard
- [ ] Add Import navigation link
- [ ] Add TypeScript interfaces
- [ ] Test with sample YouTube and article URLs

## Success Criteria

- [ ] Successfully extract transcript from YouTube video
- [ ] Successfully scrape content from web articles
- [ ] Groq returns valid vocabulary JSON
- [ ] User can preview and select words before saving
- [ ] Import history tracked in vocabulary_imports table
- [ ] Rate limiting prevents abuse (10/hour)
- [ ] Errors handled gracefully with user-friendly messages

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| YouTube blocks transcript API | Medium | High | Try ai-youtube-transcript fallback |
| Web scraping blocked by sites | Medium | Medium | Respect robots.txt, handle 403 |
| Groq rate limit exceeded | Low | Medium | Queue imports, user feedback |
| Large content causes timeout | Medium | Medium | Truncate to 30KB, show warning |

## Security Considerations

- Validate URLs (no internal/localhost URLs)
- Sanitize extracted content before Groq API
- Rate limit per user to prevent abuse
- Don't store raw scraped content long-term

## Next Steps

After this phase:
- Phase 4: Community courses for sharing vocabulary sets
- Consider: Batch import from CSV/JSON files
