// convex/actions/whatsapp/notifications.ts
import { action } from "../../_generated/server";
import { Client, LocalAuth, MessageMedia } from "whatsapp-web.js";
import { v } from "convex/values";
import qrcode from "qrcode-terminal";
import { getMessageContent } from "../../../lib/whatsappTemplates";

// حالة عميل واتساب
let whatsappClient: Client | null = null;

/**
 * تهيئة عميل واتساب
 */
function initializeWhatsAppClient() {
  if (whatsappClient) return whatsappClient;

  whatsappClient = new Client({
    authStrategy: new LocalAuth({ clientId: "lifesync" }),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    },
    webVersionCache: {
      type: "remote",
      remotePath: "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html"
    }
  });

  // معالجة QR Code للتوثيق
  whatsappClient.on("qr", (qr) => {
    console.log("WhatsApp QR Code:");
    qrcode.generate(qr, { small: true });
  });

  // تأكيد الاتصال
  whatsappClient.on("ready", () => {
    console.log("WhatsApp client is ready!");
  });

  // معالجة الأخطاء
  whatsappClient.on("auth_failure", (msg) => {
    console.error("WhatsApp auth failure:", msg);
    whatsappClient = null;
  });

  whatsappClient.initialize();
  return whatsappClient;
}

/**
 * إرسال إشعار واتساب
 * @param userId - معرف المستخدم
 * @param type - نوع الإشعار
 * @param data - بيانات مخصصة للإشعار
 */
export const sendWhatsAppNotification = action({
  args: {
    userId: v.id("users"),
    type: v.union(
      v.literal("price_alert"),
      v.literal("donation_confirmation"),
      v.literal("mental_health_alert"),
      v.literal("weekly_report")
    ),
    data: v.any()
  },
  handler: async (ctx, args) => {
    // 1. جلب بيانات المستخدم
    const user = await ctx.runQuery("users:get", { id: args.userId });
    if (!user.phone) {
      await ctx.runMutation("notifications:logFailedNotification", {
        userId: user._id,
        error: "No phone number available",
        type: args.type
      });
      return { success: false, error: "No phone number available" };
    }

    // 2. التحقق من تفضيلات المستخدم
    if (!user.notificationPreferences?.whatsapp) {
      return { success: false, error: "WhatsApp notifications disabled" };
    }

    // 3. تهيئة العميل
    const client = initializeWhatsAppClient();
    if (!client) {
      throw new Error("WhatsApp client not initialized");
    }

    // 4. إنشاء محتوى الرسالة
    const { message, media } = await getMessageContent(args.type, args.data, user.language);

    try {
      // 5. إرسال الرسالة
      const chatId = `${user.phone}@c.us`;
      let response;

      if (media) {
        const mediaData = await MessageMedia.fromUrl(media.url);
        response = await client.sendMessage(chatId, mediaData, {
          caption: message,
          sendMediaAsDocument: media.asDocument
        });
      } else {
        response = await client.sendMessage(chatId, message);
      }

      // 6. تسجيل الإشعار المرسل
      await ctx.runMutation("notifications:logSentNotification", {
        userId: user._id,
        type: args.type,
        messageId: response.id.id,
        content: message,
        timestamp: Date.now()
      });

      return { success: true, messageId: response.id.id };

    } catch (error) {
      // 7. معالجة الأخطاء
      await ctx.runMutation("notifications:logFailedNotification", {
        userId: user._id,
        error: error.message,
        type: args.type
      });
      throw new Error(`Failed to send WhatsApp notification: ${error.message}`);
    }
  }
});

// ===== أنواع الإشعارات المخصصة ===== //

/**
 * إرسال تنبيه سعر عبر واتساب
 */
export const sendPriceAlert = action({
  args: {
    productId: v.id("trackedProducts"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const product = await ctx.runQuery("products:getById", { id: args.productId });
    const discount = calculateDiscount(product.originalPrice, product.currentPrice);

    return ctx.runAction("whatsapp/sendWhatsAppNotification", {
      userId: args.userId,
      type: "price_alert",
      data: {
        productName: product.name,
        oldPrice: product.originalPrice,
        newPrice: product.currentPrice,
        discount,
        productUrl: product.productUrl,
        imageUrl: product.imageUrl
      }
    });
  }
});

/**
 * إرسال تأكيد تبرع عبر واتساب
 */
export const sendDonationConfirmation = action({
  args: {
    donationId: v.id("donations"),
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    const donation = await ctx.runQuery("donations:getById", { id: args.donationId });
    const project = await ctx.runQuery("projects:getById", { id: donation.projectId });

    return ctx.runAction("whatsapp/sendWhatsAppNotification", {
      userId: args.userId,
      type: "donation_confirmation",
      data: {
        amount: donation.amount,
        currency: donation.currency,
        projectName: project.name,
        transactionHash: donation.txHash,
        impact: project.impactDescription
      }
    });
  }
});

// ===== الدوال المساعدة ===== //

function calculateDiscount(oldPrice: number, newPrice: number): number {
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}