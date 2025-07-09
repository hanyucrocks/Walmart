import { type NextRequest, NextResponse } from "next/server"
import { smartPredictAI } from "@/lib/ai-service"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 })
  }

  try {
    const recommendations = await smartPredictAI.generatePersonalizedRecommendations(userId)
    // Add smart suggestions
    const smartSuggestions = await smartPredictAI.getSmartSuggestions(userId)
    return NextResponse.json({ recommendations, smartSuggestions })
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return NextResponse.json({ error: "Failed to generate recommendations" }, { status: 500 })
  }
}
