
# CeeKay Emporium - System Architecture & Workflow

This document tracks the engineering progress, architecture, and roadmap of the CeeKay Emporium app.

## 🏗️ Architecture & Tech Stack
- **Frontend:** React (Vite), Framer Motion (Animations)
- **Backend:** Supabase (PostgreSQL, RLS, Storage, Realtime)
- **Styling:** Modular CSS (`src/styles/tokens.css`, `components.css`)
- **State:** Context API (Auth, Cart, Store, Preferences)
- **PWA:** Dynamic manifests (Storefront, Admin, Kitchen install as separate apps)

## ✅ Completed Features
- [x] **Brand Identity System:** Custom tokens, fonts, and 3D food card styling.
- [x] **Multi-Shell Architecture:** Separate Desktop, Mobile Storefront, Mobile Admin, and Kitchen layouts.
- [x] **Native Ordering Flow:** Bottom sheets, swipe-to-dismiss, haptics, and native checkout (no WhatsApp redirect).
- [x] **Kitchen Dashboard:** Live order tracking, horizontal swipeable columns, audio chimes.
- [x] **Admin Panel:** Menu management, order viewing, basic analytics.
- [x] **Loyalty System:** Apple Wallet-style punch card with redemption logic.
- [x] **Dynamic PWA:** The app installs as 3 distinct applications (Store, Admin, Kitchen).
- [x] **Smart Popups:** Dismissals persist in localStorage (PWA banner, Active Order bar).
- [x] **Image Uploader:** Connected to Supabase Storage for real food PNGs.

## 🚧 In Progress / Missing Features
- [ ] **Inventory Tracking:** Auto-sold out when stock hits 0.
- [ ] **Franchise Analytics:** Multi-store revenue filtering.
- [ ] **Payments:** Yoco/PayFast integration.
- [ ] **Customer Accounts:** Saved addresses and order history (currently device-scoped).

## 🎨 Motion System (Kota Joe's level)
- [x] Page Transitions (Framer Motion `AnimatePresence`)
- [x] Swipe-to-dismiss Bottom Sheets
- [x] Haptic Feedback
- [ ] Fly-to-cart physics animation
- [ ] Staggered entrance for menu items
- [ ] Global button press physics (`whileTap`)
