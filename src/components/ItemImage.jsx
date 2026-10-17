import { useState } from 'react';

export default function ItemImage({ src, alt, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className={`item-image-fallback ${className}`}>
        <span>{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={`item-image ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
