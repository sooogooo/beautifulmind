/**
 * 美丽的心灵地图 - Service Worker
 * Enables offline reading and caching
 */

const CACHE_NAME = 'beautifulmind-v1';
const OFFLINE_URL = '/offline.html';

// Resources to cache immediately
const PRECACHE_URLS = [
    '/',
    '/index.html',
    '/reader.html',
    '/css/common.css',
    '/js/common.js',
    '/manifest.json',
    'https://docs.bccsw.cn/logo.png',
    'https://docs.bccsw.cn/favicon.png',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500&family=Noto+Serif+SC:wght@400;500;600&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap'
];

// Markdown files to cache for offline reading
const MD_FILES = [
    '/md/10-preface.md',
    '/md/02-motivation.md',
    '/md/03-decision-making.md',
    '/md/04-expectations.md',
    '/md/05-family-environment.md',
    '/md/06-communication.md',
    '/md/07-happiness.md',
    '/md/08-special-situations.md',
    '/md/09-beauty-planner.md',
    '/md/11-epilogue.md',
    '/md/12-psychology-effects-list.md'
];

// Install event - cache essential resources
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Pre-caching essential resources');
                return cache.addAll(PRECACHE_URLS);
            })
            .then(() => {
                // Cache markdown files in background (don't block install)
                caches.open(CACHE_NAME).then((cache) => {
                    MD_FILES.forEach((url) => {
                        fetch(url)
                            .then((response) => {
                                if (response.ok) {
                                    cache.put(url, response);
                                }
                            })
                            .catch(() => {
                                console.log('[SW] Failed to cache:', url);
                            });
                    });
                });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((cacheName) => cacheName !== CACHE_NAME)
                        .map((cacheName) => {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // Skip Chrome extension requests
    if (url.protocol === 'chrome-extension:') {
        return;
    }

    // Strategy: Cache First for static assets
    if (isStaticAsset(url)) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Strategy: Network First for HTML and Markdown
    if (isDocument(url) || isMarkdown(url)) {
        event.respondWith(networkFirst(request));
        return;
    }

    // Strategy: Stale While Revalidate for everything else
    event.respondWith(staleWhileRevalidate(request));
});

// Helper functions
function isStaticAsset(url) {
    return /\.(css|js|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i.test(url.pathname);
}

function isDocument(url) {
    return /\.(html?)$/i.test(url.pathname) || url.pathname.endsWith('/');
}

function isMarkdown(url) {
    return /\.md$/i.test(url.pathname);
}

// Cache First Strategy
async function cacheFirst(request) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.log('[SW] Cache first failed:', request.url);
        return new Response('Offline', { status: 503 });
    }
}

// Network First Strategy
async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            const offlineResponse = await caches.match(OFFLINE_URL);
            if (offlineResponse) {
                return offlineResponse;
            }
        }
        return new Response('Offline', { status: 503 });
    }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);

    const fetchPromise = fetch(request)
        .then((networkResponse) => {
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(() => cachedResponse);

    return cachedResponse || fetchPromise;
}

// Background sync for reading progress
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-reading-progress') {
        event.waitUntil(syncReadingProgress());
    }
});

async function syncReadingProgress() {
    // Future: sync reading progress to server
    console.log('[SW] Syncing reading progress...');
}

// Push notifications (future feature)
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: 'https://docs.bccsw.cn/logo.png',
            badge: 'https://docs.bccsw.cn/logo.png',
            vibrate: [100, 50, 100],
            data: {
                url: data.url || '/'
            }
        };
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    event.waitUntil(
        clients.openWindow(event.notification.data.url)
    );
});
