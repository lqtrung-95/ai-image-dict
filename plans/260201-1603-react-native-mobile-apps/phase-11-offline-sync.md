---
title: "Phase 11: Offline Support and Data Sync"
description: "Implement offline storage, data sync, and background tasks"
---

# Phase 11: Offline Support and Data Sync

## Context Links
- Parent Plan: [plan.md](./plan.md)
- Previous Phase: [phase-10-settings-and-profile.md](./phase-10-settings-and-profile.md)
- Research: [researcher-tts-offline-report.md](./research/researcher-tts-offline-report.md)

## Overview
- **Priority:** P2
- **Status:** Pending
- **Description:** Implement offline storage with SQLite, data synchronization, and background sync tasks.
- **Estimated Effort:** 4-5 days

## Key Insights
- Use expo-sqlite for structured data storage
- Implement queue for pending changes
- Sync when app comes online
- Cache vocabulary for offline practice
- Background sync for data updates

## Requirements

### Functional Requirements
- Offline vocabulary access
- Queue actions when offline
- Sync when connection restored
- Cache images for offline viewing
- Background data sync

### Technical Requirements
- expo-sqlite integration
- NetInfo for connectivity detection
- Background tasks (expo-background-task)
- Sync conflict resolution

## Implementation Steps

### Step 1: Setup SQLite Database
Create `lib/offline-database.ts`:
```typescript
import { SQLiteDatabase } from 'expo-sqlite';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const DATABASE_VERSION = 1;

  const result = await db.getFirstAsync<{ user_version: number }>(
    'PRAGMA user_version'
  );
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS vocabulary (
        id TEXT PRIMARY KEY,
        word_english TEXT NOT NULL,
        word_chinese_simplified TEXT NOT NULL,
        pinyin TEXT NOT NULL,
        notes TEXT,
        synced INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS pending_changes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation TEXT NOT NULL,
        table_name TEXT NOT NULL,
        data TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch())
      );

      CREATE TABLE IF NOT EXISTS practice_sessions_offline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        vocabulary_id TEXT NOT NULL,
        correct INTEGER NOT NULL,
        mode TEXT NOT NULL,
        created_at INTEGER DEFAULT (unixepoch()),
        synced INTEGER DEFAULT 0
      );
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export async function cacheVocabulary(db: SQLiteDatabase, words: any[]) {
  const statement = await db.prepareAsync(
    'INSERT OR REPLACE INTO vocabulary (id, word_english, word_chinese_simplified, pinyin, notes) VALUES (?, ?, ?, ?, ?)'
  );

  for (const word of words) {
    await statement.executeAsync([
      word.id,
      word.word_english,
      word.word_chinese_simplified,
      word.pinyin,
      word.notes,
    ]);
  }

  await statement.finalizeAsync();
}

export async function getOfflineVocabulary(db: SQLiteDatabase) {
  return await db.getAllAsync('SELECT * FROM vocabulary');
}

export async function queueChange(
  db: SQLiteDatabase,
  operation: string,
  tableName: string,
  data: any
) {
  await db.runAsync(
    'INSERT INTO pending_changes (operation, table_name, data) VALUES (?, ?, ?)',
    [operation, tableName, JSON.stringify(data)]
  );
}
```

### Step 2: Create Sync Hook
Create `hooks/useSync.ts`:
```typescript
import { useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useSQLiteContext } from 'expo-sqlite';
import { apiClient } from '@/lib/api-client';

export function useSync() {
  const db = useSQLiteContext();

  const syncPendingChanges = useCallback(async () => {
    const pending = await db.getAllAsync<{
      id: number;
      operation: string;
      table_name: string;
      data: string;
    }>('SELECT * FROM pending_changes ORDER BY created_at ASC');

    for (const change of pending) {
      try {
        const data = JSON.parse(change.data);

        switch (change.operation) {
          case 'CREATE_VOCABULARY':
            await apiClient.post('/api/vocabulary', data);
            break;
          case 'UPDATE_VOCABULARY':
            await apiClient.put(`/api/vocabulary/${data.id}`, data);
            break;
          case 'DELETE_VOCABULARY':
            await apiClient.delete(`/api/vocabulary/${data.id}`);
            break;
          case 'PRACTICE_ATTEMPT':
            await apiClient.post('/api/word-attempts', data);
            break;
        }

        // Remove synced change
        await db.runAsync('DELETE FROM pending_changes WHERE id = ?', [change.id]);
      } catch (error) {
        console.error('Sync failed for change:', change.id, error);
        break; // Stop syncing on error, retry later
      }
    }
  }, [db]);

  useEffect(() => {
    // Sync when app comes online
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        syncPendingChanges();
      }
    });

    // Sync when app becomes active
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        NetInfo.fetch().then((state) => {
          if (state.isConnected) {
            syncPendingChanges();
          }
        });
      }
    });

    return () => {
      unsubscribe();
      subscription.remove();
    };
  }, [syncPendingChanges]);

  return { syncPendingChanges };
}
```

## Todo List
- [ ] Setup SQLite database
- [ ] Create vocabulary cache table
- [ ] Create pending changes queue
- [ ] Implement sync hook
- [ ] Add network detection
- [ ] Cache vocabulary offline
- [ ] Queue actions when offline
- [ ] Test offline functionality
- [ ] Test sync on reconnect

## Success Criteria
- [ ] Vocabulary caches to SQLite
- [ ] Actions queue when offline
- [ ] Sync triggers on reconnect
- [ ] No data loss during sync
- [ ] Conflict resolution works

## Next Steps
Proceed to [Phase 12: Polish and Deployment](./phase-12-polish-and-deployment.md).
