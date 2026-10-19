import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { useIsMobile } from './hooks/useIsMobile';
import { useDynamicManifest } from './hooks/useDynamicManifest';

import Storefront from './pages/Storefront';
import MobileStorefront from './pages/MobileStorefront';
import Kitchen from './pages/Kitchen';
import OrderStatus from './pages/OrderStatus';
import MobileOrderStatus from './pages/MobileOrderStatus';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import MobileAdminShell from './pages/admin/MobileAdminShell';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMenu from './pages/admin/AdminMenu';
import AdminOrders from './pages/admin/AdminOrders';
import AdminStores from './pages/admin/AdminStores';
import AdminStaff from './pages/admin/AdminStaff';
import AdminPOS from './pages/admin/AdminPOS';
import SplashScreen from './components/SplashScreen';

function AppRoutes() {
  const isMobile = useIsMobile();
  const location = useLocation();
  useDynamicManifest();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={isMobile ? <MobileAdminShell /> : <AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="menu" element={<AdminMenu />} />
          <Route path="pos" element={<AdminPOS />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="stores" element={<AdminStores />} />
          <Route path="staff" element={<AdminStaff />} />
        </Route>

        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/order/:id" element={isMobile ? <MobileOrderStatus /> : <OrderStatus />} />
        
        <Route
          path="/*"
          element={
            isMobile ? <MobileStorefront /> : <Storefront />
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    let dataReady = false;
    let minTimeElapsed = false;
    const MIN_SPLASH_TIME = 5500;

    const checkAndDropSplash = () => {
      if (dataReady && minTimeElapsed) {
        setIsBooting(false);
      }
    };

    const handleAppReady = () => {
      dataReady = true;
      checkAndDropSplash();
    };
    window.addEventListener('app_ready', handleAppReady);

    const minTimeTimer = setTimeout(() => {
      minTimeElapsed = true;
      checkAndDropSplash();
    }, MIN_SPLASH_TIME);

    const fallbackTimer = setTimeout(() => {
      setIsBooting(false);
    }, 10000);

    return () => {
      window.removeEventListener('app_ready', handleAppReady);
      clearTimeout(minTimeTimer);
      clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <AuthProvider>
      <PreferencesProvider>
        <StoreProvider>
          <CartProvider>
            
            <motion.div
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ 
                scale: isBooting ? 1.05 : 1, 
                opacity: isBooting ? 0 : 1 
              }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: isBooting ? 0 : 0.2 }}
              style={{ 
                height: '100dvh', width: '100vw', overflow: 'hidden',
                willChange: 'transform, opacity'
              }}
            >
              <AppRoutes />
            </motion.div>

            <AnimatePresence>
              {isBooting && <SplashScreen key="splash" />}
            </AnimatePresence>

          </CartProvider>
        </StoreProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}