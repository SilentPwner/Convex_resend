import { ConvexHttpClient } from 'convex/browser';
import { offlineDB } from './localDB';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function syncOfflineOperations() {
  const pendingOps = await offlineDB.get('pending_operations');
  
  await Promise.all(pendingOps.map(async (op: any) => {
    try {
      switch (op.type) {
        case 'donation':
          await convex.mutation('donations:create', op.data);
          break;
        case 'email':
          await convex.action('emails:send', op.data);
          break;
      }
      await offlineDB.delete('pending_operations', op.id);
    } catch (error) {
      console.error('Sync failed for operation:', op.id);
    }
  }));
}

// في service worker (public/sw.js)
self.addEventListener('sync', (event: any) => {
  if (event.tag === 'sync-operations') {
    event.waitUntil(syncOfflineOperations());
  }
});