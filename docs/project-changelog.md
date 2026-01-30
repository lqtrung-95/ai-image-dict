# AI Image Dictionary - Project Changelog

**Format:** Semantic Versioning (MAJOR.MINOR.PATCH)
**Last Updated:** 2026-01-27

---

## [Unreleased] - In Development

### Added
- Initial documentation suite (codebase summary, architecture, standards, roadmap)
- Repomix codebase analysis output
- Development roadmap phases and milestones
- Code standards & guidelines documentation
- System architecture diagrams and data flows

### Changed
- README placeholder with proper project overview

### Fixed
- (TBD by development team)

### Deprecated
- (None yet)

### Removed
- (None yet)

---

## [1.0.0] - MVP Planned (February 2026)

### Planned Features

**Core Photo Analysis**
- Camera capture via browser camera API
- Photo upload from device
- Groq AI vision analysis (Llama 4 Scout model)
- Chinese vocabulary detection with Pinyin & English

**Vocabulary Management**
- Save detected words to personal vocabulary list
- View vocabulary history & search
- Organize into collections/categories
- View original analysis photos

**Practice Modes**
- Flashcard mode (flip to reveal translation)
- Multiple choice quiz (Chinese → English)
- Listening quiz (audio → English)
- Pinyin input quiz (type Pinyin for character)

**User Features**
- Email/password authentication (Supabase Auth)
- User profile & settings
- Progress dashboard with stats
- Daily learning streak counter
- Practice session history

**Trial System**
- 2 free photo analyses without account
- 6 analyses per day limit for free tier
- Premium tier option (future)

**Text-to-Speech**
- Chinese pronunciation guide
- Google Cloud TTS API (primary)
- Web Speech API (browser fallback)
- Tone mark support for Mandarin

---

## Previous Releases (from git history)

### [2026-01-27] - Recent Updates
```
Commit: 5ee2e13 - feat: 🎸 update
Commit: eefcbd1 - chore: update capacitor dependencies to version 7.4.4
Commit: 2b780fd - feat: 🎸 update
Commit: 87d8a0d - feat: 🎸 update
Commit: e95694f - feat: 🎸 add support for scene descriptions in Chinese and Pinyin
Commit: 679043e - feat: 🎸 update
Commit: 52234ec - feat: 🎸 update
Commit: 10aa5ac - feat: 🎸 update
Commit: 3fc46aa - feat: 🎸 update
Commit: f0dd417 - redesign: impressive animated landing page
```

---

## Changelog Guidelines

### How to Update This File

When making significant changes, add entries following this format:

```markdown
### [Section]

**Issue:** #123 (if applicable)
**Type:** feature|bugfix|improvement|security|documentation

Description of what changed and why. Include:
- What was added/changed/fixed
- Why it matters to users/developers
- Any breaking changes or migration needed
- Related PRs or issues

**Files Changed:**
- src/components/Example.tsx
- src/lib/service.ts
```

### Change Type Guidelines

| Type | When to Use | Example |
|------|------------|---------|
| **Added** | New feature or capability | "Add spaced repetition algorithm" |
| **Changed** | Existing feature modified | "Improve photo analysis speed by 30%" |
| **Fixed** | Bug resolution | "Fix crash when analyzing blurry photos" |
| **Improved** | Enhancement to existing | "Better error messages on upload fail" |
| **Security** | Security fix or hardening | "Add rate limiting to API" |
| **Performance** | Speed/efficiency improvement | "Optimize image compression algorithm" |
| **Documentation** | Docs changes only | "Add API endpoint documentation" |
| **Deprecated** | Feature marked for removal | "Deprecate old quiz mode (remove in v2.0)" |
| **Removed** | Feature deletion | "Remove analytics that users disabled" |

### Severity Levels

For bugs and issues:
- **Critical (P0):** App crashes, data loss, security breach
- **High (P1):** Feature completely broken, significant UX issue
- **Medium (P2):** Feature partially broken, workaround exists
- **Low (P3):** Minor issue, cosmetic, edge case

---

## Release Process

### MVP Release (February 2026)
1. Feature complete by Feb 8
2. Beta testing Feb 8-10 (bug fixes)
3. Launch Feb 10 (v1.0.0)
4. Update changelog with all v1.0.0 features

### Patch Releases (v1.0.x)
- Released as bugs are fixed
- Cherry-picked from main branch
- Update changelog immediately after release

### Minor Releases (v1.1.0, v1.2.0)
- New features added without breaking changes
- Released monthly (or as needed)
- Complete feature description in changelog

### Major Releases (v2.0.0)
- Breaking changes to API or data model
- Significant architecture changes
- Deprecation warnings in prior minor release
- Migration guide provided

---

## Historical Notes

### Why This Format?

This changelog follows [Keep a Changelog](https://keepachangelog.com/) conventions:
- Easy to read and parse by humans
- Searchable for specific features
- Structured for automated tools
- Version-focused organization

### Audience

This changelog is for:
- **Users:** Understanding what features/fixes are available
- **Developers:** Tracking codebase evolution
- **Product:** Release notes and feature announcements
- **Support:** Communicating changes to customers

---

## Planned Major Milestones

| Version | Timeline | Focus |
|---------|----------|-------|
| v1.0 | Feb 2026 | MVP with core features |
| v1.1 | Mar 2026 | Polish & performance |
| v1.2 | Mar 2026 | Quiz modes, collections |
| v2.0 | Apr 2026 | Monetization, multiple languages |
| v2.1+ | Q3-Q4 2026 | Scale, new features, integrations |

---

## Known Issues & Limitations (MVP)

### Limitations
- Photo analysis limited to 12MB files
- Groq API has rate limits (30 req/min free tier)
- English translations may be basic (no AI-generated)
- No offline support (requires internet)
- Mobile app not yet available (web-only)

### Known Issues
- (To be populated during beta testing)

### Future Improvements
- See `docs/development-roadmap.md` for detailed planning

---

## Contributor Guidelines

When contributing, please:

1. **Create detailed commit messages**
   ```
   feat: Add spaced repetition to practice mode

   - Implement SRS algorithm using sm-2
   - Add interval tracking to vocabulary_items
   - Show review schedule to user

   Fixes #123
   ```

2. **Update changelog before merging**
   - Add entry under [Unreleased]
   - Link to PR/issue number
   - Describe user-facing impact

3. **Follow semantic versioning**
   - MAJOR.MINOR.PATCH
   - Major: Breaking changes
   - Minor: New features (backward compatible)
   - Patch: Bug fixes

---

## References

- **Keep a Changelog:** https://keepachangelog.com/
- **Semantic Versioning:** https://semver.org/
- **Conventional Commits:** https://www.conventionalcommits.org/

