# AI Image Dictionary - Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2026-02-16
**Platform:** Vercel (Web), Capacitor (Mobile)

---

## Overview

Deployment covers three platforms:
1. **Web App** - Vercel (Next.js optimized)
2. **Mobile Apps** - Apple App Store (iOS) & Google Play (Android) via Capacitor
3. **Database** - Supabase (managed PostgreSQL)

---

## Prerequisites

### Required Accounts & Keys

```
✓ GitHub account (for version control)
✓ Vercel account (connected to GitHub)
✓ Supabase account & project created
✓ Groq API key (AI vision)
✓ Google Cloud TTS API key (optional, Web Speech fallback)
✓ Apple Developer account (iOS builds)
✓ Google Play Developer account (Android builds)
```

### Local Development Environment

```bash
# Node.js & npm
node --version  # v18+ required
npm --version   # v8+ required

# Capacitor CLI (for mobile builds)
npm install -g @capacitor/cli

# Xcode (macOS, for iOS builds)
# Android Studio (for Android builds)
```

---

## Web Deployment (Vercel)

### 1. Connect GitHub Repository

**At:** https://vercel.com/new

1. Click "Import Project"
2. Select GitHub repository: `ai-image-dict`
3. Vercel auto-detects Next.js configuration
4. Click "Import"

### 2. Configure Environment Variables

**In Vercel Dashboard → Project Settings → Environment Variables:**

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_TTS_API_KEY=your_google_tts_key_here (optional)
```

**Variable Scope:** Production, Preview, Development

### 3. Deploy

**Automatic Deployment:**
- On GitHub `main` branch push → automatic Vercel build
- ~2-3 minutes to deploy
- Preview URLs for pull requests

**Manual Deployment:**
- Vercel Dashboard → Project → "Deployments" → "Redeploy"

### 4. Verify Deployment

```
✓ Visit: https://ai-image-dict.vercel.app
✓ Check: Network tab (images, API calls)
✓ Test: Login, photo analysis, vocabulary save
✓ Monitor: Vercel Analytics
```

### Domain Setup (Optional)

1. Vercel Dashboard → Settings → Domains
2. Add custom domain
3. Update DNS records (CNAME)
4. SSL auto-configured

---

## Database Setup (Supabase)

### 1. Create Project

**At:** https://supabase.com/dashboard

1. Click "New Project"
2. Select organization & name: "ai-image-dict"
3. Set strong password
4. Choose region (US/EU/APAC)
5. Wait for initialization (~5 min)

### 2. Run Migrations

**SQL Scripts Location:** `supabase/migrations/`

**Method 1: Supabase Dashboard**

1. Go to SQL Editor
2. Copy & paste migration files in order:
   - `20260127_add_srs_fields.sql`
   - `20260128_add_daily_goals_table.sql`
   - `20260128235600_vocabulary_lists_and_courses.sql`
   - (continue with others in chronological order)
3. Execute each script

**Method 2: Supabase CLI (Recommended)**

```bash
# Install Supabase CLI
npm install -g supabase

# Link to project
supabase link --project-ref xxxxx

# Push migrations
supabase push
```

### 3. Enable Row-Level Security (RLS)

**All Tables Require RLS:**

1. Supabase Dashboard → Authentication → Policies
2. For each table (profiles, vocabulary_items, etc.):
   - Enable RLS toggle
   - Create policy: `SELECT/INSERT/UPDATE/DELETE WHERE (auth.uid() = user_id)`

**Example Policy:**
```sql
CREATE POLICY "Users can see own vocabulary"
ON vocabulary_items FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create vocabulary"
ON vocabulary_items FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### 4. Configure Authentication

**Email/Password Provider:**

1. Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider
3. Set up email templates (optional)

**Google OAuth:**

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback`
4. Supabase Dashboard → Authentication → Providers → Google → paste Client ID + Secret → Enable

**Redirect URLs (Supabase → Authentication → URL Configuration):**

- Site URL: `http://localhost:3000` (dev) or production URL
- Additional redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `https://ai-image-dict.vercel.app/auth/callback`
  - `aiimagedict://auth/callback` (Expo mobile)

### 5. Create Storage Buckets

**For image storage:**

