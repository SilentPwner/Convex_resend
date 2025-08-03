// types/index.ts

/**
 * الأنواع الأساسية
 */

// نوع المستخدم
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin' | 'content_manager' | 'finance_manager';
  emailVerified: boolean;
  image?: string;
  createdAt: number;
  lastLogin: number;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    notifications: {
      email: boolean;
      whatsapp: boolean;
      push: boolean;
    };
  };
}

// نوع المنتج
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: 'USD' | 'EUR' | 'GBP';
  imageUrl: string;
  category: string;
  inStock: boolean;
  createdAt: number;
  updatedAt: number;
}

// نوع التبرع
export interface Donation {
  id: string;
  donorId: string;
  donorName: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'BTC';
  message?: string;
  date: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: 'stripe' | 'paypal' | 'bitcoin';
  transactionId?: string;
  location?: {
    latitude: number;
    longitude: number;
    country: string;
    city: string;
  };
}

// نوع التقرير
export interface Report {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: 'health' | 'financial' | 'activity';
  date: number;
  data: Record<string, any>;
}

// نوع الإشعار
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'email' | 'whatsapp' | 'push';
  status: 'sent' | 'pending' | 'failed' | 'read';
  createdAt: number;
  readAt?: number;
  metadata?: Record<string, any>;
}

/**
 * أنواع الصحة النفسية
 */

// نوع مدخلات المزاج
export interface MoodEntry {
  id: string;
  userId: string;
  mood: 'excited' | 'happy' | 'neutral' | 'sad' | 'angry' | 'anxious';
  intensity: number; // 1-10
  date: number;
  notes?: string;
  tags?: string[];
}

// نوع النصيحة الصحية
export interface HealthAdvice {
  id: string;
  title: string;
  content: string;
  category: 'mental' | 'physical' | 'nutrition' | 'sleep' | 'stress';
  author: string;
  createdAt: number;
  updatedAt: number;
  isFeatured: boolean;
  isApproved: boolean;
}

/**
 * أنواع البيتكوين
 */

// نوع معاملة البيتكوين
export interface BitcoinTransaction {
  id: string;
  userId: string;
  address: string;
  amount: number; // بالساتوشي
  fee: number; // بالساتوشي
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  txHash: string;
  blockHeight?: number;
  createdAt: number;
  updatedAt: number;
}

// نوع محفظة البيتكوين
export interface BitcoinWallet {
  id: string;
  userId: string;
  address: string;
  balance: number; // بالساتوشي
  unconfirmedBalance: number; // بالساتوشي
  lastSynced: number;
  label?: string;
  isDefault: boolean;
}

/**
 * أنواع الإجراءات
 */

// نوع إجراء الإرسال عبر Resend
export type ResendActionParams = {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
};

// نوع إجراء الواتساب
export type WhatsAppActionParams = {
  to: string;
  template: string;
  data: Record<string, any>;
};

/**
 * أنواع الاستعلامات
 */

// نوع استعلام لوحة التحكم
export interface DashboardData {
  totalDonations: number;
  activeUsers: number;
  monthlyRevenue: number;
  pendingNotifications: number;
  moodSummary: {
    excited: number;
    happy: number;
    neutral: number;
    sad: number;
    angry: number;
    anxious: number;
  };
}

// نوع استعلام المنتجات
export interface ProductsQueryResult {
  products: Product[];
  total: number;
  page: number;
  pageSize: number;
}

// نوع استعلام التبرعات
export interface DonationsQueryResult {
  donations: Donation[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * أنواع المساعدات
 */

// نوع رد المساعد
export type AIResponse = {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
};

// نوع تحليل المشاعر
export type SentimentAnalysis = {
  mood: MoodEntry['mood'];
  score: number;
  keywords: string[];
};

/**
 * أنواع الويب هوكس
 */

// نوع ويب هوك البيتكوين
export interface BitcoinWebhookPayload {
  event: 'transaction';
  address: string;
  tx_hash: string;
  confirmations: number;
  value: number;
}

// نوع ويب هوك Resend
export interface ResendWebhookPayload {
  event: 'email_sent' | 'email_delivered' | 'email_bounced' | 'email_complained';
  data: {
    email: string;
    template: string;
    timestamp: number;
  };
}

// نوع ويب هوك الواتساب
export interface WhatsAppWebhookPayload {
  event: 'message_sent' | 'message_delivered' | 'message_read' | 'message_failed';
  data: {
    to: string;
    template: string;
    timestamp: number;
  };
}

/**
 * أنواع المكونات
 */

// نوع خصائص مكون MetricsCard
export interface MetricsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: number; // النسبة المئوية للتغيير
  description?: string;
}

// نوع خصائص مكون BitcoinDonation
export interface BitcoinDonationProps {
  bitcoinAddress: string;
  onDonationSuccess?: (txId: string, amount: number, currency: string) => void;
  className?: string;
}

// نوع خصائص مكون MoodTracker
export interface MoodTrackerProps {
  initialEntries?: MoodEntry[];
  onSave?: (entry: Omit<MoodEntry, 'id'>) => Promise<void>;
  className?: string;
}

/**
 * أنواع الدوال المساعدة
 */

// نوع دالة cn لدمج الفصول
export type ClassValue = string | number | boolean | null | undefined | ClassValue[];
export type ClassDictionary = Record<string, any>;
export type ClassArray = ClassValue[];
export type ClassArgument = ClassValue | ClassDictionary | ClassArray;

/**
 * أنواع API
 */

// نوع رد API البيتكوين
export interface BitcoinApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

/**
 * أنواع البيئة
 */

// نوع متغيرات البيئة
export interface EnvVariables {
  RESEND_API_KEY: string;
  BITCOIN_NETWORK: 'mainnet' | 'testnet';
  WHATSAPP_API_TOKEN: string;
  CONVEX_DEPLOYMENT: string;
  NEXT_PUBLIC_CONVEX_URL: string;
}

/**
 * أنواع الدوال المشتركة
 */

// نوع دالة معالجة الأخطاء
export type ErrorHandler = (error: unknown) => string;

// نوع دالة التحقق من الصحة
export type Validator<T> = (data: T) => { valid: boolean; message?: string };