// convex/utils/validation.ts
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// ======================================
// === مخططات التحقق المشتركة ===
// ======================================

export const emailSchema = v.string().regex(
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  "يجب أن يكون بريدًا إلكترونيًا صالحًا"
);

export const passwordSchema = v.string().min(
  8,
  "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل"
).regex(
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  "يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص"
);

export const phoneSchema = v.string().regex(
  /^\+?[0-9]{10,15}$/,
  "يجب أن يكون رقم هاتف صالح"
);

export const bitcoinAddressSchema = v.string().regex(
  /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,39}$/,
  "عنوان بيتكوين غير صالح"
);

// ======================================
// === دوال التحقق المخصصة ===
// ======================================

/**
 * التحقق من صحة بيانات المستخدم
 */
export const validateUserInput = (input: {
  email: string;
  password: string;
  name: string;
}) => {
  try {
    const schema = v.object({
      email: emailSchema,
      password: passwordSchema,
      name: v.string().min(2, "يجب أن يكون الاسم أكثر من حرفين"),
    });

    return schema.parse(input);
  } catch (error) {
    throw new ConvexError(
      error instanceof Error ? error.message : "بيانات المستخدم غير صالحة"
    );
  }
};

/**
 * التحقق من صحة بيانات التبرع
 */
export const validateDonationInput = (input: {
  amount: number;
  currency: string;
  method: string;
}) => {
  try {
    const schema = v.object({
      amount: v.number().min(1, "يجب أن يكون المبلغ أكبر من الصفر"),
      currency: v.union(
        v.literal("USD"),
        v.literal("EUR"),
        v.literal("BTC")
      ),
      method: v.union(
        v.literal("credit_card"),
        v.literal("bitcoin"),
        v.literal("paypal")
      ),
    });

    return schema.parse(input);
  } catch (error) {
    throw new ConvexError(
      error instanceof Error ? error.message : "بيانات التبرع غير صالحة"
    );
  }
};

/**
 * التحقق من صحة بيانات المنتج
 */
export const validateProductInput = (input: {
  name: string;
  price: number;
  category: string;
}) => {
  try {
    const schema = v.object({
      name: v.string().min(3, "يجب أن يكون الاسم أكثر من 3 أحرف"),
      price: v.number().min(0, "لا يمكن أن يكون السعر سالبًا"),
      category: v.union(
        v.literal("donation"),
        v.literal("subscription"),
        v.literal("digital"),
        v.literal("physical"),
        v.literal("service")
      ),
    });

    return schema.parse(input);
  } catch (error) {
    throw new ConvexError(
      error instanceof Error ? error.message : "بيانات المنتج غير صالحة"
    );
  }
};

// ======================================
// === أدوات التحقق المساعدة ===
// ======================================

/**
 * التحقق من وجود حقول مطلوبة
 */
export const validateRequiredFields = (
  input: Record<string, any>,
  requiredFields: string[]
) => {
  const missingFields = requiredFields.filter((field) => !input[field]);

  if (missingFields.length > 0) {
    throw new ConvexError(
      `الحقول التالية مطلوبة: ${missingFields.join(", ")}`
    );
  }
  return true;
};

/**
 * التحقق من صحة مجموعة من القيم
 */
export const validateEnum = <T extends string>(
  value: string,
  validValues: T[]
): value is T => {
  if (!validValues.includes(value as T)) {
    throw new ConvexError(
      `القيمة ${value} غير صالحة. القيم المسموحة: ${validValues.join(", ")}`
    );
  }
  return true;
};

/**
 * التحقق من صحة التاريخ
 */
export const validateDate = (date: string | Date) => {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new ConvexError("تاريخ غير صالح");
  }
  return parsedDate;
};

// ======================================
// === تصدير الوظائف ===
// ======================================

export const validationUtils = {
  // المخططات
  schemas: {
    email: emailSchema,
    password: passwordSchema,
    phone: phoneSchema,
    bitcoinAddress: bitcoinAddressSchema,
  },

  // دوال التحقق
  validateUserInput,
  validateDonationInput,
  validateProductInput,

  // الأدوات المساعدة
  validateRequiredFields,
  validateEnum,
  validateDate,
};