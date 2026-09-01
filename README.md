# 🥘 Hasan's Flavors — Full Restaurant Ecosystem Mobile App

An end-to-end multi-role restaurant application built with **React Native**, **Expo (SDK 57)**, **Expo Router**, and **TypeScript** for **Hasan's Flavors** (100% Halal Certified Pakistani & Indian Cuisine).

---

## 🏛️ System Architecture & The 6 Pillars

This application delivers a unified single-codebase ecosystem covering both customer dining/delivery and back-of-house restaurant operations:

| Pillar | Screen / Module | Route | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **1. 📱 Digital Menu** | Home & Interactive Menu | `/(tabs)` & `/(tabs)/menu` | 57+ Halal dishes, Category pills, Search, Spice filters (Mild to Fiery), Chef picks |
| **2. 🔲 QR Table Ordering** | Dine-In QR Scanner | `/qr-scan` | Simulated QR camera scanner, Table 01–15 selector, Guest party size picker |
| **3. 🛒 Cart & Checkout** | Cart, Checkout & Tracker | `/(tabs)/cart`, `/checkout`, `/track/[id]` | Dine-In/Delivery toggle, Promo codes (`HASAN10`, `HALALFIRST`), GCash/Cash/Card, 4-step live order tracker |
| **4. 🍳 Kitchen Display (KDS)** | Kitchen Orders Board | `/staff/kds` | Real-time Kanban columns (New Orders ➔ Cooking ➔ Ready), Elapsed prep timers, Tap-to-bump status |
| **5. 💰 Cashier POS** | Cashier Register & Tabs | `/staff/pos` | Tap-to-add POS grid, Table tabs, Discount & tax calculations, Digital printed receipt modal |
| **6. 📊 Owner Dashboard** | Analytics & Stock Control | `/staff/owner` | Today's Gross Revenue, Total Orders, AOV, Active tables, Best-sellers leaderboard, Live Out-of-Stock toggle |

---

## 🎨 Design System: "Saffron & Spice"

* **Primary Spice Red**: `#D32F2F` / `#B71C1C`
* **Saffron Gold**: `#F57C00` / `#FFB300`
* **Halal Badge Green**: `#2E7D32`
* **Warm Cream Background**: `#FAF9F8` / `#FFFDF9`
* **Charcoal Slate**: `#1A1A1A` / `#2D2A27`
* **Border Radius**: 16px cards, 12px buttons, 24px pills

---

## 💾 State Management & Real-Time Sync (Zustand)

All modules are interconnected via reactive Zustand stores in `src/store/`:
1. **`useCartStore`**: Handles items, portion size selections, spice level modifiers, sides/add-ons checklist, coupon discounts, tax, and delivery fee calculation.
2. **`useOrderStore`**: Central order queue. When a customer or cashier places an order, it **instantly appears on the Kitchen KDS board** and updates the Owner Dashboard revenue stats.
3. **`useTableStore`**: Manages dining room table occupancy (Table 01 to 15) and active guest sessions.
4. **`useMenuStore`**: Live dish inventory and instant out-of-stock toggling.
5. **`useRoleStore`**: Seamless switching between Customer App and Staff Operational modes with PIN protection.

---

## 🔑 Quick Demo Credentials

To switch between modes in the app, tap the **"Staff Mode"** button in the top header or navigate to **Account ➔ Enter Staff PIN**:

* **Staff Mode (Kitchen KDS & Cashier POS)**: `1234`
* **Owner Analytics Mode**: `8888`
* **Superuser Bypass**: `0000`

---

## 🚀 How to Run

### 1. Install Dependencies
```bash
cd mobile-app
npm install
```

### 2. Start Development Server
```bash
# Start Metro bundler
npx expo start

# Run on Android Device / Emulator
npx expo run:android # or press 'a' in terminal

# Run on Web Simulator
npx expo start --web
```

### 3. Type Checking & Verification
```bash
npx tsc --noEmit
npx expo export --platform web
```

---

## 📁 Project Directory Structure

```
mobile-app/
├── src/
│   ├── app/                     # Expo Router file-based routes
│   │   ├── (tabs)/              # Customer Tab Navigation
│   │   │   ├── _layout.tsx      # 5 bottom tabs with live cart badge
│   │   │   ├── index.tsx        # Home Screen with Hero Banners & Chef Picks
│   │   │   ├── menu.tsx         # Digital Menu with Search & Spice Filters
│   │   │   ├── cart.tsx         # Cart with Dine-In vs Delivery calculations
│   │   │   ├── orders.tsx       # Active & Past Orders list
│   │   │   └── profile.tsx      # Gold Loyalty Rewards Club & Halal credentials
│   │   ├── dish/[id].tsx        # Dish Detail & Customization Modal
│   │   ├── checkout.tsx         # Full Checkout & Payment flow
│   │   ├── track/[id].tsx       # Live 4-Step Order Tracker & ETA
│   │   ├── qr-scan.tsx          # QR Table Dine-In Scanner & Selector
│   │   ├── staff/
│   │   │   ├── kds.tsx          # Kitchen Display System (KDS)
│   │   │   ├── pos.tsx          # Cashier POS Terminal & Receipts
│   │   │   └── owner.tsx        # Owner Analytics & Inventory Toggle
│   │   ├── _layout.tsx          # Root Stack layout & Global Role Switcher Modal
│   │   └── index.tsx            # Root redirect
│   ├── components/              # Reusable UI components
│   │   ├── Header.tsx           # Navigation bar with Table Badge & Role Switcher
│   │   ├── DishCard.tsx         # Grid & Horizontal food card with Halal tags
│   │   ├── SpiceMeter.tsx       # Visual spice flame indicator
│   │   ├── CategoryPill.tsx     # Filter category pills
│   │   ├── CartFloatingBar.tsx  # Sticky bottom cart trigger
│   │   └── RoleSwitcherModal.tsx# PIN-protected view switcher
│   ├── constants/
│   │   └── theme.ts             # Saffron & Spice design tokens
│   ├── data/
│   │   ├── menu.json            # 57 clean items from halalfood.com.ph
│   │   ├── categories.json      # Structured restaurant categories
│   │   └── options.ts           # Portions, Addons, Spice levels & Coupons
│   ├── store/                   # Zustand reactive state stores
│   │   ├── useCartStore.ts
│   │   ├── useOrderStore.ts
│   │   ├── useMenuStore.ts
│   │   ├── useTableStore.ts
│   │   ├── useRoleStore.ts
│   │   └── useFavoritesStore.ts
│   └── types/
│       └── index.ts             # Complete TypeScript interfaces
├── app.json
├── package.json
└── tsconfig.json
```
