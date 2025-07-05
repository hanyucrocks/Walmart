"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Search, Home, User, Plus, Clock, Zap, Star, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChatAssistant } from "@/components/chat-assistant"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { ToastContainer } from "@/components/toast"

export default function WalmartSmartPredict() {
  const [activeTab, setActiveTab] = useState("home")
  const { state: cartState, addToCart } = useCart()
  const { toasts, addToast, removeToast } = useToast()

  // Real user data
  const [user, setUser] = useState({
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Sarah",
  })

  const [recommendations, setRecommendations] = useState([])
  const [predictions, setPredictions] = useState([])
  const [weeklyDealsData, setWeeklyDealsData] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch AI-powered data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [recsRes, predsRes, dealsRes] = await Promise.all([
          fetch(`/api/recommendations?userId=${user.id}`),
          fetch(`/api/predictions?userId=${user.id}`),
          fetch(`/api/weekly-deals?userId=${user.id}`),
        ])

        if (recsRes.ok) {
          const recsData = await recsRes.json()
          setRecommendations(recsData.recommendations || [])
        }

        if (predsRes.ok) {
          const predsData = await predsRes.json()
          setPredictions(predsData.predictions || [])
        }

        if (dealsRes.ok) {
          const dealsData = await dealsRes.json()
          setWeeklyDealsData(dealsData.weeklyDeals || [])
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching AI data:", error)
        // Set fallback data
        setRecommendations([
          {
            id: "1",
            name: "Great Value Organic Bananas",
            price: 2.48,
            image: "/placeholder.svg?height=120&width=120",
            confidence: 95,
            reason: "You buy these every week",
          },
          {
            id: "2",
            name: "Tide Laundry Detergent",
            price: 12.97,
            image: "/placeholder.svg?height=120&width=120",
            confidence: 88,
            reason: "Based on your purchase history",
          },
        ])
        setPredictions([
          {
            item: "Toilet Paper",
            daysLeft: 3,
            confidence: "High",
            action: "Order now for delivery tomorrow",
          },
          {
            item: "Dog Food",
            daysLeft: 5,
            confidence: "Medium",
            action: "Add to your next order",
          },
        ])
        setWeeklyDealsData([
          {
            id: "3",
            name: "Coca-Cola 12-pack",
            originalPrice: 6.98,
            salePrice: 4.98,
            savings: 2.0,
            image: "/placeholder.svg?height=80&width=80",
          },
          {
            id: "4",
            name: "Lay's Potato Chips",
            originalPrice: 4.48,
            salePrice: 2.98,
            savings: 1.5,
            image: "/placeholder.svg?height=80&width=80",
          },
        ])
        setLoading(false)
      }
    }

    fetchData()
  }, [user.id])

  // Quick reorder items with functionality
  const quickReorderItems = [
    { id: "qr1", name: "Milk", price: 3.68, lastOrdered: "3 days ago", image: "/placeholder.svg?height=60&width=60" },
    { id: "qr2", name: "Bread", price: 1.98, lastOrdered: "5 days ago", image: "/placeholder.svg?height=60&width=60" },
    { id: "qr3", name: "Eggs", price: 2.78, lastOrdered: "1 week ago", image: "/placeholder.svg?height=60&width=60" },
    {
      id: "qr4",
      name: "Coffee",
      price: 8.98,
      lastOrdered: "2 weeks ago",
      image: "/placeholder.svg?height=60&width=60",
    },
  ]

  const handleAddToCart = (item: any, source: string) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.salePrice || item.price,
      image: item.image,
    })

    addToast({
      type: "success",
      title: "Added to cart!",
      description: `${item.name} has been added to your cart.`,
    })

    // Track the action (you could send this to analytics)
    console.log(`Added ${item.name} to cart from ${source}`)
  }

  const handlePredictionAction = (prediction: any) => {
    // Simulate adding predicted item to cart
    addToCart({
      id: `pred-${Date.now()}`,
      name: prediction.item,
      price: Math.random() * 10 + 5, // Random price for demo
      image: "/placeholder.svg?height=60&width=60",
    })

    addToast({
      type: "success",
      title: "Smart prediction added!",
      description: `${prediction.item} has been added to your cart.`,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 max-w-md mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading your personalized experience...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pt-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold">Good morning, {user.name}! 👋</h1>
            <p className="text-blue-100 text-sm">Ready to make shopping smarter?</p>
          </div>
          <div className="relative">
            <ShoppingCart className="w-6 h-6" />
            {cartState.itemCount > 0 && (
              <Badge className="absolute -top-2 -right-2 bg-yellow-400 text-blue-900 text-xs px-1.5 py-0.5">
                {cartState.itemCount}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pb-20 px-4 -mt-2">
        {/* Smart Predictions */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center mb-3">
              <Zap className="w-5 h-5 text-yellow-600 mr-2" />
              <h2 className="font-semibold text-gray-800">Smart Predictions</h2>
            </div>
            {predictions.map((prediction, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-2 border-b border-yellow-100 last:border-b-0"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    You may run out of <span className="font-semibold text-blue-600">{prediction.item}</span> in{" "}
                    {prediction.daysLeft} days
                  </p>
                  <p className="text-xs text-gray-600">{prediction.action}</p>
                </div>
                <Button
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-xs px-3"
                  onClick={() => handlePredictionAction(prediction)}
                >
                  Add to Cart
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Recommended for You</h2>
            <Button variant="ghost" size="sm" className="text-blue-600">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {recommendations.map((product) => (
              <Card key={product.id} className="min-w-[160px] border-0 shadow-md">
                <CardContent className="p-3">
                  <img
                    src={product.image || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-24 object-cover rounded-lg mb-2"
                  />
                  <h3 className="font-medium text-sm text-gray-800 mb-1 line-clamp-2">{product.name}</h3>
                  <p className="text-lg font-bold text-blue-600 mb-1">${product.price}</p>
                  <div className="flex items-center mb-2">
                    <Star className="w-3 h-3 text-yellow-500 mr-1" />
                    <span className="text-xs text-gray-600">{product.confidence}% match</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">{product.reason}</p>
                  <Button
                    size="sm"
                    className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 text-xs"
                    onClick={() => handleAddToCart(product, "recommendations")}
                  >
                    Add to Cart
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Reorder */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Reorder</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickReorderItems.map((item) => (
              <Card key={item.id} className="border-0 shadow-md">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm text-gray-800">{item.name}</h3>
                    <Clock className="w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-sm font-bold text-blue-600 mb-1">${item.price}</p>
                  <p className="text-xs text-gray-500 mb-2">Last: {item.lastOrdered}</p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs border-blue-200 text-blue-600 hover:bg-blue-50 bg-transparent"
                    onClick={() => handleAddToCart(item, "quick-reorder")}
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Reorder
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Weekly Personalized Deals */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Your Weekly Deals</h2>
            <Badge className="bg-yellow-400 text-blue-900">Personalized</Badge>
          </div>
          <div className="space-y-3">
            {weeklyDealsData.map((deal) => (
              <Card key={deal.id} className="border-0 shadow-md">
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={deal.image || "/placeholder.svg"}
                      alt={deal.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm text-gray-800 mb-1">{deal.name}</h3>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-bold text-blue-600">${deal.salePrice}</span>
                        <span className="text-sm text-gray-500 line-through">${deal.originalPrice}</span>
                      </div>
                      <Badge className="bg-green-100 text-green-800 text-xs">Save ${deal.savings}</Badge>
                    </div>
                    <Button
                      size="sm"
                      className="bg-yellow-400 hover:bg-yellow-500 text-blue-900"
                      onClick={() => handleAddToCart(deal, "weekly-deals")}
                    >
                      Add
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around">
          {[
            { id: "home", icon: Home, label: "Home" },
            { id: "search", icon: Search, label: "Search" },
            { id: "cart", icon: ShoppingCart, label: "Cart" },
            { id: "profile", icon: User, label: "Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                addToast({
                  type: "info",
                  title: `${tab.label} selected`,
                  description: `Navigated to ${tab.label} section`,
                })
              }}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === tab.id ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{tab.label}</span>
              {tab.id === "cart" && cartState.itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                  {cartState.itemCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Assistant */}
      <ChatAssistant userId={user.id} userName={user.name} />
    </div>
  )
}
