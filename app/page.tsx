"use client"

import { useEffect, useState } from "react"
import { ShoppingCart, Search, Home, User, Plus, Clock, Zap, Star, ChevronRight, Minus, Trash, Heart, Package, TrendingUp, Award, Settings, LogOut, MapPin, Users, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ChatAssistant } from "@/components/chat-assistant"
import { useCart } from "@/contexts/cart-context"
import { useToast } from "@/hooks/use-toast"
import { ToastContainer } from "@/components/toast"
import { CartModal } from "@/components/chat-assistant";
import { AnimatePresence, motion } from "framer-motion";

// Add types for recommendations, predictions, weeklyDealsData, and quickReorderItems
interface Recommendation {
  id: string;
  name: string;
  price: number;
  image: string;
  confidence: number;
  reason: string;
}

interface Prediction {
  item: string;
  daysLeft: number;
  confidence: string;
  action: string;
}

interface WeeklyDeal {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  savings: number;
  image: string;
}

interface QuickReorderItem {
  id: string;
  name: string;
  price: number;
  lastOrdered: string;
  image: string;
}

export default function WalmartSmartPredict() {
  const [activeTab, setActiveTab] = useState("home")
  const { state: cartState, addToCart, removeFromCart, clearCart, updateQuantity } = useCart()
  const { toasts, addToast, removeToast } = useToast()
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Real user data
  const [user, setUser] = useState({
    id: "550e8400-e29b-41d4-a716-446655440000",
    name: "Sarah",
  })

  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [weeklyDealsData, setWeeklyDealsData] = useState<WeeklyDeal[]>([])
  const [loading, setLoading] = useState(true)
  const [smartSuggestions, setSmartSuggestions] = useState<any>(null)

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
          setSmartSuggestions(recsData.smartSuggestions || null)
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
            image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=120&h=120&fit=crop&crop=center",
            confidence: 95,
            reason: "You buy these every week",
          },
          {
            id: "2",
            name: "Tide Laundry Detergent",
            price: 12.97,
            image: "https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=120&h=120&fit=crop&crop=center",
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
            image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=80&h=80&fit=crop&crop=center",
          },
          {
            id: "4",
            name: "Lay's Potato Chips",
            originalPrice: 4.48,
            salePrice: 2.98,
            savings: 1.5,
            image: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=80&h=80&fit=crop&crop=center",
          },
        ])
        setLoading(false)
      }
    }

    fetchData()
  }, [user.id])

  // Quick reorder items with functionality
  const quickReorderItems: QuickReorderItem[] = [
    { id: "qr1", name: "Milk", price: 3.68, lastOrdered: "3 days ago", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=60&h=60&fit=crop&crop=center" },
    { id: "qr2", name: "Bread", price: 1.98, lastOrdered: "5 days ago", image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=60&h=60&fit=crop&crop=center" },
    { id: "qr3", name: "Eggs", price: 2.78, lastOrdered: "1 week ago", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=60&h=60&fit=crop&crop=center" },
    {
      id: "qr4",
      name: "Coffee",
      price: 8.98,
      lastOrdered: "2 weeks ago",
      image: "https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=60&h=60&fit=crop&crop=center",
    },
  ]

  const handleAddToCart = async (item: any, source: string) => {
    const id = item.id || `${item.name || item.product_name}`;
    const name = item.name || item.product_name || 'Unnamed Product';
    const price = typeof item.salePrice === 'number' ? item.salePrice : (typeof item.price === 'number' ? item.price : undefined);
    const image = typeof item.image === 'string' ? item.image : undefined;
    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
      addToast({
        type: "error",
        title: "Invalid product",
        description: `Cannot add '${name}' to cart: missing or invalid price.`,
      });
      return;
    }
    await addToCart({
      id,
      name,
      price,
      image,
    })
    addToast({
      type: "success",
      title: "Added to cart!",
      description: `${name} has been added to your cart.`,
    })
    // Track the action (you could send this to analytics)
    console.log(`Added ${name} to cart from ${source}`)
  }

  const handlePredictionAction = async (prediction: any) => {
    // Simulate adding predicted item to cart
    // Use a deterministic id and price for SSR consistency
    const deterministicId = `pred-${prediction.item.replace(/\s+/g, '-').toLowerCase()}`;
    const deterministicPrice = 9.99; // Use a fixed price for demo
    const name = prediction.item || 'Unnamed Product';
    const image = "/placeholder.svg?height=60&width=60";
    await addToCart({
      id: deterministicId,
      name,
      price: deterministicPrice,
      image,
    })

    addToast({
      type: "success",
      title: "Smart prediction added!",
      description: `${name} has been added to your cart.`,
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

  // Add CartPage placeholder
  function CartPage() {
    const items = cartState.items || [];
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    const handleCheckout = async () => {
      if (!user.id || items.length === 0) return;
      setIsCheckingOut(true);
      setToast(null);
      try {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, cartItems: items }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          await clearCart();
          setToast({ type: 'success', message: 'Order placed successfully!' });
          // Optionally refresh Smart Suggestions/order history here
        } else {
          setToast({ type: 'error', message: data.error || 'Checkout failed.' });
        }
      } catch (err) {
        setToast({ type: 'error', message: 'Checkout failed. Please try again.' });
      } finally {
        setIsCheckingOut(false);
      }
    };

    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4">Your Cart</h2>
        {toast && (
          <div className={`my-2 text-center rounded p-2 ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{toast.message}</div>
        )}
        {items.length === 0 ? (
          <div className="text-center text-gray-500 py-8">Your cart is empty.</div>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id || (item.name + '-' + item.price)} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-3">
                  <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-12 h-12 rounded" />
                  <div>
                    <div className="font-medium">{item.name}</div>
                    <div className="text-xs text-gray-500">${item.price.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><Minus /></Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus /></Button>
                  <Button size="icon" variant="ghost" onClick={() => removeFromCart(item.id)}><Trash /></Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-4">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={clearCart}>Clear Cart</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={items.length === 0 || isCheckingOut} onClick={handleCheckout}>{isCheckingOut ? 'Processing...' : 'Checkout'}</Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  function SearchTab({
    recommendations,
    weeklyDealsData,
    quickReorderItems,
    onAddToCart,
  }: {
    recommendations: Recommendation[];
    weeklyDealsData: WeeklyDeal[];
    quickReorderItems: QuickReorderItem[];
    onAddToCart: (item: any, source: string) => void;
  }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
      if (!query.trim()) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const controller = new AbortController();
      fetch(`/api/search?query=${encodeURIComponent(query)}`, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) throw new Error("API error");
          const data = await res.json();
          setResults(data.products || []);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setError("Failed to fetch search results. Showing local results.");
          // Fallback to local search
          const q = query.toLowerCase();
          const recs = recommendations.filter((item) => item.name.toLowerCase().includes(q));
          const deals = weeklyDealsData.filter((item) => item.name.toLowerCase().includes(q));
          const quick = quickReorderItems.filter((item) => item.name.toLowerCase().includes(q));
          setResults([
            ...recs.map((item) => ({ ...item, _type: "recommendation" })),
            ...deals.map((item) => ({ ...item, _type: "deal" })),
            ...quick.map((item) => ({ ...item, _type: "quick" })),
          ]);
          setLoading(false);
        });
      return () => controller.abort();
    }, [query, recommendations, weeklyDealsData, quickReorderItems]);

    return (
      <div className="p-4">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Search className="w-6 h-6 text-blue-600" />
          Search
        </h2>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            className="w-full border rounded-md pl-10 pr-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search for products, deals, or past items..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {loading && <div className="text-center text-gray-400 py-4">Searching...</div>}
        {error && <div className="text-center text-red-500 py-2 text-sm">{error}</div>}
        {query.trim() && !loading && (
          <>
            {results.length === 0 ? (
              <div className="text-center text-gray-500 py-8">No results found.</div>
            ) : (
              <div className="space-y-4">
                {results.map((item) => (
                  <div key={item.id + (item._type || "api")}
                    className="flex items-center justify-between border-b pb-2">
                    <div className="flex items-center gap-3">
                      <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-12 h-12 rounded" />
                      <div>
                        <div className="font-medium">{item.name || item.product_name}</div>
                        {item.price && <div className="text-xs text-gray-500">${item.price.toFixed(2)}</div>}
                        {item.originalPrice && (
                          <div className="text-xs text-gray-500 line-through">${item.originalPrice.toFixed(2)}</div>
                        )}
                        {item.lastOrdered && (
                          <div className="text-xs text-gray-400">Last ordered: {item.lastOrdered}</div>
                        )}
                      </div>
                    </div>
                    <Button size="sm" onClick={() => onAddToCart(item, item._type || "api")}>Add to Cart</Button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  function ProfileTab() {
    // Mock user data
    const user = {
      name: "Sarah Johnson",
      email: "sarah.johnson@email.com",
      avatar: "/placeholder-user.jpg",
      location: "San Francisco, CA",
      preferences: ["Organic", "Vegetarian"],
      dietary: ["Nut-free"],
      householdSize: 3,
    };
    const favorites = [
      { id: "1", name: "Milk", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=60&h=60&fit=crop&crop=center" },
      { id: "2", name: "Eggs", image: "https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=60&h=60&fit=crop&crop=center" },
    ];
    const recentOrders = [
      { id: "o1", name: "Bread", date: "2024-07-01", price: 1.98 },
      { id: "o2", name: "Coffee", date: "2024-06-28", price: 8.98 },
    ];
    const aiInsights = [
      "You may need to restock milk soon.",
      "Great deal on organic bananas this week!",
    ];
    return (
      <div className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative">
            <img src={user.avatar} alt={user.name} className="w-16 h-16 rounded-full border-2 border-blue-200" />
            <div className="absolute -bottom-1 -right-1 bg-green-500 w-4 h-4 rounded-full border-2 border-white"></div>
          </div>
          <div>
            <div className="font-bold text-lg flex items-center gap-2">
              {user.name}
              <Award className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-gray-500 text-sm flex items-center gap-1">
              <User className="w-3 h-3" />
              {user.email}
            </div>
            <div className="text-gray-400 text-xs flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {user.location}
            </div>
          </div>
        </div>
        <div className="mb-4">
          <div className="font-semibold mb-1 flex items-center gap-2">
            <Settings className="w-4 h-4 text-blue-600" />
            Preferences
          </div>
          <div className="flex flex-wrap gap-2">
            {user.preferences.map((p) => (
              <span key={p} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                <Star className="w-3 h-3" />
                {p}
              </span>
            ))}
            {user.dietary.map((d) => (
              <span key={d} className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">
                <Heart className="w-3 h-3" />
                {d}
              </span>
            ))}
          </div>
          <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Household size: {user.householdSize}
          </div>
        </div>
        <div className="mb-4">
          <div className="font-semibold mb-1 flex items-center gap-2">
            <Heart className="w-4 h-4 text-red-500" />
            Favorites
          </div>
          <div className="flex gap-3">
            {favorites.map((item) => (
              <div key={item.id} className="flex flex-col items-center">
                <div className="relative">
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded mb-1 border-2 border-red-200" />
                  <Heart className="w-3 h-3 text-red-500 absolute -top-1 -right-1 bg-white rounded-full" />
                </div>
                <span className="text-xs text-gray-700">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <div className="font-semibold mb-1 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            Recent Orders
          </div>
          <div className="space-y-1">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex justify-between text-sm text-gray-700 items-center">
                <div className="flex items-center gap-2">
                  <Package className="w-3 h-3 text-gray-400" />
                  <span>{order.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">${order.price.toFixed(2)}</span>
                  <span className="text-gray-400 text-xs">{order.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <div className="font-semibold mb-1 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-600" />
            AI Insights
          </div>
          <ul className="list-disc list-inside text-xs text-gray-600">
            {aiInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2">
                <Bell className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </div>
        <button className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded mt-4 flex items-center justify-center gap-2">
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 max-w-md mx-auto relative">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 pt-12">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2">
              <div className="text-blue-600 font-bold text-lg">W</div>
            </div>
            <div>
              <h1 className="text-xl font-semibold">Good morning, {user.name}! 👋</h1>
              <p className="text-blue-100 text-sm">Ready to make shopping smarter?</p>
            </div>
          </div>
          <div className="relative">
            <button onClick={() => setIsCartOpen(true)} className="relative">
              <ShoppingCart className="w-6 h-6" />
              {cartState.itemCount > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-yellow-400 text-blue-900 text-xs px-1.5 py-0.5">
                  {cartState.itemCount}
                </Badge>
              )}
            </button>
          </div>
        </div>
      </div>
      {/* Main Content with animated tab transitions */}
      <div className="pb-20 px-4 -mt-2 min-h-[400px]">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === "cart" ? (
            <motion.div
              key="cart"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              <CartPage />
            </motion.div>
          ) : activeTab === "search" ? (
            <motion.div
              key="search"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              <SearchTab
                recommendations={recommendations}
                weeklyDealsData={weeklyDealsData}
                quickReorderItems={quickReorderItems}
                onAddToCart={handleAddToCart}
              />
            </motion.div>
          ) : activeTab === "profile" ? (
            <motion.div
              key="profile"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              <ProfileTab />
            </motion.div>
          ) : (
            <motion.div
              key="home"
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
            >
              {/* Smart Suggestions */}
              {smartSuggestions && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600" />
                    {smartSuggestions.message}
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {smartSuggestions.accessories.map((acc: any) => (
                      <div key={acc.accessory_name} className="min-w-[120px] bg-white rounded-lg shadow p-2 flex flex-col items-center">
                        <img src={acc.image_url || "/placeholder.svg"} alt={acc.accessory_name} className="w-16 h-16 object-cover rounded mb-2" />
                        <div className="font-medium text-sm text-gray-800 mb-1 text-center">{acc.accessory_name}</div>
                        {acc.price && <div className="text-xs text-blue-600 font-bold mb-1">${acc.price}</div>}
                        <Button size="sm" className="w-full" onClick={() => handleAddToCart(acc, "smart-suggestion")}>Add to Cart</Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Star className="w-5 h-5 text-yellow-500" />
                    Recommended for You
                  </h2>
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
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Quick Reorder
                </h2>
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
                  <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    Your Weekly Deals
                  </h2>
                  <Badge className="bg-yellow-400 text-blue-900 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Personalized
                  </Badge>
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
            </motion.div>
          )}
        </AnimatePresence>
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
                setActiveTab(tab.id);
                // Removed addToast for navigation
              }}
              className={`relative flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${
                activeTab === tab.id ? "text-blue-600 bg-blue-50" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <tab.icon className="w-5 h-5 mb-1" />
              <span className="text-xs">{tab.label}</span>
              {/* Only render badge for cart */}
              {tab.id === "cart" && cartState.itemCount > 0 && (
                <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs px-1 py-0.5 rounded-full min-w-[16px] h-4 flex items-center justify-center">
                  {cartState.itemCount}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>
      {/* Cart Modal (for top-right button only) */}
      <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} userId={user.id} />
      {/* Chat Assistant */}
      <ChatAssistant userId={user.id} userName={user.name} />
    </div>
  )
}
