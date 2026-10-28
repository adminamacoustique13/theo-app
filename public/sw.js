'use strict';
// Service worker : garde l'appli utilisable hors ligne (actif seulement en HTTPS ou sur localhost).
const V = 'theo-v2';
const SHELL = ['/style.css', '/app.js', '/icons/icon-180.png', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;
  if (u.pathname.startsWith('/api/events') || u.pathname.startsWith('/api/gm') || u.pathname === '/gm') return;
  if (u.pathname.startsWith('/api/phone')) {
    e.respondWith(fetch(r).then(x => { const c = x.clone(); if (x.ok) caches.open(V).then(ca => ca.put(r.url, c)); return x; }).catch(() => caches.match(r.url)));
    return;
  }
  e.respondWith(fetch(r).then(x => { if (x.ok) { const c = x.clone(); caches.open(V).then(ca => ca.put(r, c)); } return x; }).catch(() => caches.match(r)));
});
