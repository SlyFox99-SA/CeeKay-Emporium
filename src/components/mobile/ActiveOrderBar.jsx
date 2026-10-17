
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue } from 'framer-motion';
import { ChefHat, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getOrders, subscribeToOrders } from '../../services/orderService';

export default function ActiveOrderBar() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const x = useMotionValue(0);
  const barRef = useRef(null);

  useEffect(() => {
    const checkActive = async () => {
      const orders = await getOrders();
      const active = orders.find(o => ['placed', 'preparing', 'ready'].includes(o.status));
      
      if (active) {
        setActiveOrder(active);
        // If this specific order was previously dismissed, keep it hidden
        const dismissedId = localStorage.getItem('ceekay-dismissed-order');
        if (dismissedId === active.id) {
          setDismissed(true);
        } else {
          setDismissed(false);
        }
      } else {
        // No active order, clear the history so future orders appear
        setActiveOrder(null);
        localStorage.removeItem('ceekay-dismissed-order');
      }
    };

    checkActive();
    const unsub = subscribeToOrders(checkActive);
    return unsub;
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    if (activeOrder) {
      localStorage.setItem('ceekay-dismissed-order', activeOrder.id);
    }
  };

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!activeOrder || dismissed) return;
    const timer = setTimeout(() => {
      handleDismiss();
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeOrder, dismissed]);

  // Dismiss when clicking outside
  useEffect(() => {
    if (!activeOrder || dismissed) return;
    const handleOutsideClick = (e) => {
      if (barRef.current && !barRef.current.contains(e.target)) {
        handleDismiss();
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, [activeOrder, dismissed]);

  if (!activeOrder || dismissed || location.pathname.startsWith('/order') || location.pathname === '/admin') {
    return null;
  }

  const getStatusText = (status) => {
    if (status === 'placed') return 'Order received';
    if (status === 'preparing') return 'Cooking your order';
    if (status === 'ready') return 'Ready for pickup!';
    return 'In progress';
  };

  return (
    <AnimatePresence>
      <motion.div 
        ref={barRef}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        style={{ x }}
        onDragEnd={(e, info) => {
          if (info.offset.x > 80) {
            handleDismiss();
          }
        }}
        className={`active-order-bar status-${activeOrder.status}`}
        onClick={() => navigate(`/order/${activeOrder.id}`)}
      >
        <div className="aob-icon">
          {activeOrder.status === 'ready' ? <CheckCircle2 size={20} /> : <ChefHat size={20} className="pulse-icon" />}
        </div>
        <div className="aob-text">
          <div className="aob-title">{getStatusText(activeOrder.status)}</div>
          <div className="aob-sub">Order #{activeOrder.id}</div>
        </div>
        <ChevronRight size={20} className="aob-arrow" />
      </motion.div>
    </AnimatePresence>
  );
}
