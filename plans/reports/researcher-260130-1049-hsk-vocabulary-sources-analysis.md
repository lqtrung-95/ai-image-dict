# Research Report: HSK Vocabulary List Sources

## Executive Summary

Research blocked - WebSearch permission denied. Proceeding with knowledge-based implementation using standard HSK vocabulary from official curriculum.

## Alternative Approach

### HSK Standard Vocabulary
- HSK 4: ~1200 total words (existing migration has 100, need 300 more)
- HSK 5: ~2500 total words (existing migration has 100, need 400 more)
- HSK 6: ~5000 total words (existing migration has 100, need 500 more)

### Data Sources (From Training Knowledge)
1. **Official HSK Standard Wordlists** - Hanban/Confucius Institute
2. **CEDICT Database** - Open-source Chinese-English dictionary with HSK levels
3. **Common HSK Study Materials** - Validated vocabulary sets

## Implementation Strategy

Given web research unavailable, will use:
1. Existing migration pattern from `20260129020000_expand_hsk_course_words.sql`
2. Standard HSK vocabulary from training data
3. Verified pinyin and translations

## Recommendation

**Proceed with direct implementation** using known HSK vocabulary rather than external data sources. Migration file structure already established - complete remaining 1100 words.

## Unresolved Questions

- Should we validate against specific HSK test versions (2.0 vs 3.0)?
- Preference for simplified or include traditional characters?
- Need custom vocabulary filtering or use standard HSK lists?
