// public/sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-changes') {
    event.waitUntil(handleOfflineSync());
  }
});