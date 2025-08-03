// lib/constants.ts

/**
 * الثوابت الأساسية للتطبيق
 */
export const APP_NAME = "LifeSync";
export const APP_DESCRIPTION = "Your all-in-one health and wellness dashboard";
export const COMPANY_NAME = "LifeSync Inc.";
export const SUPPORT_EMAIL = "support@lifesync.app";

/**
 * أدوار المستخدمين
 */
export const USER_ROLES = {
  USER: "user",
  ADMIN: "admin",
  CONTENT_MANAGER: "content_manager",
  FINANCE_MANAGER: "finance_manager",
} as const;

/**
 * أنواع التنبيهات
 */
export const ALERT_TYPES = {
  HEALTH: "health",
  FINANCIAL: "financial",
  SECURITY: "security",
  SYSTEM: "system",
  DONATION: "donation",
} as const;

/**
 * إعدادات البتكوين
 */
export const BITCOIN_SETTINGS = {
  NETWORK: import.meta.env.VITE_BITCOIN_NETWORK || "testnet",
  EXPLORER_URL: "https://blockstream.info/",
  CONFIRMATION_THRESHOLD: 3,
  MIN_DONATION: 0.0001, // BTC
};

/**
 * إعدادات البريد الإلكتروني (Resend)
 */
export const EMAIL_SETTINGS = {
  FROM: "LifeSync <noreply@lifesync.app>",
  REPLY_TO: "support@lifesync.app",
  TEMPLATES: {
    PRICE_ALERT: "price_alert",
    DONATION_RECEIPT: "donation_receipt",
    HEALTH_REPORT: "health_report",
    ACCOUNT_VERIFICATION: "account_verification",
    PASSWORD_RESET: "password_reset",
  },
};

/**
 * إعدادات الواتساب
 */
export const WHATSAPP_SETTINGS = {
  API_URL: "https://graph.facebook.com/v18.0/",
  TEMPLATES: {
    APPOINTMENT_REMINDER: "appointment_reminder",
    MEDICATION_REMINDER: "medication_reminder",
    DONATION_NOTIFICATION: "donation_notification",
    SECURITY_ALERT: "security_alert",
  },
};

/**
 * إعدادات الذكاء الاصطناعي
 */
export const AI_SETTINGS = {
  MOOD_ANALYSIS_MODEL: "gpt-4-turbo",
  HEALTH_ADVICE_MODEL: "claude-3-opus",
  MAX_TOKENS: 4096,
};

/**
 * ثوابت الصحة النفسية
 */
export const MENTAL_HEALTH = {
  MOOD_TYPES: ["excited", "happy", "neutral", "sad", "angry", "anxious"] as const,
  ADVICE_CATEGORIES: ["mental", "physical", "nutrition", "sleep", "stress"] as const,
};

/**
 * فترات التحديث
 */
export const REFRESH_INTERVALS = {
  PRICE_DATA: 5 * 60 * 1000, // 5 دقائق
  TRANSACTIONS: 2 * 60 * 1000, // دقيقتين
  HEALTH_DATA: 10 * 60 * 1000, // 10 دقائق
  NOTIFICATIONS: 30 * 1000, // 30 ثانية
};

/**
 * الحدود والقيود
 */
export const LIMITS = {
  MAX_NOTIFICATIONS: 100,
  MAX_MOOD_ENTRIES_PER_DAY: 5,
  MAX_DONATION_AMOUNT: 1000, // USD
  MAX_FILE_UPLOAD_SIZE: 5 * 1024 * 1024, // 5MB
};

/**
 * روابط هامة
 */
export const EXTERNAL_LINKS = {
  PRIVACY_POLICY: "https://lifesync.app/privacy",
  TERMS_OF_SERVICE: "https://lifesync.app/terms",
  DOCUMENTATION: "https://docs.lifesync.app",
  SUPPORT_PORTAL: "https://support.lifesync.app",
  GITHUB_REPO: "https://github.com/SilentPwner/Convex_resend",
};

/**
 * ثوابت التشفير
 */
export const CRYPTO = {
  ENCRYPTION_ALGORITHM: "AES-GCM",
  KEY_DERIVATION_ITERATIONS: 100000,
  IV_LENGTH: 12,
  SALT_LENGTH: 16,
};

/**
 * ثوابت التوثيق (Auth)
 */
export const AUTH = {
  SESSION_EXPIRY: 30 * 24 * 60 * 60 * 1000, // 30 يوم
  PASSWORD_MIN_LENGTH: 8,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 دقيقة
};

/**
 * رموز الأخطاء
 */
export const ERROR_CODES = {
  // أخطاء عامة
  UNKNOWN_ERROR: "GENERAL_000",
  VALIDATION_ERROR: "GENERAL_001",
  NOT_FOUND: "GENERAL_002",
  PERMISSION_DENIED: "GENERAL_003",
  
  // أخطاء التوثيق
  INVALID_CREDENTIALS: "AUTH_001",
  ACCOUNT_LOCKED: "AUTH_002",
  SESSION_EXPIRED: "AUTH_003",
  EMAIL_NOT_VERIFIED: "AUTH_004",
  
  // أخطاء الدفع
  INSUFFICIENT_FUNDS: "PAYMENT_001",
  TRANSACTION_FAILED: "PAYMENT_002",
  INVALID_ADDRESS: "PAYMENT_003",
  
  // أخطاء الذكاء الاصطناعي
  AI_PROCESSING_ERROR: "AI_001",
  CONTENT_FILTERED: "AI_002",
  
  // أخطاء التكامل
  THIRD_PARTY_FAILURE: "INTEGRATION_001",
  WEBHOOK_FAILURE: "INTEGRATION_002",
};

/**
 * ثوابت التنسيق
 */
export const FORMAT = {
  DATE: "yyyy-MM-dd",
  TIME: "HH:mm",
  DATETIME: "yyyy-MM-dd HH:mm",
  CURRENCY: "en-US",
};

/**
 * أيقونات التطبيق
 */
export const APP_ICONS = {
  LOGO: "/icons/logo.svg",
  FAVICON: "/favicon.ico",
  APPLE_TOUCH_ICON: "/apple-touch-icon.png",
};

/**
 * ألوان التطبيق
 */
export const COLORS = {
  PRIMARY: "#4361ee",
  SECONDARY: "#3f37c9",
  SUCCESS: "#4cc9f0",
  WARNING: "#f72585",
  DANGER: "#f94144",
  INFO: "#4895ef",
  LIGHT: "#f8f9fa",
  DARK: "#212529",
};