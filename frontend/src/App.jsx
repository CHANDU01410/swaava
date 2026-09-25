import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import ForgotPassword from './pages/ForgotPassword';
import LandingPage from './pages/LandingPage';
import useGetCurrentUser from './hooks/useGetCurrentUser';
import { useSelector } from 'react-redux';
import useGetCity from './hooks/useGetCity';
import Home from './pages/Home';
import Cart from './pages/Cart';
import MyOrders from './pages/MyOrders';
import Profile from './pages/Profile';
import RegionChefs from './pages/RegionChefs';
import ChefMenu from './pages/ChefMenu';
import AllRegions from './pages/AllRegions';
import Explore from './pages/Explore';
import FoodDetail from './pages/FoodDetail';
import AdminDashboard from './components/AdminDashboard';
import ChefDashboard from './components/ChefDashboard';

// Single source of truth — re-export so existing imports still work
export { serverUrl } from './config';

const App = () => {
  useGetCurrentUser();
  useGetCity();
  const { userData, authLoading } = useSelector(state => state.user);
  const location = useLocation();

  // Always show public pages quickly without waiting for auth
  const isPublicPage = location.pathname === '/' ||
    location.pathname === '/explore' ||
    location.pathname === '/regions' ||
    location.pathname.startsWith('/food/') ||
    location.pathname.startsWith('/item/') ||
    location.pathname.startsWith('/region/') ||
    location.pathname.startsWith('/chef/');

  // Full-screen loader while checking auth
  if (authLoading && !isPublicPage) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAFAF8]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="w-14 h-14 bg-[#D9532F] rounded-2xl flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl font-bold">
              restaurant
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-stone-900">
            Swaava<span className="text-[#D9532F]">.</span>
          </h1>

          <div className="w-40 h-1 bg-stone-200 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-[#D9532F] rounded-full"
              style={{ animation: 'authLoader 1.2s ease-in-out infinite' }}
            />
          </div>

          <p className="text-xs text-stone-400">Loading your food experience…</p>
        </div>

        <style>{`
          @keyframes authLoader {
            0% { width: 0%; margin-left: 0; }
            50% { width: 60%; margin-left: 20%; }
            100% { width: 0%; margin-left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900">
      <Routes>
        <Route path="/" element={userData ? <Home /> : <LandingPage />} />
        <Route path="/signup" element={!userData ? <AuthPage initialTab="signup" /> : <Navigate to="/" />} />
        <Route path="/signin" element={!userData ? <AuthPage initialTab="login" /> : <Navigate to="/" />} />
        <Route path="/forgot-password" element={!userData ? <ForgotPassword /> : <Navigate to="/" />} />

        {/* Protected customer routes */}
        <Route path="/cart" element={userData ? <Cart /> : <Navigate to="/signin" />} />
        <Route path="/my-orders" element={userData ? <MyOrders /> : <Navigate to="/signin" />} />
        <Route path="/profile" element={userData ? <Profile /> : <Navigate to="/signin" />} />

        {/* Protected admin route */}
        <Route path="/admin" element={userData?.role === 'Admin' ? <AdminDashboard /> : <Navigate to="/" />} />

        {/* Protected HomeChef routes with RBAC */}
        <Route
          path="/homechef"
          element={
            !userData ? (
              <Navigate to="/signin" />
            ) : userData.role === 'HomeCook' || userData.role === 'Admin' ? (
              <ChefDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />
        <Route
          path="/chef-dashboard"
          element={
            !userData ? (
              <Navigate to="/signin" />
            ) : userData.role === 'HomeCook' || userData.role === 'Admin' ? (
              <ChefDashboard />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        {/* Public marketplace routes */}
        <Route path="/explore" element={<Explore />} />
        <Route path="/food/:foodId" element={<FoodDetail />} />
        <Route path="/item/:foodId" element={<FoodDetail />} />
        <Route path="/regions" element={<AllRegions />} />
        <Route path="/region/:stateName" element={<RegionChefs />} />
        <Route path="/chef/:chefId" element={<ChefMenu />} />

        {/* Catch all redirect to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
};

export default App;