import { useEffect, useState } from 'react';

export default function Toast({ message, action, onAction, onDone, duration = 2800 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const t = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, duration);
    return () => clearTimeout(t);
  }, [message, onDone, duration]);

  return (
    <div className={`toast ${visible ? 'show' : ''}`}>
      <span className="toast-message">{message}</span>
      {action && (
        <button
          className="toast-action"
          onClick={() => {
            setVisible(false);
            onAction?.();
            onDone?.();
          }}
        >
          {action}
        </button>
      )}
    </div>
  );
}
