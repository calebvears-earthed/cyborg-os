const C = 'cyborg-v2';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['./', './index.html', './support.js', './manifest.json', './assets/icon-plum.png']))); });
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k))))));
self.addEventListener('fetch', e => { const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.pathname.startsWith('/api/')) return;
  e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request))); });
self.addEventListener('push', e => { const d = e.data ? e.data.json() : { title: 'cyborg.', body: 'Reminder' }; e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: './assets/icon-plum.png', badge: './assets/icon-plum.png' })); });
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(clients.openWindow('./')); });
