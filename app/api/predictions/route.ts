import { type NextRequest, NextResponse } from "next/server"
import { smartPredictAI } from "@/lib/ai-service"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  try {
    const predictions = await smartPredictAI.predictRestockNeeds(userId)
    return NextResponse.json({ predictions })
  } catch (error) {
    console.error("Error generating predictions:", error)
    return NextResponse.json({ error: "Failed to generate predictions" }, { status: 500 })
  }
}
