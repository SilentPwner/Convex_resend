// src/utils/conflictResolver.ts
import { ConvexError } from 'convex/values';

/**
 * يكشف التعارضات بين البيانات المحلية والخادم
 */
export const detectConflicts = (
  localData: any,
  serverData: any,
  keysToCompare: string[] = ['updatedAt']
): Array<{
  localId: string;
  serverId: string;
  table: string;
  localData: any;
  serverData: any;
  conflictFields: string[];
}> => {
  try {
    const conflicts: any[] = [];

    // كشف التعارضات للمستندات المعدلة محلياً وعلى الخادم
    for (const localItem of localData) {
      const serverItem = serverData.find(
        (s: any) => s._id === localItem._id || s.localId === localItem._id
      );

      if (serverItem) {
        const changedFields = keysToCompare.filter(
          (key) => localItem[key] !== serverItem[key]
        );

        if (changedFields.length > 0) {
          conflicts.push({
            localId: localItem._id,
            serverId: serverItem._id,
            table: localItem.table,
            localData: localItem,
            serverData: serverItem,
            conflictFields: changedFields,
          });
        }
      }
    }

    return conflicts;
  } catch (error) {
    throw new ConvexError('Conflict detection failed');
  }
};

/**
 * يدمج البيانات حسب الاستراتيجية المحددة
 */
export const mergeData = (
  localData: any,
  serverData: any,
  strategy: 'local' | 'server' | 'merge' = 'merge'
) => {
  try {
    switch (strategy) {
      case 'local':
        return { ...serverData, ...localData };
      case 'server':
        return { ...localData, ...serverData };
      case 'merge':
      default:
        // دمج ذكي يحافظ على أحدث التغييرات
        const merged = { ...localData, ...serverData };
        merged.updatedAt = Math.max(
          localData.updatedAt || 0,
          serverData.updatedAt || 0
        );
        return merged;
    }
  } catch (error) {
    throw new ConvexError('Data merge failed');
  }
};

/**
 * يحول التعارض إلى وصف مقروء
 */
export const conflictToMessage = (conflict: any) => {
  const fields = conflict.conflictFields.join(', ');
  return `تعارض في الحقول: ${fields}`;
};

/**
 * يحل جميع التعارضات باستخدام استراتيجية واحدة
 */
export const resolveAllConflicts = (
  conflicts: any[],
  strategy: 'local' | 'server' | 'merge'
) => {
  return conflicts.map((conflict) => ({
    ...conflict,
    resolution: strategy,
    mergedData: mergeData(conflict.localData, conflict.serverData, strategy),
  }));
};

/**
 * أنماط حل التعارضات المحددة مسبقاً
 */
export const resolutionStrategies = {
  keepLocal: (conflict: any) => ({
    ...conflict,
    resolution: 'local',
    mergedData: mergeData(conflict.localData, conflict.serverData, 'local'),
  }),
  keepServer: (conflict: any) => ({
    ...conflict,
    resolution: 'server',
    mergedData: mergeData(conflict.localData, conflict.serverData, 'server'),
  }),
  mergeSmart: (conflict: any) => ({
    ...conflict,
    resolution: 'merge',
    mergedData: mergeData(conflict.localData, conflict.serverData, 'merge'),
  }),
};