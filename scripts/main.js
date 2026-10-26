/* ============================================================
   CeeKay Emporium — Main Script
   scripts/main.js
   ============================================================ */

/* ── MENU DATA ── */
var KOTAS = [
  {
    id: 1,
    name: "Mezozo",
    emoji: "🍞",
    price: 20,
    tag: "House Special",
    tagClass: "tag-special",
    desc: "Our original classic. The perfect street food hit.",
    ingredients: ["Chips", "Cheese", "Achaar", "Polony"],
    ribbon: "Best Value"
  },
  {
    id: 2,
    name: "Emporium Bliss",
    emoji: "🌟",
    price: 35,
    tag: "Fan Favourite",
    tagClass: "tag-fav",
    desc: "The one everyone keeps coming back for — generous and loaded.",
    ingredients: ["Chips", "Cheese", "Achaar", "Polony", "Vienna", "Burger", "Lettuce"],
    ribbon: "Most Popular"
  },
  {
    id: 3,
    name: "Emporium Chaw",
    emoji: "🔥",
    price: 40,
    tag: "The Beast",
    tagClass: "tag-beast",
    desc: "Fully loaded, seriously satisfying. Not for the faint-hearted.",
    ingredients: ["Chips", "Achaar", "Polony", "Cheese", "Egg", "Russian", "Burger", "Lettuce", "Cucumber"],
    ribbon: null
  }
];

var DRINKS = [
  {
    id: 4,
    name: "Orange Soda",
    emoji: "🍊",
    price: 8,
    desc: "Refreshing citrus burst — ice cold."
  },
  {
    id: 5,
    name: "Coca-Cola",
    emoji: "🥤",
    price: 10,
    desc: "The classic. Always chilled, always right."
  }
];

/* ── CART STATE ── */
var cart = [];
var toastTimer;

/* ── DOM BUILDERS ── */

function buildDishCard(item) {
  var d = document.createElement('div');
  d.className = 'dish-card';
  var ingrs = item.ingredients.map(function(i) {
    return '<span class="ingr">' + i + '</span>';
  }).join('');
  var ribbon = item.ribbon ? '<div class="ribbon">' + item.ribbon + '</div>' : '';
  d.innerHTML = ribbon
    + '<div class="dish-hero"></div>'
    + '<div class="dish-body">'
    + '<div class="dish-top">'
    + '<span class="dish-emoji">' + item.emoji + '</span>'
    + '<div class="dish-tag-wrap">'
    + '<span class="dish-tag ' + item.tagClass + '">' + item.tag + '</span>'
    + '</div></div>'
    + '<div class="dish-name">' + item.name + '</div>'
    + '<div class="dish-desc">' + item.desc + '</div>'
    + '<div class="dish-ingredients">' + ingrs + '</div>'
    + '<div class="dish-footer">'
    + '<div class="dish-price"><span class="cur">R</span>' + item.price + '</div>'
    + '<button class="add-btn">+ Add to Order</button>'
    + '</div></div>';
  d.querySelector('.add-btn').addEventListener('click', function() {
    addToCart(item);
  });
  return d;
}

function buildDrinkCard(item) {
  var d = document.createElement('div');
  d.className = 'drink-card';
  d.innerHTML = '<span class="drink-emoji">' + item.emoji + '</span>'
    + '<div class="drink-name">' + item.name + '</div>'
    + '<div class="drink-desc">' + item.desc + '</div>'
    + '<button class="drink-add">+ Add — R' + item.price + '</button>';
  d.querySelector('.drink-add').addEventListener('click', function() {
    addToCart(item);
  });
  return d;
}

/* ── INITIALISE MENU GRIDS ── */
(function initMenus() {
  var kotaGrid  = document.getElementById('kota-grid');
  var drinkGrid = document.getElementById('drink-grid');
  KOTAS.forEach(function(k)  { kotaGrid.appendChild(buildDishCard(k)); });
  DRINKS.forEach(function(d) { drinkGrid.appendChild(buildDrinkCard(d)); });
})();

/* ── CART FUNCTIONS ── */

function toggleCart() {
  document.getElementById('cart-side').classList.toggle('open');
  document.getElementById('cart-overlay').classList.toggle('open');
}

