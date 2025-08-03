// convex/utils/encryption.ts
import { promisify } from 'util';
import { scrypt, randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { ConvexError } from 'convex/values';

// تحويل دوال callback-based إلى promise-based
const scryptAsync = promisify(scrypt);

// أنواع خوارزميات التشفير المدعومة
const encryptionAlgorithms = {
    aes256: 'aes-256-cbc',
    aes192: 'aes-192-cbc',
    aes128: 'aes-128-cbc',
} as const;

type EncryptionAlgorithm = keyof typeof encryptionAlgorithms;

interface EncryptionResult {
    iv: string;
    content: string;
    algorithm: EncryptionAlgorithm;
}

/**
 * تشفير كلمة المرور باستخدام خوارزمية scrypt
 * @param password كلمة المرور المراد تشفيرها
 * @returns سلسلة مشفرة تحتوي على hash و salt
 */
export async function hashPassword(password: string): Promise<string> {
    try {
        const salt = randomBytes(16).toString('hex');
        const buf = (await scryptAsync(password, salt, 64)) as Buffer;
        return `${buf.toString('hex')}.${salt}`;
    } catch (error) {
        throw new ConvexError('Password hashing failed');
    }
}

/**
 * التحقق من تطابق كلمة المرور مع hash المخزنة
 * @param suppliedPassword كلمة المرور المدخلة
 * @param storedPassword كلمة المرور المخزنة (hash.salt)
 * @returns boolean يشير إلى التطابق
 */
export async function verifyPassword(
    suppliedPassword: string,
    storedPassword: string
): Promise<boolean> {
    try {
        const [hashedPassword, salt] = storedPassword.split('.');
        const buf = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
        return buf.toString('hex') === hashedPassword;
    } catch (error) {
        throw new ConvexError('Password verification failed');
    }
}

/**
 * تشفير البيانات باستخدام خوارزمية AES
 * @param data البيانات المراد تشفيرها
 * @param key مفتاح التشفير (يجب أن يكون طوله 32 بايت لـ aes-256)
 * @param algorithm خوارزمية التشفير (اختياري)
 * @returns كائن يحتوي على iv والمحتوى المشفر
 */
export async function encryptData(
    data: string,
    key: string,
    algorithm: EncryptionAlgorithm = 'aes256'
): Promise<EncryptionResult> {
    try {
        const iv = randomBytes(16);
        const cipherKey = Buffer.from(key, 'utf8');
        const cipher = createCipheriv(encryptionAlgorithms[algorithm], cipherKey, iv);
        
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return {
            iv: iv.toString('hex'),
            content: encrypted,
            algorithm,
        };
    } catch (error) {
        throw new ConvexError('Data encryption failed');
    }
}

/**
 * فك تشفير البيانات المشفرة
 * @param encryptedData البيانات المشفرة
 * @param key مفتاح التشفير
 * @returns البيانات الأصلية
 */
export async function decryptData(
    encryptedData: EncryptionResult,
    key: string
): Promise<string> {
    try {
        const decipherKey = Buffer.from(key, 'utf8');
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const decipher = createDecipheriv(
            encryptionAlgorithms[encryptedData.algorithm],
            decipherKey,
            iv
        );
        
        let decrypted = decipher.update(encryptedData.content, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (error) {
        throw new ConvexError('Data decryption failed');
    }
}

/**
 * إنشاء مفتاح تشفير عشوائي
 * @param length طول المفتاح (بالبايت)
 * @returns مفتاح عشوائي كسلسلة hex
 */
export function generateEncryptionKey(length: number = 32): string {
    return randomBytes(length).toString('hex');
}

/**
 * تشفير كائن JSON
 * @param obj الكائن المراد تشفيره
 * @param key مفتاح التشفير
 * @returns كائن مشفر
 */
export async function encryptObject<T extends Record<string, any>>(
    obj: T,
    key: string
): Promise<EncryptionResult> {
    const dataString = JSON.stringify(obj);
    return await encryptData(dataString, key);
}

/**
 * فك تشفير كائن JSON
 * @param encryptedData الكائن المشفر
 * @param key مفتاح التشفير
 * @returns الكائن الأصلي
 */
export async function decryptObject<T extends Record<string, any>>(
    encryptedData: EncryptionResult,
    key: string
): Promise<T> {
    const decrypted = await decryptData(encryptedData, key);
    return JSON.parse(decrypted) as T;
}

/**
 * إنشاء hash للبيانات (غير قابلة للفك)
 * @param data البيانات المراد عمل hash لها
 * @param salt الملح (اختياري)
 * @returns hash للبيانات
 */
export async function createHash(
    data: string,
    salt?: string
): Promise<string> {
    try {
        const usedSalt = salt || randomBytes(16).toString('hex');
        const buf = (await scryptAsync(data, usedSalt, 64)) as Buffer;
        return `${buf.toString('hex')}.${usedSalt}`;
    } catch (error) {
        throw new ConvexError('Hash creation failed');
    }
}

// تصدير الوظائف للاستخدام في الملفات الأخرى
export const encryptionUtils = {
    hashPassword,
    verifyPassword,
    encryptData,
    decryptData,
    generateEncryptionKey,
    encryptObject,
    decryptObject,
    createHash,
};