# CeeKay Emporium - Architecture Rulebook (v1.0.0)

## 🏗️ Core Philosophy
- **Zero Frankenstein Code:** Never append `!important`. Fix the root cause.
- **Strict Separation:** Mobile components (`src/components/mobile/`) NEVER import desktop components.
- **Server-Authoritative:** Total prices and stock availability are calculated server-side via Supabase RPCs.

## 🎨 UI/UX Standards
- **Physics:** All interactive elements must use Framer Motion `whileTap={{ scale: 0.97 }}`.
- **Z-Index Rule:**
  - `1-10`: Base components
  - `100`: Bottom Nav
  - `500`: Bottom Sheets (Cart, Item Modals)
  - `9999`: Global Toasts/Alerts & StoreSelector Portal
- **Safe Areas:** All fixed elements must respect `env(safe-area-inset-bottom)`.
- **Audio/Haptics:**
  - `useHaptics()` for *every* interaction.
  - `chime.js` for meaningful events ONLY (Add to cart, Success, Error). NEVER for navigation.

## 🗄️ Database Rules
- Orders must always include a valid `store_id` UUID.
- Checkout MUST use the `place_order_with_inventory` RPC. Direct `insert` into `orders` is strictly forbidden.

## 🚧 Known Technical Debt (Do NOT break these)
- **Desktop Storefront (`Storefront.jsx`)**: Still partially relies on `src/data/menu.js`. Needs future migration to Supabase.
- **Kitchen Dashboard (`Kitchen.jsx`)**: Still partially relies on `src/data/stores.js`. Needs future migration to Supabase.
- **Upsell Drinks**: Now correctly pulls from Supabase via the `menu.drinks` prop.