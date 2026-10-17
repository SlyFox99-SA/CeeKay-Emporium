import { useState } from 'react';
import Header from '../components/Header';
import KotaCard from '../components/KotaCard';
import DrinkCard from '../components/DrinkCard';
import CartSidebar from '../components/CartSidebar';
import StoreSelector from '../components/StoreSelector';
import Toast from '../components/Toast';
import Ticker from '../components/Ticker';
import TrustStrip from '../components/TrustStrip';
import WelcomeBack from '../components/WelcomeBack';
import InstallPrompt from '../components/InstallPrompt';
import Preferences from '../components/Preferences';
import ItemModal from '../components/ItemModal';
import { useReveal } from '../hooks/useReveal';
import { useCart } from '../context/CartContext';
import { KOTAS, DRINKS } from '../data/menu';

export default function Storefront() {
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [toastAction, setToastAction] = useState(null);
  const [modalItem, setModalItem] = useState(null);

  const { addToCart } = useCart();
  useReveal();

  const handleAdd = (item) => {
    setToastAction(null);
    setToast(`${item.name} added to order`);
  };

  const handleToastWithAction = (message, action, onAction) => {
    setToast(message);
    setToastAction({ label: action, handler: onAction });
  };

  const handleModalConfirm = (item, options) => {
    addToCart(item, options);
    setToastAction(null);
    setToast(`${item.name} × ${options.qty} added`);
  };

  return (
    <>
      <Ticker />
      <Header onCartClick={() => setCartOpen(o => !o)} />

      <main>
        <section className="hero">
          <div className="hero-stamp">
            <span className="hero-stamp-line" />
            <span>Est. 2021 · Benoni, Gauteng</span>
            <span className="hero-stamp-line" />
          </div>
          <h1 className="hero-title">
            Benoni's
            <span className="hero-title-accent">Kota Spot</span>
          </h1>
          <p className="hero-tagline">
            Handcrafted, packed with achaar, and made like we're feeding our own family. From R20.
          </p>
          <div className="hero-actions">
            <a href="#menu" className="hero-cta hero-cta-primary">See the menu</a>
            <button className="hero-cta hero-cta-ghost" onClick={() => setCartOpen(true)}>
              Start an order
            </button>
          </div>
        </section>

        <TrustStrip />
        <WelcomeBack />

        <section className="menu-section" id="menu">
          <div className="menu-heading" data-reveal>
            <span className="menu-heading-eyebrow">What we serve</span>
            <h2>Our Menu</h2>
          </div>

          <h3 className="menu-cat" data-reveal>Signature Kotas</h3>
          <div className="kota-grid">
            {KOTAS.map((k, i) => (
              <div key={k.id} data-reveal style={{ '--delay': `${i * 90}ms` }}>
                <KotaCard item={k} onAdd={handleAdd} onOpenModal={setModalItem} />
              </div>
            ))}
          </div>

          <h3 className="menu-cat" data-reveal>Cold Drinks</h3>
          <div className="drink-grid">
            {DRINKS.map((d, i) => (
              <div key={d.id} data-reveal style={{ '--delay': `${i * 90}ms` }}>
                <DrinkCard item={d} onAdd={handleAdd} onOpenModal={setModalItem} />
              </div>
            ))}
          </div>
        </section>

        <section className="storefront-footer" data-reveal>
          <div className="footer-promise">
            <span className="footer-promise-eyebrow">The CeeKay Promise</span>
            <p>No shortcuts. No pre-cooking. Every kota made properly.</p>
          </div>
        </section>
      </main>

      <CartSidebar
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        onToast={setToast}
        onToastAction={handleToastWithAction}
      />
      <ItemModal item={modalItem} onClose={() => setModalItem(null)} onConfirm={handleModalConfirm} />
      <StoreSelector />
      <Preferences />
      <InstallPrompt />
      <Toast
        message={toast}
        action={toastAction?.label}
        onAction={toastAction?.handler}
        onDone={() => { setToast(''); setToastAction(null); }}
        duration={toastAction ? 5000 : 2800}
      />
    </>
  );
}
