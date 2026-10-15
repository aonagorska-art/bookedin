const CACHE = 'bookedin-v2-cat'
const SHELL = ['/', '/manifest.webmanifest', '/icon.svg']
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())))
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) return
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone()
    if (response.ok) caches.open(CACHE).then(cache => cache.put(event.request, copy))
    return response
  }).catch(() => caches.match(event.request)))
})
