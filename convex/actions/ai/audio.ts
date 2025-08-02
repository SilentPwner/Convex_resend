// convex/actions/ai/audio.ts
import { action } from "../../_generated/server";
import { ElevenLabsClient } from "elevenlabs";

const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVENLABS_API_KEY
});

export const generateAudioReport = action({
  args: { userId: v.id("users"), text: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery("users:get", { id: args.userId });
    
    const audio = await elevenlabs.generate({
      voice: user.language === "ar" ? "Arcadia" : "Rachel",
      model_id: "eleven_multilingual_v2",
      text: args.text,
      voice_settings: {
        stability: 0.7,
        similarity_boost: 0.8
      }
    });

    const storageId = await ctx.storage.store(
      new Blob([audio], { type: "audio/mpeg" })
    );

    return { url: storageId };
  }
});