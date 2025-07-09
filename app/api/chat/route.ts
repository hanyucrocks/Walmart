import type { NextRequest } from "next/server"
import { smartPredictAI } from "@/lib/ai-service"
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const { userId, message, conversationHistory } = await request.json()

  if (!userId || !message) {
    return new Response("Missing required fields", { status: 400 })
  }

  try {
    const result = await smartPredictAI.handleChatQuery(userId, message, conversationHistory || [])

    // If result is already a Response, return it directly
    if (result instanceof Response) {
      return result
    }

    // If result has a toDataStream method (from streamText), use it
    if (result && typeof result.toDataStream === "function") {
      return new Response(result.toDataStream())
    }

    // Otherwise, treat as text
    return new Response(String(result), { headers: { "Content-Type": "text/plain" } })
  } catch (error) {
    console.error("Error in chat:", error)
    return new Response("Failed to process chat message", { status: 500 })
  }
}
