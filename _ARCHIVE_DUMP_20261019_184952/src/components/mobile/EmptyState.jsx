

const ICONS = {
  cart: ShoppingBag,
  orders: ReceiptText,
  kitchen: ChefHat
};

export default function EmptyState({ type, title, subtitle, action }) {
  const Icon = ICONS[type] || ShoppingBag;

  return (
    <div className="m-empty-state">
      <div className="m-empty-icon-wrap">
        <Icon size={40} strokeWidth={1.5} color="var(--ck-brand)" />
      </div>
      <h2 className="m-empty-title">{title}</h2>
      <p className="m-empty-sub">{subtitle}</p>
      {action && <div className="m-empty-action">{action}</div>}
    </div>
  );
}