import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMyShop,
  createEditShop,
  addItem,
  editItem,
  deleteItem,
  fetchChefOrders,
  fetchChefAnalytics,
  updateOrderStatusAPI
} from '../redux/chefSlice';
import { setUserData } from '../redux/userSlice';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../App';

const ALL_12_STATES = [
  'Punjab', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu',
  'Kerala', 'Karnataka', 'Maharashtra', 'Gujarat',
  'Rajasthan', 'West Bengal', 'Odisha', 'Uttar Pradesh'
];

const CATEGORIES = [
  'Main Course', 'Breakfast', 'Breads', 'Rice Dishes',
  'Snacks', 'Desserts', 'Sides & Pickles', 'Beverages', 'Traditional'
];

export default function ChefDashboard() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myShop, myShopLoading, chefOrders, analytics, analyticsLoading } = useSelector(state => state.chef);
  const { userData } = useSelector(state => state.user);

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'menu' | 'orders' | 'reviews' | 'profile'
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderFilter, setOrderFilter] = useState('all'); // 'all' | 'pending' | 'confirmed' | 'preparing' | 'delivered'
  const [menuSearch, setMenuSearch] = useState('');

  // Shop Profile state
  const [showShopForm, setShowShopForm] = useState(false);
  const [shopForm, setShopForm] = useState({
    name: '', city: '', state: 'Punjab', address: '', bio: '', specialty: '', experience: ''
  });
  const [shopImage, setShopImage] = useState(null);
  const [shopSaving, setShopSaving] = useState(false);

  // Item state
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    description: '',
    category: 'Main Course',
    foodType: 'veg',
    price: '',
    spiceLevel: 1,
    preparationTime: '25-30 mins',
    servingSize: '1-2 persons',
    ingredients: '',
    image: ''
  });
  const [itemImageFile, setItemImageFile] = useState(null);
  const [itemSaving, setItemSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  // Reviews state
  const [chefReviews, setChefReviews] = useState([]);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    dispatch(fetchMyShop());
    dispatch(fetchChefOrders());
    dispatch(fetchChefAnalytics());
  }, [dispatch]);

  useEffect(() => {
    if (myShop) {
      setShopForm({
        name: myShop.name || '',
        city: myShop.city || '',
        state: myShop.state || 'Punjab',
        address: myShop.address || '',
        bio: myShop.bio || '',
        specialty: myShop.specialization || myShop.specialty || '',
        experience: myShop.yearsOfExperience || myShop.experience || ''
      });
    }
  }, [myShop]);

  useEffect(() => {
    if ((activeTab === 'reviews' || activeTab === 'overview') && myShop?._id) {
      axios.get(`${serverUrl}/api/review/chef/${myShop._id}`)
        .then(res => setChefReviews(res.data || []))
        .catch(err => console.error('Failed to load reviews:', err));
    }
  }, [activeTab, myShop]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true });
      dispatch(setUserData(null));
      navigate('/');
    } catch (e) {
      console.error(e);
    }
  };

  const handleShopSubmit = async (e) => {
    e.preventDefault();
    setShopSaving(true);
    const fd = new FormData();
    Object.entries(shopForm).forEach(([k, v]) => fd.append(k, v));
    if (shopImage) fd.append('image', shopImage);

    try {
      await dispatch(createEditShop(fd)).unwrap();
      setShowShopForm(false);
      setShopImage(null);
      dispatch(fetchChefAnalytics());
      showToast('Kitchen profile updated successfully!');
    } catch (err) {
      console.error(err);
      showToast('Failed to save kitchen profile.');
    } finally {
      setShopSaving(false);
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    setItemSaving(true);
    const fd = new FormData();
    Object.entries(itemForm).forEach(([k, v]) => {
      if (k === 'image' && !v) return;
      fd.append(k, v);
    });
    if (itemImageFile) fd.append('image', itemImageFile);

    try {
      if (editingId) {
        await dispatch(editItem({ itemId: editingId, formData: fd })).unwrap();
        showToast(`Updated "${itemForm.name}"!`);
      } else {
        await dispatch(addItem(fd)).unwrap();
        showToast(`Added "${itemForm.name}" to menu!`);
      }
      setShowItemForm(false);
      setEditingId(null);
      setItemForm({
        name: '', description: '', category: 'Main Course', foodType: 'veg',
        price: '', spiceLevel: 1, preparationTime: '25-30 mins',
        servingSize: '1-2 persons', ingredients: '', image: ''
      });
      setItemImageFile(null);
      dispatch(fetchChefAnalytics());
    } catch (err) {
      console.error(err);
      showToast(typeof err === 'string' ? err : 'Operation failed');
    } finally {
      setItemSaving(false);
    }
  };

  const handleEditClick = (item) => {
    setEditingId(item._id);
    setItemForm({
      name: item.name || '',
      description: item.description || '',
      category: item.category || 'Main Course',
      foodType: item.foodType || 'veg',
      price: item.price || '',
      spiceLevel: item.spiceLevel !== undefined ? item.spiceLevel : (item.spicyLevel || 1),
      preparationTime: item.preparationTime || '25-30 mins',
      servingSize: item.servingSize || '1-2 persons',
      ingredients: Array.isArray(item.ingredients) ? item.ingredients.join(', ') : (item.ingredients || ''),
      image: item.image || ''
    });
    setItemImageFile(null);
    setShowItemForm(true);
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm('Remove this authentic dish from your kitchen menu?')) return;
    setDeletingId(itemId);
    try {
      await dispatch(deleteItem(itemId)).unwrap();
      showToast('Dish removed from menu');
      dispatch(fetchChefAnalytics());
    } catch (err) {
      console.error(err);
      showToast('Failed to delete item');
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAvailability = async (item) => {
    setTogglingId(item._id);
    const fd = new FormData();
    const newStatus = !(item.isAvailable !== false && item.available !== false);
    fd.append('isAvailable', newStatus);
    fd.append('name', item.name);
    fd.append('category', item.category);
    fd.append('foodType', item.foodType);
    fd.append('price', item.price);
    try {
      await dispatch(editItem({ itemId: item._id, formData: fd })).unwrap();
      showToast(`Dish is now ${newStatus ? 'Active & Available' : 'Sold Out for Today'}`);
      dispatch(fetchChefAnalytics());
    } catch (err) {
      console.error(err);
      showToast('Failed to update availability');
    } finally {
      setTogglingId(null);
    }
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    try {
      await dispatch(updateOrderStatusAPI({ orderId, status: newStatus })).unwrap();
      showToast(`Order status updated to "${newStatus}"`);
      dispatch(fetchChefAnalytics());
      dispatch(fetchChefOrders());
    } catch (err) {
      console.error(err);
      showToast('Failed to update order status');
    }
  };

  if (myShopLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center text-stone-400 gap-2">
        <span className="material-symbols-outlined text-4xl animate-spin text-[#D9532F]">progress_activity</span>
        <span className="text-xs font-semibold">Opening Home Chef Workspace...</span>
      </div>
    );
  }

  const items = myShop?.items || [];
  const filteredItems = items.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    const matchesSearch = !menuSearch || item.name.toLowerCase().includes(menuSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const ordersList = chefOrders || [];
  const filteredOrders = ordersList.filter(o => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  // Calculate live or fallback metrics
  const totalOrdersCount = analytics?.totalOrders ?? ordersList.length;
  const todayOrdersCount = analytics?.todaysOrders ?? ordersList.filter(o => {
    const d = new Date(o.createdAt);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  }).length;
  const totalRevenue = analytics?.revenue ?? ordersList.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const avgRatingVal = analytics?.averageRating ?? Number((myShop?.rating?.average || 4.9).toFixed(1));
  const activeDishesCount = analytics?.activeDishes ?? items.filter(i => i.isAvailable !== false && i.available !== false).length;
  const pendingOrdersCount = analytics?.pendingOrders ?? ordersList.filter(o => o.status === 'pending').length;

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-stone-900 text-white text-xs font-bold shadow-xl border border-stone-800 animate-in fade-in slide-in-from-bottom-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <span>{toast}</span>
        </div>
      )}

      {/* ══ TOP KITCHEN NAVIGATION BAR ══ */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <img src="/swaava-logo.svg" alt="Swaava" className="w-8 h-8 rounded-xl" />
              <span className="text-2xl font-black tracking-tight text-stone-900">
                Swaava<span className="text-[#D9532F]">.</span>
              </span>
            </div>

            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FDF2ED] text-[#D9532F] border border-[#F6D5C7] flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">skillet</span>
              <span>Home Chef Workspace</span>
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (myShop?._id) navigate(`/chef/${myShop._id}`);
              }}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#D9532F]">visibility</span>
              <span>View Public Menu</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-stone-100 hover:bg-red-50 hover:text-red-700 text-stone-700 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* ══ MAIN DASHBOARD BODY ══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Kitchen Profile Header Banner */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start sm:items-center gap-5">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 shadow-sm">
              <img
                src={myShop?.profileImage || myShop?.image || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop'}
                alt={myShop?.name}
                className="w-full h-full object-cover"
              />
              {myShop?.isVerified ? (
                <div
                  className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-xs"
                  title="Verified HomeChef"
                >
                  <span className="material-symbols-outlined text-xs font-bold">verified</span>
                </div>
              ) : (
                <div
                  className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold border border-amber-300 shadow-xs"
                  title="Pending Administrator Approval"
                >
                  Pending
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-stone-950 tracking-tight">
                  {myShop?.name || userData?.fullName || 'Your Kitchen'}
                </h1>
                {myShop?.isVerified ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="material-symbols-outlined text-xs font-bold">verified</span>
                    ✓ Verified HomeChef
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="material-symbols-outlined text-xs font-bold">schedule</span>
                    Approval Pending
                  </span>
                )}
                {myShop?.isPureVeg && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900">
                    100% Pure Veg
                  </span>
                )}
              </div>

              <p className="text-xs font-bold text-[#D9532F]">
                {myShop?.specialization || myShop?.specialty || 'Authentic Regional Kitchen'}
              </p>

              <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                <span className="flex items-center gap-0.5">
                  <span className="material-symbols-outlined text-xs text-[#D9532F]">location_on</span>
                  <span>{myShop?.city || 'City'}, <strong>{myShop?.state || 'State'}</strong></span>
                </span>
                <span>•</span>
                <span>{items.length} Total Recipes</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => {
                setShowItemForm(true);
                setEditingId(null);
                setItemForm({
                  name: '', description: '', category: 'Main Course', foodType: 'veg',
                  price: '', spiceLevel: 1, preparationTime: '25-30 mins',
                  servingSize: '1-2 persons', ingredients: '', image: ''
                });
              }}
              className="px-4 py-2.5 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add New Dish</span>
            </button>
            <button
              onClick={() => setShowShopForm(true)}
              className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">edit</span>
              <span>Edit Kitchen Profile</span>
            </button>
          </div>
        </div>

        {/* Verification Status Banner */}
        {myShop && !myShop.isVerified && (
          <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-start gap-3 text-amber-900">
            <span className="material-symbols-outlined text-amber-600 text-xl shrink-0 mt-0.5">pending_actions</span>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-amber-950">Kitchen Verification Pending Admin Review</p>
              <p className="text-amber-800 leading-relaxed">
                Your kitchen profile is currently under review by Swaava Administration. Once approved, the <strong>"✓ Verified HomeChef"</strong> trust badge will be displayed across your profile, dishes, and chef cards.
              </p>
            </div>
          </div>
        )}
        {myShop && myShop.isVerified && (
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200 flex items-center justify-between gap-3 text-emerald-900">
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-emerald-600 text-base font-bold">verified</span>
              <span><strong>Official Partner:</strong> Your kitchen is verified by Swaava Administration. The <strong>✓ Verified HomeChef</strong> trust indicator is active.</span>
            </div>
          </div>
        )}

        {/* ══ TOP METRICS CARDS: REQUIRED DASHBOARD METRICS ══ */}
        <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* 1. Total Orders */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Total Orders</span>
              <span className="material-symbols-outlined text-base text-stone-500">receipt_long</span>
            </div>
            <div>
              <span className="text-2xl font-black text-stone-950">{totalOrdersCount}</span>
              <p className="text-[10px] text-stone-400 mt-0.5">Lifetime orders</p>
            </div>
          </div>

          {/* 2. Today's Orders */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Today's Orders</span>
              <span className="material-symbols-outlined text-base text-sky-500">today</span>
            </div>
            <div>
              <span className="text-2xl font-black text-stone-950">{todayOrdersCount}</span>
              <p className="text-[10px] text-emerald-600 font-semibold mt-0.5">Cooking today</p>
            </div>
          </div>

          {/* 3. Revenue */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Revenue</span>
              <span className="material-symbols-outlined text-base text-emerald-600">payments</span>
            </div>
            <div>
              <span className="text-2xl font-black text-stone-950">₹{totalRevenue}</span>
              <p className="text-[10px] text-stone-400 mt-0.5">Total earnings</p>
            </div>
          </div>

          {/* 4. Average Rating */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Avg Rating</span>
              <span className="material-symbols-outlined text-base text-amber-500 material-symbols-fill">star</span>
            </div>
            <div>
              <span className="text-2xl font-black text-stone-950">{avgRatingVal} ★</span>
              <p className="text-[10px] text-stone-400 mt-0.5">{analytics?.totalReviews || myShop?.rating?.count || 0} reviews</p>
            </div>
          </div>

          {/* 5. Active Dishes */}
          <div className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider">Active Dishes</span>
              <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            </div>
            <div>
              <span className="text-2xl font-black text-stone-950">{activeDishesCount}</span>
              <p className="text-[10px] text-stone-400 mt-0.5">of {items.length} items</p>
            </div>
          </div>

          {/* 6. Pending Orders */}
          <div className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between ${
            pendingOrdersCount > 0 ? 'bg-amber-50/70 border-amber-300 ring-1 ring-amber-200' : 'bg-white border-stone-200'
          }`}>
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800">Pending Orders</span>
              <span className="material-symbols-outlined text-base text-amber-600 animate-pulse">pending</span>
            </div>
            <div>
              <span className="text-2xl font-black text-amber-900">{pendingOrdersCount}</span>
              <p className="text-[10px] text-amber-700 font-semibold mt-0.5">Needs action</p>
            </div>
          </div>
        </section>

        {/* ══ DASHBOARD NAVIGATION TABS ══ */}
        <div className="flex items-center gap-2 border-b border-stone-200 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-[#D9532F] text-[#D9532F]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">dashboard</span>
            <span>Analytics & Feed</span>
          </button>

          <button
            onClick={() => setActiveTab('menu')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'menu'
                ? 'border-[#D9532F] text-[#D9532F]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">restaurant_menu</span>
            <span>Food Management ({items.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-[#D9532F] text-[#D9532F]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">orders</span>
            <span>Order Management ({ordersList.length})</span>
            {pendingOrdersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer shrink-0 flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-[#D9532F] text-[#D9532F]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">reviews</span>
            <span>Diner Reviews</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════
            TAB 1: OVERVIEW & BASIC ANALYTICS
        ══════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left Column: Best-Selling Dishes Leaderboard */}
              <div className="lg:col-span-7 bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-stone-950">Best-Selling Dishes</h2>
                    <p className="text-xs text-stone-400 mt-0.5">Top performing authentic recipes by popularity</p>
                  </div>
                  <span className="text-xs font-bold text-[#D9532F]">Leaderboard</span>
                </div>

                {analytics?.bestSellingDishes && analytics.bestSellingDishes.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.bestSellingDishes.map((dish, idx) => (
                      <div
                        key={dish.id || idx}
                        className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-stone-50 hover:bg-stone-100/80 transition-colors border border-stone-100"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                            idx === 0 ? 'bg-amber-400 text-amber-950 shadow-xs' : idx === 1 ? 'bg-stone-300 text-stone-800' : 'bg-stone-200 text-stone-600'
                          }`}>
                            #{idx + 1}
                          </span>
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-200 shrink-0">
                            <img
                              src={dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&fit=crop'}
                              alt={dish.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-stone-900 truncate">{dish.name}</h4>
                            <p className="text-[11px] text-stone-400 font-medium">₹{dish.price} per portion</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-xs font-black text-stone-900 block">{dish.orderCount} portions sold</span>
                          <span className="text-[11px] font-bold text-emerald-600">₹{dish.totalRevenue} revenue</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-stone-400 space-y-2">
                    <span className="material-symbols-outlined text-3xl text-stone-300">bar_chart</span>
                    <p className="text-xs font-semibold">No sales aggregated yet</p>
                    <p className="text-[11px] text-stone-400">As customer orders come in, your best-selling specialties will rank here.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Order Activity Summary & Rating Breakdown */}
              <div className="lg:col-span-5 space-y-6">
                {/* Kitchen Status Card */}
                <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
                  <h3 className="text-sm font-black text-stone-900">Kitchen Operations Pulse</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium">Pending Kitchen Confirmations</span>
                      <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md">{pendingOrdersCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium">Preparing in Kitchen</span>
                      <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-md">
                        {ordersList.filter(o => o.status === 'preparing').length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-medium">Completed & Delivered</span>
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        {ordersList.filter(o => o.status === 'delivered').length}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('orders')}
                    className="w-full py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    Open Live Order Board
                  </button>
                </div>

                {/* Rating Card */}
                <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Diner Satisfaction</span>
                    <span className="text-3xl font-black text-stone-900 mt-1 block">{avgRatingVal} / 5.0</span>
                    <p className="text-xs text-stone-500 mt-0.5">Based on verified customer reviews</p>
                  </div>
                  <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center font-black text-2xl">
                    ★
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Feed */}
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-stone-950">Recent Kitchen Orders</h3>
                  <p className="text-xs text-stone-400 mt-0.5">Latest orders placed by diners</p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="text-xs font-bold text-[#D9532F] hover:underline cursor-pointer"
                >
                  View All Orders →
                </button>
              </div>

              {ordersList.slice(0, 5).length > 0 ? (
                <div className="divide-y divide-stone-100">
                  {ordersList.slice(0, 5).map(o => (
                    <div key={o._id} className="py-3.5 flex items-center justify-between gap-4 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-stone-900">
                            Order #{o._id.slice(-6).toUpperCase()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                            o.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' :
                            o.status === 'preparing' ? 'bg-sky-50 text-sky-700' :
                            o.status === 'confirmed' ? 'bg-indigo-50 text-indigo-700' :
                            'bg-amber-50 text-amber-800'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                        <p className="text-xs text-stone-400 mt-0.5">
                          {o.customer?.fullName || 'Diner'} • {o.items?.length || 1} items • {new Date(o.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-black text-stone-900 block">₹{o.totalAmount}</span>
                        <span className="text-[10px] text-stone-400 uppercase font-semibold">{o.paymentMethod || 'COD'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-stone-400 py-6 text-center">No orders received yet.</p>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 2: FOOD MANAGEMENT
        ══════════════════════════════════════════════ */}
        {activeTab === 'menu' && (
          <div className="space-y-6">
            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setActiveCategory('All')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    activeCategory === 'All'
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  All Dishes ({items.length})
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                      activeCategory === cat
                        ? 'bg-stone-900 text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative min-w-[200px]">
                <span className="material-symbols-outlined text-stone-400 text-base absolute left-3 top-2.5">search</span>
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Filter dishes..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-medium focus:outline-none focus:border-[#D9532F]"
                />
              </div>
            </div>

            {/* Dishes Grid */}
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredItems.map((item) => {
                  const isAvailable = item.isAvailable !== false && item.available !== false;
                  return (
                    <div
                      key={item._id}
                      className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Dish Header Image */}
                        <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'}
                            alt={item.name}
                            className={`w-full h-full object-cover transition-transform duration-300 ${!isAvailable ? 'grayscale opacity-70' : ''}`}
                          />

                          {/* Dietary Tag */}
                          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-stone-200/60 text-xs font-bold">
                            <span className={`w-2 h-2 rounded-full ${item.foodType === 'veg' ? 'bg-emerald-600' : 'bg-red-600'}`} />
                            <span className={item.foodType === 'veg' ? 'text-emerald-800' : 'text-red-800'}>
                              {item.foodType === 'veg' ? 'Veg' : 'Non-Veg'}
                            </span>
                          </div>

                          {/* Status Badge */}
                          <div className="absolute top-3 right-3">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase backdrop-blur-md ${
                              isAvailable ? 'bg-emerald-600/90 text-white' : 'bg-stone-900/80 text-white'
                            }`}>
                              {isAvailable ? 'Cooked Fresh' : 'Sold Out'}
                            </span>
                          </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9532F]">
                              {item.category || 'Traditional'}
                            </span>
                            <span className="text-base font-black text-stone-950">₹{item.price}</span>
                          </div>

                          <h3 className="text-base font-black text-stone-950 truncate">{item.name}</h3>
                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {item.description || 'Authentic regional preparation using traditional spices and recipes.'}
                          </p>

                          <div className="pt-2 flex items-center justify-between text-xs text-stone-400">
                            <span>Prep: {item.preparationTime || '25-30 mins'}</span>
                            <span>Spice: {item.spiceLevel ?? item.spicyLevel ?? 1}/3</span>
                          </div>
                        </div>
                      </div>

                      {/* Footer Actions: Availability Toggle, Edit, Delete */}
                      <div className="p-5 pt-0 border-t border-stone-100 flex items-center justify-between gap-2 mt-2">
                        {/* Availability Toggle Switch */}
                        <button
                          type="button"
                          disabled={togglingId === item._id}
                          onClick={() => handleToggleAvailability(item)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            isAvailable
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          <span className="material-symbols-outlined text-sm">
                            {isAvailable ? 'toggle_on' : 'toggle_off'}
                          </span>
                          <span>{isAvailable ? 'Active' : 'Sold Out'}</span>
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors cursor-pointer"
                            title="Edit Dish"
                          >
                            <span className="material-symbols-outlined text-base">edit</span>
                          </button>
                          <button
                            disabled={deletingId === item._id}
                            onClick={() => handleDelete(item._id)}
                            className="p-2 rounded-xl bg-stone-100 hover:bg-red-50 hover:text-red-600 text-stone-500 transition-colors cursor-pointer"
                            title="Remove Dish"
                          >
                            <span className="material-symbols-outlined text-base">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto">
                <span className="material-symbols-outlined text-4xl text-stone-300 mb-2">lunch_dining</span>
                <h3 className="text-base font-bold text-stone-800">No dishes found</h3>
                <p className="text-xs text-stone-500 mt-1">Add your heritage regional recipes to start receiving customer orders.</p>
                <button
                  onClick={() => {
                    setShowItemForm(true);
                    setEditingId(null);
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-[#D9532F] text-white text-xs font-bold hover:bg-[#C04321] transition-colors cursor-pointer"
                >
                  Add Your First Dish
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 3: ORDER MANAGEMENT (PENDING -> CONFIRMED -> PREPARING -> DELIVERED)
        ══════════════════════════════════════════════ */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All Orders', count: ordersList.length },
                { id: 'pending', label: 'Pending', count: ordersList.filter(o => o.status === 'pending').length },
                { id: 'confirmed', label: 'Confirmed', count: ordersList.filter(o => o.status === 'confirmed').length },
                { id: 'preparing', label: 'Preparing', count: ordersList.filter(o => o.status === 'preparing').length },
                { id: 'delivered', label: 'Delivered', count: ordersList.filter(o => o.status === 'delivered').length }
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setOrderFilter(f.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1.5 ${
                    orderFilter === f.id
                      ? 'bg-stone-900 text-white shadow-xs'
                      : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    orderFilter === f.id ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {filteredOrders.length > 0 ? (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const itemsInOrder = order.items || [];
                  return (
                    <div
                      key={order._id}
                      className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-xs space-y-5"
                    >
                      {/* Order Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-black text-stone-950">
                              Order #{order._id.slice(-6).toUpperCase()}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${
                              order.status === 'delivered' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              order.status === 'preparing' ? 'bg-sky-50 text-sky-800 border border-sky-200' :
                              order.status === 'confirmed' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                              'bg-amber-50 text-amber-800 border border-amber-300 animate-pulse'
                            }`}>
                              ● {order.status}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 mt-1">
                            Received {new Date(order.createdAt).toLocaleString()}
                          </p>
                        </div>

                        {/* Price & Payment */}
                        <div className="text-left sm:text-right">
                          <span className="text-xl font-black text-stone-950">₹{order.totalAmount}</span>
                          <span className="text-xs text-stone-400 font-semibold block uppercase">
                            Payment: {order.paymentMethod || 'Cash on Delivery'}
                          </span>
                        </div>
                      </div>

                      {/* Diner Contact & Delivery Destination */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-stone-50/70 p-4 rounded-2xl border border-stone-100">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Diner Details</span>
                          <p className="font-bold text-stone-800">{order.customer?.fullName || 'Customer'}</p>
                          <p className="text-stone-500">{order.customer?.email}</p>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-0.5">Delivery Address</span>
                          <p className="text-stone-700 leading-relaxed font-medium">
                            {typeof order.deliveryAddress === 'string' ? order.deliveryAddress : (order.deliveryAddress?.text || 'Address on file')}
                          </p>
                        </div>
                      </div>

                      {/* Items Ordered List */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Ordered Dishes</span>
                        <div className="divide-y divide-stone-100 border border-stone-100 rounded-2xl overflow-hidden">
                          {itemsInOrder.map((item, idx) => (
                            <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl overflow-hidden bg-stone-100 shrink-0">
                                  <img
                                    src={item.image || item.item?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&fit=crop'}
                                    alt={item.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-stone-900">{item.name || item.item?.name}</h4>
                                  <span className="text-[11px] text-stone-400">Qty: {item.quantity || 1} • ₹{item.price} each</span>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-stone-900">₹{(item.price || 0) * (item.quantity || 1)}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Order Action Controls: Pending -> Confirmed -> Preparing -> Delivered */}
                      <div className="pt-3 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-stone-500">Quick Advance:</span>
                          {order.status === 'pending' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order._id, 'confirmed')}
                              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              Confirm Order
                            </button>
                          )}
                          {order.status === 'confirmed' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order._id, 'preparing')}
                              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              Start Preparing
                            </button>
                          )}
                          {order.status === 'preparing' && (
                            <button
                              onClick={() => handleOrderStatusUpdate(order._id, 'delivered')}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              Mark Delivered
                            </button>
                          )}
                          {order.status === 'delivered' && (
                            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                              <span className="material-symbols-outlined text-sm">check_circle</span>
                              Delivered Successfully
                            </span>
                          )}
                        </div>

                        {/* Or Manual Dropdown */}
                        <div className="flex items-center gap-2 self-end sm:self-auto">
                          <span className="text-[11px] font-semibold text-stone-400">Set Status:</span>
                          <select
                            value={order.status || 'pending'}
                            onChange={(e) => handleOrderStatusUpdate(order._id, e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-bold text-stone-800 focus:outline-none focus:border-[#D9532F]"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="preparing">Preparing</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto">
                <span className="material-symbols-outlined text-4xl text-stone-300 mb-2">receipt_long</span>
                <h3 className="text-base font-bold text-stone-800">No {orderFilter !== 'all' ? orderFilter : ''} orders</h3>
                <p className="text-xs text-stone-500 mt-1">Live customer orders will appear here automatically.</p>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════
            TAB 4: DINER REVIEWS
        ══════════════════════════════════════════════ */}
        {activeTab === 'reviews' && (
          <div className="space-y-4">
            {chefReviews && chefReviews.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {chefReviews.map((rev) => (
                  <div key={rev._id} className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900">{rev.customer?.fullName || 'Verified Diner'}</span>
                      <span className="flex items-center gap-0.5 text-xs text-amber-500 font-bold">
                        {'★'.repeat(rev.rating || 5)}
                      </span>
                    </div>
                    <p className="text-xs text-stone-600 leading-relaxed font-normal">
                      "{rev.comment || rev.review || 'Wonderful home-cooked meal! Authentic regional flavours.'}"
                    </p>
                    <span className="text-[10px] text-stone-400 block pt-1">
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Verified Order'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto">
                <span className="material-symbols-outlined text-4xl text-stone-300 mb-2">star</span>
                <h3 className="text-base font-bold text-stone-800">No reviews yet</h3>
                <p className="text-xs text-stone-500 mt-1">Customer reviews and ratings will be listed here after delivered orders.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ══ MODAL: ADD / EDIT DISH ══ */}
      {showItemForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-black text-stone-950">
                {editingId ? 'Edit Authentic Dish' : 'Add New Regional Dish'}
              </h3>
              <button
                onClick={() => setShowItemForm(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleItemSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Dish Name *</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="e.g. Amritsari Kulcha, Gongura Chicken"
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Category *</label>
                  <select
                    value={itemForm.category}
                    onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Dietary Type</label>
                  <select
                    value={itemForm.foodType}
                    onChange={(e) => setItemForm({ ...itemForm, foodType: e.target.value })}
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  >
                    <option value="veg">Vegetarian (Veg)</option>
                    <option value="non veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={itemForm.price}
                    onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    placeholder="240"
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Spice Level (0-3)</label>
                  <select
                    value={itemForm.spiceLevel}
                    onChange={(e) => setItemForm({ ...itemForm, spiceLevel: Number(e.target.value) })}
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  >
                    <option value="0">0 - Mild / Delicate</option>
                    <option value="1">1 - Mildly Spiced</option>
                    <option value="2">2 - Medium Heat</option>
                    <option value="3">3 - Intense Regional Spice</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Prep Time</label>
                  <input
                    type="text"
                    value={itemForm.preparationTime}
                    onChange={(e) => setItemForm({ ...itemForm, preparationTime: e.target.value })}
                    placeholder="25-30 mins"
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Serving Size</label>
                  <input
                    type="text"
                    value={itemForm.servingSize}
                    onChange={(e) => setItemForm({ ...itemForm, servingSize: e.target.value })}
                    placeholder="1-2 persons"
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Key Ingredients</label>
                <input
                  type="text"
                  value={itemForm.ingredients}
                  onChange={(e) => setItemForm({ ...itemForm, ingredients: e.target.value })}
                  placeholder="e.g. Mustard Leaves, Ghee, Ginger, Maize Flour"
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Photo URL (Optional)</label>
                <input
                  type="text"
                  value={itemForm.image}
                  onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Or Upload Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setItemImageFile(e.target.files[0])}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-stone-900 file:text-white cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Heritage Description</label>
                <textarea
                  rows="3"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Describe your authentic ingredients, family heritage, and flavor profile..."
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowItemForm(false)}
                  className="flex-1 py-3 rounded-xl border border-stone-200 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={itemSaving}
                  className="flex-1 py-3 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {itemSaving ? (
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  ) : (
                    <span>{editingId ? 'Save Changes' : 'Publish Dish'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ MODAL: EDIT KITCHEN PROFILE ══ */}
      {showShopForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl my-auto animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-lg font-black text-stone-950">Update Kitchen Profile</h3>
              <button
                onClick={() => setShowShopForm(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleShopSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Kitchen / Chef Name *</label>
                <input
                  type="text"
                  required
                  value={shopForm.name}
                  onChange={(e) => setShopForm({ ...shopForm, name: e.target.value })}
                  placeholder="e.g. Master Chef Gurpreet Kaur"
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Heritage State *</label>
                  <select
                    value={shopForm.state}
                    onChange={(e) => setShopForm({ ...shopForm, state: e.target.value })}
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  >
                    {ALL_12_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">City / Region *</label>
                  <input
                    type="text"
                    required
                    value={shopForm.city}
                    onChange={(e) => setShopForm({ ...shopForm, city: e.target.value })}
                    placeholder="e.g. Amritsar"
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Specialization / Cuisine</label>
                <input
                  type="text"
                  value={shopForm.specialty}
                  onChange={(e) => setShopForm({ ...shopForm, specialty: e.target.value })}
                  placeholder="e.g. Authentic Punjabi Dhaba & Heritage Tandoor"
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Years of Culinary Experience</label>
                <input
                  type="text"
                  value={shopForm.experience}
                  onChange={(e) => setShopForm({ ...shopForm, experience: e.target.value })}
                  placeholder="e.g. 15+ Years"
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Kitchen Address / Landmark</label>
                <input
                  type="text"
                  value={shopForm.address}
                  onChange={(e) => setShopForm({ ...shopForm, address: e.target.value })}
                  placeholder="e.g. Near Golden Temple, Amritsar"
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">About Chef & Story</label>
                <textarea
                  rows="3"
                  value={shopForm.bio}
                  onChange={(e) => setShopForm({ ...shopForm, bio: e.target.value })}
                  placeholder="Share your culinary heritage, ancestral recipe secrets, and family traditions..."
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setShopImage(e.target.files[0])}
                  className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-stone-900 file:text-white cursor-pointer"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowShopForm(false)}
                  className="flex-1 py-3 rounded-xl border border-stone-200 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={shopSaving}
                  className="flex-1 py-3 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {shopSaving ? (
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  ) : (
                    <span>Update Kitchen</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}