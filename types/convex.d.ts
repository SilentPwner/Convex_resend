// types/convex.d.ts
import { type DataModel } from './dataModel';

declare global {
  interface Window {
    // لمزامنة دون اتصال
    workbox: {
      messageSW: (msg: any) => Promise<any>;
      registerRoute: (options: any) => void;
    };
    
    // لتخزين البيانات المحلية
    __OFFLINE_DB__: IDBDatabase;
    
    // لتتبع حالة الاتصال
    __NETWORK_STATUS__: {
      online: boolean;
      lastSync: Date;
    };
  }

  // أنواع إضافية لـ Service Worker
  interface ServiceWorkerRegistration {
    sync: {
      register: (tag: string) => Promise<void>;
    };
  }
}

// أنواع البيانات المشتركة
export type EmailTone = 'positive' | 'negative' | 'neutral';

export type OfflineOperation = {
  id: string;
  type: 'donation' | 'email' | 'product-track';
  data: any;
  createdAt: Date;
  retryCount: number;
};

export type SyncStatus = {
  lastAttempt: Date;
  pendingOperations: number;
  lastError?: string;
};

// أنواع لوحة التحكم
export type DashboardMetrics = {
  emailStats: {
    sent: number;
    opened: number;
    positive: number;
    negative: number;
  };
  donationStats: {
    total: number;
    completed: number;
    bitcoin: number;
  };
  syncStatus: SyncStatus;
};

// توسيع أنواع Convex
declare module 'convex' {
  interface ConvexClientConfig {
    offlineMode?: boolean;
    retryCount?: number;
  }
}

// أنواع خاصة بـ Resend
declare module 'resend' {
  interface SendEmailResponse {
    trackingId: string;
    toneAnalysis?: EmailTone;
  }
}