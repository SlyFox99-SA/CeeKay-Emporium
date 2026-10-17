/* Flies a small image from a source point to the cart button.
   Uses Web Animations API — no dependencies. */
export function flyToCart(sourceEl, imageSrc) {
  if (!sourceEl) return;

  const target = document.querySelector('[data-cart-target]');
  if (!target) return;

  const srcRect = sourceEl.getBoundingClientRect();
  const tgtRect = target.getBoundingClientRect();

  const startX = srcRect.left + srcRect.width / 2;
  const startY = srcRect.top + srcRect.height / 2;
  const endX = tgtRect.left + tgtRect.width / 2;
  const endY = tgtRect.top + tgtRect.height / 2;

  const floater = document.createElement('div');
  floater.className = 'fly-item';
  floater.style.left = `${startX - 26}px`;
  floater.style.top = `${startY - 26}px`;

  if (imageSrc) {
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = '';
    floater.appendChild(img);
  }

  document.body.appendChild(floater);

  const dx = endX - startX;
  const dy = endY - startY;

  const animation = floater.animate(
    [
      { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
      { transform: `translate(${dx * 0.55}px, ${dy * 0.55 - 130}px) scale(0.75)`, opacity: 1, offset: 0.55 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.15)`, opacity: 0.4, offset: 1 },
    ],
    {
      duration: 750,
      easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)',
      fill: 'forwards',
    }
  );

  animation.onfinish = () => {
    floater.remove();
    target.classList.add('cart-bounce');
    setTimeout(() => target.classList.remove('cart-bounce'), 600);

    const badge = target.querySelector('.cart-count');
    if (badge) {
      badge.classList.remove('badge-pop');
      void badge.offsetWidth;
      badge.classList.add('badge-pop');
      setTimeout(() => badge.classList.remove('badge-pop'), 600);
    }
  };
}
