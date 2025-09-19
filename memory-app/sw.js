const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `memory-cache-${CACHE_VERSION}`;

// 這裡列出要預先快取的檔案（相對路徑，適合 GitHub Pages 子路徑）
const PRECACHE_FILES = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// 安裝：預先快取
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_FILES))
  );
  self.skipWaiting();
});

// 啟用：清除舊版快取
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)))
    )
  );
  self.clients.claim();
});

// 取檔策略：網路優先，失敗再用快取；對離線頁面也能撐住
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // 只處理 GET
  if (req.method !== "GET") return;

  event.respondWith(
    fetch(req)
      .then((resp) => {
        // 成功就把副本塞進快取
        const respClone = resp.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, respClone));
        return resp;
      })
      .catch(async () => {
        // 失敗（離線）→ 回退快取
        const cached = await caches.match(req);
        if (cached) return cached;

        // 針對 navigation 回退 index.html（SPA）
        if (req.mode === "navigate") {
          const fallback = await caches.match("./index.html");
          if (fallback) return fallback;
        }
        // 若仍沒有，只好丟回 404
        return new Response("Offline and no cache available.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      })
  );
});
