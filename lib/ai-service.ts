import { generateText, streamText, processTextStream } from "ai"
import { xai } from "@ai-sdk/xai"
import { supabase } from "./supabase"

export class SmartPredictAI {
  private model = xai("grok-2")

  async generatePersonalizedRecommendations(userId: string, mood?: string) {
    try {
      // Get user's purchase history and preferences
      const { data: purchaseHistory } = await supabase
        .from("purchase_history")
        .select("*")
        .eq("user_id", userId)
        .order("purchase_date", { ascending: false })
        .limit(50)

      const { data: userProfile } = await supabase.from("user_profiles").select("*").eq("id", userId).single()

      // Fetch user favorites
      const { data: favoritesRows } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", userId)
      const favoriteProductIds = favoritesRows ? favoritesRows.map(row => row.product_id) : [];
      const favoriteProducts = (purchaseHistory || []).filter(p => favoriteProductIds.includes(p.id));

      const prompt = `
      Generate exactly 5 personalized product recommendations based on this user's data.
      
      User Profile: ${JSON.stringify(userProfile)}
      Location: ${userProfile?.location || "unknown"}
      Preferences: ${JSON.stringify(userProfile?.shopping_preferences || [])}
      Dietary Restrictions: ${JSON.stringify(userProfile?.dietary_restrictions || [])}
      Favorites: ${JSON.stringify(favoriteProducts)}
      Recent Purchases: ${JSON.stringify(purchaseHistory)}
      Mood: ${mood || "not specified"}
      
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
          image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=120&h=120&fit=crop&crop=center",
          confidence: 95,
          reason: "You buy these every week",
        },
        {
          id: 2,
          name: "Tide Laundry Detergent",
          price: 12.97,
          image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=120&h=120&fit=crop&crop=center",
          confidence: 88,
          reason: "Based on your purchase history",
        },
        {
          id: 3,
          name: "Honey Nut Cheerios",
          price: 4.98,
          image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=120&h=120&fit=crop&crop=center",
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

  // Utility: Detect mood from message
  detectMood(message: string): string | null {
    const moodKeywords: Record<string, string[]> = {
      tired: ["tired", "sleepy", "exhausted", "worn out", "fatigued"],
      happy: ["happy", "joyful", "excited", "cheerful", "glad"],
      sad: ["sad", "down", "unhappy", "depressed", "blue"],
      stressed: ["stressed", "anxious", "overwhelmed", "nervous"],
      bored: ["bored", "uninterested", "dull", "restless"],
      energetic: ["energetic", "active", "lively", "motivated"],
      hungry: ["hungry", "starving", "craving", "snack"],
      relaxed: ["relaxed", "calm", "chill", "peaceful"],
    };
    const lower = message.toLowerCase();
    for (const [mood, keywords] of Object.entries(moodKeywords)) {
      if (keywords.some((kw) => lower.includes(kw))) {
        return mood;
      }
    }
    return null;
  }

  async handleChatQuery(userId: string, message: string, conversationHistory: any[]) {
    try {
      const lowerMsg = message.toLowerCase().trim();

      // Mood detection
      const detectedMood = this.detectMood(message);

      // Intent: Add to cart (flexible matching)
      // Improved regex: capture only the product name, not the trailing 'to the cart'
      let addToCartProduct = null;
      let addToCartMatch = lowerMsg.match(/(?:please |can you )?add (.+?) to (?:my )?cart/);
      if (addToCartMatch) {
        addToCartProduct = addToCartMatch[1];
      } else {
        // fallback: 'add milk' or 'add milk please'
        addToCartMatch = lowerMsg.match(/(?:please |can you )?add (.+)$/);
        if (addToCartMatch) {
          addToCartProduct = addToCartMatch[1];
        }
      }
      if (addToCartProduct) {
        // Remove trailing 'to the cart', 'to cart', 'please', etc. if present
        let productName = addToCartProduct.trim();
        productName = productName.replace(/\s*to( the)? cart.*/g, '').replace(/\s*please$/g, '').trim();
        // Fuzzy match in mockProducts (substring, case-insensitive)
        let product = this.mockProducts.find(
          p => p.product_name.toLowerCase() === productName.toLowerCase()
        );
        if (!product) {
          product = this.mockProducts.find(
            p => p.product_name.toLowerCase().includes(productName.toLowerCase())
          );
        }
        // Try plural (remove trailing 's')
        if (!product && productName.endsWith('s')) {
          const singular = productName.slice(0, -1);
          product = this.mockProducts.find(
            p => p.product_name.toLowerCase().includes(singular.toLowerCase())
          );
        }
        // Try common synonyms (simple mapping)
        const synonyms: Record<string, string[]> = {
          "chips": ["potato chips", "lays"],
          "coke": ["coca-cola"],
          "detergent": ["tide"],
          // Add more as needed
        };
        if (!product && synonyms[productName.toLowerCase()]) {
          for (const syn of synonyms[productName.toLowerCase()]) {
            product = this.mockProducts.find(
              p => p.product_name.toLowerCase().includes(syn)
            );
            if (product) break;
          }
        }
        // If still not found, search user's purchase history
        if (!product) {
          const { data: purchases } = await supabase
            .from("purchase_history")
            .select("*")
            .eq("user_id", userId);
          if (purchases && purchases.length > 0) {
            product = purchases.find(
              p => p.product_name.toLowerCase() === productName.toLowerCase()
            ) || purchases.find(
              p => p.product_name.toLowerCase().includes(productName.toLowerCase())
            );
            // Try plural
            if (!product && productName.endsWith('s')) {
              const singular = productName.slice(0, -1);
              product = purchases.find(
                p => p.product_name.toLowerCase().includes(singular.toLowerCase())
              );
            }
            // Try synonyms
            if (!product && synonyms[productName.toLowerCase()]) {
              for (const syn of synonyms[productName.toLowerCase()]) {
                product = purchases.find(
                  p => p.product_name.toLowerCase().includes(syn)
                );
                if (product) break;
              }
            }
          }
        }
        if (product) {
          return new Response(JSON.stringify({ type: "add_to_cart", product }), { headers: { "Content-Type": "application/json" } });
        } else {
          return new Response(JSON.stringify({ 
            type: "product_not_available", 
            productName: productName,
            message: `Sorry, ${productName} is not available in our products.`
          }), { headers: { "Content-Type": "application/json" } });
        }
      }

      // Intent: Remove from cart (flexible matching)
      const removeFromCartMatch = lowerMsg.match(/(?:please |can you )?remove (.+?) from (my )?cart|(?:please |can you )?remove (.+)$/);
      let removeFromCartProduct = null;
      if (removeFromCartMatch) {
        removeFromCartProduct = removeFromCartMatch[1] || removeFromCartMatch[3];
      }
      if (removeFromCartProduct) {
        const productName = removeFromCartProduct.trim();
        // Fuzzy match in mockProducts (substring, case-insensitive)
        let product = this.mockProducts.find(
          p => p.product_name.toLowerCase() === productName.toLowerCase()
        );
        if (!product) {
          product = this.mockProducts.find(
            p => p.product_name.toLowerCase().includes(productName.toLowerCase())
          );
        }
        // Try plural (remove trailing 's')
        if (!product && productName.endsWith('s')) {
          const singular = productName.slice(0, -1);
          product = this.mockProducts.find(
            p => p.product_name.toLowerCase().includes(singular.toLowerCase())
          );
        }
        // Try common synonyms (simple mapping)
        const synonyms: Record<string, string[]> = {
          "chips": ["potato chips", "lays"],
          "coke": ["coca-cola"],
          "detergent": ["tide"],
          // Add more as needed
        };
        if (!product && synonyms[productName.toLowerCase()]) {
          for (const syn of synonyms[productName.toLowerCase()]) {
            product = this.mockProducts.find(
              p => p.product_name.toLowerCase().includes(syn)
            );
            if (product) break;
          }
        }
        // If still not found, search user's purchase history
        if (!product) {
          const { data: purchases } = await supabase
            .from("purchase_history")
            .select("*")
            .eq("user_id", userId);
          if (purchases && purchases.length > 0) {
            product = purchases.find(
              p => p.product_name.toLowerCase() === productName.toLowerCase()
            ) || purchases.find(
              p => p.product_name.toLowerCase().includes(productName.toLowerCase())
            );
            // Try plural
            if (!product && productName.endsWith('s')) {
              const singular = productName.slice(0, -1);
              product = purchases.find(
                p => p.product_name.toLowerCase().includes(singular.toLowerCase())
              );
            }
            // Try synonyms
            if (!product && synonyms[productName.toLowerCase()]) {
              for (const syn of synonyms[productName.toLowerCase()]) {
                product = purchases.find(
                  p => p.product_name.toLowerCase().includes(syn)
                );
                if (product) break;
              }
            }
          }
        }
        if (product) {
          return new Response(JSON.stringify({ type: "remove_from_cart", product }), { headers: { "Content-Type": "application/json" } });
        } else {
          return new Response(JSON.stringify({ 
            type: "product_not_available", 
            productName: productName,
            message: `Sorry, ${productName} is not available in our products.`
          }), { headers: { "Content-Type": "application/json" } });
        }
      }

      // Intent: Checkout (e.g., "Checkout", "Place my order")
      if (lowerMsg === "checkout" || lowerMsg === "place my order" || lowerMsg === "place order") {
        return new Response(JSON.stringify({ type: "checkout" }), { headers: { "Content-Type": "application/json" } });
      }

      // Intent: Add to favorites (e.g., "Add milk to my favorites")
      const addFavMatch = lowerMsg.match(/^add (.+) to my favorites?$/);
      if (addFavMatch) {
        const productName = addFavMatch[1];
        return await this.addFavoriteByName(userId, productName);
      }

      // Intent: Remove from favorites (e.g., "Remove milk from my favorites")
      const removeFavMatch = lowerMsg.match(/^remove (.+) from my favorites?$/);
      if (removeFavMatch) {
        const productName = removeFavMatch[1];
        return await this.removeFavoriteByName(userId, productName);
      }

      // Intent: Show favorites
      if (lowerMsg.includes("show my favorites")) {
        return await this.showFavorites(userId);
      }

      // Intent: Show cart contents
      if (
        lowerMsg.includes("show my cart") ||
        lowerMsg.includes("what's in my cart") ||
        lowerMsg.includes("cart contents") ||
        lowerMsg.includes("my cart")
      ) {
        // Fetch cart from persistent storage
        const { data: items, error } = await supabase
          .from("cart_items")
          .select("*")
          .eq("user_id", userId);
        if (error) {
          return new Response(JSON.stringify({ type: "cart_contents", error: error.message }), { headers: { "Content-Type": "application/json" } });
        }
        return new Response(JSON.stringify({ type: "cart_contents", items: items || [] }), { headers: { "Content-Type": "application/json" } });
      }

      // Intent: Set preference (e.g., "Set my preference to organic")
      const setPrefMatch = lowerMsg.match(/^set my preference to (.+)$/);
      if (setPrefMatch) {
        const preference = setPrefMatch[1];
        return await this.setPreference(userId, preference);
      }

      // Intent: Find product (e.g., "Find Milk", "Find milk for me", "Find milk please")
      const findMatch = lowerMsg.match(/^find (.+?)( for me| please|$)/);
      if (findMatch) {
        const productName = findMatch[1].trim();
        return this.handleProductSearch(userId, productName);
      }

      // Intent: Weekly Deals
      if (lowerMsg.includes("weekly deals")) {
        const deals = await this.generateWeeklyDeals(userId, detectedMood || undefined);
        // Return as a string for streaming compatibility
        return new Response(JSON.stringify({ type: "weekly_deals", deals }), { headers: { "Content-Type": "application/json" } });
      }

      // Intent: Order History
      if (lowerMsg.includes("order history")) {
        const { data: orders } = await supabase
          .from("purchase_history")
          .select("*")
          .eq("user_id", userId)
          .order("purchase_date", { ascending: false })
          .limit(10);
        return new Response(JSON.stringify({ type: "order_history", orders }), { headers: { "Content-Type": "application/json" } });
      }

      // Intent: Recipe Ideas
      if (lowerMsg.includes("recipe idea")) {
        // For now, fallback to LLM but could be routed to a recipe API
        // Optionally, add a specialized handler here
      }

      // Default: Fallback to LLM
      // Get user context
      const { data: userProfile } = await supabase.from("user_profiles").select("*").eq("id", userId).single();
      const { data: recentPurchases } = await supabase
        .from("purchase_history")
        .select("*")
        .eq("user_id", userId)
        .order("purchase_date", { ascending: false })
        .limit(10);

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
      `;

      const streamResult = await streamText({
        model: this.model,
        system: systemPrompt,
        messages: [...conversationHistory, { role: "user", content: message }],
      });

      // Use the textStream property to get only the text chunks
      const textStream = new ReadableStream({
        async start(controller) {
          for await (const chunk of streamResult.textStream) {
            controller.enqueue(new TextEncoder().encode(chunk));
          }
          controller.close();
        },
      });
      return new Response(textStream);
    } catch (error) {
      console.error("Error in chat query:", error);
      throw error;
    }
  }

