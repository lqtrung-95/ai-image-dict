---
phase: testing
title: Testing Strategy
description: Define testing approach, test cases, and quality assurance
feature: photo-vocabulary-detection
---

# Testing Strategy: Photo Vocabulary Detection

## Test Coverage Goals
**What level of testing do we aim for?**

- Unit test coverage target: 80%+ for utility functions and hooks
- Integration test scope: All API endpoints, database operations
- End-to-end test scenarios: Core user journeys (capture, analyze, save, search)
- Alignment with requirements/design acceptance criteria

## Unit Tests
**What individual components need testing?**

### Utility Functions (`lib/`)

#### Image Processing (`lib/image.ts`)
- [ ] `compressImage` correctly resizes large images
- [ ] `compressImage` maintains aspect ratio
- [ ] `compressImage` handles invalid base64 input
- [ ] `getImageDimensions` returns correct dimensions

#### Groq Integration (`lib/groq.ts`)
- [ ] `analyzeImage` parses valid JSON response
- [ ] `analyzeImage` handles malformed JSON gracefully (strips markdown code blocks)
- [ ] `analyzeImage` throws on API errors
- [ ] Request includes correct prompt structure
- [ ] Works with both 11B and 90B vision models

### Hooks

#### `useCamera` Hook
- [ ] `startCamera` requests correct media constraints
- [ ] `capturePhoto` returns valid base64 string
- [ ] `stopCamera` stops all media tracks
- [ ] Error state set when camera access denied
- [ ] Handles missing camera gracefully

#### `useSpeech` Hook
- [ ] `speakWithGoogle` calls /api/tts endpoint
- [ ] `speakWithGoogle` returns false on API error
- [ ] `speakWithWebSpeech` creates utterance with correct language
- [ ] `speak` tries Google TTS first, falls back to Web Speech
- [ ] `speak` handles unsupported browsers gracefully
- [ ] `stop` cancels both Google TTS audio and Web Speech

#### TTS API Endpoint (`/api/tts`)
- [ ] Returns 400 if no text provided
- [ ] Calls Google TTS API with correct parameters
- [ ] Returns audio/mpeg content type
- [ ] Caches response for 24 hours
- [ ] Returns 500 on Google API failure

#### `useVocabulary` Hook
- [ ] `addVocabulary` calls API with correct payload
- [ ] `removeVocabulary` removes item from state
- [ ] `toggleLearned` updates item status
- [ ] `searchVocabulary` filters results correctly

### Components

#### `VocabularyCard` Component
- [ ] Renders Chinese characters, pinyin, and English
- [ ] Play button triggers speech synthesis
- [ ] Learned toggle changes visual state
- [ ] Delete button triggers onDelete callback

#### `CameraCapture` Component
- [ ] Shows loading state while camera initializes
- [ ] Displays video stream when active
- [ ] Capture button is disabled until stream ready
- [ ] Shows error message when camera denied

#### `PhotoUpload` Component
- [ ] Accepts valid image files (jpg, png, webp)
- [ ] Rejects non-image files
- [ ] Rejects files over size limit
- [ ] Shows preview after selection
- [ ] Handles drag-and-drop

## Integration Tests
**How do we test component interactions?**

### API Endpoints

#### POST `/api/analyze`
- [ ] Returns 401 if not authenticated
- [ ] Returns 400 if no image provided
- [ ] Returns analysis results for valid image
- [ ] Stores analysis in database
- [ ] Stores detected objects in database
- [ ] Returns 500 on Groq API failure (with retry suggestion)

#### GET `/api/analyses`
- [ ] Returns only current user's analyses
- [ ] Returns analyses sorted by date (newest first)
- [ ] Includes detected objects in response
- [ ] Supports pagination

#### DELETE `/api/analyses/:id`
- [ ] Returns 404 for non-existent analysis
- [ ] Returns 403 for other user's analysis
- [ ] Deletes analysis and related objects
- [ ] Deletes image from storage

