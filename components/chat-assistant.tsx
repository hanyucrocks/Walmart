"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, Send, X, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useCart } from "@/contexts/cart-context";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Trash, Minus, Plus, ShoppingCart, X as XIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface ChatAssistantProps {
  userId: string
  userName: string
}

// CartModal component
export function CartModal({ isOpen, onClose, userId }: { isOpen: boolean; onClose: () => void; userId: string }) {
  const { state: cartState, addToCart, removeFromCart, clearCart, updateQuantity } = useCart();
  const items = cartState.items || [];
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleCheckout = async () => {
    if (!userId || items.length === 0) return;
    setIsCheckingOut(true);
    setToast(null);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, cartItems: items }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        clearCart();
        setToast({ type: 'success', message: 'Order placed successfully!' });
        setTimeout(() => {
          setToast(null);
          onClose();
        }, 1500);
      } else {
        setToast({ type: 'error', message: data.error || 'Checkout failed.' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Checkout failed. Please try again.' });
    } finally {
      setIsCheckingOut(false);
    }
  };

  useEffect(() => {
    if (toast && toast.type === 'error') {
      setToast(null);
    }
  }, [items.length]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogTitle className="flex items-center justify-between">
          <span>Shopping Cart</span>
          {/* Remove the DialogClose cross button here to avoid duplicate close buttons */}
        </DialogTitle>
        <DialogDescription>
          {items.length === 0 ? (
            <span className="text-center text-gray-500 py-8 block">Your cart is empty.</span>
          ) : (
            "Review and manage your cart items below."
          )}
        </DialogDescription>
        {toast && items.length > 0 && (
          <div className={`my-2 text-center rounded p-2 ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{toast.message}</div>
        )}
        {items.length > 0 && (
          <div className="space-y-4 mt-4">
            {items.map((item) => (
              <div key={item.id || item.name} className="flex items-center justify-between border-b pb-2">
                <div className="flex items-center gap-3">
                  <img src={item.image || "/placeholder.svg"} alt={item.name || 'Unnamed Product'} className="w-12 h-12 rounded" />
                  <div>
                    <div className="font-medium">{item.name || 'Unnamed Product'}</div>
                    <div className="text-xs text-gray-500">${item.price.toFixed(2)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="icon" variant="ghost" onClick={async () => await updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><Minus /></Button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <Button size="icon" variant="ghost" onClick={async () => await updateQuantity(item.id, item.quantity + 1)}><Plus /></Button>
                  <Button size="icon" variant="ghost" onClick={async () => await removeFromCart(item.id)}><Trash /></Button>
                </div>
              </div>
            ))}
            <div className="flex justify-between font-semibold pt-4">
              <span>Subtotal</span>
              <span>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={async () => await clearCart()}>Clear Cart</Button>
              <Button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white" disabled={items.length === 0 || isCheckingOut} onClick={handleCheckout}>{isCheckingOut ? 'Processing...' : 'Checkout'}</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Replace messageIdCounter with a unique ID generator
function generateUniqueId() {
  return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function ChatAssistant({ userId, userName }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateUniqueId(),
      role: "assistant",
      content: `Hi ${userName}! I can help you find products, check prices, or place orders. What can I do for you today?`,
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { addToCart, removeFromCart, clearCart, state: cartState } = useCart();
  const { addToast } = useToast();
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Voice recognition setup
  useEffect(() => {
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
        // Auto-send the message
        setTimeout(() => handleSendMessage(), 100);
      };
      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleMicClick = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: generateUniqueId(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          message: inputValue,
          conversationHistory: messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          })),
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      // Handle single JSON response (commerce intent)
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        const parsed = await response.json();
        if (parsed && typeof parsed === 'object' && parsed.type) {
          if (parsed.type === 'add_to_cart' && parsed.product) {
            const name = parsed.product.name || parsed.product.product_name;
            const price = parsed.product.price;
            if (!name || typeof price !== 'number' || isNaN(price) || price <= 0) {
              addToast({
                type: "error",
                title: "Invalid product",
                description: `Cannot add product: missing or invalid name/price.`,
              });
              setIsLoading(false);
              return;
            }
            await addToCart({
              id: parsed.product.id || name,
              name,
              price,
              image: parsed.product.image,
            });
            addToast({
              type: "success",
              title: "Added to cart",
              description: `${name} has been added to your cart.`,
            });
            setMessages((prev) => [
              ...prev,
              {
                id: generateUniqueId(),
                role: "assistant",
                content: `${name} has been added to the cart!`,
                timestamp: new Date(),
              },
            ]);
            setIsLoading(false);
            return;
          } else if (parsed.type === 'remove_from_cart' && parsed.product) {
            await removeFromCart(parsed.product.id || parsed.product.name);
            addToast({
              type: "success",
              title: "Removed from cart",
              description: `${parsed.product.name} has been removed from your cart.`,
            });
            setIsLoading(false);
            return;
          } else if (parsed.type === 'checkout') {
            if (cartState.items.length > 0) {
              try {
                const response = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId, cartItems: cartState.items }),
                });
                const data = await response.json();
                if (response.ok && data.success) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: generateUniqueId(),
                      role: "assistant",
                      content: "Order has been placed successfully!",
                      timestamp: new Date(),
                    },
                  ]);
                  await clearCart();
                  addToast({
                    type: "success",
                    title: "Checkout complete!",
                    description: `Your order has been placed.`,
                  });
                } else {
                  addToast({
                    type: "error",
                    title: "Checkout failed",
                    description: data.error || "Could not place your order.",
                  });
                }
              } catch (err) {
                addToast({
                  type: "error",
                  title: "Checkout failed",
                  description: "Could not place your order. Please try again.",
                });
              }
            } else {
              addToast({
                type: "error",
                title: "Cart is empty",
                description: `Add items to your cart before checking out.`,
              });
            }
            setIsLoading(false);
            return;
          } else if (parsed.type === 'cart_contents') {
            // Show real cart in chat
            const cartItems = parsed.items || [];
            let cartContent = '';
            if (cartItems.length === 0) {
              cartContent = 'Your cart is empty.';
            } else {
              cartContent = 'Your cart contains:\n' + cartItems.map(function(item: any) { return `- ${item.name} (x${item.quantity})`; }).join('\n');
            }
            setMessages((prev) => [
              ...prev,
              {
                id: generateUniqueId(),
                role: "assistant",
                content: cartContent,
                timestamp: new Date(),
              },
            ]);
            setIsLoading(false);
            return;
          } else if (
            parsed.type === 'product_search' ||
            parsed.type === 'weekly_deals' ||
            parsed.type === 'order_history'
          ) {
            setMessages((prev) => [
              ...prev,
              {
                id: generateUniqueId(),
                role: "assistant",
                content: JSON.stringify(parsed),
                timestamp: new Date(),
              },
            ]);
            setIsLoading(false);
            return;
          } else if (parsed.error) {
            addToast({
              type: "error",
              title: "Commerce Error",
              description: parsed.error,
            });
            setIsLoading(false);
            return;
          }
        }
        // If JSON but not a commerce intent, treat as plain text
        setIsLoading(false);
        return;
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error("No response body")

      let assistantMessage = ""
      const assistantMessageId = generateUniqueId();

      let commerceHandled = false;
      let fullBuffer = "";
      let messageAdded = false;

      // Stream the response
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        let chunk = new TextDecoder().decode(value)
        fullBuffer += chunk;

        // Try to parse as JSON, fallback to plain text
        let parsed = null;
        try {
          parsed = JSON.parse(chunk)
        } catch {}

        // Handle commerce intents
        if (parsed && typeof parsed === 'object' && parsed.type) {
          if (parsed.type === 'add_to_cart' && parsed.product) {
            const name = parsed.product.name || parsed.product.product_name;
            const price = parsed.product.price;
            if (!name || typeof price !== 'number' || isNaN(price) || price <= 0) {
              addToast({
                type: "error",
                title: "Invalid product",
                description: `Cannot add product: missing or invalid name/price.`,
              });
              setIsLoading(false);
              return;
            }
            await addToCart({
              id: parsed.product.id || name,
              name,
              price,
              image: parsed.product.image,
            });
            addToast({
              type: "success",
              title: "Added to cart",
              description: `${name} has been added to your cart.`,
            });
            setMessages((prev) => [
              ...prev,
              {
                id: generateUniqueId(),
                role: "assistant",
                content: `${name} has been added to the cart!`,
                timestamp: new Date(),
              },
            ]);
            commerceHandled = true;
          } else if (parsed.type === 'remove_from_cart' && parsed.product) {
            await removeFromCart(parsed.product.id || parsed.product.name);
            addToast({
              type: "success",
              title: "Removed from cart",
              description: `${parsed.product.name} has been removed from your cart.`,
            });
            commerceHandled = true;
          } else if (parsed.type === 'checkout') {
            if (cartState.items.length > 0) {
              try {
                const response = await fetch("/api/checkout", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId, cartItems: cartState.items }),
                });
                const data = await response.json();
                if (response.ok && data.success) {
                  setMessages((prev) => [
                    ...prev,
                    {
                      id: generateUniqueId(),
                      role: "assistant",
                      content: "Order has been placed successfully!",
                      timestamp: new Date(),
                    },
                  ]);
                  await clearCart();
                  addToast({
                    type: "success",
                    title: "Checkout complete!",
                    description: `Your order has been placed.`,
                  });
                } else {
                  addToast({
                    type: "error",
                    title: "Checkout failed",
                    description: data.error || "Could not place your order.",
                  });
                }
              } catch (err) {
                addToast({
                  type: "error",
                  title: "Checkout failed",
                  description: "Could not place your order. Please try again.",
                });
              }
            } else {
              addToast({
                type: "error",
                title: "Cart is empty",
                description: `Add items to your cart before checking out.`,
              });
            }
            commerceHandled = true;
          } else if (
            parsed.type === 'product_search' ||
            parsed.type === 'weekly_deals' ||
            parsed.type === 'order_history'
          ) {
            setMessages((prev) => [
              ...prev,
              {
                id: generateUniqueId(),
                role: "assistant",
                content: JSON.stringify(parsed),
                timestamp: new Date(),
              },
            ]);
            setIsLoading(false);
            messageAdded = true; // Ensure this is set!
            // DO NOT return here! Let the loop finish.
          } else if (parsed.error) {
            addToast({
              type: "error",
              title: "Commerce Error",
              description: parsed.error,
            });
            commerceHandled = true;
          }
        }

        // If not a commerce or special intent, treat as normal message
        if (!commerceHandled) {
          // Try to parse as JSON for special types (deals, product_search, etc.)
          try {
            const parsedChunk = JSON.parse(chunk);
            if (parsedChunk.content) {
              chunk = parsedChunk.content;
            }
          } catch {}
          assistantMessage += chunk;
          // Only add the message if there is actual content
          if (!messageAdded && assistantMessage.trim().length > 0) {
            setMessages((prev) => [
              ...prev,
              {
                id: assistantMessageId,
                role: "assistant",
                content: assistantMessage,
                timestamp: new Date(),
              },
            ]);
            messageAdded = true;
          } else if (messageAdded) {
            setMessages((prev) =>
              prev.map((msg) => (msg.id === assistantMessageId ? { ...msg, content: assistantMessage } : msg)),
            );
          }
        }
      }

      // After stream ends, if no message was added, try to parse the buffer as JSON for special types
      if (!messageAdded) {
        try {
          const parsed = JSON.parse(fullBuffer);
          if (parsed && typeof parsed === 'object' && (
            parsed.type === 'product_search' ||
            parsed.type === 'weekly_deals' ||
            parsed.type === 'order_history')
          ) {
            setMessages((prev) => [
              ...prev,
              {
                id: generateUniqueId(),
                role: "assistant",
                content: JSON.stringify(parsed),
                timestamp: new Date(),
              },
            ]);
            messageAdded = true; // Ensure this is set!
          }
        } catch {}
      }
      // If still nothing, add a fallback error message
      if (!messageAdded) {
        setMessages((prev) => [
          ...prev,
          {
            id: generateUniqueId(),
            role: "assistant",
            content: "Sorry, I couldn't process your request. Please try again.",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error sending message:", error)
      setMessages((prev) => [
        ...prev,
        {
          id: generateUniqueId(),
          role: "assistant",
          content: "Sorry, I'm having trouble responding right now. Please try again later.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion)
  }

  const suggestions = ["Find milk", "Weekly deals", "Order history", "Recipe ideas"]

  return (
    <div className="fixed bottom-24 right-4 z-50">
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 shadow-lg"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>

      {isOpen && (
        <Card className="absolute bottom-16 right-0 w-80 h-96 border-0 shadow-xl">
          <CardContent className="p-0 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-800">SmartPredict Assistant</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => {
                let dealsContent = null;
                let productContent = null;
                let orderHistoryContent = null;
                // Try to parse as JSON for special types
                let parsed = null;
                try {
                  parsed = typeof message.content === 'string' ? JSON.parse(message.content) : null;
                } catch {}
                if (parsed && parsed.type === 'weekly_deals' && Array.isArray(parsed.deals)) {
                  dealsContent = (
                    <div className="w-full">
                      <div className="font-semibold text-blue-800 mb-2">Weekly Deals</div>
                      <div className="flex flex-col gap-4">
                        {parsed.deals.map((deal: any) => (
                          <div key={deal.id} className="bg-white rounded-xl shadow-md p-3 border border-blue-100 relative flex flex-col items-center">
                            <img src={deal.image || "/placeholder.svg"} alt={deal.name} className="w-16 h-16 object-cover rounded-lg border mb-2" />
                            <div className="flex-1 min-w-0 w-full text-center">
                              <div className="font-semibold text-gray-900 truncate">{deal.name}</div>
                              <div className="flex items-center justify-center gap-2 text-xs mt-1">
                                <span className="text-blue-600 font-bold text-base">${deal.salePrice}</span>
                                <span className="line-through text-gray-400">${deal.originalPrice}</span>
                                <span className="text-green-700 font-semibold">Save ${deal.savings}</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-1 truncate">{deal.deal_reason}</div>
                            </div>
                            {deal.savings > 1.5 && (
                              <span className="absolute top-2 right-2 bg-yellow-300 text-yellow-900 text-xs font-bold px-2 py-0.5 rounded-full shadow">Best Deal</span>
                            )}
                            <Button size="sm" className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white transition" onClick={async () => await addToCart({ id: deal.id, name: deal.name, price: deal.salePrice, image: deal.image })}>Add to Cart</Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                if (parsed && parsed.type === 'product_search' && parsed.result === null) {
                  productContent = (
                    <div className="w-full text-center text-gray-500 py-4">
                      <div className="font-semibold text-red-600 mb-1">Not Found the product you are looking for.</div>
                    </div>
                  );
                }
                if (parsed && parsed.type === 'product_search' && parsed.result) {
                  const p = parsed.result;
                  productContent = (
                    <div className="w-full">
                      <div className="font-semibold text-blue-800 mb-2">Product Found</div>
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow-lg p-4 border border-blue-200 relative flex flex-col items-center">
                        <img src={p.image || "/placeholder.svg"} alt={p.product_name || p.name} className="w-20 h-20 object-cover rounded-lg border-2 border-blue-200 mb-2" />
                        <div className="flex-1 min-w-0 w-full text-center">
                          <div className="font-bold text-lg text-gray-900 truncate">{p.product_name || p.name}</div>
                          <div className="text-xs text-blue-700 font-medium mb-1">{p.product_category || ''}</div>
                          <div className="text-blue-700 font-extrabold text-xl mb-1">${p.price}</div>
                          {p.purchase_date && <div className="text-xs text-gray-400">Last purchased: {new Date(p.purchase_date).toLocaleDateString()}</div>}
                        </div>
                        <Button size="sm" className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white transition shadow" onClick={async () => await addToCart({ id: p.id, name: p.product_name || p.name, price: p.price, image: p.image })}>Add to Cart</Button>
                      </div>
                    </div>
                  );
                }
                if (parsed && parsed.type === 'order_history' && Array.isArray(parsed.orders)) {
                  orderHistoryContent = (
                    <div className="w-full">
                      <div className="font-semibold text-blue-800 mb-2">Order History</div>
                      <div className="flex flex-col gap-4">
                        {parsed.orders.map((order: any) => (
                          <div key={order.id} className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl shadow p-3 border border-blue-200 flex items-center gap-3">
                            <img src={order.image || "/placeholder.svg"} alt={order.product_name} className="w-14 h-14 object-cover rounded-lg border-2 border-blue-200" />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 truncate">{order.product_name}</div>
                              <div className="text-xs text-blue-700 font-medium mb-1">{order.product_category}</div>
                              <div className="text-blue-700 font-extrabold text-lg mb-1">${order.price}</div>
                              <div className="text-xs text-gray-400">Qty: {order.quantity}</div>
                              <div className="text-xs text-gray-400">Purchased: {new Date(order.purchase_date).toLocaleDateString()}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] p-2 rounded-lg text-sm ${
                        message.role === "user" ? "bg-blue-600 text-white" : "bg-blue-50 text-gray-800"
                      }`}
                    >
                      {productContent ? productContent : dealsContent ? dealsContent : orderHistoryContent ? orderHistoryContent : message.content}
                    </div>
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-blue-50 p-2 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex gap-2 mb-2 items-center">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 text-sm"
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isLoading || isListening}
                />
                <Button
                  size="icon"
                  onClick={handleMicClick}
                  className={`bg-blue-50 hover:bg-blue-100 ${isListening ? 'animate-pulse border-2 border-blue-600' : ''}`}
                  aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                  disabled={isLoading}
                >
                  {isListening ? <MicOff className="w-5 h-5 text-blue-600" /> : <Mic className="w-5 h-5 text-blue-600" />}
                </Button>
                <Button
                  size="sm"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || isListening}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="text-xs border-gray-200 text-gray-600 hover:bg-gray-50 bg-transparent"
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
