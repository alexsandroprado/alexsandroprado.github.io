// Service worker do site: rede primeiro, com cópia das páginas visitadas
// para leitura sem conexão. Não armazena dados pessoais.
const VERSAO = "ap-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (ev) => {
  ev.waitUntil(caches.open(VERSAO).then((c) => c.addAll([OFFLINE, "/images/pwa/icone-192.png"])));
  self.skipWaiting();
});

self.addEventListener("activate", (ev) => {
  ev.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener("fetch", (ev) => {
  const req = ev.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    ev.respondWith(
      fetch(req).then((res) => {
        const copia = res.clone();
        if (res.ok) caches.open(VERSAO).then((c) => c.put(req, copia));
        return res;
      }).catch(() => caches.match(req).then((r) => r || caches.match(OFFLINE)))
    );
  }
});
