 
const ITEMS = [
  'Fresh achaar daily',
  'Est. 2021 � Benoni, Gauteng',
  'Kotas from R20',
  "Made like we're feeding family",
  'Order on WhatsApp � Collect in 15 min',
  'Real flavour. Real value.',
];

export default function Ticker() {
  /* Duplicate the list so the scroll loops seamlessly */
  const strip = [...ITEMS, ...ITEMS];

  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker-track">
        {strip.map((text, i) => (
          <span key={i} className="ticker-item">
            <span className="ticker-dot" />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

