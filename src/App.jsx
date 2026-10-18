import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
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
import SplashScreen from './components/SplashScreen';

function AppRoutes() {
  const isMobile = useIsMobile();
  const location = useLocation();
  useDynamicManifest();

  // Audio unlocking is strictly handled by AudioWrapper in main.jsx

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={isMobile ? <MobileAdminShell /> : <AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="menu" element={<AdminMenu />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="stores" element={<AdminStores />} />
          <Route path="staff" element={<AdminStaff />} />
        </Route>

        <Route path="/kitchen" element={<Kitchen />} />
        <Route path="/order/:id" element={isMobile ? <MobileOrderStatus /> : <OrderStatus />} />
        
        <Route
          path="/*"
          element={
            <StoreProvider>
              <CartProvider>
                {isMobile ? <MobileStorefront /> : <Storefront />}
              </CartProvider>
            </StoreProvider>
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
    const timer = setTimeout(() => setIsBooting(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      <PreferencesProvider>
        <AppRoutes />
        <AnimatePresence>
          {isBooting && <SplashScreen key="splash" />}
        </AnimatePresence>
      </PreferencesProvider>
    </AuthProvider>
  );
}