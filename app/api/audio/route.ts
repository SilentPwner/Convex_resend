// app/api/audio/route.ts
import { internal } from "@/convex/_generated/api";
import { fetchFromConvex } from "@/lib/api";

export async function POST(request: Request) {
  const { audioData, actionType, userId, language, voiceModel } = await request.json();

  const result = await fetchFromConvex({
    action: internal.ai.audio.processAudio,
    args: { audioData, actionType, userId, language, voiceModel },
  });

  return Response.json(result);
}