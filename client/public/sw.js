// Sideline service worker — minimal cache shell.
const CACHE = 'sideline-v1'
const ASSETS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()))
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET') return
  const url = new URL(req.url)
  // network-first for API, cache-first for assets
  if (url.pathname.startsWith('/api') || url.pathname.includes('/socket.io')) return
  e.respondWith(
    caches.match(req).then((hit) => hit || fetch(req).then((res) => {
      if (res.ok && url.origin === location.origin) caches.open(CACHE).then((c) => c.put(req, res.clone()))
      return res
    }).catch(() => caches.match('/')))
  )
})
