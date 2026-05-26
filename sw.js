// CrimpLog SW v4 – network-first always, offline fallback
const CACHE = 'crimplog-v4';
const OFFLINE_URLS = ['./index.html', './style.css', './script.js', './manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(c => c.addAll(OFFLINE_URLS))
  );
  // Take over immediately, don't wait for old SW to die
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // Never intercept Supabase or external API calls
  if (!event.request.url.startsWith(self.location.origin)) return;

  // Network-first for everything: try network, fall back to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Update cache with fresh version
        const clone = response.clone();
        caches.open(CACHE).then(c => c.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
