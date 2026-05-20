const CACHE_NAME = 'lifehub-v1';
const urlsToCache = [
  'index.html',
  'css/variables.css',
  'css/main.css',
  'css/animations.css',
  'css/tour.css',
  'js/app.js',
  'js/tour.js',
  'tools/colors/index.html',
  'tools/colors/script.js',
  'tools/colors/style.css',
  'tools/expenses/index.html',
  'tools/expenses/script.js',
  'tools/expenses/style.css',
  'tools/habits/index.html',
  'tools/habits/script.js',
  'tools/habits/style.css',
  'tools/notes/index.html',
  'tools/notes/script.js',
  'tools/notes/style.css',
  'tools/password/index.html',
  'tools/password/script.js',
  'tools/password/style.css',
  'tools/pomodoro/index.html',
  'tools/pomodoro/script.js',
  'tools/pomodoro/style.css',
  'tools/random/index.html',
  'tools/random/script.js',
  'tools/random/style.css'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});