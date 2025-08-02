// convex/actions/resend/alerts.ts
import { action } from "../../_generated/server";
import { Resend } from "resend";
import { v } from "convex/values";
import { priceAlertEmail } from "../../../components/email-templates/PriceAlert";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * إرسال تنبيه انخفاض السعر للمستخدم
 * @param productId - معرف المنتج في جدول trackedProducts
 */
export const sendPriceAlert = action({
  args: {
    productId: v.id("trackedProducts"),
    testMode: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    // 1. جلب بيانات المنتج والمستخدم
    const product = await ctx.runQuery("products:getById", { 
      id: args.productId 
    });
    
    const user = await ctx.runQuery("users:get", { 
      id: product.userId 
    });

    // 2. التحقق من عدم إرسال تنبيه مكرر
    const lastAlert = await ctx.runQuery("alerts:getLastPriceAlert", {
      productId: args.productId
    });

    if (shouldSkipAlert(lastAlert, product)) {
      await ctx.runMutation("alerts:logSkipped", {
        productId: args.productId,
        reason: "duplicate_alert"
      });
      return;
    }

    // 3. حساب نسبة الخصم
    const discountPercentage = calculateDiscountPercentage(
      product.originalPrice,
      product.currentPrice
    );

    // 4. إعداد بيانات القالب
    const emailData = {
      productName: product.name,
      oldPrice: product.originalPrice,
      newPrice: product.currentPrice,
      discount: discountPercentage,
      productUrl: product.productUrl,
      imageUrl: product.imageUrl || getDefaultProductImage(),
      unsubscribeUrl: `${process.env.BASE_URL}/unsubscribe?token=${generateUnsubscribeToken(user._id)}`,
      language: user.language,
      testMode: args.testMode || false
    };

    // 5. إرسال الإيميل عبر Resend
    try {
      const { id: emailId } = await resend.emails.send({
        from: `Price Alerts <alerts@${process.env.RESEND_DOMAIN}>`,
        to: args.testMode ? "test@lifesync.ai" : user.email,
        subject: user.language === "ar" 
          ? `🚨 انخفاض السعر بنسبة ${discountPercentage}% على ${product.name}` 
          : `🚨 Price dropped ${discountPercentage}% for ${product.name}`,
        react: priceAlertEmail(emailData),
        headers: {
          "X-Entity-Ref-ID": generateAlertId(product._id),
          "X-Price-Alert": "true"
        },
        tags: [{
          name: "alert_type",
          value: "price_drop"
        }]
      });

      // 6. تسجيل الإرسال الناجح
      await ctx.runMutation("alerts:logSentAlert", {
        productId: product._id,
        userId: user._id,
        emailId,
        discountPercentage,
        currentPrice: product.currentPrice
      });

      // 7. تحديث سعر التنبيه الأخير
      await ctx.runMutation("products:updateLastNotified", {
        productId: product._id,
        price: product.currentPrice
      });

      // 8. إرسال تنبيه واتساب إذا مفعل
      if (user.notificationPreferences.whatsapp && user.phone) {
        await ctx.runAction("whatsapp/sendPriceAlert", {
          productId: product._id,
          userId: user._id
        });
      }

      return { success: true, emailId };

    } catch (error) {
      // تسجيل الخطأ
      await ctx.runMutation("alerts:logFailedAlert", {
        productId: product._id,
        userId: user._id,
        error: error.message
      });
      throw new Error("Failed to send price alert");
    }
  }
});

// ===== الدوال المساعدة ===== //

/**
 * حساب نسبة الخصم
 */
function calculateDiscountPercentage(oldPrice: number, newPrice: number): number {
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

/**
 * التحقق من وجوب تخطي التنبيه
 */
function shouldSkipAlert(
  lastAlert: any,
  product: any
): boolean {
  // 1. إذا كان التنبيه السابق لنفس السعر
  if (lastAlert?.currentPrice === product.currentPrice) {
    return true;
  }

  // 2. إذا كان الانخفاض أقل من عتبة التنبيه
  if (product.notificationThreshold) {
    const discount = calculateDiscountPercentage(
      product.originalPrice,
      product.currentPrice
    );
    if (discount < product.notificationThreshold) {
      return true;
    }
  }

  // 3. إذا تم إرسال تنبيه خلال آخر ساعة
  const oneHour = 60 * 60 * 1000;
  if (lastAlert?._creationTime > Date.now() - oneHour) {
    return true;
  }

  return false;
}

/**
 * إنشاء معرف فريد للتنبيه
 */
function generateAlertId(productId: string): string {
  return `price_alert_${productId}_${Date.now()}`;
}

/**
 * إنشاء رابط إلغاء الاشتراك
 */
function generateUnsubscribeToken(userId: string): string {
  return `${userId}_${crypto.randomUUID()}`;
}