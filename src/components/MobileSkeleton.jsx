export default function MobileSkeleton() {
  return (
    <div className="mobile-menu-view">
      <div className="skeleton skeleton-title" />
      <div className="skeleton skeleton-subtitle" />
      <div className="skeleton-list">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="skeleton-card">
            <div className="skeleton skeleton-img" />
            <div className="skeleton-content">
              <div className="skeleton skeleton-text" style={{ width: '60%' }} />
              <div className="skeleton skeleton-text" style={{ width: '40%' }} />
              <div className="skeleton skeleton-text" style={{ width: '25%' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}