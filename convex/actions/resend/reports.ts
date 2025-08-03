// convex/actions/resend/reports.ts
import { action } from "../../_generated/server";
import { Resend } from "resend";
import { v } from "convex/values";
import { weeklyReportEmail } from "../../../components/email-templates/WeeklyReport";
import { generateAudioReport } from "../../ai/audio";
import { analyzeUserEmotions } from "../../ai/analysis";

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * إرسال التقرير الأسبوعي للمستخدم
 * @param userId - معرف المستخدم
 * @param testMode - وضع الاختبار (اختياري)
 */
export const sendWeeklyReport = action({
  args: {
    userId: v.id("users"),
    testMode: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    // 1. جلب بيانات المستخدم
    const user = await ctx.runQuery("users:get", { id: args.userId });

    // 2. تحليل المشاعر والصحة العقلية
    const emotionAnalysis = await analyzeUserEmotions(ctx, args.userId);
    
    // 3. إنشاء التقرير الصوتي
    const audioReport = await generateAudioReport(ctx, {
      userId: args.userId,
      text: emotionAnalysis.summary,
      language: user.language
    });

    // 4. جمع بيانات التقرير
    const weeklyStats = await ctx.runQuery("reports:getWeeklyStats", {
      userId: args.userId
    });

    // 5. إعداد بيانات القالب
    const emailData = {
      userName: user.name,
      weekNumber: getCurrentWeekNumber(),
      startDate: getWeekStartDate(),
      endDate: getWeekEndDate(),
      emotionAnalysis,
      weeklyStats,
      expertAdvice: generateExpertAdvice(emotionAnalysis),
      language: user.language,
      unsubscribeUrl: `${process.env.BASE_URL}/unsubscribe-reports?token=${generateUnsubscribeToken(user._id)}`
    };

    // 6. إرسال الإيميل عبر Resend
    try {
      const { id: emailId } = await resend.emails.send({
        from: `LifeSync Reports <reports@${process.env.RESEND_DOMAIN}>`,
        to: args.testMode ? "test@lifesync.ai" : user.email,
        subject: user.language === "ar" 
          ? `تقريرك الأسبوعي للصحة العقلية - الأسبوع ${emailData.weekNumber}` 
          : `Your Weekly Mental Health Report - Week ${emailData.weekNumber}`,
        react: weeklyReportEmail(emailData),
        attachments: [{
          filename: user.language === "ar" 
            ? "التقرير_الصوتي.mp3" 
            : "Audio_Report.mp3",
          content: await ctx.storage.get(audioReport.storageId)
        }],
        headers: {
          "X-Entity-Ref-ID": generateReportId(user._id),
          "X-Report-Type": "weekly_mental_health"
        },
        tags: [{
          name: "report_type",
          value: "weekly_summary"
        }]
      });

      // 7. تسجيل التقرير المرسل
      await ctx.runMutation("reports:logSentReport", {
        userId: user._id,
        emailId,
        reportType: "weekly",
        audioReportId: audioReport.storageId,
        emotionScore: emotionAnalysis.score
      });

      return { success: true, emailId };

    } catch (error) {
      // تسجيل الخطأ
      await ctx.runMutation("reports:logFailedReport", {
        userId: user._id,
        error: error.message
      });
      throw new Error("Failed to send weekly report");
    }
  }
});

// ===== الدوال المساعدة ===== //

/**
 * تحليل مشاعر المستخدم بناء على إيميلاته
 */
async function analyzeUserEmotions(ctx: any, userId: string) {
  const emails = await ctx.runQuery("emails:getLastWeek", { userId });
  
  const analysis = await ctx.runAction("ai/analyzeEmotions", {
    texts: emails.map((e: any) => e.content)
  });

  return {
    score: analysis.score,
    summary: analysis.summary,
    dominantEmotion: analysis.dominantEmotion,
    keywords: analysis.keywords,
    recommendations: analysis.recommendations
  };
}

/**
 * إنشاء نصيحة خبراء مخصصة
 */
function generateExpertAdvice(analysis: any): string[] {
  const advice = [];
  
  if (analysis.score < 0.3) {
    advice.push("Consider scheduling a consultation with a mental health professional");
    advice.push("Try mindfulness exercises for 10 minutes daily");
  } else if (analysis.score < 0.6) {
    advice.push("Take regular breaks during work hours");
    advice.push("Connect with friends or family this week");
  } else {
    advice.push("Maintain your positive routines");
    advice.push("Consider journaling to reflect on your positive experiences");
  }

  return advice;
}

/**
 * إنشاء معرف فريد للتقرير
 */
function generateReportId(userId: string): string {
  return `report_${userId}_${Date.now()}`;
}

/**
 * الحصول على رقم الأسبوع الحالي
 */
function getCurrentWeekNumber(): number {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - startOfYear.getTime();
  return Math.ceil(diff / (7 * 24 * 60 * 60 * 1000));
}

/**
 * إنشاء رابط إلغاء الاشتراك
 */
function generateUnsubscribeToken(userId: string): string {
  return `${userId}_${crypto.randomUUID()}`;
}