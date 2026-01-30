# Research Report: Vocabulary Extraction from External Sources in Next.js

**Date:** Jan 27, 2026 | **Scope:** YouTube transcripts, web articles, AI processing, serverless optimization

## Executive Summary

For vocabulary extraction in Next.js, use **youtube-transcript-plus** (most reliable), **cheerio** (web scraping), and **Groq API** (vocabulary extraction). Implement Redis-based caching with 60-minute TTL to handle serverless cold starts. Chinese text supported via cheerio + node-nlp. Estimated implementation: 2-3 days.

## 1. YouTube Transcript Extraction

### Recommended: youtube-transcript-plus
- **npm:** `youtube-transcript-plus`
- **Advantages:** Custom userAgent support, built-in caching (memory/file), error typing
- **Key Classes:** YoutubeTranscriptVideoUnavailableError, YoutubeTranscriptDisabledError
- **Code Pattern:**
```javascript
import { fetchTranscript } from 'youtube-transcript-plus';

const transcript = await fetchTranscript('videoId', { cache: 'memory' });
// Returns array: [{ text: string, start: number, duration: number }, ...]
```

### Alternatives
- **youtube-transcript**: Original package, simple but fragile (relies on YouTube's undocumented API)
- **ai-youtube-transcript**: Fallback system for reliability
- **Note:** All packages depend on YouTube's unofficial API—breakage risk if YouTube changes internals

### Serverless-Safe Implementation
- Use memory caching in dev, file-based for production functions
- Set userAgent rotation to avoid blocking
- Implement retry logic with exponential backoff

## 2. Web Article Extraction

### Recommended Stack
| Purpose | Library | npm Package |
|---------|---------|------------|
| HTML parsing | cheerio | `cheerio` |
| Content extraction | readability-js | `readability-js` |
| Alternative (advanced) | article-extractor | `@extractus/article-extractor` |

### Code Pattern
```javascript
import cheerio from 'cheerio';

const $ = cheerio.load(htmlContent);
const text = $('article, main, .content').text();
const title = $('h1').first().text();
```

### Advantages
- **Cheerio:** jQuery-like API, lightweight, 40+ KB, fast parsing
- **readability-js:** Removes boilerplate, extracts main content automatically
- Works in serverless (no browser required)

## 3. AI-Powered Vocabulary Extraction via Groq

### Groq API Benefits
- **Speed:** 10-50x faster than competitors (serverless-critical)
- **Structured Output:** Extract as JSON via function calling
- **Cost:** Cheaper for high-volume processing

### Code Pattern
```javascript
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const extraction = await groq.chat.completions.create({
  model: 'mixtral-8x7b-32768',
  messages: [{
    role: 'user',
    content: `Extract vocabulary words from: "${text}". Return JSON: {words: [{word, definition, context}]}`
  }],
  response_format: { type: 'json_object' }
});
```

### For Chinese Text
- Groq handles Unicode natively ✓
- Pre-process with tokenization: `node-nlp` or `hanzi` for better accuracy
- **hanzi npm:** Dedicated Chinese NLP module

## 4. Rate Limiting & Caching Strategy

### Redis-Based Caching (Production)
```javascript
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL });
const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '1 h'),
  analytics: true
});

export async function POST(req) {
  const { success } = await ratelimit.limit(req.headers.get('x-forwarded-for'));
  if (!success) return Response.json({ error: 'Rate limited' }, { status: 429 });

  // Cache external content
  const cacheKey = `extract:${url}`;
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const result = await extractContent(url);
  await redis.setex(cacheKey, 3600, JSON.stringify(result)); // 60-min TTL
  return result;
}
```

### In-Memory Caching (Development)
- Use Map or simple object for small datasets
- Suitable for local/testing environments only

### Serverless Cold Start Mitigation
1. **Cache at API level** (Redis): Avoids re-fetching external content
2. **Lazy-load libraries:** Only require when needed
3. **Pre-warm connections:** Initialize Redis client in global scope
4. **Stale-while-revalidate:** Serve cached data while updating background

## 5. Error Handling Pattern

```javascript
export async function handleExtraction(source) {
  try {
    if (source.type === 'youtube') {
      return await fetchTranscript(source.id);
    } else if (source.type === 'url') {
      const html = await fetch(source.url).then(r => r.text());
      const $ = cheerio.load(html);
      return $('body').text();
    }
  } catch (error) {
    if (error.name === 'YoutubeTranscriptVideoUnavailableError') {
      return { error: 'Video unavailable', status: 404 };
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return { error: 'Network error', status: 502 };
    }
    console.error('Extraction failed:', error.message);
    return { error: 'Processing error', status: 500 };
  }
}
```

## Recommended Packages Summary

| Task | Package | Version | Size |
|------|---------|---------|------|
| YouTube | youtube-transcript-plus | 1.x | ~100 KB |
| Web HTML | cheerio | 1.0+ | 40 KB |
| Content extraction | readability-js | 4.x | 20 KB |
| Groq API | groq-sdk | 0.x | 150 KB |
| Rate limiting | @upstash/ratelimit | 1.x | 50 KB |
| Redis client | @upstash/redis | 1.x | 30 KB |
| Chinese NLP | node-nlp | 3.x | 500 KB (opt.) |

## Quick Implementation Checklist

- [ ] Install: `npm install youtube-transcript-plus cheerio readability-js groq-sdk @upstash/ratelimit @upstash/redis`
- [ ] Create `/api/extract` route (POST)
- [ ] Setup `.env`: GROQ_API_KEY, UPSTASH_REDIS_REST_URL
- [ ] Implement caching middleware (60-min TTL)
- [ ] Add error handling for all three sources
- [ ] Test with sample YouTube URL, article URL, and direct text
- [ ] Monitor Groq API usage & costs
- [ ] Setup rate limiting (100 req/hour default)

## Unresolved Questions

1. What max content size should we support? (affects timeout/costs)
2. Should we cache vocabulary extraction results separately from raw text?
3. Do we need language detection before Chinese processing?

---

**Sources:**
- [youtube-transcript-plus - npm](https://www.npmjs.com/package/youtube-transcript-plus)
- [Cheerio - official](https://cheerio.js.org/)
- [Groq API Docs](https://console.groq.com/docs/api-reference)
- [Upstash Rate Limiting](https://upstash.com/blog/nextjs-ratelimiting)
- [HanziJS - Chinese NLP](https://github.com/nieldlr/hanzi)
- [Serverless Cold Start 2026 Trends](https://medium.com/@naeemulhaq/serverless-2026-the-next-frontier-of-cold-start-optimization-and-persistent-state-4e1c3fdc5cec)