  async handleGeneralChat(userId: string, message: string, conversationHistory: any[]) {
    // Fetch user context
    const { data: userProfile, error: userProfileError } = await supabase.from("user_profiles").select("*").eq("id", userId).single();
    const { data: recentPurchases, error: purchasesError } = await supabase
      .from("purchase_history")
      .select("*")
      .eq("user_id", userId)
      .order("purchase_date", { ascending: false })
      .limit(10);

    // Use safe defaults if data is missing
    const safeUserProfile = userProfile || {};
    const safeRecentPurchases = recentPurchases || [];

    const systemPrompt = `
      You are Walmart's SmartPredict AI assistant. You help users with:
      - Product recommendations
      - Price comparisons
      - Shopping list suggestions
      - Nutritional information
      - Recipe ideas based on purchases
      - Order placement and tracking

      You can also answer general questions, greet users, and explain your capabilities.

      User Context:
      Profile: ${JSON.stringify(safeUserProfile)}
      Recent Purchases: ${JSON.stringify(safeRecentPurchases)}

      Be helpful, friendly, and concise. Always prioritize Walmart products and services.
      Keep responses under 100 words unless specifically asked for detailed information.
    `;

    try {
      return streamText({
        model: this.model,
        system: systemPrompt,
        messages: [...conversationHistory, { role: "user", content: message }],
      });
    } catch (error) {
      console.error("Error in LLM fallback:", error);
      return new Response(
        JSON.stringify({ type: "error", message: "Sorry, I'm having trouble responding right now. Please try again later." }),
        { headers: { "Content-Type": "application/json" }, status: 500 }
      );
    }
  }

