# CeeKay Emporium — Website

Benoni's favourite kota spot. Single-page food ordering website.

---

## 📁 Folder Structure

```
ceekay/
│
├── index.html               ← Main page (open this in a browser)
│
├── styles/
│   └── main.css             ← All styles, animations & responsive rules
│
├── scripts/
│   └── main.js              ← Menu data, cart logic, order functions
│
└── assets/
    └── images/
        ├── icon-facebook.svg    ← Facebook brand icon
        ├── icon-instagram.svg   ← Instagram brand icon (gradient)
        ├── icon-tiktok.svg      ← TikTok brand icon (dual-colour)
        ├── icon-whatsapp.svg    ← WhatsApp icon (used on order button)
        ├── icon-email.svg       ← Email envelope icon
        └── texture-noise.svg    ← Subtle grain texture overlay
```

---

## 🚀 How to Run

Just open `index.html` in any web browser. No server needed.

> **Note:** Google Fonts and Google Maps require an internet connection.

---

## ✏️ How to Update the Menu

Open `scripts/main.js` and edit the `KOTAS` or `DRINKS` arrays at the top of the file.

**Adding a new Kota:**
```js
{
  id: 4,                          // unique number
  name: "Your Kota Name",
  emoji: "🥙",
  price: 45,
  tag: "New Item",
  tagClass: "tag-special",        // tag-special | tag-fav | tag-beast
  desc: "Short description here.",
  ingredients: ["Chips", "Cheese", "Your fillings"],
  ribbon: "New!"                  // or null for no ribbon
}
```

**Adding a new Drink:**
```js
{ id: 6, name: "Sprite", emoji: "🥤", price: 10, desc: "Cool and crisp." }
```

---

## 🎨 How to Change Brand Colours

Open `styles/main.css` and edit the `:root` block at the very top:

```css
:root {
  --cr:  #c0392b;   /* Primary red    */
  --or:  #e67e22;   /* Orange accent  */
  --ye:  #f1c40f;   /* Yellow accent  */
  --wm:  #fff8f0;   /* Warm background */
  --dk:  #1a0a00;   /* Dark / footer  */
}
```

---

## 📞 Contact Details (update in index.html)

| Field     | Value                        |
|-----------|------------------------------|
| WhatsApp  | +27 78 017 8517              |
| Email     | info@ceekayemporium.com      |
| Website   | www.ceekayemporium.com       |
| Location  | Benoni, Gauteng, South Africa |

---

© 2021 CeeKay Emporium · All Rights Reserved
