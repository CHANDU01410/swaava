import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../App';
import {
  setUserData,
  fetchMyOrdersAPI,
  fetchFavoritesAPI,
  fetchRecentlyViewedAPI,
  toggleFavoriteFoodAPI,
  toggleFavoriteChefAPI,
  addAddressAPI,
  deleteAddressAPI,
  addToCartAPI
} from '../redux/userSlice';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function Profile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { userData, myOrders, favorites, favoritesLoading, recentlyViewed, recentlyViewedLoading } = useSelector(state => state.user);

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'addresses' | 'favorites' | 'recently-viewed'
  const [favSubTab, setFavSubTab] = useState('foods'); // 'foods' | 'chefs'

  // Personal details form
  const [form, setForm] = useState({
    fullName: userData?.fullName || '',
    email: userData?.email || '',
    phone: userData?.phone || '',
    city: userData?.city || ''
  });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  // Address form modal
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressForm, setAddressForm] = useState({
    label: 'Home',
    fullAddress: '',
    city: userData?.city || '',
    state: '',
    pincode: '',
    phone: userData?.phone || '',
    isDefault: false
  });
  const [addressSaving, setAddressSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchMyOrdersAPI());
    dispatch(fetchFavoritesAPI());
    dispatch(fetchRecentlyViewedAPI());

    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['profile', 'addresses', 'favorites', 'recently-viewed'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [dispatch, location.search]);

  useEffect(() => {
    if (userData) {
      setForm({
        fullName: userData.fullName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        city: userData.city || ''
      });
    }
  }, [userData]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.put(`${serverUrl}/api/user/profile`, form, { withCredentials: true });
      dispatch(setUserData({ ...userData, ...res.data }));
      showToast('Profile updated successfully!');
    } catch (error) {
      console.error(error);
      showToast('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.fullAddress.trim()) {
      showToast('Address line is required');
      return;
    }
    setAddressSaving(true);
    try {
      await dispatch(addAddressAPI(addressForm)).unwrap();
      showToast('Address added successfully!');
      setShowAddressModal(false);
      setAddressForm({
        label: 'Home',
        fullAddress: '',
        city: userData?.city || '',
        state: '',
        pincode: '',
        phone: userData?.phone || '',
        isDefault: false
      });
    } catch (err) {
      console.error(err);
      showToast('Failed to save address.');
    } finally {
      setAddressSaving(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      await dispatch(deleteAddressAPI(addressId)).unwrap();
      showToast('Address removed.');
    } catch (err) {
      console.error(err);
      showToast('Failed to remove address.');
    }
  };

  const handleToggleFavoriteFood = async (foodId) => {
    try {
      await dispatch(toggleFavoriteFoodAPI(foodId)).unwrap();
      showToast('Favorites updated.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavoriteChef = async (chefId) => {
    try {
      await dispatch(toggleFavoriteChefAPI(chefId)).unwrap();
      showToast('Favorites updated.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = async (food) => {
    try {
      await dispatch(addToCartAPI({
        itemId: food._id,
        name: food.name,
        image: food.image || '',
        price: food.price,
        quantity: 1,
        chef: food.chef?.name || 'Master Chef'
      })).unwrap();
      showToast(`Added ${food.name} to cart!`);
    } catch (err) {
      console.error(err);
      showToast('Failed to add item to cart.');
    }
  };

  const savedAddresses = userData?.addresses || [];
  const favoriteFoods = favorites?.favoriteFoods || [];
  const favoriteChefs = favorites?.favoriteChefs || [];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      <Nav />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-2xl bg-stone-900 text-white text-xs font-bold shadow-xl border border-stone-800 animate-in fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-sm">check_circle</span>
          <span>{toast}</span>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
        {/* User Profile Summary Card */}
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs flex items-center justify-between gap-5 flex-wrap">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-[#D9532F] text-white flex items-center justify-center font-black text-2xl shadow-sm shrink-0">
              {userData?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 truncate">
                  {userData?.fullName || 'User Profile'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-700">
                  {userData?.role === 'HomeCook' ? 'Home Chef' : userData?.role === 'Admin' ? 'Admin' : 'Customer'}
                </span>
              </div>
              <p className="text-xs text-stone-400 truncate mt-0.5">{userData?.email}</p>
              {userData?.city && (
                <p className="text-xs text-stone-500 font-medium flex items-center gap-1 mt-1">
                  <span className="material-symbols-outlined text-xs text-[#D9532F]">location_on</span>
                  <span>{userData.city}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/my-orders')}
              className="px-4 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#D9532F]">receipt_long</span>
              <span>My Orders ({myOrders?.length || 0})</span>
            </button>
            <button
              onClick={() => navigate('/cart')}
              className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">shopping_bag</span>
              <span>Basket</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-stone-200">
          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-[#D9532F] text-[#D9532F]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">person</span>
            <span>Personal Details</span>
          </button>
          <button
            onClick={() => setActiveTab('addresses')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'addresses'
                ? 'border-[#D9532F] text-[#D9532F]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">home_pin</span>
            <span>Saved Addresses ({savedAddresses.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'favorites'
                ? 'border-[#D9532F] text-[#D9532F]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">favorite</span>
            <span>My Favorites ({favoriteFoods.length + favoriteChefs.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('recently-viewed')}
            className={`pb-3 px-4 text-xs font-bold transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
              activeTab === 'recently-viewed'
                ? 'border-[#D9532F] text-[#D9532F]'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">history</span>
            <span>Recently Viewed ({recentlyViewed?.length || 0})</span>
          </button>
        </div>

        {/* ══ TAB 1: PERSONAL DETAILS ══ */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
            <h2 className="text-base font-extrabold text-stone-900 mb-1">Personal Account Details</h2>
            <p className="text-xs text-stone-400 mb-6">Keep your contact information up to date for smooth food deliveries.</p>

            <form onSubmit={handleProfileUpdate} className="space-y-4 max-w-lg">
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  disabled
                  value={form.email}
                  className="w-full p-3 rounded-xl bg-stone-100 border border-stone-200 text-xs font-medium text-stone-500 cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Primary City
                  </label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Bengaluru, Hyderabad, etc."
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer mt-2"
              >
                {saving ? (
                  <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ══ TAB 2: SAVED ADDRESSES ══ */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-stone-900">Saved Delivery Addresses</h2>
                <p className="text-xs text-stone-400 mt-0.5">Manage delivery destinations for fast checkout.</p>
              </div>
              <button
                onClick={() => setShowAddressModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>Add New Address</span>
              </button>
            </div>

            {savedAddresses.length === 0 ? (
              <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-2xl">home_pin</span>
                </div>
                <h3 className="text-sm font-bold text-stone-800">No saved addresses yet</h3>
                <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                  Add your home, office, or family delivery addresses to speed through ordering fresh regional food.
                </p>
                <button
                  onClick={() => setShowAddressModal(true)}
                  className="mt-4 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                >
                  Add Address Now
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    className={`bg-white rounded-2xl border p-5 transition-all shadow-xs relative flex flex-col justify-between ${
                      addr.isDefault ? 'border-[#D9532F]/50 ring-1 ring-[#D9532F]/20' : 'border-stone-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-base text-[#D9532F]">
                            {addr.label?.toLowerCase() === 'work' ? 'work' : 'home'}
                          </span>
                          <span className="text-xs font-bold text-stone-900 uppercase tracking-wide">
                            {addr.label || 'Home'}
                          </span>
                        </div>
                        {addr.isDefault && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/50">
                            Default
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-stone-700 font-medium leading-relaxed mb-2">
                        {addr.fullAddress}
                      </p>
                      <p className="text-[11px] text-stone-400">
                        {[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}
                      </p>
                      {addr.phone && (
                        <p className="text-[11px] text-stone-400 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">call</span>
                          <span>{addr.phone}</span>
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-end">
                      <button
                        onClick={() => handleDeleteAddress(addr._id)}
                        className="text-stone-400 hover:text-red-600 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 3: MY FAVORITES ══ */}
        {activeTab === 'favorites' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h2 className="text-base font-extrabold text-stone-900">Your Culinary Favorites</h2>
                <p className="text-xs text-stone-400 mt-0.5">Quickly access dishes and master home chefs you love.</p>
              </div>

              {/* Sub-tab Pills */}
              <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-xl">
                <button
                  onClick={() => setFavSubTab('foods')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    favSubTab === 'foods'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Favorite Dishes ({favoriteFoods.length})
                </button>
                <button
                  onClick={() => setFavSubTab('chefs')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    favSubTab === 'chefs'
                      ? 'bg-white text-stone-900 shadow-xs'
                      : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  Favorite Chefs ({favoriteChefs.length})
                </button>
              </div>
            </div>

            {/* Favorite Foods */}
            {favSubTab === 'foods' && (
              <div>
                {favoriteFoods.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-2xl">lunch_dining</span>
                    </div>
                    <h3 className="text-sm font-bold text-stone-800">No favorite dishes yet</h3>
                    <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                      Explore our regional specialties and tap the heart icon on any dish to save it here for easy ordering.
                    </p>
                    <button
                      onClick={() => navigate('/explore')}
                      className="mt-4 px-5 py-2.5 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Explore Dishes
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {favoriteFoods.map((item) => (
                      <div
                        key={item._id}
                        className="bg-white rounded-3xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-[16/10] bg-stone-100 overflow-hidden">
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&fit=crop'}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                            {item.state && (
                              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-900/80 backdrop-blur-md text-white text-[10px] font-bold">
                                {item.state}
                              </span>
                            )}
                            <button
                              onClick={() => handleToggleFavoriteFood(item._id)}
                              title="Remove from favorites"
                              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-red-500 hover:scale-110 transition-transform cursor-pointer shadow-sm"
                            >
                              <span className="material-symbols-outlined text-base material-symbols-fill">favorite</span>
                            </button>
                          </div>

                          <div className="p-4">
                            <h4
                              onClick={() => navigate(`/food/${item._id}`)}
                              className="text-sm font-black text-stone-900 hover:text-[#D9532F] transition-colors cursor-pointer truncate"
                            >
                              {item.name}
                            </h4>
                            <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                              {item.description || 'Authentic regional preparation'}
                            </p>
                            <div className="mt-3 flex items-baseline justify-between">
                              <span className="text-base font-black text-stone-900">₹{item.price}</span>
                              {item.rating?.average && (
                                <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                                  <span className="material-symbols-outlined text-xs material-symbols-fill">star</span>
                                  {item.rating.average}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="p-4 pt-0 flex items-center gap-2">
                          <button
                            onClick={() => navigate(`/food/${item._id}`)}
                            className="flex-1 py-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors cursor-pointer text-center"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleAddToCart(item)}
                            className="flex-1 py-2.5 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">shopping_bag</span>
                            <span>Add</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Favorite Chefs */}
            {favSubTab === 'chefs' && (
              <div>
                {favoriteChefs.length === 0 ? (
                  <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center shadow-xs">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center mb-3">
                      <span className="material-symbols-outlined text-2xl">skillet</span>
                    </div>
                    <h3 className="text-sm font-bold text-stone-800">No favorite chefs saved</h3>
                    <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                      Follow master home chefs from Punjab, Bengal, Kerala, and beyond to keep their menus at your fingertips.
                    </p>
                    <button
                      onClick={() => navigate('/explore')}
                      className="mt-4 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer"
                    >
                      Discover Chefs
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {favoriteChefs.map((chef) => (
                      <div
                        key={chef._id}
                        className="bg-white rounded-3xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-3">
                            <div className="w-14 h-14 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                              <img
                                src={chef.image || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=300&fit=crop'}
                                alt={chef.name}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <button
                              onClick={() => handleToggleFavoriteChef(chef._id)}
                              title="Remove from favorites"
                              className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-red-500 hover:scale-110 transition-transform cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base material-symbols-fill">favorite</span>
                            </button>
                          </div>

                          <div className="mt-3">
                            <h4
                              onClick={() => navigate(`/chef/${chef._id}`)}
                              className="text-sm font-black text-stone-900 hover:text-[#D9532F] transition-colors cursor-pointer truncate"
                            >
                              {chef.name}
                            </h4>
                            <p className="text-xs text-[#D9532F] font-bold mt-0.5">
                              {chef.specialization || 'Heritage Home Cook'}
                            </p>
                            <p className="text-xs text-stone-400 mt-1 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">location_on</span>
                              <span>{[chef.city, chef.state].filter(Boolean).join(', ') || 'India'}</span>
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                          <span className="text-xs text-stone-500 font-medium">
                            {chef.experienceYears ? `${chef.experienceYears}+ yrs exp.` : 'Authentic recipe keeper'}
                          </span>
                          <button
                            onClick={() => navigate(`/chef/${chef._id}`)}
                            className="px-3.5 py-1.5 rounded-xl bg-stone-900 hover:bg-black text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Visit Kitchen
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ══ TAB 4: RECENTLY VIEWED DISHES ══ */}
        {activeTab === 'recently-viewed' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-8 shadow-xs">
              <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#D9532F] text-xl">history</span>
                    <h2 className="text-base font-extrabold text-stone-900">Recently Viewed Dishes</h2>
                  </div>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Dishes you explored recently across Indian states. Up to 8 most recent items are saved.
                  </p>
                </div>
                <button
                  onClick={() => navigate('/explore')}
                  className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-xs font-bold text-stone-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">search</span>
                  <span>Explore Menu</span>
                </button>
              </div>

              {recentlyViewedLoading ? (
                <div className="py-12 text-center text-xs text-stone-400">Loading recently viewed dishes...</div>
              ) : !recentlyViewed || recentlyViewed.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400 mb-3">
                    <span className="material-symbols-outlined text-xl">history</span>
                  </div>
                  <h3 className="text-sm font-bold text-stone-800">No recently viewed dishes yet</h3>
                  <p className="text-xs text-stone-400 mt-1 max-w-sm mx-auto">
                    When you view dishes across our regional culinary partners, they will appear here so you can easily return and order.
                  </p>
                  <button
                    onClick={() => navigate('/explore')}
                    className="mt-4 px-5 py-2 rounded-xl bg-[#D9532F] text-white text-xs font-bold hover:bg-[#C04321] transition-all cursor-pointer"
                  >
                    Start Browsing Dishes
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentlyViewed.map((food) => (
                    <div
                      key={food._id}
                      className="bg-[#FAFAF8] rounded-2xl border border-stone-200/80 p-4 flex flex-col justify-between hover:shadow-md transition-all group"
                    >
                      <div>
                        <div
                          onClick={() => navigate(`/food/${food._id}`)}
                          className="relative aspect-4/3 rounded-xl overflow-hidden bg-stone-100 mb-3 cursor-pointer"
                        >
                          <img
                            src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&fit=crop'}
                            alt={food.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-2 left-2 flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${food.foodType === 'veg' || food.vegetarian ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-xs">
                              {food.state || 'Authentic'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start justify-between gap-2">
                          <h3
                            onClick={() => navigate(`/food/${food._id}`)}
                            className="text-sm font-black text-stone-900 hover:text-[#D9532F] transition-colors cursor-pointer line-clamp-1"
                          >
                            {food.name}
                          </h3>
                          <span className="text-xs font-black text-stone-900 shrink-0">₹{food.price}</span>
                        </div>

                        {food.category && (
                          <p className="text-[11px] text-stone-500 mt-0.5 line-clamp-1">
                            {food.category}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-stone-200/60 flex items-center justify-between gap-2">
                        <button
                          onClick={() => navigate(`/food/${food._id}`)}
                          className="text-xs font-bold text-stone-600 hover:text-stone-900 cursor-pointer"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => handleAddToCart(food)}
                          className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-xs">add_shopping_cart</span>
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ══ ADD ADDRESS MODAL ══ */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="text-base font-black text-stone-900">Add Delivery Address</h3>
                <p className="text-xs text-stone-400">Save for seamless 1-click checkout</p>
              </div>
              <button
                onClick={() => setShowAddressModal(false)}
                className="w-8 h-8 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 flex items-center justify-center cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAddAddress} className="space-y-3.5">
              {/* Address Label Pills */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                  Address Label
                </label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map(lbl => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        addressForm.label === lbl
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                  Full Street Address & Landmark *
                </label>
                <textarea
                  required
                  rows={2}
                  value={addressForm.fullAddress}
                  onChange={(e) => setAddressForm({ ...addressForm, fullAddress: e.target.value })}
                  placeholder="Flat No, Building, Street, Near Landmark"
                  className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    placeholder="Bengaluru"
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={addressForm.state}
                    onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                    placeholder="Karnataka"
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    placeholder="560001"
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
                    Delivery Contact Phone
                  </label>
                  <input
                    type="text"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    placeholder="+91 9876543210"
                    className="w-full p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={addressForm.isDefault}
                  onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                  className="rounded text-[#D9532F] focus:ring-[#D9532F]"
                />
                <label htmlFor="isDefault" className="text-xs text-stone-600 font-medium cursor-pointer">
                  Set as default delivery address
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 py-3 rounded-xl border border-stone-200 text-stone-600 text-xs font-bold hover:bg-stone-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addressSaving}
                  className="flex-1 py-3 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  {addressSaving ? (
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                  ) : (
                    <span>Save Address</span>
                  )}
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