function addToCart(item) {
  var existing = cart.find(function(i) { return i.id === item.id; });
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ id: item.id, name: item.name, emoji: item.emoji, price: item.price, qty: 1 });
  }
  renderCart();
  showToast(item.emoji + ' ' + item.name + ' added to order!');
}

function changeQty(id, delta) {
  var it = cart.find(function(i) { return i.id === id; });
  if (!it) return;
  it.qty += delta;
  if (it.qty <= 0) cart = cart.filter(function(i) { return i.id !== id; });
  renderCart();
}

function removeItem(id) {
  cart = cart.filter(function(i) { return i.id !== id; });
  renderCart();
}

function renderCart() {
  var con     = document.getElementById('cart-items');
  var empty   = document.getElementById('cart-empty');
  var countEl = document.getElementById('cart-count');
  var totalEl = document.getElementById('cart-total');

  var total = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  var count = cart.reduce(function(s, i) { return s + i.qty; }, 0);

  countEl.textContent = count;
  totalEl.textContent = 'R ' + total.toFixed(2);

  /* Remove existing item rows */
  Array.from(con.querySelectorAll('.cart-item')).forEach(function(el) { el.remove(); });

  if (cart.length === 0) {
    empty.style.display = 'block';
  } else {
    empty.style.display = 'none';
    cart.forEach(function(item) {
      var d = document.createElement('div');
      d.className = 'cart-item';
      d.innerHTML = '<span class="c-emoji">' + item.emoji + '</span>'
        + '<div style="flex:1;min-width:0">'
        + '<div class="c-name">' + item.name + '</div>'
        + '<div class="c-qty-row">'
        + '<button class="qty-btn" data-id="' + item.id + '" data-d="-1">−</button>'
        + '<span class="qty-val">' + item.qty + '</span>'
        + '<button class="qty-btn" data-id="' + item.id + '" data-d="1">+</button>'
        + '<span class="c-subtotal">R ' + (item.price * item.qty).toFixed(2) + '</span>'
        + '</div></div>'
        + '<button class="c-remove" data-id="' + item.id + '">✕</button>';
      d.querySelectorAll('.qty-btn').forEach(function(b) {
        b.addEventListener('click', function() {
          changeQty(parseInt(b.dataset.id), parseInt(b.dataset.d));
        });
      });
      d.querySelector('.c-remove').addEventListener('click', function(e) {
        removeItem(parseInt(e.currentTarget.dataset.id));
      });
      con.appendChild(d);
    });
  }
}

/* ── ORDER HELPERS ── */

function buildOrderText() {
  var note  = document.getElementById('order-note').value.trim();
  var total = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  var lines = ['🌟 CeeKay Emporium Order', ''];
  cart.forEach(function(i) {
    lines.push(i.emoji + ' ' + i.name + ' x' + i.qty + ' — R' + (i.price * i.qty).toFixed(2));
  });
  lines.push('', '💰 Total: R' + total.toFixed(2));
  if (note) lines.push('', '📝 Notes: ' + note);
  return lines.join('\n');
}

function orderWhatsApp() {
  if (!cart.length) { showToast('Add something to your order first! 🍔'); return; }
  window.open('https://wa.me/27780178517?text=' + encodeURIComponent(buildOrderText()), '_blank');
}

function orderEmail() {
  if (!cart.length) { showToast('Add something to your order first! 🍔'); return; }
  var note  = document.getElementById('order-note').value.trim();
  var total = cart.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  var body  = 'CeeKay Emporium Order\n\n';
  cart.forEach(function(i) { body += i.name + ' x' + i.qty + ' — R' + (i.price * i.qty).toFixed(2) + '\n'; });
  body += '\nTotal: R' + total.toFixed(2);
  if (note) body += '\n\nNotes: ' + note;
  window.location.href = 'mailto:info@ceekayemporium.com'
    + '?subject=' + encodeURIComponent('New Order — CeeKay Emporium')
    + '&body='    + encodeURIComponent(body);
}

/* ── TOAST ── */

function showToast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { el.classList.remove('show'); }, 2800);
}

/* ── SCROLL REVEAL ── */
(function initReveal() {
  var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(function(el) { io.observe(el); });
})();