#### GET `/api/vocabulary`
- [ ] Returns only current user's vocabulary
- [ ] Supports filtering by collection
- [ ] Supports filtering by learned status
- [ ] Supports pagination

#### POST `/api/vocabulary`
- [ ] Creates vocabulary item with correct user_id
- [ ] Links to detected_object if provided
- [ ] Links to collection if provided
- [ ] Returns created item

#### GET `/api/vocabulary/search`
- [ ] Searches Chinese characters
- [ ] Searches pinyin (with and without tones)
- [ ] Searches English translation
- [ ] Case-insensitive search
- [ ] Returns empty array for no matches

### Database Operations

#### Row Level Security
- [ ] User cannot read other users' analyses
- [ ] User cannot read other users' vocabulary
- [ ] User cannot read other users' collections
- [ ] User can read own detected objects via analysis

## End-to-End Tests
**What user flows need validation?**

### Critical Path: Photo Capture to Vocabulary

```gherkin
Feature: Capture and Learn Vocabulary

Scenario: User captures photo and saves vocabulary
  Given I am logged in
  When I navigate to /capture
  And I grant camera permission
  And I capture a photo
  Then I should see detected objects with Chinese vocabulary
  When I click "Save" on a vocabulary word
  Then the word should be added to my vocabulary
  And I should see a success notification

Scenario: User uploads photo and learns vocabulary
  Given I am logged in
  When I navigate to /upload
  And I upload a valid image file
  Then I should see the analysis loading state
  And eventually see detected objects
  When I click on a vocabulary card
  Then I should hear the pronunciation
```

### User Flows to Test

- [ ] **Signup → Login → First Analysis**: New user flow
- [ ] **Capture → Analyze → Save → Review**: Core learning flow
- [ ] **Upload → Analyze → Save to Collection**: Organization flow
- [ ] **Search Vocabulary → Find Word → Play Pronunciation**: Review flow
- [ ] **View History → Open Past Analysis → Save More Words**: History flow
- [ ] **Create Collection → Add Words → Filter by Collection**: Collection flow
- [ ] **Share Analysis → Generate Card → Copy/Download**: Sharing flow

### Error Scenarios

- [ ] Camera access denied → Show helpful error
- [ ] No objects detected → Show empty state with retry option
- [ ] API timeout → Show retry button
- [ ] Network offline → Show offline message
- [ ] Invalid image format → Show validation error

## Test Data
**What data do we use for testing?**

### Test Fixtures

```typescript
// __tests__/fixtures/vocabulary.ts
export const mockVocabularyItem = {
  id: 'vocab-1',
  user_id: 'user-1',
  word_zh: '苹果',
  word_pinyin: 'píngguǒ',
  word_en: 'apple',
  is_learned: false,
  created_at: '2024-01-15T10:00:00Z'
};

export const mockAnalysisResult = {
  sceneDescription: 'A kitchen table with fruits',
  objects: [
    { en: 'apple', zh: '苹果', pinyin: 'píngguǒ', confidence: 0.95 },
    { en: 'banana', zh: '香蕉', pinyin: 'xiāngjiāo', confidence: 0.92 }
  ],
  colors: [
    { en: 'red', zh: '红色', pinyin: 'hóngsè' }
  ],
  actions: []
};
```

### Test Images
- `__tests__/fixtures/images/fruit-bowl.jpg` - Common objects
- `__tests__/fixtures/images/street-scene.jpg` - Scene with actions
- `__tests__/fixtures/images/invalid.txt` - Invalid file type
- `__tests__/fixtures/images/large.jpg` - Oversized image (10MB+)

### Database Seeding

