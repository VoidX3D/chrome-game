const cacheName = 'dino-cache-v1';
const cacheFiles = [
  '/',
  '/index.html',
  '/style.css',
  '/game.js',
  '/manifest.json',
  '/assets/dino-run1.png',
  '/assets/dino-run2.png',
  '/assets/dino-duck1.png',
  '/assets/dino-duck2.png',
  '/assets/dino-jump.png',
  '/assets/cactus1.png',
  '/assets/cactus2.png',
  '/assets/bird1.png',
  '/assets/bird2.png',
  '/assets/crow1.png',
  '/assets/crow2.png',
  '/assets/tumbleweed.png',
  '/assets/ground.png',
  '/assets/cloud.png',
  '/assets/moon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(cacheName).then(cache => cache.addAll(cacheFiles))
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(resp => resp || fetch(e.request))
  );
});