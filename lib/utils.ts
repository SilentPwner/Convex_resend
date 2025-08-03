// lib/utils.ts

import { ERROR_CODES, FORMAT, LIMITS } from './constants';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * دمج كلاسات Tailwind مع clsx و tailwind-merge
 * @param inputs قائمة بالكلاسات
 * @returns سلسلة كلاسات مدمجة
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق التاريخ/الوقت
 * @param date التاريخ/الوقت المطلوب تنسيقه
 * @param format التنسيق المطلوب (تاريخ، وقت، تاريخ-وقت)
 * @returns التاريخ/الوقت المنسق
 */
export function formatDateTime(
  date: Date | string,
  format: keyof typeof FORMAT = 'DATETIME'
): string {
  const d = new Date(date);
  
  switch (format) {
    case 'DATE':
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    
    case 'TIME':
      return d.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    
    case 'DATETIME':
    default:
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      })}`;
  }
}

/**
 * تنسيق العملات
 * @param amount المبلغ
 * @param currency العملة (default: USD)
 * @returns المبلغ المنسق
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat(FORMAT.CURRENCY, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: currency === 'BTC' ? 8 : 2
  }).format(amount);
}

/**
 * تقصير النصوص مع إضافة نقاط (...)
 * @param text النص الأصلي
 * @param maxLength الحد الأقصى للطول
 * @returns النص المقصوص
 */
export function truncateText(
  text: string,
  maxLength: number = LIMITS.MAX_TEXT_PREVIEW || 100
): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * التحقق من صحة البريد الإلكتروني
 * @param email البريد الإلكتروني
 * @returns true إذا كان البريد صحيحاً
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * توليد معرف فريد
 * @returns معرف فريد
 */
export function generateUniqueId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * معالجة الأخطاء بشكل صديق للمستخدم
 * @param error كائن الخطأ
 * @returns رسالة خطأ مفهومة
 */
export function handleError(error: any): string {
  console.error(error);
  
  // معالجة أخطاء Convex
  if (error?.data?.code) {
    return getErrorMessage(error.data.code);
  }
  
  // معالجة أخطاء HTTP
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  
  // معالجة الأخطاء العامة
  return getErrorMessage('GENERAL_000');
}

/**
 * الحصول على رسالة خطأ بناءً على رمز الخطأ
 * @param code رمز الخطأ
 * @returns رسالة الخطأ
 */
function getErrorMessage(code: string): string {
  switch (code) {
    case ERROR_CODES.INVALID_CREDENTIALS:
      return 'Invalid email or password. Please try again.';
    case ERROR_CODES.ACCOUNT_LOCKED:
      return 'Your account has been temporarily locked. Please try again later or reset your password.';
    case ERROR_CODES.INSUFFICIENT_FUNDS:
      return 'Insufficient funds to complete this transaction.';
    case ERROR_CODES.TRANSACTION_FAILED:
      return 'The transaction failed. Please try again later.';
    case ERROR_CODES.AI_PROCESSING_ERROR:
      return 'We encountered an issue processing your request. Please try again.';
    case ERROR_CODES.CONTENT_FILTERED:
      return 'Your request was filtered due to content policies.';
    case ERROR_CODES.VALIDATION_ERROR:
      return 'Please check your input and try again.';
    case ERROR_CODES.NOT_FOUND:
      return 'The requested resource was not found.';
    case ERROR_CODES.PERMISSION_DENIED:
      return 'You do not have permission to perform this action.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * تحويل القيم بين وحدات البتكوين
 * @param value القيمة
 * @param fromUnit الوحدة الأصلية (SAT, BTC)
 * @param toUnit الوحدة الهدف (SAT, BTC)
 * @returns القيمة المحولة
 */
export function convertBitcoinUnits(
  value: number,
  fromUnit: 'SAT' | 'BTC',
  toUnit: 'SAT' | 'BTC'
): number {
  if (fromUnit === toUnit) return value;
  
  if (fromUnit === 'SAT' && toUnit === 'BTC') {
    return value / 100000000;
  }
  
  if (fromUnit === 'BTC' && toUnit === 'SAT') {
    return value * 100000000;
  }
  
  return value;
}

/**
 * إضافة تأخير
 * @param ms وقت التأخير بالميلي ثانية
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * التحقق من صحة عنوان البتكوين
 * @param address عنوان البتكوين
 * @param network نوع الشبكة (mainnet, testnet)
 * @returns true إذا كان العنوان صالحاً
 */
export function isValidBitcoinAddress(
  address: string,
  network: 'mainnet' | 'testnet' = 'mainnet'
): boolean {
  // التحقق الأساسي من البداية
  if (network === 'mainnet') {
    return address.startsWith('1') || 
           address.startsWith('3') || 
           address.startsWith('bc1');
  } else {
    return address.startsWith('m') || 
           address.startsWith('n') || 
           address.startsWith('2') || 
           address.startsWith('tb1');
  }
}

/**
 * تحويل كائن إلى سلسلة استعلام (Query String)
 * @param params كائن المعلمات
 * @returns سلسلة استعلام
 */
export function toQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, value.toString());
    }
  }
  
  return searchParams.toString();
}

/**
 * الحصول على قيمة من localStorage بأمان
 * @param key المفتاح
 * @returns القيمة أو null
 */
export function getLocalStorage(key: string): string | null {
  try {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key);
    }
    return null;
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
}

/**
 * حفظ قيمة في localStorage بأمان
 * @param key المفتاح
 * @param value القيمة
 */
export function setLocalStorage(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, value);
    }
  } catch (error) {
    console.error('Error accessing localStorage:', error);
  }
}

/**
 * حساب الفرق بين تاريخين بالكلمات
 * @param startDate تاريخ البداية
 * @param endDate تاريخ النهاية (اختياري، default: الآن)
 * @returns الفرق بالكلمات (مثال: "5 دقائق")
 */
export function timeAgo(
  startDate: Date | string,
  endDate: Date | string = new Date()
): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
  
  if (diffSeconds < 60) {
    return `${diffSeconds} ثانية`;
  }
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes} دقيقة`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} ساعة`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) {
    return `${diffDays} يوم`;
  }
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `${diffMonths} شهر`;
  }
  
  const diffYears = Math.floor(diffMonths / 12);
  return `${diffYears} سنة`;
}

/**
 * توليد لون عشوائي بناءً على نص
 * @param text النص المستخدم لتوليد اللون
 * @returns كود اللون HEX
 */
export function generateColorFromText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const color = `#${((hash & 0x00FFFFFF) | 0x808080)
    .toString(16)
    .toUpperCase()
    .padStart(6, '0')}`;
  
  return color;
}