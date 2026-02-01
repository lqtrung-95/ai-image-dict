---
title: "AI Image Dictionary - React Native Migration"
description: "Migrate web app to React Native using Expo SDK 52+ with iOS-first approach"
status: in_progress
priority: P0
effort: 12 weeks
branch: main
tags: [react-native, expo, mobile, migration]
created: 2026-02-01
---

# React Native Migration Plan

## Goal
Migrate AI Image Dictionary web app to React Native using Expo SDK 52+ while keeping the existing Next.js web app unchanged.

## Architecture
- **Frontend**: React Native with Expo Router (file-based navigation)
- **Backend**: Reuse existing Next.js API routes
- **State**: Zustand + TanStack Query
- **Styling**: NativeWind v4 (Tailwind for RN)
- **Auth**: Supabase Auth with SecureStore
- **Storage**: expo-sqlite for offline, Supabase for cloud

## Phases

| Phase | Name | Status | Priority |
|-------|------|--------|----------|
| 01 | Expo Project Setup | completed | P0 |
| 02 | Shared Code Extraction | completed | P0 |
| 03 | Authentication Setup | completed | P0 |
| 04 | Core UI Components | completed | P0 |
| 05 | Photo Capture & Analysis | completed | P0 |
| 06 | Vocabulary Management | completed | P1 |
| 07 | Practice & Quiz Features | completed | P1 |
| 08 | Dashboard & Progress | completed | P1 |
| 09 | Courses, Stories & Games | pending | P2 |
| 10 | Settings & Profile | completed | P2 |
| 11 | Offline Sync | pending | P2 |
| 12 | Polish & Deployment | pending | P3 |

## Key Decisions
- Use Expo Router over React Navigation for file-based routing
- NativeWind v4 for Tailwind CSS compatibility
- Zustand for client state, TanStack Query for server state
- Supabase Auth with expo-secure-store for token storage
- expo-image-picker for camera/gallery (simpler than expo-camera)
- expo-speech for TTS (simple use case)
- expo-sqlite for offline vocabulary storage

## Project Structure
```
apps/mobile/
├── app/                    # Expo Router file-based routes
│   ├── (auth)/            # Auth screens
│   ├── (tabs)/            # Main tab navigation
│   └── _layout.tsx        # Root layout
├── components/            # React Native components
├── hooks/                 # Custom hooks
├── lib/                   # Utilities, API clients
├── stores/                # Zustand stores
├── types/                 # TypeScript types
└── assets/                # Images, fonts
```

## Dependencies
See individual phase files for specific package installations.

## Unresolved Questions
1. Should we use Expo Dev Client for development builds?
2. Push notifications - implement now or later?
3. Analytics integration - Mixpanel/Amplitude?

## Quick Start

```bash
cd apps/mobile

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your credentials

# Start development
npm start
```
