import { ArrowLeft, User, Phone } from 'lucide-react';

export default function CheckoutForm({ cart, total, customer, setCustomer, onBack, onSubmit, isPlacing }) {
  return (
    <div className="m-cart-items" style={{ padding: '0 20px' }}>
      <button onClick={onBack} style={{ background: 'transparent', border: 'none', color: 'var(--ck-ink-soft)', display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 0', fontWeight: 600 }}>
        <ArrowLeft size={16} /> Back to cart
      </button>
      
      <div style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '24px', border: '1px solid var(--ck-border)' }}>
        <h4 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 800 }}>Order Summary</h4>
        {cart.map(item => (
          <div key={item.lineKey} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px', color: 'var(--ck-ink-soft)' }}>
            <span>{item.qty}x {item.name}</span>
            <span>R {(item.price * item.qty).toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <label className="m-field">
          <span className="m-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}><User size={14} /> Your Name</span>
          <input placeholder="e.g. Bongani" value={customer.name} onChange={e => setCustomer({...customer, name: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '16px' }} />
        </label>
        <label className="m-field">
          <span className="m-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--ck-ink-soft)', marginBottom: '8px' }}><Phone size={14} /> Phone Number</span>
          <input placeholder="082 123 4567" type="tel" value={customer.phone} onChange={e => setCustomer({...customer, phone: e.target.value})} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--ck-border)', fontSize: '16px' }} />
        </label>
      </div>
      
      <div className="m-cart-totals" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '18px', fontWeight: 800 }}>
        <span>Total to pay</span>
        <span>R {total.toFixed(2)}</span>
      </div>
      
      <button className="m-cart-primary-btn" onClick={onSubmit} disabled={isPlacing} style={{ width: '100%', padding: '16px', background: 'var(--ck-brand-deep)', color: 'white', border: 'none', borderRadius: '99px', fontWeight: 800, fontSize: '16px', marginTop: '16px', cursor: 'pointer' }}>
        {isPlacing ? 'Processing...' : 'Place Order'}
      </button>
    </div>
  );
}