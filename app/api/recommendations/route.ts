import { NextRequest, NextResponse } from "next/server";
import { smartPredictAI } from "@/lib/ai-service";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  try {
    // Get smart suggestions for the user
    const smartSuggestions = await smartPredictAI.getSmartSuggestions(userId);
    return NextResponse.json({ smartSuggestions });
  } catch (error) {
    console.error("Error generating smart suggestions:", error);
    return NextResponse.json({ error: "Failed to generate smart suggestions" }, { status: 500 });
  }
}
