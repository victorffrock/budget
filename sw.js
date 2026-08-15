// Service Worker do Somador de Contas — somente recursos seguros para cache.
const CACHE_PREFIX = 'somador-de-contas-';
const CACHE_NAME = CACHE_PREFIX + 'v4';

const ASSETS = [
  './',
  './index.html',
  './icon.png',
  './manifest.webmanifest'
];

function saveResponse(request, response) {
  if (!response || response.status !== 200 || response.type !== 'basic') {
    return Promise.resolve();
  }

  return caches.open(CACHE_NAME).then((cache) => cache.put(request, response.clone()));
}

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isNavigationOrHtml =
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/index.html');

  if (isNavigationOrHtml) {
    event.respondWith(
      fetch(event.request)
        .then((response) => saveResponse(event.request, response).catch(() => {}).then(() => response))
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => saveResponse(event.request, response).catch(() => {}).then(() => response))
        .catch(() => undefined);
    })
  );
});
