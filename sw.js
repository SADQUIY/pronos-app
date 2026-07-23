// Service worker minimal pour rendre l'app installable (PWA) et disponible hors-ligne
// pour le shell (page + icônes) — ajouté le 22/07/2026.
//
// IMPORTANT : ne met JAMAIS en cache les appels à l'API (api-football.com) ni aucune requête
// réseau autre que les fichiers listés ci-dessous. Après toute la journée passée à traquer des
// cotes figées, il serait absurde d'introduire une nouvelle source de données périmées via un
// cache de service worker. Toute requête qui n'est pas un des fichiers statiques de l'app passe
// directement au réseau, sans jamais toucher au cache.

const CACHE_NAME = 'pronos-app-shell-v1';
const SHELL_FILES = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const isShellFile = SHELL_FILES.some((f) => url.pathname.endsWith(f.replace('./', '/')));
  if (!isShellFile) return; // laisse passer directement au réseau, pas de mise en cache

  // Réseau d'abord (pour avoir la dernière version du shell dès qu'il y a du réseau), cache en
  // secours seulement si vraiment hors-ligne.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
