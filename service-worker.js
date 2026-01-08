const CACHE_NAME = 'radres-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/src/pages/dashboard.html',
    '/src/styles/main.css',
    '/src/modules/toon-parser.js',
    '/src/modules/srs-engine.js',
    '/src/auth/supabase-client.js',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch new
                return response || fetch(event.request);
            })
    );
});
