"use client"

import type React from "react"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import { useEffect, useState } from "react"

interface CartItem {
  id: string // will always be the product name
  name: string
  price: number
  quantity: number
  image?: string
}

interface CartState {
  items: CartItem[]
  total: number
  itemCount: number
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Omit<CartItem, "quantity"> }
  | { type: "REMOVE_ITEM"; payload: string }
  | { type: "UPDATE_QUANTITY"; payload: { id: string; quantity: number } }
  | { type: "CLEAR_CART" }

const CartContext = createContext<{
  state: CartState
  dispatch: React.Dispatch<CartAction>
  addToCart: (item: Omit<CartItem, "quantity">) => void
  removeFromCart: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  loading: boolean;
  error: string | null;
} | null>(null)

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const existingItem = state.items.find((item) => item.name === action.payload.name)
      if (existingItem) {
        const updatedItems = state.items.map((item) =>
          item.name === action.payload.name ? { ...item, quantity: item.quantity + 1 } : item,
        )
        return {
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
          itemCount: updatedItems.reduce((sum, item) => sum + item.quantity, 0),
        }
      }
      const newItems = [...state.items, { ...action.payload, id: action.payload.name, quantity: 1 }]
      return {
        items: newItems,
        total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      }
    }
    case "REMOVE_ITEM": {
      const newItems = state.items.filter((item) => item.name !== action.payload)
      return {
        items: newItems,
        total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      }
    }
    case "UPDATE_QUANTITY": {
      const newItems = state.items
        .map((item) =>
          item.name === action.payload.id ? { ...item, quantity: Math.max(0, action.payload.quantity) } : item,
        )
        .filter((item) => item.quantity > 0)
      return {
        items: newItems,
        total: newItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
        itemCount: newItems.reduce((sum, item) => sum + item.quantity, 0),
      }
    }
    case "CLEAR_CART":
      return {
        items: [],
        total: 0,
        itemCount: 0,
      }
    default:
      return state
  }
}

interface CartProviderProps {
  children: ReactNode;
  userId?: string;
}

export function CartProvider({ children, userId }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    itemCount: 0,
  })
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate cart from backend
  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/cart?userId=${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.items) {
          dispatch({ type: "CLEAR_CART" });
          data.items.forEach((item: any) => {
            dispatch({ type: "ADD_ITEM", payload: {
              id: item.name,
              name: item.name,
              price: Number(item.price),
              image: item.image,
            }});
            if (item.quantity > 1) {
              dispatch({ type: "UPDATE_QUANTITY", payload: { id: item.name, quantity: item.quantity } });
            }
          });
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load cart");
        setLoading(false);
      });
  }, [userId]);

  // Async cart actions with backend sync
  const addToCart = async (item: Omit<CartItem, "quantity">) => {
    dispatch({ type: "ADD_ITEM", payload: { ...item, id: item.name } }); // optimistic
    if (!userId) return;
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "add", userId, item: { ...item, id: undefined } }),
    });
    if (!res.ok) {
      let errorMsg = "Failed to add to cart";
      try {
        const data = await res.json();
        if (data && data.error) errorMsg = data.error;
        // Log the backend error for debugging
        console.error("/api/cart add error:", data);
      } catch (e) {
        // Log raw response if not JSON
        const text = await res.text();
        console.error("/api/cart add error (non-JSON):", text);
      }
      // Rollback
      dispatch({ type: "REMOVE_ITEM", payload: item.name });
      setError(errorMsg);
    }
  };
  const removeFromCart = async (name: string) => {
    const item = state.items.find((i) => i.name === name);
    dispatch({ type: "REMOVE_ITEM", payload: name }); // optimistic
    if (!userId || !item) return;
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", userId, item: { name: item.name } }),
    });
    if (!res.ok) {
      // Rollback
      dispatch({ type: "ADD_ITEM", payload: { ...item, id: item.name } });
      setError("Failed to remove from cart");
    }
  };
  const updateQuantity = async (name: string, quantity: number) => {
    const item = state.items.find((i) => i.name === name);
    if (!item) return;
    dispatch({ type: "UPDATE_QUANTITY", payload: { id: name, quantity } }); // optimistic
    if (!userId) return;
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: quantity > item.quantity ? "add" : "remove", userId, item: { name: item.name, price: item.price, quantity: Math.abs(quantity - item.quantity) } }),
    });
    if (!res.ok) {
      // Rollback
      dispatch({ type: "UPDATE_QUANTITY", payload: { id: name, quantity: item.quantity } });
      setError("Failed to update quantity");
    }
  };

  const clearCart = async () => {
    const prevItems = state.items;
    dispatch({ type: "CLEAR_CART" }); // optimistic
    if (!userId) return;
    const res = await fetch("/api/cart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear", userId }),
    });
    if (!res.ok) {
      // Rollback
      prevItems.forEach((item) => dispatch({ type: "ADD_ITEM", payload: item }));
      setError("Failed to clear cart");
    }
  };

  return (
    <CartContext.Provider
      value={{
        state,
        dispatch,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        loading,
        error,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
