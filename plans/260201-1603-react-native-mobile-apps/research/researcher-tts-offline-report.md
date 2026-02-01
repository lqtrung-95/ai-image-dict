# TTS and Offline Support in Expo React Native

## 1. expo-speech for TTS

### Capabilities
- Cross-platform TTS (Android, iOS, Web)
- Works in Expo Go
- Voice selection, pitch/rate control
- Callbacks: onStart, onDone, onStopped, onError, onBoundary

### Limitations
- **iOS silent mode**: No sound if device is in silent mode
- **pause/resume**: Not available on Android
- **volume control**: Web only
- **maxSpeechInputLength**: Platform-dependent

### Usage Example
```javascript
import * as Speech from 'expo-speech';

// Basic speech
Speech.speak('Hello world', {
  language: 'en-US',
  pitch: 1.0,
  rate: 1.0,
  voice: 'voice-identifier',
  onDone: () => console.log('Done'),
  onError: (err) => console.error(err),
});

// Check voices
const voices = await Speech.getAvailableVoicesAsync();

// Stop speaking
Speech.stop();
```

---

## 2. Alternative TTS Libraries

### react-native-tts
- More granular control (ducking, engines on Android)
- iOS: ignore silent switch option
- Events: tts-start, tts-progress, tts-finish, tts-cancel
- **Trade-off**: Requires native linking, not Expo Go compatible

```javascript
import Tts from 'react-native-tts';

Tts.setDefaultLanguage('en-US');
Tts.setDefaultRate(0.6);
Tts.setDefaultPitch(1.0);
Tts.speak('Hello world');

// Events
Tts.addEventListener('tts-finish', () => {});
```

---

## 3. Audio Playback for Pre-generated TTS

### expo-audio (expo-av successor)
- Play local/remote audio files
- Full playback controls (play, pause, seek)
- Status monitoring via hooks

```javascript
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';

const player = useAudioPlayer(require('./tts-file.mp3'));
const status = useAudioPlayerStatus(player);

// Playback
player.play();
player.pause();
player.seekTo(0); // Reset for replay
```

**Best for**: Pre-generated TTS files from server, offline caching

---

## 4. Offline Data Storage Comparison

| Feature | expo-sqlite | WatermelonDB | AsyncStorage |
|---------|-------------|--------------|--------------|
| **Type** | Relational DB | Reactive ORM | Key-value |
| **Performance** | Excellent | Excellent (lazy-loaded) | Good for small data |
| **Complexity** | Medium | High | Low |
| **Sync** | Manual | Built-in sync | Manual |
| **Encryption** | Optional (SQLCipher) | Via SQLite | No |
| **Use case** | Structured data | Large datasets | Settings, tokens |

### expo-sqlite Example
```javascript
import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';

// Setup
<SQLiteProvider databaseName="words.db" onInit={migrateDbIfNeeded}>
  <App />
</SQLiteProvider>

// Usage
const db = useSQLiteContext();

// Prepared statements (SQL injection safe)
const statement = await db.prepareAsync('INSERT INTO words (word, translation) VALUES (?, ?)');
await statement.executeAsync(['hello', 'xin chao']);
await statement.finalizeAsync();

// Transactions
await db.withTransactionAsync(async () => {
  await db.runAsync('INSERT...');
  await db.runAsync('UPDATE...');
});
```

### AsyncStorage Example
```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store
await AsyncStorage.setItem('userToken', token);

// Retrieve
const token = await AsyncStorage.getItem('userToken');

// Multi-get for batch
const values = await AsyncStorage.multiGet(['key1', 'key2']);
```

---

## 5. Sync Strategies for Offline-First Apps

### Pattern: Queue + Sync
```javascript
// Local queue for pending changes
const queueChange = async (operation, data) => {
  const pending = await getPendingChanges();
  pending.push({ operation, data, timestamp: Date.now() });
  await savePendingChanges(pending);
};

// Sync when online
const syncPendingChanges = async () => {
  const pending = await getPendingChanges();
  for (const change of pending) {
    try {
      await api.sync(change);
      await removePendingChange(change.id);
    } catch (err) {
      // Retry later
      break;
    }
  }
};
```

### WatermelonDB Sync
- Built-in sync primitives
- Conflict resolution via server
- Optimistic UI updates

---

## 6. Background Tasks and Data Sync

### expo-background-task (replaces expo-background-fetch)
- Uses WorkManager (Android) / BGTaskScheduler (iOS)
- Minimum interval: 15 min (Android), system-controlled (iOS)
- **Limitation**: Not available on iOS simulators

```javascript
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';

const TASK_NAME = 'sync-task';

// Define task
TaskManager.defineTask(TASK_NAME, async () => {
  try {
    await syncPendingChanges();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

// Register
await BackgroundTask.registerTaskAsync(TASK_NAME, {
  minimumInterval: 15 * 60, // 15 minutes
});
```

**iOS Info.plist:**
```xml
<key>UIBackgroundModes</key>
<array>
  <string>processing</string>
</array>
```

---

## 7. Network State Detection

```javascript
import NetInfo from '@react-native-community/netinfo';

// One-time check
const state = await NetInfo.fetch();
if (state.isConnected) {
  await syncPendingChanges();
}

// Subscribe to changes
const unsubscribe = NetInfo.addEventListener(state => {
  if (state.isConnected) {
    syncPendingChanges();
  }
});

// Cleanup
unsubscribe();
```

---

## Recommendations

| Use Case | Solution |
|----------|----------|
| Simple TTS | expo-speech |
| Advanced TTS (ignore silent, engines) | react-native-tts (requires dev build) |
| Pre-generated audio | expo-audio with file caching |
| Structured vocab data | expo-sqlite |
| Large dataset + sync | WatermelonDB |
| Settings/preferences | AsyncStorage |
| Periodic sync | expo-background-task |
| Immediate sync on connect | NetInfo + manual sync |

## Unresolved Questions

1. What is the expected vocabulary data size per user?
2. Should TTS be generated on-device or pre-generated server-side?
3. Is real-time collaboration/sync needed or per-device sufficient?
