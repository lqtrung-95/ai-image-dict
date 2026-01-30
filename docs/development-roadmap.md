# AI Image Dictionary - Development Roadmap

**Version:** 1.0.0
**Last Updated:** 2026-01-27
**Planning Horizon:** 4+ months

---

## Overview

This roadmap tracks the development phases from MVP through sustainable growth. Each phase builds on previous work with clear success criteria and user impact.

**Current Status:** Phase 1 - MVP (Active)
**Target Launch:** End of Month 1 (February 2026)

---

## Phase 1: MVP (Current - January to February 2026)

**Goal:** Ship core features working end-to-end with 50+ beta users

### Milestones

| Milestone | Status | Target | Owner |
|-----------|--------|--------|-------|
| Core photo analysis | In Progress | Jan 31 | Dev |
| Vocabulary CRUD | In Progress | Jan 31 | Dev |
| Authentication | Complete | ✓ Done | Dev |
| Practice mode (flashcard) | In Progress | Feb 5 | Dev |
| Progress dashboard | In Progress | Feb 5 | Dev |
| Free trial (2 analyses) | In Progress | Feb 8 | Dev |
| Beta launch | Pending | Feb 10 | PM |
| User feedback loop | Pending | Feb 10 | PM |

### Features

**Must Have (MVP Critical Path)**
- [ ] Capture photo from camera (mobile/desktop)
- [ ] Upload photo from device
- [ ] AI detects objects → returns Chinese vocabulary
- [ ] Display results with: 汉字 + Pinyin + English
- [ ] User authentication (email/password)
- [ ] Save vocabulary to personal list
- [ ] Basic flashcard practice mode
- [ ] View learning progress (stats dashboard)
- [ ] 2 free trials without account
- [ ] Rate limiting (6/day free)

**Should Have (Nice to Have)**
- [ ] Scene context (colors, actions, moods)
- [ ] Search saved vocabulary
- [ ] View analysis history
- [ ] Mobile-responsive design
- [ ] Error recovery (user-friendly messages)

**Could Have (Future)**
- [ ] Collections/categories
- [ ] Quiz modes (multiple choice)
- [ ] Text-to-speech
- [ ] Leaderboards

### Technical Checklist

- [ ] Groq API integration working
- [ ] Supabase auth configured
- [ ] Database schema created & tested
- [ ] RLS policies enabled on all tables
- [ ] Image compression working
- [ ] API routes secured (auth checks)
- [ ] TypeScript strict mode enabled
- [ ] ESLint/Prettier configured
- [ ] Error boundary components in place
- [ ] Vercel deployment working

### Success Criteria

**Functional:**
- Photo analysis accuracy ≥ 80% on common objects
- Analysis completes in < 5 seconds (avg 2-3)
- Users can save ≥ 10 words without issues
- No crashes on main workflows

**User Engagement:**
- 50+ beta users signups
- ≥ 30% perform photo analysis after signup
- ≥ 20% save a word
- Average session > 3 minutes

**Technical:**
- Page load < 3 seconds
- API response time < 1 second (95th percentile)
- Uptime ≥ 99%
- Zero critical bugs (P1)

**Business:**
- Cost per analysis < $0.005
- Free tier sustainable
- User feedback score ≥ 4/5 CSAT

---

## Phase 2: Growth & Polish (February to March 2026)

**Goal:** 500+ MAU, expanded features, native app packages

### Milestones

| Milestone | Status | Target | Owner |
|-----------|--------|--------|-------|
| Multiple quiz modes | Pending | Feb 20 | Dev |
| Collections feature | Pending | Feb 25 | Dev |
| Word of day | Pending | Feb 28 | Dev |
| Mobile app (iOS/Android) | Pending | Mar 5 | Dev |
| Community marketing | Pending | Mar 1 | PM |
| Analytics dashboard | Pending | Mar 10 | Dev |

### Features

**New Features**
- [ ] Multiple choice quiz (Chinese → English)
- [ ] Listening quiz (Chinese audio → English)
- [ ] Pinyin input quiz (type Pinyin for character)
- [ ] Collections/categories (organize words)
- [ ] Search & filter vocabulary
- [ ] Word of day feature
- [ ] Advanced progress stats
- [ ] Pronunciation guide (Google TTS + Web Speech)

**Improvements**
- [ ] Better image compression algorithm
- [ ] Loading state animations
- [ ] Offline support (service worker)
- [ ] Dark/light mode toggle
- [ ] Accessibility audit (WCAG AA)
- [ ] Mobile app via Capacitor (iOS/Android)
- [ ] Push notifications (optional)

### Marketing & Acquisition

- Reddit: r/Chinese, r/LanguageLearning, r/LearnChinese
- TikTok: Short clips of vocabulary discovery
- Discord: Language learning communities
- Educator outreach: Chinese teachers
- Product Hunt: Launch post

