// convex/actions/ai/audio.ts
import { internalAction } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { v } from "convex/values";
import { OpenAI } from "openai";

// أنواع الإجراءات الصوتية المدعومة
const audioActionTypes = v.union(
  v.literal("transcribe"),
  v.literal("translate"),
  v.literal("analyze_sentiment"),
  v.literal("generate_speech")
);

export const processAudio = internalAction({
  args: {
    audioData: v.string(), // base64 encoded audio
    actionType: audioActionTypes,
    userId: v.string(), // للمصادقة والتتبع
    language: v.optional(v.string()), // للترجمة
    voiceModel: v.optional(v.string()), // لتوليد الكلام
  },
  handler: async (ctx, args) => {
    // 1. المصادقة والتحقق من الصلاحيات
    const user = await ctx.runQuery(internal.queries.auth.getUser, {
      userId: args.userId,
    });
    if (!user) throw new Error("Unauthorized");

    // 2. تهيئة OpenAI (يجب إضافة المفتاح في .env)
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
    });

    try {
      // 3. معالجة الصوت حسب نوع الإجراء
      switch (args.actionType) {
        case "transcribe":
          return await transcribeAudio(openai, args.audioData);
        case "translate":
          return await translateAudio(openai, args.audioData, args.language);
        case "analyze_sentiment":
          return await analyzeSentiment(openai, args.audioData);
        case "generate_speech":
          return await generateSpeech(openai, args.audioData, args.voiceModel);
        default:
          throw new Error("Invalid audio action type");
      }
    } catch (error) {
      // 4. تسجيل الخطأ
      await ctx.runMutation(internal.actions.errorHandling.logError, {
        userId: args.userId,
        error: JSON.stringify(error),
        module: "audio",
      });
      throw error;
    }
  },
});

// الدوال المساعدة
async function transcribeAudio(openai: OpenAI, audioData: string) {
  const response = await openai.audio.transcriptions.create({
    file: Buffer.from(audioData, "base64"),
    model: "whisper-1",
    response_format: "text",
  });
  return response;
}

async function translateAudio(
  openai: OpenAI,
  audioData: string,
  targetLanguage?: string
) {
  const response = await openai.audio.translations.create({
    file: Buffer.from(audioData, "base64"),
    model: "whisper-1",
    response_format: "text",
  });
  return {
    translatedText: response,
    targetLanguage: targetLanguage || "en",
  };
}

async function analyzeSentiment(openai: OpenAI, audioData: string) {
  // أولاً تحويل الصوت إلى نص
  const text = await transcribeAudio(openai, audioData);
  
  // ثم تحليل المشاعر
  const sentimentResponse = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "Analyze the sentiment of the following text. Return a JSON object with sentiment (positive/negative/neutral), score (0-1), and key emotions.",
      },
      {
        role: "user",
        content: text,
      },
    ],
    response_format: { type: "json_object" },
  });

  return JSON.parse(sentimentResponse.choices[0]?.message.content || "{}");
}

async function generateSpeech(
  openai: OpenAI,
  text: string,
  voiceModel?: string
) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: (voiceModel as any) || "alloy",
    input: text,
  });

  const buffer = await mp3.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}

// تصدير الإجراءات للاستخدام الخارجي
export const audioActions = {
  processAudio,
};