import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App';
import Nav from './Nav';
import Footer from './Footer';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { userData } = useSelector(state => state.user);

  // Tab navigation
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'chefs' | 'users' | 'foods' | 'states' | 'orders' | 'reviews'

  // Data states
  const [metrics, setMetrics] = useState(null);
  const [metricsLoading, setMetricsLoading] = useState(true);

  const [chefs, setChefs] = useState([]);
  const [chefFilter, setChefFilter] = useState('all'); // 'all' | 'pending' | 'verified'

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  const [foods, setFoods] = useState([]);
  const [foodSearch, setFoodSearch] = useState('');

  const [states, setStates] = useState([]);
  const [showStateModal, setShowStateModal] = useState(false);
  const [stateForm, setStateForm] = useState({ name: '', description: '', image: '', famousDishes: '' });

  const [orders, setOrders] = useState([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const [reviews, setReviews] = useState([]);

  // UI state
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch metrics on mount
  const fetchMetrics = async () => {
    try {
      setMetricsLoading(true);
      const res = await axios.get(`${serverUrl}/api/admin/dashboard`, { withCredentials: true });
      setMetrics(res.data);
    } catch (err) {
      console.error('Failed to fetch admin metrics:', err);
    } finally {
      setMetricsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  // Fetch data per tab
  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'chefs') {
      axios.get(`${serverUrl}/api/admin/chefs?filter=${chefFilter}`, { withCredentials: true })
        .then(res => setChefs(res.data || []))
        .catch(console.error);
    }
    if (activeTab === 'users') {
      axios.get(`${serverUrl}/api/admin/users?search=${encodeURIComponent(userSearch)}`, { withCredentials: true })
        .then(res => setUsers(res.data || []))
        .catch(console.error);
    }
    if (activeTab === 'foods') {
      axios.get(`${serverUrl}/api/admin/foods?search=${encodeURIComponent(foodSearch)}`, { withCredentials: true })
        .then(res => setFoods(res.data || []))
        .catch(console.error);
    }
    if (activeTab === 'states') {
      axios.get(`${serverUrl}/api/admin/states`, { withCredentials: true })
        .then(res => setStates(res.data || []))
        .catch(console.error);
    }
    if (activeTab === 'orders') {
      axios.get(`${serverUrl}/api/admin/orders?status=${orderStatusFilter}`, { withCredentials: true })
        .then(res => setOrders(res.data || []))
        .catch(console.error);
    }
    if (activeTab === 'reviews') {
      axios.get(`${serverUrl}/api/admin/reviews`, { withCredentials: true })
        .then(res => setReviews(res.data || []))
        .catch(console.error);
    }
  }, [activeTab, chefFilter, userSearch, foodSearch, orderStatusFilter]);

  // ── Chef Approval Handlers ──
  const handleToggleChefVerify = async (chefId, currentStatus) => {
    try {
      const res = await axios.put(`${serverUrl}/api/admin/chefs/${chefId}/verify`, { isVerified: !currentStatus }, { withCredentials: true });
      setChefs(chefs.map(c => c._id === chefId ? res.data : c));
      showToast(`Chef "${res.data.name}" is now ${res.data.isVerified ? 'Approved & Verified' : 'Unverified'}`);
      fetchMetrics();
    } catch (err) {
      console.error(err);
      showToast('Failed to update verification status');
    }
  };

  const handleDeleteChef = async (chefId) => {
    if (!window.confirm('Delete this chef profile and all associated dishes?')) return;
    try {
      await axios.delete(`${serverUrl}/api/admin/chefs/${chefId}`, { withCredentials: true });
      setChefs(chefs.filter(c => c._id !== chefId));
      showToast('Chef removed from platform');
      fetchMetrics();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete chef');
    }
  };

  // ── User Management Handlers ──
  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      const res = await axios.put(`${serverUrl}/api/admin/users/${userId}/role`, { role: newRole }, { withCredentials: true });
      setUsers(users.map(u => u._id === userId ? res.data : u));
      showToast(`Role updated to ${newRole}`);
      fetchMetrics();
    } catch (err) {
      console.error(err);
      showToast('Failed to update user role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user account?')) return;
    try {
      await axios.delete(`${serverUrl}/api/admin/users/${userId}`, { withCredentials: true });
      setUsers(users.filter(u => u._id !== userId));
      showToast('User account deleted');
      fetchMetrics();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete user');
    }
  };

  // ── Food Management Handlers ──
  const handleToggleFoodAvailability = async (food) => {
    try {
      const newAvail = !(food.isAvailable !== false && food.available !== false);
      const res = await axios.put(`${serverUrl}/api/admin/foods/${food._id}`, { isAvailable: newAvail, available: newAvail }, { withCredentials: true });
      setFoods(foods.map(f => f._id === food._id ? res.data : f));
      showToast(`Dish is now ${newAvail ? 'Available' : 'Unavailable'}`);
    } catch (err) {
      console.error(err);
      showToast('Failed to update dish availability');
    }
  };

  const handleDeleteFood = async (foodId) => {
    if (!window.confirm('Permanently delete this dish from catalog?')) return;
    try {
      await axios.delete(`${serverUrl}/api/admin/foods/${foodId}`, { withCredentials: true });
      setFoods(foods.filter(f => f._id !== foodId));
      showToast('Dish deleted');
      fetchMetrics();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete dish');
    }
  };

  // ── State Management Handlers ──
  const handleCreateState = async (e) => {
    e.preventDefault();
    if (!stateForm.name.trim()) return;
    try {
      const dishesArr = stateForm.famousDishes.split(',').map(s => s.trim()).filter(Boolean);
      const res = await axios.post(`${serverUrl}/api/admin/states`, {
        name: stateForm.name,
        description: stateForm.description,
        image: stateForm.image,
        famousDishes: dishesArr
      }, { withCredentials: true });
      setStates([...states, res.data]);
      setShowStateModal(false);
      setStateForm({ name: '', description: '', image: '', famousDishes: '' });
      showToast(`State "${res.data.name}" added to catalog`);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to add state');
    }
  };

  const handleDeleteState = async (stateId) => {
    if (!window.confirm('Are you sure you want to remove this state region?')) return;
    try {
      await axios.delete(`${serverUrl}/api/admin/states/${stateId}`, { withCredentials: true });
      setStates(states.filter(s => s._id !== stateId));
      showToast('State removed');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete state');
    }
  };

  // ── Order Management Handlers ──
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      const res = await axios.put(`${serverUrl}/api/admin/orders/${orderId}/status`, { status: newStatus }, { withCredentials: true });
      setOrders(orders.map(o => o._id === orderId ? res.data : o));
      showToast(`Order status updated to "${newStatus}"`);
      fetchMetrics();
    } catch (err) {
      console.error(err);
      showToast('Failed to update order status');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm('Permanently remove this order record?')) return;
    try {
      await axios.delete(`${serverUrl}/api/admin/orders/${orderId}`, { withCredentials: true });
      setOrders(orders.filter(o => o._id !== orderId));
      showToast('Order record removed');
      fetchMetrics();
    } catch (err) {
      console.error(err);
      showToast('Failed to remove order');
    }
  };

  // ── Review Moderation Handlers ──
  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this diner review?')) return;
    try {
      await axios.delete(`${serverUrl}/api/admin/reviews/${reviewId}`, { withCredentials: true });
      setReviews(reviews.filter(r => r._id !== reviewId));
      showToast('Review removed');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete review');
    }
  };

  const pendingApprovalsCount = metrics?.pendingChefApprovals || 0;

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      <Nav />

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-stone-900 text-white text-xs font-bold shadow-xl border border-stone-800 animate-in fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <span>{toast}</span>
        </div>
      )}

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                Master Administration
              </span>
              <span className="text-xs text-stone-400">Platform Operations & Quality Control</span>
            </div>
            <h1 className="text-3xl font-black text-stone-900 tracking-tight mt-1">
              Swaava Platform Console
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Live oversight of users, regional home chefs, dish approvals, orders, and food quality standards.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/explore')}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base text-[#D9532F]">storefront</span>
              <span>Public Store</span>
            </button>
            <button
              onClick={fetchMetrics}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-stone-900 text-white hover:bg-black transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <span className="material-symbols-outlined text-base">refresh</span>
              <span>Sync Metrics</span>
            </button>
          </div>
        </div>

        {/* ══ TOP 6 DASHBOARD KPI METRIC CARDS ══ */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Total Users */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Total Users</span>
              <span className="material-symbols-outlined text-base text-stone-600">group</span>
            </div>
            <div>
              <span className="text-2xl font-black text-stone-900">{metrics?.totalUsers ?? '...'}</span>
              <p className="text-[10px] text-stone-400 mt-0.5">Diners & chefs</p>
            </div>
          </div>

          {/* 2. Total HomeChefs */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Home Chefs</span>
              <span className="material-symbols-outlined text-base text-[#D9532F]">skillet</span>
            </div>
            <div>
              <span className="text-2xl font-black text-stone-900">{metrics?.totalHomeChefs ?? '...'}</span>
              <p className="text-[10px] text-stone-400 mt-0.5">Kitchen partners</p>
            </div>
          </div>

          {/* 3. Pending Chef Approvals */}
          <div
            onClick={() => { setActiveTab('chefs'); setChefFilter('pending'); }}
            className={`p-4 rounded-2xl border shadow-xs flex flex-col justify-between cursor-pointer transition-all ${
              pendingApprovalsCount > 0
                ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200 hover:bg-amber-50'
                : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">Pending Approvals</span>
              <span className="material-symbols-outlined text-base text-amber-600">verified_user</span>
            </div>
            <div>
              <span className="text-2xl font-black text-amber-900">{pendingApprovalsCount}</span>
              <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                {pendingApprovalsCount > 0 ? 'Action required →' : 'Queue clear'}
              </p>
            </div>
          </div>

          {/* 4. Total Orders */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Total Orders</span>
              <span className="material-symbols-outlined text-base text-sky-600">receipt_long</span>
            </div>
            <div>
              <span className="text-2xl font-black text-stone-900">{metrics?.totalOrders ?? '...'}</span>
              <p className="text-[10px] text-stone-400 mt-0.5">Placed on platform</p>
            </div>
          </div>

          {/* 5. Total Revenue */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Total Revenue</span>
              <span className="material-symbols-outlined text-base text-emerald-600">payments</span>
            </div>
            <div>
              <span className="text-2xl font-black text-stone-900">₹{metrics?.totalRevenue ?? '...'}</span>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Gross volume</p>
            </div>
          </div>

          {/* 6. Total Food Items */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Total Dishes</span>
              <span className="material-symbols-outlined text-base text-stone-600">lunch_dining</span>
            </div>
            <div>
              <span className="text-2xl font-black text-stone-900">{metrics?.totalFoodItems ?? '...'}</span>
              <p className="text-[10px] text-stone-400 mt-0.5">In catalog</p>
            </div>
          </div>
        </section>

        {/* ══ MANAGEMENT NAVIGATION TABS ══ */}
        <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto scrollbar-none">
          {[
            { id: 'overview', label: 'Overview', icon: 'dashboard' },
            { id: 'chefs', label: `Chefs & Approvals`, icon: 'skillet', badge: pendingApprovalsCount },
            { id: 'users', label: 'Users', icon: 'group' },
            { id: 'foods', label: 'Foods', icon: 'lunch_dining' },
            { id: 'states', label: 'States', icon: 'map' },
            { id: 'orders', label: 'Orders', icon: 'orders' },
            { id: 'reviews', label: 'Reviews', icon: 'reviews' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer shrink-0 flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-[#D9532F] text-[#D9532F]'
                  : 'border-transparent text-stone-500 hover:text-stone-900'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════════════
            TAB 1: OVERVIEW DASHBOARD
        ══════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Pending Approvals Callout Banner if any */}
            {pendingApprovalsCount > 0 && (
              <div className="p-5 rounded-3xl bg-amber-50 border border-amber-300 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center font-bold">
                    <span className="material-symbols-outlined">pending_actions</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">
                      {pendingApprovalsCount} Home Chef Application{pendingApprovalsCount > 1 ? 's' : ''} Awaiting Approval
                    </h3>
                    <p className="text-xs text-amber-800">
                      Review kitchen credentials and food hygiene standards to grant public kitchen verification.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setActiveTab('chefs'); setChefFilter('pending'); }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  Review Approvals Queue →
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">verified</span>
                </div>
                <h3 className="text-sm font-bold text-stone-900">Verified Home Chef Network</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Home chefs across 12 Indian states preserving culinary heritage. Fast approval turnaround keeps our catalog growing with authentic meals.
                </p>
                <button
                  onClick={() => setActiveTab('chefs')}
                  className="text-xs font-bold text-[#D9532F] hover:underline block pt-1 cursor-pointer"
                >
                  Manage Chefs ({metrics?.totalHomeChefs || 0}) →
                </button>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">lunch_dining</span>
                </div>
                <h3 className="text-sm font-bold text-stone-900">Regional Food Catalog</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Live database of dishes from Punjab, Bengal, Tamil Nadu, Andhra Pradesh, Kerala, and beyond. Admin can adjust pricing and audit availability.
                </p>
                <button
                  onClick={() => setActiveTab('foods')}
                  className="text-xs font-bold text-[#D9532F] hover:underline block pt-1 cursor-pointer"
                >
                  Manage Dishes ({metrics?.totalFoodItems || 0}) →
                </button>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-stone-200 shadow-xs space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">shield_person</span>
                </div>
                <h3 className="text-sm font-bold text-stone-900">RBAC Security & Moderation</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Strict backend role enforcement. Customers, HomeChefs, and Administrators are segregated with zero privilege escalation risk.
                </p>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-xs font-bold text-[#D9532F] hover:underline block pt-1 cursor-pointer"
                >
                  Manage Users ({metrics?.totalUsers || 0}) →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 2: CHEF APPROVALS & HOME CHEFS
        ══════════════════════════════════════════════ */}
        {activeTab === 'chefs' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-black text-stone-950">Home Chef Kitchen Approvals</h2>
                <p className="text-xs text-stone-400 mt-0.5">Approve new chef kitchens and verify regional authenticity.</p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl">
                {[
                  { id: 'all', label: 'All Chefs' },
                  { id: 'pending', label: `Pending Approval (${pendingApprovalsCount})` },
                  { id: 'verified', label: 'Approved Chefs' }
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setChefFilter(f.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      chefFilter === f.id
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chefs Table */}
            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Chef & Kitchen</th>
                      <th className="py-3.5 px-4">Region / City</th>
                      <th className="py-3.5 px-4">Dishes</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Approval Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {chefs.map(chef => (
                      <tr key={chef._id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                              <img
                                src={chef.profileImage || chef.image || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&fit=crop'}
                                alt={chef.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div>
                              <span className="font-bold text-stone-900 block truncate">{chef.name}</span>
                              <span className="text-[11px] text-stone-400">{chef.specialization || chef.specialty || 'Heritage Cook'}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-stone-800">{chef.state}</span>
                          <span className="text-stone-400 block text-[11px]">{chef.city}</span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-stone-700">
                          {chef.items?.length || 0} dishes
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase inline-flex items-center gap-1 ${
                            chef.isVerified
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-300'
                          }`}>
                            <span className="material-symbols-outlined text-xs">
                              {chef.isVerified ? 'verified' : 'pending'}
                            </span>
                            <span>{chef.isVerified ? 'Verified' : 'Pending'}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleChefVerify(chef._id, chef.isVerified)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                                chef.isVerified
                                  ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                              }`}
                            >
                              {chef.isVerified ? 'Revoke Approval' : 'Approve Kitchen'}
                            </button>
                            <button
                              onClick={() => handleDeleteChef(chef._id)}
                              className="p-1.5 rounded-xl hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Chef"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 3: USER MANAGEMENT
        ══════════════════════════════════════════════ */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-black text-stone-950">Platform User Management</h2>
                <p className="text-xs text-stone-400 mt-0.5">Manage customer, home chef, and administrator permissions.</p>
              </div>

              <div className="relative min-w-[240px]">
                <span className="material-symbols-outlined text-stone-400 text-base absolute left-3 top-2.5">search</span>
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search by name, email, city..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#D9532F]"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">User</th>
                      <th className="py-3.5 px-4">Email</th>
                      <th className="py-3.5 px-4">City</th>
                      <th className="py-3.5 px-4">Current Role</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {users.map(u => (
                      <tr key={u._id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-stone-900">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-black text-xs text-stone-600">
                              {u.fullName?.charAt(0) || 'U'}
                            </div>
                            <span>{u.fullName}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 text-stone-600">{u.email}</td>
                        <td className="py-3.5 px-4 text-stone-500">{u.city || '—'}</td>

                        <td className="py-3.5 px-4">
                          <select
                            value={u.role}
                            onChange={(e) => handleUpdateUserRole(u._id, e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-bold bg-stone-50 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                          >
                            <option value="Customer">Customer</option>
                            <option value="HomeCook">HomeCook (Chef)</option>
                            <option value="Admin">Admin</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="p-1.5 rounded-xl hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete User"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 4: FOOD MANAGEMENT
        ══════════════════════════════════════════════ */}
        {activeTab === 'foods' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-black text-stone-950">Platform Food Catalog</h2>
                <p className="text-xs text-stone-400 mt-0.5">Audit authentic regional dishes across all kitchen partners.</p>
              </div>

              <div className="relative min-w-[240px]">
                <span className="material-symbols-outlined text-stone-400 text-base absolute left-3 top-2.5">search</span>
                <input
                  type="text"
                  value={foodSearch}
                  onChange={(e) => setFoodSearch(e.target.value)}
                  placeholder="Search dish or state..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#D9532F]"
                />
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Dish</th>
                      <th className="py-3.5 px-4">State</th>
                      <th className="py-3.5 px-4">Chef Attribution</th>
                      <th className="py-3.5 px-4">Price</th>
                      <th className="py-3.5 px-4">Availability</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {foods.map(f => {
                      const isAvail = f.isAvailable !== false && f.available !== false;
                      const chefName = f.chef?.name || f.shop?.name || 'Partner Kitchen';
                      return (
                        <tr key={f._id} className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                                <img
                                  src={f.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&fit=crop'}
                                  alt={f.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <span className="font-bold text-stone-900 block truncate">{f.name}</span>
                                <span className="text-[10px] text-stone-400 uppercase font-semibold">{f.category}</span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-stone-800">{f.state}</td>
                          <td className="py-3.5 px-4 text-stone-600">{chefName}</td>
                          <td className="py-3.5 px-4 font-black text-stone-900">₹{f.price}</td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => handleToggleFoodAvailability(f)}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                                isAvail ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {isAvail ? '● Active' : '○ Sold Out'}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDeleteFood(f._id)}
                              className="p-1.5 rounded-xl hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete Dish"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 5: STATE / REGIONAL MANAGEMENT
        ══════════════════════════════════════════════ */}
        {activeTab === 'states' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-black text-stone-950">Regional States</h2>
                <p className="text-xs text-stone-400 mt-0.5">Culinary territories currently live on Swaava.</p>
              </div>

              <button
                onClick={() => setShowStateModal(true)}
                className="px-4 py-2 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Add New State</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {states.map(state => (
                <div key={state._id} className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="relative aspect-[16/9] rounded-2xl overflow-hidden bg-stone-100 mb-3">
                      <img
                        src={state.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&fit=crop'}
                        alt={state.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <h3 className="font-black text-base text-stone-900">{state.name}</h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">{state.description}</p>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
                      <span>{state.chefCount || 0} Home Chefs</span>
                      <span>•</span>
                      <span>{state.dishCount || 0} Heritage Dishes</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex justify-end">
                    <button
                      onClick={() => handleDeleteState(state._id)}
                      className="text-stone-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 6: PLATFORM ORDERS
        ══════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-black text-stone-950">Platform Orders</h2>
                <p className="text-xs text-stone-400 mt-0.5">Real-time orders across all regional kitchen networks.</p>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl overflow-x-auto scrollbar-none">
                {['all', 'pending', 'confirmed', 'preparing', 'delivered', 'cancelled'].map(st => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      orderStatusFilter === st
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-stone-500 hover:text-stone-900'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-400 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Order ID & Date</th>
                      <th className="py-3.5 px-4">Diner</th>
                      <th className="py-3.5 px-4">Chef Kitchen</th>
                      <th className="py-3.5 px-4">Total</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {orders.map(o => (
                      <tr key={o._id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-stone-900 block">#{o._id.slice(-6).toUpperCase()}</span>
                          <span className="text-[10px] text-stone-400">{new Date(o.createdAt).toLocaleString()}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-stone-800 block">{o.customer?.fullName || 'Customer'}</span>
                          <span className="text-[11px] text-stone-400">{o.customer?.email}</span>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-stone-800">{o.chef?.name || 'Chef'}</span>
                          <span className="text-[10px] text-stone-400 block">{o.chef?.city}, {o.chef?.state}</span>
                        </td>

                        <td className="py-3.5 px-4 font-black text-stone-900">₹{o.totalAmount}</td>

                        <td className="py-3.5 px-4">
                          <select
                            value={o.status || 'pending'}
                            onChange={(e) => handleUpdateOrderStatus(o._id, e.target.value)}
                            className="px-2.5 py-1 rounded-lg border border-stone-200 text-xs font-bold bg-stone-50 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDeleteOrder(o._id)}
                            className="p-1.5 rounded-xl hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
                            title="Delete Order Record"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 7: REVIEW MODERATION
        ══════════════════════════════════════════════ */}
        {activeTab === 'reviews' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-black text-stone-950">Diner Review Moderation</h2>
              <p className="text-xs text-stone-400 mt-0.5">Moderate customer feedback and remove inappropriate content.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map(rev => (
                <div key={rev._id} className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{rev.customer?.fullName || 'Verified Diner'}</span>
                      <span className="text-amber-500 font-bold text-xs">{'★'.repeat(rev.rating || 5)}</span>
                    </div>

                    <p className="text-xs text-stone-600 leading-relaxed font-normal">
                      "{rev.comment || 'Authentic regional preparation'}"
                    </p>

                    <div className="text-[11px] text-stone-400 pt-1">
                      <span>Kitchen: <strong>{rev.chef?.name || 'Chef'}</strong></span>
                      {rev.item?.name && <span> • Dish: <strong>{rev.item.name}</strong></span>}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[10px] text-stone-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                    <button
                      onClick={() => handleDeleteReview(rev._id)}
                      className="text-stone-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                      <span>Remove Review</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ══ ADD STATE MODAL ══ */}
      {showStateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-base font-black text-stone-950">Add Regional State</h3>
              <button
                onClick={() => setShowStateModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateState} className="space-y-3.5 text-xs font-medium">
              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">State Name *</label>
                <input
                  type="text"
                  required
                  value={stateForm.name}
                  onChange={(e) => setStateForm({ ...stateForm, name: e.target.value })}
                  placeholder="e.g. Assam, Kashmir"
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Hero Image URL</label>
                <input
                  type="text"
                  value={stateForm.image}
                  onChange={(e) => setStateForm({ ...stateForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Heritage Story / Description</label>
                <textarea
                  rows="2"
                  value={stateForm.description}
                  onChange={(e) => setStateForm({ ...stateForm, description: e.target.value })}
                  placeholder="Culinary culture and traditions..."
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Famous Dishes (comma-separated)</label>
                <input
                  type="text"
                  value={stateForm.famousDishes}
                  onChange={(e) => setStateForm({ ...stateForm, famousDishes: e.target.value })}
                  placeholder="Dish 1, Dish 2, Dish 3"
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowStateModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-stone-200 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white font-bold transition-all cursor-pointer shadow-xs"
                >
                  Save State
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
