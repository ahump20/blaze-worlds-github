const CACHE_NAME = 'blaze-worlds-championship-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/launcher.html',
    '/conquest.html',
    '/classic.html',
    '/js/blaze-analytics-integration.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => response || fetch(event.request))
    );
});
