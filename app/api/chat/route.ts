import type { NextRequest } from "next/server"
import { smartPredictAI } from "@/lib/ai-service"

export async function POST(request: NextRequest) {
  const { userId, message, conversationHistory } = await request.json()

  if (!userId || !message) {
    return new Response("Missing required fields", { status: 400 })
  }

  try {
    const stream = await smartPredictAI.handleChatQuery(userId, message, conversationHistory || [])

    return new Response(stream.toAIStream(), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
      },
    })
  } catch (error) {
    console.error("Error in chat:", error)
    return new Response("Failed to process chat message", { status: 500 })
  }
}
