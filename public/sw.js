/**
 * Service Worker for AI Image Generator PWA
 * Caches core assets for offline loading
 */

const CACHE_NAME = 'ai-image-gen-v1';

const CORE_ASSETS = [
    '/',
    '/index.html',
    '/css/base.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/gallery.css',
    '/js/app.js',
    '/js/api.js',
    '/js/gallery.js',
    '/js/state.js',
    '/js/utils.js',
    '/js/prompts.js'
];

/**
 * Install event - cache core assets
 */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching core assets');
                return cache.addAll(CORE_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => {
                            console.log('[SW] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

/**
 * Fetch event - serve from cache, fallback to network
 * Uses "cache first" strategy for core assets, "network first" for API calls
 */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip API requests - always go to network
    if (url.pathname.startsWith('/api/')) {
        return;
    }

    // Skip external requests
    if (url.origin !== location.origin) {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    // Return cached response and update cache in background
                    event.waitUntil(
                        fetch(request)
                            .then((networkResponse) => {
                                if (networkResponse.ok) {
                                    caches.open(CACHE_NAME)
                                        .then((cache) => cache.put(request, networkResponse));
                                }
                            })
                            .catch(() => { /* Ignore network errors during background update */ })
                    );
                    return cachedResponse;
                }

                // No cache match - fetch from network
                return fetch(request)
                    .then((networkResponse) => {
                        // Cache successful responses for static assets
                        if (networkResponse.ok && isStaticAsset(url.pathname)) {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => cache.put(request, responseToCache));
                        }
                        return networkResponse;
                    });
            })
    );
});

/**
 * Check if a path is a static asset that should be cached
 * @param {string} pathname 
 * @returns {boolean}
 */
function isStaticAsset(pathname) {
    return pathname.endsWith('.html') ||
        pathname.endsWith('.css') ||
        pathname.endsWith('.js') ||
        pathname.endsWith('.png') ||
        pathname.endsWith('.jpg') ||
        pathname.endsWith('.svg') ||
        pathname.endsWith('.ico') ||
        pathname === '/';
}
