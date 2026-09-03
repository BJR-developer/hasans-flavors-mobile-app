# Project Instructions & Design Standards

## 1. Expo & React Native Framework
- Read the exact versioned Expo docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.
- Expo SDK 57 / React 19.2.3 / React Native 0.86.3 / Expo Router ~57.0.17.

## 2. Design System & UI Principles (MANDATORY)
Always follow the **`DESIGN.md`** specification (Google Stitch Saffron & Spice System) and the **`minimal-ui-design`** skill:
- **Palette:**
  - **Background:** `#FAF9F8` (Warm Linen off-white)
  - **Cards & Surfaces:** `#FFFFFF` (Card), `#F4F3F2` (Surface Container Low), `#EEEEED` (Surface Container)
  - **Text:** `#2D2926` (Warm Charcoal Text), `#5B403D` (Warm Espresso Secondary), `#8F6F6C` (Muted Slate) — **NEVER** use pitch `#000000` text on light backgrounds.
  - **Primary Brand Red:** `#BA1A20` / `#AF101A` (Deep Spice Red)
  - **Secondary Accents:** `#B45309` / `#FC820C` (Saffron Amber / Golden Spices)
  - **Halal & Status Green:** `#2E7D32` (Zabihah Halal Green)
  - **Borders:** `#E9E8E7` / `#F1F0F0`
- **Shapes & Radii:** Standard 16px (`Radius.lg`) on primary cards and containers; pill-shaped (`Radius.round`) on category chips, tags, and stepper controls.
- **Elevation & Shadows:** Soft diffused ambient shadows (`0px 2px 8px rgba(45, 41, 38, 0.06)`), never harsh saturated glows.
- **Icons & Typography:** Use clean **Ionicons** with consistent stroke weights. Never use emojis as buttons, icons, or navigation elements.
- **Layouts & Sticky Footers:** Dock bottom action bars and sticky footers with safe area insets; avoid absolute floating overlays that obscure scrollable text.

## 3. Account Roles & Navigation Flow
- **Customer:** `customer@hasan.com` ➔ Customer App (`/(tabs)`)
- **Staff:** `staff@hasan.com` ➔ POS Register (`/staff/pos`) & Kitchen KDS (`/staff/kds`)
- **Owner:** `owner@hasan.com` ➔ Owner Analytics & Inventory (`/staff/owner`)
- 1-tap login and instant switching available on the Sign In screen (`/auth/signin`).
