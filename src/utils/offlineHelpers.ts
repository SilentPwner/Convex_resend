// src/utils/offlineHelpers.ts
import { ConvexError } from 'convex/values';
import { encryptionUtils } from './encryption';

/**
 * يحفظ البيانات محلياً مع التشفير
 */
export const saveOfflineData = async (data: any, key: string = 'offlineData') => {
  try {
    const encrypted = await encryptionUtils.encryptObject(
      data,
      process.env.NEXT_PUBLIC_OFFLINE_SECRET!
    );
    localStorage.setItem(key, JSON.stringify(encrypted));
    return true;
  } catch (error) {
    throw new ConvexError('Failed to save offline data');
  }
};

/**
 * يسترجع البيانات المشفرة محلياً
 */
export const getOfflineData = async (key: string = 'offlineData') => {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    const decrypted = await encryptionUtils.decryptObject(
      JSON.parse(encrypted),
      process.env.NEXT_PUBLIC_OFFLINE_SECRET!
    );
    return decrypted;
  } catch (error) {
    throw new ConvexError('Failed to load offline data');
  }
};

/**
 * يسجل التغييرات المحلية للتمكين من المزامنة لاحقاً
 */
export const trackLocalChange = async (change: {
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
}) => {
  try {
    const changes = JSON.parse(localStorage.getItem('offlineChanges') || '[]');
    changes.push({
      ...change,
      localTimestamp: Date.now(),
      localId: generateLocalId(),
    });
    
    await saveOfflineData(changes, 'offlineChanges');
    return true;
  } catch (error) {
    throw new ConvexError('Failed to track local change');
  }
};

/**
 * يولد معرف مؤقت محلي
 */
const generateLocalId = () => {
  return `local_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
};

/**
 * يتحقق من وجود بيانات غير مزامنة
 */
export const hasPendingChanges = () => {
  const changes = localStorage.getItem('offlineChanges');
  return !!changes && JSON.parse(changes).length > 0;
};

/**
 * يحول التاريخ إلى تنسيق مقروء
 */
export const formatSyncDate = (timestamp: number) => {
  return new Date(timestamp).toLocaleString();
};