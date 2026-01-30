// Service Worker for AI Image Dictionary PWA
// Provides offline caching and background sync

const CACHE_NAME = 'ai-dictionary-v1';
const STATIC_ASSETS = [
  '/',
  '/login',
  '/signup',
  '/vocabulary',
  '/progress',
  '/practice',
  '/settings',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('SW: Installing...');

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('SW: Skip waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('SW: Cache failed', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activating...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('SW: Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('SW: Claiming clients');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip API requests (don't cache dynamic data)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip Supabase requests
  if (url.hostname.includes('supabase')) {
    return;
  }

  // Strategy: Cache First, then Network
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached response
        return cachedResponse;
      }

      // Fetch from network
      return fetch(request)
        .then((networkResponse) => {
          // Don't cache if not ok
          if (!networkResponse || !networkResponse.ok) {
            return networkResponse;
          }

          // Clone response before caching
          const responseToCache = networkResponse.clone();

          // Cache the new response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.error('SW: Fetch failed', error);

          // For navigation requests, return offline page
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }

          throw error;
        });
    })
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('SW: Background sync', event.tag);

  if (event.tag === 'sync-vocabulary') {
    event.waitUntil(syncVocabularyChanges());
  }
});

// Handle push notifications (future feature)
self.addEventListener('push', (event) => {
  console.log('SW: Push received', event);

  const options = {
    body: event.data?.text() || 'Time to practice your Chinese vocabulary!',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'practice-reminder',
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification('AI Dictionary', options));
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('SW: Notification click', event);

  event.notification.close();

  event.waitUntil(clients.openWindow('/practice'));
});

// Helper function to sync vocabulary changes
async function syncVocabularyChanges() {
  // This would sync any offline vocabulary additions
  // Implementation would depend on your app's offline storage strategy
  console.log('SW: Syncing vocabulary changes...');
}