```sql
-- Create buckets for photos & avatars
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('photos', 'photos', true),
  ('avatars', 'avatars', true),
  ('tts', 'tts', false);

-- Set bucket policies
CREATE POLICY "Users can upload their photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos' AND auth.uid()::text = owner);

CREATE POLICY "Users can view photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- The tts bucket is accessed by server-side service role only.
-- No public policy is required.
```

### 6. Create Database Triggers

**Auto-create profiles on user signup:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Mobile Deployment (Capacitor)

### 1. Build Web Assets

```bash
# Build Next.js production bundle
npm run build

# Copy to Capacitor web folder
npx cap copy
```

### 2. iOS Deployment

#### Prerequisites

```
✓ Xcode 15+
✓ Apple Developer account
✓ Apple Developer Program member ($99/year)
```

#### Build Steps

```bash
# Add iOS platform
npx cap add ios

# Sync native files
npx cap sync ios

# Open Xcode
npx cap open ios
```

**In Xcode:**

1. Select "ai-image-dict" target
2. Signing & Capabilities:
   - Select Team (Apple Developer account)
   - Automatic signing enabled
   - Bundle identifier: com.aiimagedict.app
3. Build settings:
   - Minimum deployment: iOS 14.0
4. Build → Archive
5. Distribute to App Store

#### Upload to App Store

1. App Store Connect → My Apps
2. Create new app
3. Version & build info
4. Screenshots, description, keywords
5. Submit for review (~24-48 hours)

### 3. Android Deployment

#### Prerequisites

```
✓ Android Studio
✓ Java Development Kit (JDK) 11+
✓ Google Play Developer account ($25 one-time)
```

#### Build Steps

```bash
# Add Android platform
npx cap add android

# Sync native files
npx cap sync android

# Open Android Studio
npx cap open android
```

**In Android Studio:**

1. Build → Build Bundle/APK
2. Build Signed Bundle:
   - Create new keystore (first time only)
   - Fill keystore information
   - Generate key
3. Wait for build completion

#### Upload to Google Play

1. Google Play Console → Create new app
2. App type: App
3. App name & default language
4. Content rating questionnaire
5. Pricing & distribution (countries)
6. Upload signed bundle
7. Add screenshots, description, changelog
8. Submit for review (~2-4 hours)

### 4. Mobile Configuration

**Update capacitor.config.ts:**

```typescript
const config: CapacitorConfig = {
  appId: 'com.aiimagedict.app',
  appName: 'AI Image Dictionary',
  webDir: 'out',
  server: {
    url: 'https://ai-image-dict.vercel.app',
    cleartext: false, // HTTPS only
  },
  ios: {
    scheme: 'com.aiimagedict.app',
  },
  android: {
    buildOptions: {
      keystorePath: 'keystore.jks',
      keystorePassword: 'password',
      keystoreAlias: 'key0',
      keystoreAliasPassword: 'password',
      releaseType: 'APK',
    },
  },
  plugins: {
    Camera: {
      permissions: ['camera'],
    },
    Toast: {},
  },
};
```

---

## Environment Variables

### Web & Server Environment

**Create `.env.local` in project root:**

```bash
# Supabase (Public)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Supabase (Private - Server Only)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# AI & Integrations
GROQ_API_KEY=gsk_xxxxx
GOOGLE_TTS_API_KEY=xxxxx

# Feature Flags
NEXT_PUBLIC_ENABLE_PREMIUM=true
NEXT_PUBLIC_ENABLE_MOBILE=true
```

### Vercel Environment Setup

**Add secrets to Vercel:**

```bash
vercel env add GROQ_API_KEY
vercel env add GOOGLE_TTS_API_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

### Mobile Environment

**Capacitor reads from `.env.local` & `process.env` variables**

No separate mobile `.env` needed - uses web app environment.

---

## Health Checks & Monitoring

### Vercel Monitoring

**Check dashboard:**
- Deployments status
- Build logs & errors
- Performance metrics (Core Web Vitals)
- Analytics (traffic, users, errors)

### Supabase Monitoring

**Check dashboard:**
- Database health & performance
- Authentication stats
- Storage usage
- API logs & errors

### Uptime Monitoring (Optional)

**Use services like:**
- Uptime Robot (free)
- Better Stack
- Datadog

**Monitor endpoints:**
- `https://ai-image-dict.vercel.app` (home page)
- `https://ai-image-dict.vercel.app/api/word-of-day` (API health)

