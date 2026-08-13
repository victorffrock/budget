// Service Worker mínimo para o Somador de Contas funcionar como PWA
const CACHE_NAME = 'somador-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Não faz cache agressivo — só deixa o navegador reconhecer como PWA
});