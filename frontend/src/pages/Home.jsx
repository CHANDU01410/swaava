import React from 'react';
import { useSelector } from 'react-redux';
import LandingPage from './LandingPage.jsx';
import ChefDashboard from '../components/ChefDashboard.jsx';
import AdminDashboard from '../components/AdminDashboard.jsx';

function Home() {
  const { userData } = useSelector(state => state.user);

  if (!userData) {
    return <LandingPage />;
  }

  // HomeChef role gets the dedicated chef workspace
  if (userData.role === 'HomeCook') {
    return <ChefDashboard />;
  }

  // Admin role gets the platform operations dashboard
  if (userData.role === 'Admin') {
    return <AdminDashboard />;
  }

  // Customer gets the full interactive marketplace
  return <LandingPage />;
}

export default Home;