---

## Rollback & Recovery

### Rollback Vercel Deployment

1. Vercel Dashboard → Deployments
2. Click deployment to rollback
3. Click "Promote to Production"
4. Automatic re-deploy from that commit

### Database Rollback

**Supabase backups:**

1. Project Settings → Backups & Recovery
2. Available backups shown (auto-daily)
3. Click "Restore" on chosen backup
4. Data restored to that point-in-time

### Disaster Recovery Plan

**In case of data loss:**

1. Use Supabase point-in-time recovery
2. Restore to backup before incident
3. Alert users if data affected
4. Document incident in changelog

---

## Performance Optimization

### Web Performance

**Vercel Analytics:**
- Monitor Core Web Vitals (LCP, FID, CLS)
- Check image optimization
- Analyze JavaScript bundle size

**Commands:**

```bash
# Check bundle size
npm run build
# Output: .next/static/

# Analyze bundle
npx next-bundle-analyzer
```

### Database Performance

**Supabase Performance Dashboard:**
- Query performance (slow queries)
- Index usage
- Connection pool status
- CPU/Memory usage

**Optimize:**
- Add indexes on user_id, created_at
- Monitor table sizes
- Clean up old data (archival strategy)

### Mobile Performance

**Measure with:**
- Lighthouse (Chrome DevTools)
- React Profiler (react-dom/profiling)
- Capacitor performance metrics

---

## Security Checklist

**Before production deployment:**

- [ ] Environment variables are secrets (not hardcoded)
- [ ] HTTPS enabled on all endpoints
- [ ] RLS policies configured on all tables
- [ ] CORS configured correctly
- [ ] Rate limiting enabled (API routes)
- [ ] Input validation on all forms
- [ ] No sensitive data in logs
- [ ] CSRF protection enabled
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS protection (React auto-escapes)
- [ ] Sensitive keys not committed to Git

---

## Post-Deployment Checklist

**After deploying:**

- [ ] Login works (email/password)
- [ ] Photo analysis works
- [ ] Vocabulary save/retrieval works
- [ ] Practice modes functional
- [ ] TTS plays audio
- [ ] Stats dashboard loads
- [ ] Mobile apps launch correctly
- [ ] No errors in browser console
- [ ] No errors in server logs
- [ ] Performance metrics acceptable
- [ ] Analytics tracking active

---

## Troubleshooting

### Common Issues

**Vercel build fails:**
```
Check build logs: Vercel Dashboard → Deployments → Build logs
Common: Missing env var, TypeScript error, build timeout
Fix: Add env var, fix error, increase timeout in vercel.json
```

**Supabase connection fails:**
```
Check: NEXT_PUBLIC_SUPABASE_URL and ANON_KEY
Error: "Invalid API key" → Regenerate key in Supabase
Error: "Connection timeout" → Check Supabase status
```

**Mobile app won't launch:**
```
Check: capacitor.config.ts server URL
Ensure: Web app is deployed and accessible
Test: Build app with --prod flag
```

**Images not loading:**
```
Check: Storage bucket policies
Check: Image proxy endpoint working
Check: CORS configuration
```

---

## Maintenance & Updates

### Regular Tasks

**Daily:**
- Monitor error logs
- Check uptime status
- Review analytics

**Weekly:**
- Review performance metrics
- Check database size/growth
- Update dependencies (minor)

**Monthly:**
- Security audit
- Backup verification
- Update major dependencies
- Review costs

### Update Process

```bash
# Test in development
npm install
npm run dev

# Run tests
npm run test

# Build & verify
npm run build
npm run lint
npm run type-check

# Commit & push
git add .
git commit -m "chore: update dependencies"
git push origin main
# Vercel auto-deploys
```

---

## References

- [Vercel Deployment Guide](https://vercel.com/docs)
- [Supabase Getting Started](https://supabase.com/docs/guides/getting-started)
- [Capacitor Deployment](https://capacitorjs.com/docs/guides/deploying-to-app-stores)
- [App Store Connect Guide](https://developer.apple.com/app-store-connect/)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)

---

**Last Updated:** 2026-02-16
**Next Review:** 2026-03-16
