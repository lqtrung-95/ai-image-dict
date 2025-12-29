---
phase: requirements
title: Requirements & Problem Understanding
description: Clarify the problem space, gather requirements, and define success criteria
feature: photo-vocabulary-detection
---

# Requirements: Photo Vocabulary Detection

## Problem Statement
**What problem are we solving?**

- **Core Problem:** Language learners struggle to build vocabulary in context. Traditional methods (flashcards, word lists) are disconnected from real-world objects and situations.
- **Who is affected:** Chinese language learners who want to acquire vocabulary through visual, contextual learning.
- **Current situation:** Learners use disconnected tools—separate dictionary apps, flashcard apps, and photo references. No single tool connects real-world images to vocabulary learning with Chinese language support.

## Goals & Objectives
**What do we want to achieve?**

### Primary Goals
1. Enable users to capture/upload photos and instantly see Chinese vocabulary for detected objects
2. Provide scene context—not just objects, but actions, colors, relationships, and descriptive words
3. Allow users to save, organize, and review learned vocabulary
4. Enable vocabulary history and search functionality

### Secondary Goals
1. Social sharing of vocabulary discoveries
2. Audio pronunciation for Chinese words (Pinyin + tone marks)
3. Progressive Web App for cross-platform access

### Non-Goals (Out of Scope for MVP)
- Native mobile apps (iOS/Android)
- Gamification features (streaks, achievements)
- Spaced repetition algorithm
- Multiple language support (Chinese only for MVP)
- User authentication with social login
- Offline mode
- Real-time camera detection (photo capture only)

## User Stories & Use Cases
**How will users interact with the solution?**

### Core User Stories

| ID | User Story | Priority |
|----|------------|----------|
| US-01 | As a language learner, I want to capture a photo so that I can see Chinese vocabulary for objects in it | Must Have |
| US-02 | As a language learner, I want to upload an existing photo so that I can learn vocabulary from my photo library | Must Have |
| US-03 | As a language learner, I want to see Chinese characters, Pinyin, and English translations for each detected item | Must Have |
| US-04 | As a language learner, I want to hear pronunciation of Chinese words so I can learn correct tones | Should Have |
| US-05 | As a language learner, I want to save words to my personal vocabulary list so I can review them later | Must Have |
| US-06 | As a language learner, I want to organize vocabulary into collections/folders | Should Have |
| US-07 | As a language learner, I want to search my saved vocabulary by word or category | Must Have |
| US-08 | As a language learner, I want to view my photo/vocabulary history | Must Have |
| US-09 | As a language learner, I want to share my vocabulary discoveries on social media | Could Have |
| US-10 | As a language learner, I want to see scene context (colors, actions, relationships) not just object names | Should Have |

### Key Workflows

**Workflow 1: Capture & Learn**
1. User opens app → taps "Capture" button
2. Camera opens → user takes photo
3. AI analyzes photo → displays detected objects with Chinese vocabulary
4. User taps on word → sees details (character, pinyin, translation, example sentence)
5. User optionally saves word to vocabulary list

**Workflow 2: Upload & Learn**
1. User taps "Upload" → selects photo from device
2. Same flow as above (steps 3-5)

**Workflow 3: Review Vocabulary**
1. User navigates to "My Vocabulary"
2. Browses saved words or searches
3. Can filter by collection, date, or category
4. Taps word to see original photo context

**Workflow 4: Share Discovery**
1. After detection, user taps "Share"
2. App generates shareable card (photo + vocabulary overlay)
3. User shares to social platform

### Edge Cases
- Photo with no recognizable objects
- Low quality/blurry photos
- Multiple instances of same object type
- Objects partially visible or obscured
- Network failure during AI analysis

## Success Criteria
**How will we know when we're done?**

### Functional Criteria
- [ ] Users can capture photos via camera
- [ ] Users can upload photos from device
- [ ] AI detects and labels objects with 80%+ accuracy on common objects
- [ ] Chinese vocabulary displayed with: 汉字 + Pinyin + English
- [ ] Users can save words to personal vocabulary
- [ ] Users can search vocabulary history
- [ ] Users can view past photo analyses
- [ ] Scene context includes at least: objects, colors, basic actions

### Performance Criteria
- [ ] Photo analysis completes in < 5 seconds
- [ ] App loads in < 3 seconds on 4G connection
- [ ] Smooth camera experience (no lag)
- [ ] Works on mobile browsers (Chrome, Safari)

### User Experience Criteria
- [ ] Intuitive first-time user experience (no tutorial needed)
- [ ] Accessible UI (proper contrast, readable fonts)
- [ ] Responsive design (mobile-first, works on desktop)

## Constraints & Assumptions
**What limitations do we need to work within?**

### Technical Constraints
- Must use vision AI API for object detection (Groq API with Llama 3.2 Vision for cost savings)
- PWA approach for cross-platform compatibility
- Browser-based camera access (WebRTC)
- Need translation/vocabulary API or database for Chinese

### Business Constraints
- MVP timeline: Target 4-6 weeks
- Budget-conscious: Use cost-effective AI APIs
- Solo developer or small team

### Assumptions
- Users have modern smartphones with camera access
- Users have internet connectivity for AI processing
- Groq API with Llama 3.2 Vision can provide adequate object detection and Chinese translation
- Chinese vocabulary database/API is available or can be built

## Questions & Open Items
**What do we still need to clarify?**

### Technical Questions
- [x] Which AI vision API to use? → **Groq API with Llama 3.2 Vision** (cost-effective, fast inference)
- [ ] How to handle Chinese vocabulary data? (Build database vs use existing API)
- [x] Audio pronunciation source? → **Google TTS (primary)** with **Web Speech API (fallback)**
- [ ] User authentication approach? (Email/password vs magic link vs anonymous)

### Product Questions
- [ ] Should we limit free tier usage? (X photos per day)
- [ ] What level of scene context is sufficient for MVP?
- [ ] How detailed should vocabulary entries be? (Just translation vs example sentences vs radicals)

### Resolved
- ✅ Platform: Web app (PWA) - fastest to MVP
- ✅ Primary language: Chinese (Simplified)
- ✅ Target user: Language learners


