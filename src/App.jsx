import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { useIsMobile } from './hooks/useIsMobile';

import Storefront from './pages/Storefront';
import MobileStorefront from './pages/MobileStorefront';
import Kitchen from './pages/Kitchen';
import OrderStatus from './pages/OrderStatus';
import MobileOrderStatus from './pages/MobileOrderStatus';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMenu from './pages/admin/AdminMenu';
import AdminOrders from './pages/admin/AdminOrders';
import AdminStores from './pages/admin/AdminStores';
import AdminStaff from './pages/admin/AdminStaff';
import ProtectedRoute from './components/ProtectedRoute';

function AppRoutes() {
  const isMobile = useIsMobile();

  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="menu" element={<AdminMenu />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="stores" element={<AdminStores />} />
        <Route path="staff" element={<AdminStaff />} />
      </Route>

      <Route path="/kitchen" element={<ProtectedRoute requireAdmin={false}><Kitchen /></ProtectedRoute>} />
      
      {/* Route to the correct Order Status based on device */}
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