import { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { CartProvider } from './context/CartContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { useIsMobile } from './hooks/useIsMobile';
import { useDynamicManifest } from './hooks/useDynamicManifest';

// Pages
import Storefront from './pages/Storefront';
import MobileStorefront from './pages/MobileStorefront';
import Kitchen from './pages/Kitchen';
import OrderStatus from './pages/OrderStatus';
import MobileOrderStatus from './pages/MobileOrderStatus';
import AdminLogin from './pages/admin/AdminLogin';
import AdminResetPassword from './pages/admin/AdminResetPassword';
import AdminLayout from './pages/admin/AdminLayout';
import MobileAdminShell from './pages/admin/MobileAdminShell';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminMenu from './pages/admin/AdminMenu';

import AdminFinance from './pages/admin/AdminFinance';
import AdminCOS from './pages/admin/AdminCOS'; // <-- ADDED IMPORT
import AdminOrders from './pages/admin/AdminOrders';
import AdminStores from './pages/admin/AdminStores';
import AdminStaff from './pages/admin/AdminStaff';
import AdminPOS from './pages/admin/AdminPOS';
import FamilyLog from './pages/FamilyLog';
import SplashScreen from './components/SplashScreen';
import InstallPWA from './components/mobile/InstallPWA';

// Protected Route Wrapper
function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--ck-cream)' }}>Loading...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  
  // If the user's role is not in the allowed list, kick them out
  if (allowedRoles && !allowedRoles.includes(profile?.role) && profile?.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppRoutes() {
  const isMobile = useIsMobile();
  const location = useLocation();
  useDynamicManifest();

  const isOperational = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen') || location.pathname.startsWith('/order') || location.pathname.startsWith('/pos') || location.pathname.startsWith('/login') ||location.pathname.startsWith('/log');
  const [isBooting, setIsBooting] = useState(!isOperational);

  useEffect(() => {
    if (isOperational) { setIsBooting(false); return; }
    let dataReady = false;
    let minTimeElapsed = false;
    const MIN_SPLASH_TIME = 5500;
    const checkAndDropSplash = () => { if (dataReady && minTimeElapsed) setIsBooting(false); };
    const handleAppReady = () => { dataReady = true; checkAndDropSplash(); };
    window.addEventListener('app_ready', handleAppReady);
    const minTimeTimer = setTimeout(() => { minTimeElapsed = true; checkAndDropSplash(); }, MIN_SPLASH_TIME);
    const fallbackTimer = setTimeout(() => setIsBooting(false), 10000);
    return () => { window.removeEventListener('app_ready', handleAppReady); clearTimeout(minTimeTimer); clearTimeout(fallbackTimer); };
  }, [isOperational]);

  return (
    <AuthProvider>
      <PreferencesProvider>
        <StoreProvider>
          <CartProvider>
            <motion.div
              initial={isOperational ? { opacity: 1 } : { scale: 1.05, opacity:0 }}
              animate={{ scale: isBooting ? 1.05 : 1, opacity: isBooting ? 0 : 1 }}
              transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1], delay: isBooting ? 0 : 0.2 }}
              style={{ height: '100dvh', width: '100vw', overflow: 'hidden', willChange: 'transform, opacity' }}
            >
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                  
                  {/* Auth Routes */}
                  <Route path="/login" element={<AdminLogin />} />
                  <Route path="/admin/login" element={<Navigate to="/login" replace />} />
                  <Route path="/log" element={<FamilyLog />} />
                  <Route path="/admin/reset-password" element={<AdminResetPassword />} />

                  {/* POS ROUTE (Isolated for Cashier role) */}
                  <Route path="/pos" element={
                    <ProtectedRoute allowedRoles={['pos', 'admin']}>
                      <AdminPOS />
                    </ProtectedRoute>
                  } />

                  {/* KITCHEN ROUTE (Isolated) */}
                  <Route path="/kitchen" element={
                    <ProtectedRoute allowedRoles={['kitchen', 'admin']}>
                      <Kitchen />
                    </ProtectedRoute>
                  } />

                  {/* ADMIN ROUTES (Super Admin) */}
                  <Route path="/admin" element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      {isMobile ? <MobileAdminShell /> : <AdminLayout />}
                    </ProtectedRoute>
                  }>
                    <Route index element={<AdminDashboard />} />
                    <Route path="menu" element={<AdminMenu />} />
                    <Route path="finance" element={<AdminFinance />} />
                    <Route path="cos" element={<AdminCOS />} /> {/* <-- ADDED ROUTE */}
                    
                    {/* Added POS inside admin so the sidebar stays for admins */}
                    <Route path="pos" element={<AdminPOS />} />
                    
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="stores" element={<AdminStores />} />
                    <Route path="staff" element={<AdminStaff />} />
                  </Route>

                  {/* Customer Routes */}
                  <Route path="/order/:id" element={isMobile ? <MobileOrderStatus /> : <OrderStatus />} />
                  <Route path="/*" element={isMobile ? <MobileStorefront /> : <Storefront />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </motion.div>

            <AnimatePresence>
              {isBooting && !isOperational && <SplashScreen key="splash" />}
            </AnimatePresence>

            {!isOperational && isMobile && <InstallPWA />}
          </CartProvider>
        </StoreProvider>
      </PreferencesProvider>
    </AuthProvider>
  );
}
export default AppRoutes;