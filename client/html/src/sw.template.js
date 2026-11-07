// Caches the app shell only: the files named below, and nothing else, ever.
// Snapshots, manifest, status and the write API always go to the network and are never stored on the phone.
const CACHE = '__CACHE__';
const SHELL = __SHELL__;
const NAV_TIMEOUT_MS = 2000;
const SHELL_PATHS = new Set(SHELL.map((f) => new URL(f, self.location).pathname));

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

// A new version takes over at once and old caches go. The page reloads itself, unless a draft is open (main.tsx).
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const old = (await caches.keys()).filter((k) => k !== CACHE);
    await Promise.all(old.map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Pages come from the network when it answers quickly, so a new index.html is seen first time.
async function page(request) {
  const cached = () => caches.match('./index.html', { ignoreVary: true });
  try {
    const res = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('slow')), NAV_TIMEOUT_MS)),
    ]);
    if (res.ok) return res;
    return (await cached()) || res;
  } catch (err) {
    const hit = await cached();
    if (hit) return hit;
    throw err;
  }
}

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(page(e.request));
    return;
  }
  // Anything that is not a named shell file passes straight through, uncached.
  if (!SHELL_PATHS.has(url.pathname)) return;
  e.respondWith(caches.match(e.request, { ignoreVary: true }).then((r) => r || fetch(e.request)));
});
