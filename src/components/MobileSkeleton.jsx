 

export default function MobileSkeleton() {
  return (
    <div className="mobile-menu-view">
      <div className="skeleton skeleton-title" style={{ width: '40%', height: 28, marginBottom: 24 }} />
      <div className="premium-food-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="premium-food-card skeleton-card">
            <div className="skeleton skeleton-img" style={{ aspectRatio: '1/1', width: '100%' }} />
            <div className="premium-food-body">
              <div className="skeleton skeleton-text" style={{ width: '70%', height: 16, marginBottom: 8 }} />
              <div className="skeleton skeleton-text" style={{ width: '40%', height: 14 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

