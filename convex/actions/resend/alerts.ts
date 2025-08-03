// convex/actions/resend/alerts.ts
import { action } from "../../_generated/server";
import { Resend } from "resend";
import { v } from "convex/values";
import { priceAlertEmail } from "../../../components/email-templates/PriceAlert";
import { verificationEmail } from "../../../components/email-templates/VerificationEmail";
import { internal } from "../../_generated/api";

const resend = new Resend(process.env.RESEND_API_KEY);

// ===== Price Alert Functionality ===== //
export const sendPriceAlert = action({
  args: {
    productId: v.id("trackedProducts"),
    testMode: v.optional(v.boolean()),
    forceSend: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const [product, user] = await Promise.all([
      ctx.runQuery(internal.products.getById, { id: args.productId }),
      ctx.runQuery(internal.users.getByProductId, { productId: args.productId })
    ]);

    if (!product || !user) {
      await ctx.runMutation(internal.alerts.logFailedAlert, {
        productId: args.productId,
        error: "Missing product or user data"
      });
      throw new Error("Product or user not found");
    }

    if (!args.forceSend) {
      const shouldSkip = await checkAlertConditions(ctx, args.productId, product);
      if (shouldSkip) return { status: "skipped", reason: shouldSkip };
    }

    const { emailSubject, emailContent } = prepareEmailContent(product, user);

    try {
      const emailData = {
        from: `Price Alerts <alerts@${process.env.RESEND_DOMAIN}>`,
        to: args.testMode ? process.env.TEST_EMAIL : user.email,
        subject: emailSubject,
        react: priceAlertEmail(emailContent),
        headers: generateEmailHeaders(product._id),
        tags: generateEmailTags()
      };

      const { id: emailId } = await resend.emails.send(emailData);

      await Promise.all([
        ctx.runMutation(internal.alerts.logSentAlert, {
          productId: product._id,
          userId: user._id,
          emailId,
          currentPrice: product.currentPrice
        }),
        ctx.runMutation(internal.products.updateLastNotified, {
          productId: product._id,
          price: product.currentPrice
        })
      ]);

      await handleAdditionalNotifications(ctx, user, product);

      return { 
        status: "sent", 
        emailId,
        to: args.testMode ? process.env.TEST_EMAIL : user.email
      };

    } catch (error) {
      await ctx.runMutation(internal.alerts.logFailedAlert, {
        productId: product._id,
        userId: user._id,
        error: error instanceof Error ? error.message : "Unknown error"
      });

      await ctx.scheduler.runAfter(5 * 60 * 1000, internal.resend.retryFailedAlert, {
        productId: args.productId,
        attempt: 1
      });

      throw new Error(`Failed to send alert: ${error.message}`);
    }
  }
});

// ===== Verification Email Functionality ===== //
export const sendVerificationEmail = action({
  args: {
    email: v.string(),
    token: v.string(),
    name: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    try {
      const verificationLink = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?token=${args.token}`;
      
      const emailData = {
        from: `Verify Your Email <noreply@${process.env.RESEND_DOMAIN}>`,
        to: args.email,
        subject: 'Verify Your Email Address',
        react: verificationEmail({
          verificationLink,
          userName: args.name || 'User'
        }),
        headers: {
          "X-Email-Type": "verification"
        },
        tags: [
          { name: "email_type", value: "verification" }
        ]
      };

      const { id: emailId } = await resend.emails.send(emailData);

      await ctx.runMutation(internal.users.logVerificationEmail, {
        email: args.email,
        emailId,
        sentAt: Date.now()
      });

      return { 
        success: true,
        emailId
      };
    } catch (error) {
      console.error('Failed to send verification email:', error);
      
      await ctx.runMutation(internal.users.logFailedVerificationEmail, {
        email: args.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      throw new Error('Failed to send verification email');
    }
  }
});

// ===== Shared Helper Functions ===== //
async function checkAlertConditions(ctx: any, productId: string, product: any) {
  const [lastAlert, userPreferences] = await Promise.all([
    ctx.runQuery(internal.alerts.getLastPriceAlert, { productId }),
    ctx.runQuery(internal.users.getNotificationPreferences, { userId: product.userId })
  ]);

  if (!userPreferences?.emailAlerts) return "user_disabled_alerts";
  if (lastAlert?.currentPrice === product.currentPrice) return "duplicate_price";

  const discount = calculateDiscount(product.originalPrice, product.currentPrice);
  if (product.notificationThreshold && discount < product.notificationThreshold) {
    return "below_threshold";
  }

  if (lastAlert && new Date(lastAlert._creationTime) > new Date(Date.now() - 60 * 60 * 1000)) {
    return "too_soon";
  }

  return null;
}

function calculateDiscount(oldPrice: number, newPrice: number) {
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
}

function prepareEmailContent(product: any, user: any) {
  const discount = calculateDiscount(product.originalPrice, product.currentPrice);
  const language = user.language || "en";

  const templates = {
    en: {
      subject: `🚨 Price dropped ${discount}% for ${product.name}`,
      content: {
        productName: product.name,
        oldPrice: product.originalPrice,
        newPrice: product.currentPrice,
        discount,
        productUrl: product.trackingUrl,
        imageUrl: product.imageUrl,
        unsubscribeUrl: generateUnsubscribeUrl(user._id),
        language
      }
    },
    ar: {
      subject: `🚨 انخفاض السعر بنسبة ${discount}% على ${product.name}`,
      content: {
        productName: product.name,
        oldPrice: product.originalPrice,
        newPrice: product.currentPrice,
        discount,
        productUrl: product.trackingUrl,
        imageUrl: product.imageUrl,
        unsubscribeUrl: generateUnsubscribeUrl(user._id),
        language
      }
    }
  };

  return templates[language] || templates.en;
}

function generateEmailHeaders(productId: string) {
  return {
    "X-Entity-Ref-ID": `price_alert_${productId}_${Date.now()}`,
    "X-Price-Alert": "true",
    "X-Product-ID": productId
  };
}

function generateEmailTags() {
  return [
    { name: "alert_type", value: "price_drop" },
    { name: "system", value: "price_alerts" }
  ];
}

function generateUnsubscribeUrl(userId: string) {
  const token = `${userId}_${crypto.randomUUID()}`;
  return `${process.env.BASE_URL}/unsubscribe?token=${token}`;
}

async function handleAdditionalNotifications(ctx: any, user: any, product: any) {
  const notifications = [];
  
  if (user.notificationPreferences?.whatsapp && user.phone) {
    notifications.push(
      ctx.runAction(internal.whatsapp.sendPriceAlert, {
        productId: product._id,
        userId: user._id
      }).catch(e => console.error("WhatsApp failed:", e))
    );
  }

  if (user.notificationPreferences?.push) {
    notifications.push(
      ctx.runAction(internal.notifications.sendPush, {
        userId: user._id,
        title: "Price Alert",
        body: `Price dropped for ${product.name}`
      }).catch(e => console.error("Push failed:", e))
    );
  }

  await Promise.all(notifications);
}