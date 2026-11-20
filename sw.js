// Service worker de Licitaciones SEACE: permite instalar la app y abrirla aunque falle el internet.
// Siempre intenta primero la red (para tener los datos del día); si no hay conexión, usa la última copia.
const CACHE = "licitaciones-v2";

self.addEventListener("install", ev => { self.skipWaiting(); });
self.addEventListener("activate", ev => {
  ev.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", ev => {
  const req = ev.request, url = new URL(req.url);
  // solo archivos propios; nunca las consultas del visor local (/api/) ni otros sitios
  if (req.method !== "GET" || url.origin !== location.origin || url.pathname.includes("/api/")) return;
  ev.respondWith(
    // "no-cache": pregunta siempre al servidor si hay versión nueva (GitHub guarda la página hasta 10 min)
    fetch(req, { cache: "no-cache" }).then(r => {
      if (r.ok) { const copia = r.clone(); caches.open(CACHE).then(c => c.put(req, copia)); }
      return r;
    }).catch(() => caches.match(req).then(r => r || caches.match("./")))
  );
});
