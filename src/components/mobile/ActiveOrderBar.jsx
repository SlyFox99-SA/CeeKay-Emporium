/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ChefHat, ChevronRight, X } from 'lucide-react';
import { supabase, getDeviceId } from '../../lib/supabase';
import { useHaptics } from '../../hooks/useHaptics';

export default function ActiveOrderBar() {
  const [activeOrder, setActiveOrder] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const navigate = useNavigate();
  const haptics = useHaptics();

  // 1. Fetch active order logic
  const checkActiveOrder = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('device_id', getDeviceId())
      .in('status', ['pending', 'placed', 'preparing', 'ready'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setActiveOrder(data);
    } else {
      setActiveOrder(null);
    }
  };

  // 2. Initial fetch and Realtime listener
  useEffect(() => {
    checkActiveOrder();

    const channel = supabase
      .channel('active-order-bar')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        checkActiveOrder();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // 3. Listen for the custom "Done" event
  useEffect(() => {
    const handleOrderPlaced = () => {
      checkActiveOrder(); // Fetch the fresh order
      setIsVisible(true); // Show the bar
    };

    window.addEventListener('order_placed', handleOrderPlaced);
    return () => window.removeEventListener('order_placed', handleOrderPlaced);
  }, []);

  // 4. Auto-hide timer
  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 8000); // Hide after 8 seconds

    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!activeOrder || !isVisible) return null;

  // Formatting the Order Number safely
  const displayId = activeOrder.order_number 
    ? activeOrder.order_number 
    : activeOrder.id.split('-')[0].toUpperCase(); 

  const statusText = {
    pending: 'Awaiting payment',
    placed: 'Order received',
    preparing: 'Cooking now',
    ready: 'Ready for collection',
  }[activeOrder.status] || 'Order in progress';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        onClick={() => { haptics.light(); navigate(`/order/${activeOrder.id}`); setIsVisible(false); }}
        style={{
          position: 'fixed',
          bottom: 'calc(80px + env(safe-area-inset-bottom))',
          left: '20px',
          right: '20px',
          background: '#0F2E4A',
          borderRadius: '99px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 8px 30px rgba(15, 46, 74, 0.3)',
          zIndex: 90,
          cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: 'rgba(255,255,255,0.1)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChefHat size={18} color="#D4AF37" />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'white' }}>
              {statusText}
            </span>
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
              #{displayId} • Tap to track
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
          <button 
            onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
            style={{ background: 'transparent', border: 'none', padding: '4px', cursor: 'pointer', display: 'flex' }}
          >
            <X size={16} color="rgba(255,255,255,0.5)" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