### Success Criteria

**Engagement:**
- 500+ MAU
- ≥ 5 sessions per user per week
- ≥ 30% retention (7-day)
- NPS ≥ 30

**Technical:**
- Core Web Vitals: all green
- Mobile performance: LCP < 2.5s
- iOS/Android builds working
- 0 crashes on main features

**Business:**
- Cost per user acquisition < $2
- Free tier margin positive
- Positive feedback on new features

---

## Phase 3: Monetization (March to April 2026)

**Goal:** 10% premium conversion, $1K MRR, sustainable unit economics

### Milestones

| Milestone | Status | Target | Owner |
|-----------|--------|--------|-------|
| Premium tier design | Pending | Mar 15 | PM |
| Stripe integration | Pending | Mar 20 | Dev |
| Premium features | Pending | Mar 25 | Dev |
| SRS algorithm (spaced repetition) | Pending | Apr 1 | Dev |
| Social sharing | Pending | Apr 5 | Dev |
| Email marketing | Pending | Apr 1 | PM |

### Premium Features ($4.99/month)

- Unlimited photo analyses (vs 6/day free)
- Advanced statistics & insights
- Spaced repetition (SRS) mode
- No ads (if we add them to free tier)
- Priority support
- Export vocabulary (PDF/CSV)

### Retention Features

- Email reminders (daily, weekly)
- Streak milestones (10-day, 30-day badges)
- Achievement system
- Monthly challenges
- Learning community forum

### Success Criteria

**Conversion & Revenue:**
- 5-10% premium conversion rate
- $1K+ monthly recurring revenue
- < 5% churn rate
- CAC:LTV ratio ≥ 1:5

**Retention:**
- 30-day retention ≥ 50%
- 60-day retention ≥ 35%
- Daily active users ≥ 1.5K

---

## Phase 4: Scale & Expansion (April+ 2026)

**Goal:** 5K+ MAU, sustainable business model, explore new markets

### Strategic Initiatives

**1. Multiple Language Support**
- Japanese (most requested language)
- Spanish, Korean, Vietnamese
- Reuse core infrastructure
- Language-specific UI adjustments

**2. Teacher/Classroom Features**
- Class creation & management
- Student assignment tracking
- Group challenges
- Bulk vocabulary uploads
- Assessment tools

**3. Community Features**
- Leaderboards (weekly, monthly)
- Vocabulary sharing/discovery
- Study groups
- Peer reviews
- Social profiles

**4. Advanced Learning**
- Spaced repetition (SRS) algorithm
- AI-powered recommendations
- Learning path suggestions
- Adaptive difficulty
- Personalized insights

**5. Partnerships**
- Language schools integration
- Textbook publishers
- Influencer program
- Affiliate partnerships
- Corporate training

### Product Roadmap (Detailed)

| Quarter | Feature | Priority | Effort |
|---------|---------|----------|--------|
| Q2 2026 | Japanese language | High | M |
| Q2 2026 | Teacher dashboard | High | L |
| Q3 2026 | Community features | Medium | L |
| Q3 2026 | Advanced SRS | Medium | L |
| Q4 2026 | Spanish, Korean | Medium | M |
| Q4 2026 | API for 3rd parties | Low | M |
| 2027 | AI tutor (ChatGPT) | Medium | L |
| 2027 | VR/AR experiences | Low | XL |

---

## Success Metrics Dashboard

### Key Performance Indicators (KPIs)

**Acquisition**
- Monthly signups
- Free trial to signup conversion
- Cost per acquisition (CPA)
- Traffic sources

**Engagement**
- Daily Active Users (DAU)
- Monthly Active Users (MAU)
- Daily session time
- Feature usage (photos, practice, etc)
- Streak participation

**Retention**
- 1-day, 7-day, 30-day retention
- Churn rate (monthly)
- Lifetime value (LTV)
- Return user rate

**Monetization**
- Premium signups
- Monthly recurring revenue (MRR)
- Conversion rate
- Customer acquisition cost (CAC)
- CAC:LTV ratio
- Net revenue retention

**Quality**
- Error rate (< 0.5%)
- API response time (< 1s)
- Page load time (< 3s)
- Uptime (target 99%)
- Support ticket response time

**User Satisfaction**
- Customer satisfaction (CSAT) ≥ 4/5
- Net Promoter Score (NPS) ≥ 40
- App store rating ≥ 4.5/5
- Support feedback sentiment

### Tracking Methodology

- **Analytics:** Mixpanel or Amplitude (future)
- **Errors:** Sentry for JavaScript errors
- **Performance:** Vercel Analytics + custom monitoring
- **User feedback:** In-app surveys, email feedback
- **Financial:** Stripe dashboard for revenue