  // Add a simple product search handler
  // Add a mock product catalog for fallback search
  mockProducts = [
    { id: "cheetos-1", product_name: "Cheetos", product_category: "Snacks", price: 2.49, image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop&crop=center", },
    { id: "lays-1", product_name: "Lay's Potato Chips", product_category: "Snacks", price: 2.98, image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=200&h=200&fit=crop&crop=center", },
    { id: "milk-1", product_name: "Whole Milk", product_category: "Dairy", price: 3.68, image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop&crop=center", },
    { id: "bread-1", product_name: "Wonder Bread", product_category: "Bakery", price: 1.98, image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop&crop=center", },
    { id: "eggs-1", product_name: "Fresh Eggs", product_category: "Dairy", price: 2.78, image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=200&h=200&fit=crop&crop=center", },
    { id: "coffee-1", product_name: "Coffee Beans", product_category: "Beverages", price: 8.98, image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=200&h=200&fit=crop&crop=center", },
    { id: "coke-1", product_name: "Coca-Cola 12-pack", product_category: "Beverages", price: 4.98, image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop&crop=center", },
    { id: "tide-1", product_name: "Tide Laundry Detergent", product_category: "Household", price: 12.97, image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=200&h=200&fit=crop&crop=center", },
    { id: "bananas-1", product_name: "Great Value Organic Bananas", product_category: "Produce", price: 2.48, image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=200&h=200&fit=crop&crop=center", },
    { id: "cheerios-1", product_name: "Honey Nut Cheerios", product_category: "Breakfast", price: 4.98, image: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=200&h=200&fit=crop&crop=center", },
    { id: "iphone-16", product_name: "iPhone 16", product_category: "Electronics", price: 999.99, image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200&h=200&fit=crop&crop=center" },
  ];
  async handleProductSearch(userId: string, productName: string) {
    // Search purchase history for the product
    const { data: purchases } = await supabase
      .from("purchase_history")
      .select("*")
      .eq("user_id", userId)
      .ilike("product_name", `%${productName}%`)
      .order("purchase_date", { ascending: false });

    // If found, return the most recent purchase
    if (purchases && purchases.length > 0) {
      return new Response(
        JSON.stringify({ type: "product_search", result: purchases[0] }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // 2. Search mock product catalog
    const product = this.mockProducts.find(p => p.product_name.toLowerCase().includes(productName.toLowerCase()));
    if (product) {
      return new Response(
        JSON.stringify({ type: "product_search", result: product }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // If not found, return not available message
    return new Response(
      JSON.stringify({ 
        type: "product_not_available", 
        productName: productName,
        message: `Sorry, ${productName} is not available in our products.`
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  async generateWeeklyDeals(userId: string, mood?: string) {
    try {
      const { data: userProfile } = await supabase.from("user_profiles").select("*").eq("id", userId).single()
      const { data: purchaseHistory } = await supabase.from("purchase_history").select("*").eq("user_id", userId)
      // Fetch user favorites
      const { data: favoritesRows } = await supabase
        .from("favorites")
        .select("product_id")
        .eq("user_id", userId)
      const favoriteProductIds = favoritesRows ? favoritesRows.map(row => row.product_id) : [];
      const favoriteProducts = (purchaseHistory || []).filter(p => favoriteProductIds.includes(p.id));

      const prompt = `
      Generate personalized weekly deals for this Walmart customer.
      
      User Profile: ${JSON.stringify(userProfile)}
      Location: ${userProfile?.location || "unknown"}
      Preferences: ${JSON.stringify(userProfile?.shopping_preferences || [])}
      Dietary Restrictions: ${JSON.stringify(userProfile?.dietary_restrictions || [])}
      Favorites: ${JSON.stringify(favoriteProducts)}
      Purchase History: ${JSON.stringify(purchaseHistory)}
      Mood: ${mood || "not specified"}
      
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
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=80&h=80&fit=crop&crop=center",
          deal_reason: "Popular choice",
        },
        {
          id: 2,
          name: "Lay's Potato Chips",
          originalPrice: 4.48,
          salePrice: 2.98,
          savings: 1.5,
          image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=80&h=80&fit=crop&crop=center",
          deal_reason: "Great snack deal",
        },
      ]
    }
  }

  async getSmartSuggestions(userId: string) {
    // Get the user's most recent purchase
    const { data: recentPurchases } = await supabase
      .from("purchase_history")
      .select("product_name, purchase_date")
      .eq("user_id", userId)
      .order("purchase_date", { ascending: false })
      .limit(3);
    if (!recentPurchases || recentPurchases.length === 0) {
      return null;
    }
    // Try to find accessories for any of the recent purchases
    for (const purchase of recentPurchases) {
      const { data: accessories } = await supabase
        .from("product_accessories")
        .select("accessory_name, image_url, price")
        .eq("anchor_product_name", purchase.product_name);
      if (accessories && accessories.length > 0) {
        return {
          anchor: purchase.product_name,
          message: `You bought a ${purchase.product_name} recently. Here are some products to enhance your experience even better.`,
          accessories,
        };
      }
    }
    return null;
  }

  // Add a favorite product by name (searches purchase history for product name)
  async addFavoriteByName(userId: string, productName: string) {
    // Find product in purchase history
    const { data: purchases } = await supabase
      .from("purchase_history")
      .select("id, product_name")
      .eq("user_id", userId)
      .ilike("product_name", `%${productName}%`)
      .order("purchase_date", { ascending: false });
    if (!purchases || purchases.length === 0) {
      return new Response(JSON.stringify({ 
        type: "product_not_available", 
        productName: productName,
        message: `Sorry, ${productName} is not available in our products.`
      }), { headers: { "Content-Type": "application/json" } });
    }
    const productId = purchases[0].id;
    // Add to favorites
    await supabase.from("favorites").upsert({ user_id: userId, product_id: productId });
    return new Response(`${purchases[0].product_name} has been added to your favorites!`, { status: 200 });
  }

  // Remove a favorite product by name
  async removeFavoriteByName(userId: string, productName: string) {
    // Find product in purchase history
    const { data: purchases } = await supabase
      .from("purchase_history")
      .select("id, product_name")
      .eq("user_id", userId)
      .ilike("product_name", `%${productName}%`)
      .order("purchase_date", { ascending: false });
    if (!purchases || purchases.length === 0) {
      return new Response(JSON.stringify({ 
        type: "product_not_available", 
        productName: productName,
        message: `Sorry, ${productName} is not available in our products.`
      }), { headers: { "Content-Type": "application/json" } });
    }
    const productId = purchases[0].id;
    // Remove from favorites
    await supabase.from("favorites").delete().eq("user_id", userId).eq("product_id", productId);
    return new Response(`${purchases[0].product_name} has been removed from your favorites.`, { status: 200 });
  }

  // Show all favorite products for the user
  async showFavorites(userId: string) {
    // Get favorite product IDs
    const { data: favoritesRows } = await supabase
      .from("favorites")
      .select("product_id")
      .eq("user_id", userId);
    const favoriteProductIds = favoritesRows ? favoritesRows.map(row => row.product_id) : [];
    if (favoriteProductIds.length === 0) {
      return new Response("You have no favorite products yet.", { status: 200 });
    }
    // Get product details
    const { data: products } = await supabase
      .from("purchase_history")
      .select("product_name, product_category, price, purchase_date")
      .in("id", favoriteProductIds);
    if (!products || products.length === 0) {
      return new Response("You have no favorite products yet.", { status: 200 });
    }
    const list = products.map(p => `- ${p.product_name} (${p.product_category}, $${p.price})`).join("\n");
    return new Response(`Your favorite products:\n${list}`, { status: 200 });
  }

  // Set a shopping preference
  async setPreference(userId: string, preference: string) {
    // Get current preferences
    const { data: userProfile } = await supabase.from("user_profiles").select("shopping_preferences").eq("id", userId).single();
    let prefs = userProfile?.shopping_preferences || [];
    if (!prefs.includes(preference)) {
      prefs = [...prefs, preference];
      await supabase.from("user_profiles").update({ shopping_preferences: prefs }).eq("id", userId);
    }
    return new Response(`Your preference for '${preference}' has been saved.`, { status: 200 });
  }
}

export const smartPredictAI = new SmartPredictAI()
