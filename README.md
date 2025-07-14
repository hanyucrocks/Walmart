# Walmart SmartPredict

**AI-powered personalized shopping assistant**

Prototype Link - [Link to the website](https://walmart-smartpredict.vercel.app/)


---

## Highlighted Features

### 🚀 Smart Suggestions
Get real-time, AI-powered product recommendations and shopping insights tailored to your preferences, purchase history, and current needs. The Smart Suggestions engine proactively surfaces what you might want to buy next, restock, or discover—making your shopping experience faster and more relevant.

### 🗣️ Voice-driven AI Chatbot — SmartPredict Assistant
Interact with the SmartPredict Assistant using natural language—either by typing or speaking! The voice-enabled chatbot helps you find products, check prices, manage your cart, and place orders, all through conversational AI. Enjoy hands-free, intelligent shopping assistance right in your browser.

---

## Overview

Walmart SmartPredict is a full-stack, AI-powered shopping assistant web application that delivers a personalized, efficient, and interactive Walmart shopping experience. It leverages user data and advanced AI to provide smart product recommendations, restock predictions, shopping list suggestions, and conversational assistance—all in a modern, responsive UI.

---

## Features

- **🚀 Smart Suggestions:** Real-time, AI-powered recommendations and insights based on your shopping behavior and preferences.
- **🗣️ Voice-driven AI Chatbot (SmartPredict Assistant):** Chat or speak with the assistant for hands-free, intelligent shopping help.
- **Personalized Recommendations:** AI-driven suggestions based on your purchase history, preferences, and favorites.
- **Restock Predictions:** Proactive reminders for items you may need to reorder soon.
- **Weekly Deals:** Surfaced deals tailored to your interests.
- **Smart Cart & Checkout:** Add, remove, and update items in your cart, then check out with a single click.
- **Modern UI:** Built with Next.js, React, Tailwind CSS, and Radix UI for a seamless experience.

---

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI, Framer Motion
- **Backend:** Next.js API routes, Supabase (PostgreSQL)
- **AI:** [@ai-sdk/xai](https://www.npmjs.com/package/@ai-sdk/xai) (Grok-2 model)
- **Database:** Supabase (PostgreSQL)
- **Other:** React Hook Form, Zod, Lucide Icons, Sonner, Embla Carousel

---

## Getting Started

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Walmart
```

### 2. Install dependencies
```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Set up environment variables
Create a `.env.local` file in the root directory with the following:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Set up the database
- Create a new project in [Supabase](https://supabase.com/).
- Run the SQL in [`scripts/setup-database.sql`](scripts/setup-database.sql) in the Supabase SQL editor to create tables and seed sample data.

### 5. Run the development server
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```
Visit [http://localhost:3000](http://localhost:3000) to view the app.

---

## Usage

- **Home:** Personalized dashboard with recommendations, predictions, deals, and quick reorder.
- **Chat Assistant:** Click the chat icon to ask for product help, price checks, or order placement. Try voice input for hands-free assistance.
- **Cart:** Add/remove/update items, then proceed to checkout.
- **Profile:** View and manage your preferences and favorites.

---

## API Endpoints

All API routes are under `/api/`:

- `POST /api/chat` — Conversational AI assistant
  - Body: `{ userId, message, conversationHistory }`
- `GET /api/recommendations?userId=...` — Get smart product suggestions
- `GET /api/predictions?userId=...` — Get restock predictions
- `GET /api/weekly-deals?userId=...` — Get weekly deals
- `GET /api/search?query=...` — Search for products
- `GET /api/cart?userId=...` — Get cart items
- `POST /api/cart` — Add/remove/clear items in cart
  - Body: `{ action: "add"|"remove"|"clear", userId, item }`
- `POST /api/checkout` — Place an order
  - Body: `{ userId, cartItems }`

---

## Database Schema

See [`scripts/setup-database.sql`](scripts/setup-database.sql) for full schema. Key tables:
- `user_profiles` — User info and preferences
- `purchase_history` — Track purchases
- `ai_insights` — Store AI recommendations/predictions
- `favorites` — User favorites
- `orders` — Order records
- `cart_items` — Shopping cart contents

---

## Project Structure

```
Walmart/
  app/           # Next.js app directory (pages, API routes)
  components/    # Reusable UI components
  contexts/      # React context providers (e.g., cart)
  hooks/         # Custom React hooks
  lib/           # AI service, Supabase client, utilities
  public/        # Static assets (images, logo)
  scripts/       # Database setup scripts
  styles/        # Global styles
```

---

## Contributions and Acknowledgements

- Shreelekha for the Voice driven implementation.
- Mansi for the UI/UX design.
- Nikhil for the database-backend Linking.

Thank you to Walmart, for giving this amazing opportunity.

- Team What-If
