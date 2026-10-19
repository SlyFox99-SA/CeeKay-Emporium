
export function flyToCart(e, imageUrl) {
  if (!e || !imageUrl) return;
  const cartBtn = document.querySelector('[data-cart-target]');
  if (!cartBtn) return;

  const startRect = e.currentTarget.getBoundingClientRect();
  const endRect = cartBtn.getBoundingClientRect();

  const clone = document.createElement('img');
  clone.src = imageUrl;
  clone.style.position = 'fixed';
  clone.style.top = startRect.top + 'px';
  clone.style.left = startRect.left + 'px';
  clone.style.width = startRect.width + 'px';
  clone.style.height = startRect.height + 'px';
  clone.style.borderRadius = '50%';
  clone.style.objectFit = 'contain';
  clone.style.background = '#fff';
  clone.style.zIndex = '99999';
  clone.style.transition = 'all 0.6s cubic-bezier(0.2, 0.8, 0.3, 1)';
  clone.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';

  document.body.appendChild(clone);

  requestAnimationFrame(() => {
    clone.style.top = endRect.top + (endRect.height / 2) - 15 + 'px';
    clone.style.left = endRect.left + (endRect.width / 2) - 15 + 'px';
    clone.style.width = '30px';
    clone.style.height = '30px';
    clone.style.opacity = '0.5';
  });

  setTimeout(() => {
    clone.remove();
    cartBtn.classList.add('cart-bounce');
    setTimeout(() => cartBtn.classList.remove('cart-bounce'), 600);
  }, 600);
}
