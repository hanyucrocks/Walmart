import { generateText, streamText } from "ai"
import { xai } from "@ai-sdk/xai"
import { supabase } from "./supabase"

export class SmartPredictAI {
  private model = xai("grok-2")

  async generatePersonalizedRecommendations(userId: string) {
    try {
      // Get user's purchase history and preferences
      const { data: purchaseHistory } = await supabase
        .from("purchase_history")
        .select("*")
        .eq("user_id", userId)
        .order("purchase_date", { ascending: false })
        .limit(50)

      const { data: userProfile } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

      const prompt = `
      Generate exactly 5 personalized product recommendations based on this user's data.
      
      User Profile: ${JSON.stringify(userProfile)}
      Recent Purchases: ${JSON.stringify(purchaseHistory)}
      
      IMPORTANT: Return ONLY a valid JSON array with this exact structure:
      [
        {
          "id": 1,
          "name": "Product Name",
          "category": "Category",
          "price": 9.99,
          "image": "/placeholder.svg?height=120&width=120",
          "confidence": 85,
          "reason": "Brief reason for recommendation"
        }
      ]
      
      Do not include any explanatory text, only the JSON array.
      `

      const { text } = await generateText({
        model: this.model,
        prompt,
        system:
          "You are a JSON API that returns only valid JSON arrays for product recommendations. Never include explanatory text.",
      })

      // Clean the response to extract JSON
      const cleanedText = text.trim()
      const jsonStart = cleanedText.indexOf("[")
      const jsonEnd = cleanedText.lastIndexOf("]") + 1

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("No JSON array found in response")
      }

      const jsonString = cleanedText.substring(jsonStart, jsonEnd)
      const recommendations = JSON.parse(jsonString)

      // Store insights in database
      for (const rec of recommendations) {
        await supabase.from("ai_insights").insert({
          user_id: userId,
          insight_type: "recommendation",
          content: JSON.stringify(rec),
          confidence_score: rec.confidence / 100,
          is_active: true,
        })
      }

      return recommendations
    } catch (error) {
      console.error("Failed to generate recommendations:", error)
      // Return fallback recommendations
      return [
        {
          id: 1,
          name: "Great Value Organic Bananas",
          price: 2.48,
          image: "/placeholder.svg?height=120&width=120",
          confidence: 95,
          reason: "You buy these every week",
        },
        {
          id: 2,
          name: "Tide Laundry Detergent",
          price: 12.97,
          image: "/placeholder.svg?height=120&width=120",
          confidence: 88,
          reason: "Based on your purchase history",
        },
        {
          id: 3,
          name: "Honey Nut Cheerios",
          price: 4.98,
          image: "/placeholder.svg?height=120&width=120",
          confidence: 82,
          reason: "Popular with similar shoppers",
        },
      ]
    }
  }

  async predictRestockNeeds(userId: string) {
    try {
      const { data: purchaseHistory } = await supabase
        .from("purchase_history")
        .select("*")
        .eq("user_id", userId)
        .order("purchase_date", { ascending: false })

      const prompt = `
      Analyze purchase history to predict restock needs.
      
      Purchase History: ${JSON.stringify(purchaseHistory)}
      
      IMPORTANT: Return ONLY a valid JSON array with this exact structure:
      [
        {
          "item": "Product Name",
          "daysLeft": 3,
          "confidence": "High",
          "action": "Order now for delivery tomorrow",
          "urgency_level": "high"
        }
      ]
      
      Generate 2-3 predictions. Do not include any explanatory text, only the JSON array.
      `

      const { text } = await generateText({
        model: this.model,
        prompt,
        system:
          "You are a JSON API that returns only valid JSON arrays for restock predictions. Never include explanatory text.",
      })

      // Clean the response to extract JSON
      const cleanedText = text.trim()
      const jsonStart = cleanedText.indexOf("[")
      const jsonEnd = cleanedText.lastIndexOf("]") + 1

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("No JSON array found in response")
      }

      const jsonString = cleanedText.substring(jsonStart, jsonEnd)
      const predictions = JSON.parse(jsonString)

      // Store predictions
      for (const pred of predictions) {
        await supabase.from("ai_insights").insert({
          user_id: userId,
          insight_type: "prediction",
          content: JSON.stringify(pred),
          confidence_score: pred.confidence === "High" ? 0.9 : pred.confidence === "Medium" ? 0.7 : 0.5,
          is_active: true,
        })
      }

      return predictions
    } catch (error) {
      console.error("Failed to generate predictions:", error)
      // Return fallback predictions
      return [
        {
          item: "Toilet Paper",
          daysLeft: 3,
          confidence: "High",
          action: "Order now for delivery tomorrow",
          urgency_level: "high",
        },
        {
          item: "Dog Food",
          daysLeft: 5,
          confidence: "Medium",
          action: "Add to your next order",
          urgency_level: "medium",
        },
      ]
    }
  }

  async handleChatQuery(userId: string, message: string, conversationHistory: any[]) {
    try {
      // Get user context
      const { data: userProfile } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

      const { data: recentPurchases } = await supabase
        .from("purchase_history")
        .select("*")
        .eq("user_id", userId)
        .order("purchase_date", { ascending: false })
        .limit(10)

      const systemPrompt = `
      You are Walmart's SmartPredict AI assistant. You help users with:
      - Product recommendations
      - Price comparisons
      - Shopping list suggestions
      - Nutritional information
      - Recipe ideas based on purchases
      - Order placement and tracking
      
      User Context:
      Profile: ${JSON.stringify(userProfile)}
      Recent Purchases: ${JSON.stringify(recentPurchases)}
      
      Be helpful, friendly, and concise. Always prioritize Walmart products and services.
      Keep responses under 100 words unless specifically asked for detailed information.
      `

      return streamText({
        model: this.model,
        system: systemPrompt,
        messages: [...conversationHistory, { role: "user", content: message }],
      })
    } catch (error) {
      console.error("Error in chat query:", error)
      throw error
    }
  }

  async generateWeeklyDeals(userId: string) {
    try {
      const { data: userProfile } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

      const { data: purchaseHistory } = await supabase.from("purchase_history").select("*").eq("user_id", userId)

      const prompt = `
      Generate personalized weekly deals for this Walmart customer.
      
      User Profile: ${JSON.stringify(userProfile)}
      Purchase History: ${JSON.stringify(purchaseHistory)}
      
      IMPORTANT: Return ONLY a valid JSON array with this exact structure:
      [
        {
          "id": 1,
          "name": "Product Name",
          "originalPrice": 6.98,
          "salePrice": 4.98,
          "savings": 2.00,
          "image": "/placeholder.svg?height=80&width=80",
          "deal_reason": "Because you bought similar items"
        }
      ]
      
      Generate 3-4 deals. Do not include any explanatory text, only the JSON array.
      `

      const { text } = await generateText({
        model: this.model,
        prompt,
        system:
          "You are a JSON API that returns only valid JSON arrays for weekly deals. Never include explanatory text.",
      })

      // Clean the response to extract JSON
      const cleanedText = text.trim()
      const jsonStart = cleanedText.indexOf("[")
      const jsonEnd = cleanedText.lastIndexOf("]") + 1

      if (jsonStart === -1 || jsonEnd === 0) {
        throw new Error("No JSON array found in response")
      }

      const jsonString = cleanedText.substring(jsonStart, jsonEnd)
      const deals = JSON.parse(jsonString)

      // Store deals
      for (const deal of deals) {
        await supabase.from("ai_insights").insert({
          user_id: userId,
          insight_type: "deal",
          content: JSON.stringify(deal),
          confidence_score: 0.8,
          is_active: true,
        })
      }

      return deals
    } catch (error) {
      console.error("Failed to generate deals:", error)
      // Return fallback deals
      return [
        {
          id: 1,
          name: "Coca-Cola 12-pack",
          originalPrice: 6.98,
          salePrice: 4.98,
          savings: 2.0,
          image: "/placeholder.svg?height=80&width=80",
          deal_reason: "Popular choice",
        },
        {
          id: 2,
          name: "Lay's Potato Chips",
          originalPrice: 4.48,
          salePrice: 2.98,
          savings: 1.5,
          image: "/placeholder.svg?height=80&width=80",
          deal_reason: "Great snack deal",
        },
      ]
    }
  }
}

export const smartPredictAI = new SmartPredictAI()
