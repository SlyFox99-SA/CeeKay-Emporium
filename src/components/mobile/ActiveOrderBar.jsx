import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getOrders, subscribeToOrders } from '../../services/orderService';

export default function ActiveOrderBar() {
  const [activeOrder, setActiveOrder] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkActive = async () => {
      // Fetch all orders, find the most recent one that isn't completed/cancelled
      const orders = await getOrders();
      const active = orders.find(o => ['placed', 'preparing', 'ready'].includes(o.status));
      setActiveOrder(active || null);
    };

    checkActive();
    const unsub = subscribeToOrders(checkActive);
    return unsub;
  }, []);

  // Hide the bar if we are already on the tracking page or checkout
  if (!activeOrder || location.pathname.startsWith('/order') || location.pathname === '/admin') {
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
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
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