```sql
-- Test user
INSERT INTO auth.users (id, email) VALUES 
  ('test-user-1', 'test@example.com');

INSERT INTO public.profiles (id, display_name) VALUES 
  ('test-user-1', 'Test User');

-- Test collection
INSERT INTO public.collections (id, user_id, name, color) VALUES 
  ('col-1', 'test-user-1', 'Food', '#22c55e');

-- Test vocabulary
INSERT INTO public.vocabulary_items (id, user_id, collection_id, word_zh, word_pinyin, word_en) VALUES 
  ('vocab-1', 'test-user-1', 'col-1', '苹果', 'píngguǒ', 'apple'),
  ('vocab-2', 'test-user-1', 'col-1', '香蕉', 'xiāngjiāo', 'banana');
```

## Test Reporting & Coverage
**How do we verify and communicate test results?**

### Coverage Commands

```bash
# Run all tests with coverage
pnpm test --coverage

# Run specific test file
pnpm test path/to/test.ts

# Run E2E tests
pnpm test:e2e
```

### Coverage Thresholds

```json
// package.json or jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### Coverage Gaps (to document after implementation)
- [ ] Document any files/functions below threshold with rationale
- [ ] Track coverage trends over time

## Manual Testing
**What requires human validation?**

### UI/UX Checklist

- [ ] Camera viewfinder is responsive and clear
- [ ] Vocabulary cards are readable and well-spaced
- [ ] Chinese characters display correctly (font rendering)
- [ ] Pinyin tone marks display correctly
- [ ] Touch targets are at least 44x44px
- [ ] Loading states are informative
- [ ] Error messages are helpful and actionable
- [ ] Animations feel smooth and purposeful

### Accessibility Checklist

- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Focus states are visible
- [ ] Screen reader announces vocabulary correctly
- [ ] Keyboard navigation works throughout
- [ ] Pronunciation button has aria-label

### Browser/Device Compatibility

| Device | Browser | Camera | Upload | Vocabulary |
|--------|---------|--------|--------|------------|
| iPhone 14 | Safari | ⬜ | ⬜ | ⬜ |
| iPhone 14 | Chrome | ⬜ | ⬜ | ⬜ |
| Android (Pixel) | Chrome | ⬜ | ⬜ | ⬜ |
| Android (Samsung) | Samsung Browser | ⬜ | ⬜ | ⬜ |
| MacBook | Chrome | ⬜ | ⬜ | ⬜ |
| MacBook | Safari | ⬜ | ⬜ | ⬜ |
| Windows | Chrome | ⬜ | ⬜ | ⬜ |
| Windows | Edge | ⬜ | ⬜ | ⬜ |

### Smoke Tests After Deployment

1. [ ] Home page loads
2. [ ] Login/signup works
3. [ ] Camera capture works (mobile)
4. [ ] Photo upload works
5. [ ] AI analysis returns results
6. [ ] Vocabulary saves correctly
7. [ ] Search works
8. [ ] History loads

## Performance Testing
**How do we validate performance?**

### Lighthouse Targets

| Metric | Target | 
|--------|--------|
| Performance | > 90 |
| Accessibility | > 95 |
| Best Practices | > 90 |
| SEO | > 90 |
| PWA | Pass |

### Load Testing (Post-MVP)

- Simulate 100 concurrent users
- API response times < 500ms (excluding AI call)
- AI analysis < 10 seconds under load

### Performance Benchmarks

- [ ] Time to First Byte (TTFB) < 200ms
- [ ] Largest Contentful Paint (LCP) < 2.5s
- [ ] First Input Delay (FID) < 100ms
- [ ] Cumulative Layout Shift (CLS) < 0.1

## Bug Tracking
**How do we manage issues?**

### Issue Template

```markdown
## Bug Report

**Severity:** Critical / High / Medium / Low

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Behavior:**


**Actual Behavior:**


**Device/Browser:**


**Screenshots:**

```

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| Critical | App unusable, data loss | < 4 hours |
| High | Major feature broken | < 24 hours |
| Medium | Feature partially broken | < 3 days |
| Low | Minor issue, workaround exists | Next sprint |

### Regression Testing

Before each release:
1. Run full E2E test suite
2. Manual smoke test on mobile devices
3. Verify all critical paths work
4. Check for console errors


