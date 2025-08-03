// convex/actions/ai/analysis.ts
import { action, internalAction } from "../../_generated/server";
import { v } from "convex/values";
import { OpenAI } from "openai";
import { analyzeTone } from "../../../lib/sentimentAnalysis";

const openai = new OpenAI(process.env.OPENAI_API_KEY);

/**
 * تحليل مشاعر المستخدم من الإيميلات
 */
export const analyzeUserEmotions = internalAction({
  args: {
    userId: v.id("users"),
    timeframe: v.union(v.literal("24h"), v.literal("7d"), v.literal("30d"))
  },
  handler: async (ctx, args) => {
    // 1. جلب إيميلات المستخدم للفترة المحددة
    const emails = await ctx.runQuery("emails:getByTimeframe", {
      userId: args.userId,
      timeframe: args.timeframe
    });

    // 2. تحليل كل إيميل على حدة
    const individualAnalysis = await Promise.all(
      emails.map(async (email) => {
        return {
          emailId: email._id,
          ...(await analyzeEmailContent(email.content))
        };
      })
    );

    // 3. تحليل شامل لجميع الإيميلات
    const combinedText = emails.map(e => e.content).join("\n\n");
    const overallAnalysis = await analyzeCombinedContent(combinedText);

    // 4. حفظ النتائج
    await ctx.runMutation("analysis:saveResults", {
      userId: args.userId,
      timeframe: args.timeframe,
      individualAnalysis,
      overallAnalysis
    });

    return {
      individual: individualAnalysis,
      overall: overallAnalysis
    };
  }
});

/**
 * تحليل محتوى إيميل واحد
 */
async function analyzeEmailContent(content: string) {
  // 1. التحليل باستخدام نموذج الذكاء الاصطناعي
  const aiResponse = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `Analyze the text and respond with JSON format: {
          "tone": "positive" | "negative" | "neutral",
          "sentiment_score": number (-1 to 1),
          "keywords": string[],
          "emotional_tone": string[],
          "potential_concerns": string[]
        }`
      },
      {
        role: "user",
        content: content
      }
    ],
    response_format: { type: "json_object" }
  });

  const aiResult = JSON.parse(aiResponse.choices[0].message.content || "{}");

  // 2. التحليل باستخدام الخوارزمية المحلية
  const localAnalysis = analyzeTone(content);

  return {
    ...aiResult,
    local_score: localAnalysis.score,
    timestamp: Date.now()
  };
}

/**
 * تحليل محتوى مجمع
 */
async function analyzeCombinedContent(content: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `Analyze combined emails and provide JSON: {
          "dominant_emotion": string,
          "emotion_timeline": { day: string, emotion: string }[],
          "main_concerns": string[],
          "positive_aspects": string[],
          "recommendations": string[],
          "health_score": number (1-100)
        }`
      },
      {
        role: "user",
        content: content
      }
    ],
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

/**
 * إنشاء تقرير الصحة العقلية الأسبوعي
 */
export const generateMentalHealthReport = action({
  args: {
    userId: v.id("users")
  },
  handler: async (ctx, args) => {
    // 1. تحليل المشاعر للأسبوع الماضي
    const analysis = await ctx.runAction("ai/analyzeUserEmotions", {
      userId: args.userId,
      timeframe: "7d"
    });

    // 2. إنشاء ملخص التقرير
    const report = await generateReportSummary(analysis.overall);

    // 3. حفظ التقرير
    await ctx.runMutation("reports:saveMentalHealthReport", {
      userId: args.userId,
      analysis: analysis.individual,
      summary: report,
      healthScore: analysis.overall.health_score
    });

    return report;
  }
});

/**
 * إنشاء ملخص التقرير
 */
async function generateReportSummary(analysis: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `Create a mental health report summary with:
        - Overall emotional state
        - Key concerns
        - Positive aspects
        - Personalized recommendations
        - Professional advice if needed
        Use clear, empathetic language.`
      },
      {
        role: "user",
        content: JSON.stringify(analysis)
      }
    ]
  });

  return response.choices[0].message.content;
}

/**
 * الكشف عن الحالات الحرجة
 */
export const detectCriticalCases = internalAction({
  handler: async (ctx) => {
    // 1. جلب جميع التحليلات الحديثة
    const recentAnalyses = await ctx.runQuery("analysis:getRecentAnalyses");

    // 2. تحديد الحالات الحرجة
    const criticalCases = recentAnalyses.filter(
      (a: any) => a.overall.health_score < 30
    );

    // 3. إرسال تنبيهات للحالات الحرجة
    await Promise.all(
      criticalCases.map(async (user: any) => {
        await ctx.runAction("notifications:sendCriticalAlert", {
          userId: user._id,
          severity: "high",
          concerns: user.overall.main_concerns
        });
      })
    );

    return criticalCases.length;
  }
});