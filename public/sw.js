// InmoCRM.AI — Service Worker PWA
// Estrategia: Network First para API, Cache First para assets estáticos

const CACHE_VERSION = 'inmocrm-v1'
const CACHE_ESTATICO = `${CACHE_VERSION}-estatico`
const CACHE_DINAMICO = `${CACHE_VERSION}-dinamico`

const ASSETS_PRECACHE = [
  '/',
  '/tablero',
  '/manifest.json',
  '/offline.html',
]

const RUTAS_API = ['/api/', '/functions/']
const RUTAS_CACHE_FIRST = [
  '/_next/static/',
  '/fonts/',
  '/icons/',
]

// Instalar: pre-cachear assets críticos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_ESTATICO).then(cache =>
      cache.addAll(ASSETS_PRECACHE).catch(() => null)
    ).then(() => self.skipWaiting())
  )
})

// Activar: limpiar caches viejos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(claves =>
      Promise.all(
        claves
          .filter(c => c.startsWith('inmocrm-') && c !== CACHE_ESTATICO && c !== CACHE_DINAMICO)
          .map(c => caches.delete(c))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch: estrategia según ruta
self.addEventListener('fetch', event => {
  const { url, method } = event.request

  // Solo interceptar GET
  if (method !== 'GET') return

  // API y Supabase: Network First (sin cache)
  if (RUTAS_API.some(r => url.includes(r))) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'Sin conexión' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      )
    )
    return
  }

  // Assets estáticos de Next.js: Cache First
  if (RUTAS_CACHE_FIRST.some(r => url.includes(r))) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached ?? fetch(event.request).then(resp => {
          if (resp.ok) {
            caches.open(CACHE_ESTATICO).then(c => c.put(event.request, resp.clone()))
          }
          return resp
        })
      )
    )
    return
  }

  // Páginas de la app: Network First con fallback a cache
  event.respondWith(
    fetch(event.request)
      .then(resp => {
        if (resp.ok) {
          caches.open(CACHE_DINAMICO).then(c => c.put(event.request, resp.clone()))
        }
        return resp
      })
      .catch(async () => {
        const cached = await caches.match(event.request)
        return cached ?? caches.match('/offline.html') ?? new Response('Sin conexión', { status: 503 })
      })
  )
})

// Push notifications
self.addEventListener('push', event => {
  if (!event.data) return
  let datos = { titulo: 'InmoCRM.AI', cuerpo: 'Nueva notificación', url: '/tablero' }
  try { datos = { ...datos, ...event.data.json() } } catch {}

  event.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: { url: datos.url },
      vibrate: [100, 50, 100],
    })
  )
})

// Click en notificación push → abrir la app
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/tablero'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url)
          return client.focus()
        }
      }
      return clients.openWindow(url)
    })
  )
})
