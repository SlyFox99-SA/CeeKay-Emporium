import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { useIsMobile } from './hooks/useIsMobile';
import { primeAudio } from './lib/chime';

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

function AppRoutes() {
  const isMobile = useIsMobile();

  // Unlock audio on the very first tap anywhere in the app
  useEffect(() => {
    const unlock = () => {
      primeAudio();
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('touchstart', unlock);
    document.addEventListener('click', unlock);
    return () => {
      document.removeEventListener('touchstart', unlock);
      document.removeEventListener('click', unlock);
    };
  }, []);

  return (
    <Routes>
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <AppRoutes />
      </PreferencesProvider>
    </AuthProvider>
  );
}