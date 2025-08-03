// ===== إصدار التخزين المؤقت =====
const CACHE_NAME = 'lifesync-offline-v3';
const OFFLINE_FALLBACK = '/offline-fallback';
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-256x256.png',
  '/fonts/Inter.woff2',
  '/scripts/offline.js',
  '/styles/offline.css'
];

// ===== تثبيت Service Worker =====
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Precaching assets');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
  );
});

// ===== تفعيل Service Worker =====
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return self.clients.claim();
    })
  );
});

// ===== إدارة الطلبات =====
self.addEventListener('fetch', (event) => {
  // تجاهل الطلبات غير HTTP/S
  if (!event.request.url.startsWith('http')) return;

  // استراتيجية Cache First مع تحديث الشبكة
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // تحديث التخزين المؤقت
            if (event.request.method === 'GET') {
              caches.open(CACHE_NAME)
                .then(cache => cache.put(event.request, networkResponse.clone()));
            }
            return networkResponse;
          })
          .catch(() => {
            // Fallback للصفحات المعروفة
            if (event.request.destination === 'document') {
              return caches.match(OFFLINE_FALLBACK);
            }
          });

        return cachedResponse || fetchPromise;
      })
  );
});

// ===== مزامنة البيانات دون اتصال =====
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-changes') {
    event.waitUntil(
      syncOfflineData()
        .then(() => {
          console.log('[Background Sync] Sync completed');
          return self.registration.showNotification('تمت المزامنة', {
            body: 'تم تحميل جميع التغييرات إلى السحابة',
            icon: '/icons/icon-192x192.png'
          });
        })
        .catch(error => {
          console.error('[Background Sync] Sync failed:', error);
        })
    );
  }
});

// ===== وظيفة المزامنة =====
const syncOfflineData = async () => {
  const db = await openOfflineDB();
  const pendingOps = await db.getAll('pending_operations');
  
  for (const op of pendingOps) {
    try {
      const response = await fetch(op.url, {
        method: op.method,
        headers: op.headers,
        body: op.body
      });

      if (response.ok) {
        await db.delete('pending_operations', op.id);
      }
    } catch (error) {
      console.error(`Failed to sync operation ${op.id}:`, error);
      throw error;
    }
  }
};

// ===== فتح قاعدة البيانات دون اتصال =====
const openOfflineDB = () => {
  return new Promise((resolve) => {
    const request = indexedDB.open('lifesync_offline', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending_operations')) {
        db.createObjectStore('pending_operations', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
  });
};

// ===== استقبال الرسائل =====
self.addEventListener('message', (event) => {
  if (event.data.type === 'CACHE_UPDATED') {
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(event.data.payload))
      .then(() => {
        event.ports[0].postMessage({ status: 'done' });
      });
  }
});