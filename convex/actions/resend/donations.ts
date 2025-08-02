// convex/actions/resend/donations.ts
import { action } from "../../_generated/server";
import { Resend } from "resend";
import { v } from "convex/values";
import { donationReceiptEmail } from "../../../components/email-templates/DonationReceipt";
import { generatePDFReceipt } from "../../utils/pdfGenerator";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * إرسال إيصال التبرع للمستخدم
 * @param donationId - معرف التبرع في جدول donations
 * @param testMode - وضع الاختبار (اختياري)
 */
export const sendDonationReceipt = action({
  args: {
    donationId: v.id("donations"),
    testMode: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    // 1. جلب بيانات التبرع والمستخدم والمشروع
    const donation = await ctx.runQuery("donations:getById", {
      id: args.donationId
    });
    
    const user = await ctx.runQuery("users:get", {
      id: donation.userId
    });

    const project = await ctx.runQuery("projects:getById", {
      id: donation.projectId
    });

    // 2. إنشاء إيصال PDF
    const pdfBuffer = await generatePDFReceipt({
      donation,
      user,
      project
    });

    // 3. إعداد بيانات القالب
    const emailData = {
      userName: user.name,
      amount: donation.amount,
      currency: donation.currency,
      projectName: project.name,
      donationDate: new Date(donation._creationTime).toLocaleDateString(user.language),
      isCrypto: donation.currency === "BTC",
      transactionHash: donation.txHash,
      impactDescription: project.impactDescription,
      language: user.language,
      projectImages: project.images.slice(0, 3),
      taxDeductible: project.taxDeductible,
      nextSteps: getNextSteps(donation, user.language)
    };

    // 4. إرسال الإيميل عبر Resend
    try {
      const { id: emailId } = await resend.emails.send({
        from: `Donations <donations@${process.env.RESEND_DOMAIN}>`,
        to: args.testMode ? "test@lifesync.ai" : user.email,
        subject: user.language === "ar" 
          ? `شكراً لتبرعك لمشروع ${project.name}` 
          : `Thank you for donating to ${project.name}`,
        react: donationReceiptEmail(emailData),
        attachments: [{
          filename: user.language === "ar" 
            ? "إيصال_تبرع.pdf" 
            : "Donation_Receipt.pdf",
          content: pdfBuffer
        }],
        headers: {
          "X-Entity-Ref-ID": generateDonationId(donation._id),
          "X-Donation-Type": donation.currency
        },
        tags: [{
          name: "donation_type",
          value: donation.currency
        }]
      });

      // 5. تسجيل الإرسال الناجح
      await ctx.runMutation("donations:logReceiptSent", {
        donationId: donation._id,
        emailId,
        receiptPdf: await ctx.storage.store(
          new Blob([pdfBuffer], { type: "application/pdf" })
        )
      });

      // 6. إرسال تنبيه واتساب إذا مفعل
      if (user.notificationPreferences.whatsapp && user.phone) {
        await ctx.runAction("whatsapp/sendDonationConfirmation", {
          donationId: donation._id,
          userId: user._id
        });
      }

      return { success: true, emailId };

    } catch (error) {
      // تسجيل الخطأ
      await ctx.runMutation("donations:logReceiptFailed", {
        donationId: donation._id,
        error: error.message
      });
      throw new Error("Failed to send donation receipt");
    }
  }
});

// ===== الدوال المساعدة ===== //

/**
 * إنشاء معرف فريد للتبرع
 */
function generateDonationId(donationId: string): string {
  return `donation_${donationId}_${Date.now()}`;
}

/**
 * الحصول على الخطوات التالية بناءً على نوع التبرع
 */
function getNextSteps(donation: any, language: string): string[] {
  const steps = [];
  
  if (donation.currency === "BTC") {
    steps.push(
      language === "ar" 
        ? "يمكنك تتبع معاملتك على البلوكشين باستخدام الرابط التالي" 
        : "You can track your transaction on blockchain using the following link"
    );
  }

  if (donation.project.updatesEnabled) {
    steps.push(
      language === "ar"
        ? "سوف تصلك تحديثات دورية عن تقدم المشروع"
        : "You'll receive regular updates about the project progress"
    );
  }

  return steps;
}