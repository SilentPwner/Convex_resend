// src/hooks/useOfflineSync.ts
import { useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export function useOfflineSync(userId: string) {
  const prepareData = useQuery(api.offlineSyncUtils.prepareOfflineData, { userId });
  const processChanges = useMutation(api.offlineSyncUtils.processOfflineChanges);
  const resolveConflicts = useMutation(api.offlineSyncUtils.resolveSyncConflicts);

  // 1. تحميل البيانات عند الاتصال
  useEffect(() => {
    const loadInitialData = async () => {
      if (!navigator.onLine) return;
      
      const { data, dataHash } = await prepareData();
      localStorage.setItem('offlineData', JSON.stringify(data));
      localStorage.setItem('dataHash', dataHash);
    };

    loadInitialData();
  }, [userId]);

  // 2. معالجة التغييرات عند استعادة الاتصال
  const handleOnline = async () => {
    const offlineChanges = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    
    if (offlineChanges.length > 0) {
      const { results } = await processChanges({ userId, changes: offlineChanges });

      results.forEach(result => {
        if (result.status === 'success') {
          updateLocalIds(result.localId, result.serverId);
        } else {
          console.error('Sync error:', result.error);
        }
      });

      localStorage.removeItem('offlineChanges');
    }
  };

  // 3. حل التعارضات
  const handleConflicts = async () => {
    const conflicts = detectConflicts();
    const resolution = await showConflictDialog(conflicts);
    
    const { results } = await resolveConflicts({
      conflicts: conflicts.map(c => ({
        ...c,
        resolution,
        mergedData: mergeData(c.localData, c.serverData)
      }))
    });

    return results;
  };

  // 4. إضافة مستمع لحدث الاتصال
  useEffect(() => {
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [userId]);

  return { handleConflicts };
}

// Helper functions
function updateLocalIds(localId: string, serverId: string) {
  const localData = JSON.parse(localStorage.getItem('appData') || '{}');
  // تحديث الأي دي في البيانات المحلية
  // ...
  localStorage.setItem('appData', JSON.stringify(localData));
}

function detectConflicts() {
  // منطق كشف التعارضات
  return [];
}

async function showConflictDialog(conflicts: any[]) {
  // عرض واجهة حل التعارضات
  return 'keep_server'; // أو 'keep_local' أو 'merge'
}