---

## Risk Management

### Critical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Groq API unreliability | Low | High | Implement Google Vision fallback, queue system |
| Low user adoption | Medium | High | Focused marketing, educator partnerships |
| AI accuracy issues | Medium | Medium | User feedback loop, prompt optimization |
| Competitive entry | Medium | Medium | Focus on UX, affordability, community |
| Churn after trial | Medium | High | Onboarding improvements, retention features |
| Scaling challenges | Low | High | Early load testing, infrastructure planning |

### Mitigation Strategies

1. **Groq Reliability**
   - Build fallback to Google Vision API
   - Implement queue system for peak load
   - Monitor API SLA closely
   - Cache results when possible

2. **User Adoption**
   - Beta tester feedback loop
   - Community engagement (Reddit, Discord)
   - Educator partnerships & support
   - Referral program

3. **Quality Assurance**
   - Continuous user testing
   - Monitor photo analysis accuracy
   - Rapid iteration on feedback
   - A/B testing for new features

---

## Resource Allocation

### Phase 1 (MVP)
- **Dev Capacity:** 100% implementation
- **PM/Design:** 20% (wireframes, user flows)
- **Total:** 1 dev full-time

### Phase 2 (Growth)
- **Dev Capacity:** 70% new features, 30% bug fixes
- **PM:** 40% (marketing, analytics)
- **Design:** 30% (UI/UX improvements, mobile)
- **Total:** 1.5 dev, 1 PM/designer (contract)

### Phase 3 (Monetization)
- **Dev Capacity:** 50% new, 30% maintenance, 20% infrastructure
- **PM:** 60% (growth, analytics, partnerships)
- **Sales:** 20% (early enterprise talks)
- **Total:** 2 devs, 1 PM, 0.5 sales

### Phase 4+ (Scale)
- Expand team as revenue allows
- Consider hiring: Customer support, community manager, additional engineers

---

## Financial Projections

### Phase 1-2: MVP to Growth

| Metric | Jan | Feb | Mar |
|--------|-----|-----|-----|
| Users | 50 | 300 | 800 |
| MAU | - | 200 | 500 |
| Revenue (MRR) | $0 | $0 | $250 |
| Cost (USD) | $150 | $200 | $400 |
| Margin | -$150 | -$200 | -$150 |

### Phase 3: Monetization

| Metric | Apr | May | Jun |
|--------|-----|-----|-----|
| Users | 1500 | 2500 | 3500 |
| MAU | 1200 | 2000 | 2800 |
| Premium % | 2% | 5% | 8% |
| Revenue (MRR) | $600 | $1500 | $2200 |
| Cost (USD) | $500 | $700 | $900 |
| Margin | $100 | $800 | $1300 |

**Assumptions:**
- Premium price: $4.99/month
- Cost breakdown: Infrastructure 40%, Groq API 30%, Marketing 20%, Other 10%
- Churn rate: 5% monthly
- Conversion rate: 3-8%

---

## Decision Gates

### End of Phase 1 (Feb 10, 2026)
**Go/No-Go Decision:** Proceed to Phase 2?

**Go Criteria (ALL required):**
- Core features working without critical bugs
- ≥ 50 active beta users
- Photo analysis < 5 seconds (90th percentile)
- User satisfaction ≥ 4/5 CSAT
- Cost per analysis < $0.005

**No-Go Criteria (ANY triggers abort):**
- Photo analysis fails > 20% of time
- < 30 active users
- Repeated crashes on main features
- Cost per analysis > $0.05

### End of Phase 2 (March 15, 2026)
**Go/No-Go Decision:** Launch publicly & monetize?

**Go Criteria:**
- 500+ MAU
- iOS/Android working
- All quiz modes implemented
- ≥ 30% 7-day retention
- Positive user feedback

**No-Go Criteria:**
- < 250 MAU
- Mobile apps unstable
- High churn (< 20% retention)
- Missing major features

### End of Phase 3 (April 15, 2026)
**Go/No-Go Decision:** Scale aggressively?

**Go Criteria:**
- 5% premium conversion
- $1K+ MRR
- Positive unit economics
- NPS ≥ 30

**No-Go Criteria:**
- < 2% conversion
- < $500 MRR
- Negative unit economics
- High refund rate

---

## Communication & Updates

- **Weekly standup:** Internal progress tracking
- **Bi-weekly user feedback:** Beta testers
- **Monthly roadmap review:** Adjust based on learnings
- **Quarterly planning:** Strategic adjustments
- **Public transparency:** Monthly blog updates (after launch)

---

## References

- **Product Strategy:** See `docs/project-overview-pdr.md`
- **Technical Details:** See `docs/system-architecture.md`
- **Code Standards:** See `docs/code-standards.md`

