// Community Hero Service Worker
// Handles offline caching for map tiles and last-viewed issues

const CACHE_NAME = 'community-hero-v2';
const STATIC_ASSETS = [
  '/',
  '/map',
  '/report',
  '/leaderboard',
  '/manifest.json',
];

// Install: pre-cache static routes
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - API requests: network-first with offline fallback
// - Static assets: cache-first
// - Map tiles: stale-while-revalidate (cache 30 min)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin && !url.hostname.includes('maps.googleapis.com') && !url.hostname.includes('gstatic.com')) return;

  // Google Maps tiles — stale-while-revalidate
  if (url.hostname.includes('maps.googleapis.com') || url.hostname.includes('maps.gstatic.com')) {
    event.respondWith(
      caches.open('maps-tiles-cache').then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((res) => {
          cache.put(request, res.clone());
          return res;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // API routes — network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() =>
        new Response(
          JSON.stringify({ success: false, error: 'Offline — request queued', offline: true }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  // Everything else — cache first
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((res) => {
        // Cache successful responses
        if (res.status === 200) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, res.clone()));
        }
        return res;
      });
    })
  );
});

// Push notification handler
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Community Hero', {
      body: payload.body || 'Your civic report has been updated.',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { url: payload.url || '/' },
      actions: [
        { action: 'view', title: 'View Issue' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
