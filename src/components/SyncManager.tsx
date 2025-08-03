// src/components/SyncManager.tsx
import { useOfflineSync } from '../hooks/useOfflineSync';

export function SyncManager({ userId }: { userId: string }) {
  const { handleConflicts } = useOfflineSync(userId);

  return (
    <div className="offline-status">
      {navigator.onLine ? (
        <button onClick={handleConflicts}>حل التعارضات</button>
      ) : (
        <div>وضع عدم الاتصال - التغييرات سيتم مزامنتها لاحقاً</div>
      )}
    </div>
  );
}