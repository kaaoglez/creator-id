// public/sw.js - Service Worker básico
const CACHE_NAME = 'creator-id-v1'
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Instalación del Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  )
})

// Estrategia de caché: Network First, fallback a caché
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clonar la respuesta para guardarla en caché
        const responseClone = response.clone()
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone)
        })
        return response
      })
      .catch(() => caches.match(event.request))
  )
})