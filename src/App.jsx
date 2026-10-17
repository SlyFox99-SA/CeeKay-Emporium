import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { PreferencesProvider } from './context/PreferencesContext';
import Storefront from './pages/Storefront';
import Kitchen from './pages/Kitchen';
import OrderStatus from './pages/OrderStatus';
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMenu from './pages/admin/AdminMenu';
import AdminOrders from './pages/admin/AdminOrders';
import AdminStores from './pages/admin/AdminStores';
import AdminStaff from './pages/admin/AdminStaff';

export default function App() {
  return (
    <AuthProvider>
      <PreferencesProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="menu" element={<AdminMenu />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="stores" element={<AdminStores />} />
            <Route path="staff" element={<AdminStaff />} />
          </Route>

          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/order/:id" element={<OrderStatus />} />
          <Route
            path="/*"
            element={
              <StoreProvider>
                <CartProvider>
                  <Storefront />
                </CartProvider>
              </StoreProvider>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PreferencesProvider>
    </AuthProvider>
  );
}
