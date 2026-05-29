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

//data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect width='192' height='192' fill='%231a1208'/><text x='96' y='130' font-size='100' text-anchor='middle'>🧗</text></svg>
