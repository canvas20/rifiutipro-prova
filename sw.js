/* RifiutiPro · service worker: copia locale dell'app + notifiche anche ad app chiusa */
const C = 'rifiutipro-v3';
try { importScripts('config.js'); } catch (e) { }
if (self.FIREBASE_CONFIG && self.FCM_VAPID_KEY) {
  try {
    importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');
    firebase.initializeApp(self.FIREBASE_CONFIG);
    firebase.messaging().onBackgroundMessage(async p => {
      const d = (p && p.data) || {};
      const shown = await self.registration.getNotifications();
      try { if (self.navigator.setAppBadge) await self.navigator.setAppBadge(shown.length + 1); } catch (e) { }
      return self.registration.showNotification(d.title || 'RifiutiPro', { body: d.body || '', icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || undefined, data: { url: d.url || '#/notif' } });
    });
  } catch (e) { }
}
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = new URL('./' + ((e.notification.data && e.notification.data.url) || '#/notif'), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(ws => { for (const w of ws) { if ('focus' in w) { try { w.navigate(url); } catch (er) { } return w.focus(); } } return self.clients.openWindow(url); }));
});
self.addEventListener('install', e => { e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'index.html', 'manifest.webmanifest', 'icon-192.png']))); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== C).map(x => caches.delete(x))))); self.clients.claim(); });
self.addEventListener('fetch', e => { const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.endsWith('config.js')) return; e.respondWith(fetch(e.request).then(r => { const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }).catch(() => caches.match(e.request))); });
