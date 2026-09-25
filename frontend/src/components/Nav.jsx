import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App';
import { setUserData, setMyOrders, setSearchItems } from '../redux/userSlice';

const POPULAR_STATES = [
  'Punjab', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu',
  'Kerala', 'Karnataka', 'Maharashtra', 'Gujarat',
  'Rajasthan', 'West Bengal', 'Odisha', 'Uttar Pradesh'
];

export default function Nav() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { userData, cartItems, totalAmount, currentCity } = useSelector(state => state.user);

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showStateDropdown, setShowStateDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const searchRef = useRef(null);
  const profileRef = useRef(null);
  const stateRef = useRef(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (stateRef.current && !stateRef.current.contains(e.target)) {
        setShowStateDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      dispatch(setSearchItems(null));
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await axios.get(`${serverUrl}/api/item/search-items?query=${encodeURIComponent(query)}`);
        setSearchResults(res.data || []);
        dispatch(setSearchItems(res.data || []));
        setShowSearchDropdown(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [query, dispatch]);

  const handleLogout = async () => {
    try {
      await axios.get(`${serverUrl}/api/auth/signout`, { withCredentials: true });
      dispatch(setUserData(null));
      dispatch(setMyOrders([]));
      setShowProfileMenu(false);
      setMobileMenuOpen(false);
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const totalCartCount = cartItems?.reduce((acc, item) => acc + (item.quantity || 1), 0) || 0;

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 gap-4">
          {/* Left: Brand Logo & State Switcher */}
          <div className="flex items-center gap-6 shrink-0">
            <div
              onClick={() => navigate('/')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <img
                src="/swaava-logo.svg"
                alt="Swaava"
                className="w-8 h-8 rounded-xl shadow-xs transition-transform duration-200 group-hover:scale-105"
              />
              <span className="text-2xl font-black tracking-tight text-stone-900">
                Swaava<span className="text-[#D9532F]">.</span>
              </span>
            </div>

            {/* Regional State Selector Pill */}
            <div className="relative hidden md:block" ref={stateRef}>
              <button
                onClick={() => setShowStateDropdown(!showStateDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-stone-100 hover:bg-stone-200/80 text-stone-700 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-[#D9532F]">map</span>
                <span>Explore 12 States</span>
                <span className="material-symbols-outlined text-xs text-stone-400">expand_more</span>
              </button>

              {showStateDropdown && (
                <div className="absolute top-full left-0 mt-2 w-64 p-2 bg-white rounded-2xl shadow-xl border border-stone-200 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-stone-400">
                    Authentic Cuisines
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-0.5">
                    {POPULAR_STATES.map((state) => (
                      <button
                        key={state}
                        onClick={() => {
                          setShowStateDropdown(false);
                          navigate(`/region/${encodeURIComponent(state)}`);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-[#FDF2ED] hover:text-[#D9532F] transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>{state}</span>
                        <span className="material-symbols-outlined text-[13px] text-stone-300">chevron_right</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Live Search Bar (Desktop) */}
          <div className="hidden lg:flex flex-1 max-w-md mx-4 relative" ref={searchRef}>
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <span className="material-symbols-outlined text-lg">search</span>
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query.trim() && setShowSearchDropdown(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && query.trim()) {
                    setShowSearchDropdown(false);
                    navigate(`/explore?query=${encodeURIComponent(query.trim())}`);
                  }
                }}
                placeholder="Search dishes, curries, regions, or chefs..."
                className="w-full pl-10 pr-10 py-2 rounded-full bg-stone-100 border border-transparent focus:border-stone-300 focus:bg-white text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none transition-all"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600"
                >
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {showSearchDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden z-50 animate-in fade-in duration-150">
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-stone-400 flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                    <span>Finding authentic dishes...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto p-2 space-y-1">
                    <div className="px-3 py-1 text-[11px] font-bold uppercase text-stone-400 tracking-wider">
                      Matching Dishes ({searchResults.length})
                    </div>
                    {searchResults.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => {
                          setShowSearchDropdown(false);
                          setQuery('');
                          if (item.shop?._id || item.chef?._id) {
                            navigate(`/chef/${item.shop?._id || item.chef?._id}`);
                          } else if (item.state) {
                            navigate(`/region/${encodeURIComponent(item.state)}`);
                          }
                        }}
                        className="flex items-center gap-3 p-2 rounded-xl hover:bg-stone-50 cursor-pointer transition-colors"
                      >
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'}
                          alt={item.name}
                          className="w-10 h-10 rounded-lg object-cover bg-stone-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-stone-900 truncate">{item.name}</h4>
                          <p className="text-[11px] text-stone-400 truncate">{item.state} • {item.category}</p>
                        </div>
                        <span className="text-xs font-bold text-stone-900 shrink-0">₹{item.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-xs text-stone-400">
                    No authentic dishes found for "{query}".
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right: Actions (Cart, Profile, Navigation) */}
          <div className="flex items-center gap-3">
            {/* Explore Button */}
            <button
              onClick={() => navigate('/explore')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-2 rounded-xl hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">explore</span>
              <span>Explore</span>
            </button>

            {/* Cart Button */}
            <button
              onClick={() => navigate('/cart')}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-stone-100 hover:bg-stone-200/80 text-stone-800 transition-all cursor-pointer"
              title="View Cart"
            >
              <span className="material-symbols-outlined text-lg text-stone-700">shopping_bag</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#D9532F] text-white text-[11px] font-bold flex items-center justify-center -ml-1">
                  {totalCartCount}
                </span>
              )}
            </button>

            {/* Authenticated User Menu OR Guest Actions */}
            {userData ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-stone-200 hover:border-stone-300 bg-white transition-all cursor-pointer"
                >
                  <div className="w-7 h-7 rounded-full bg-[#D9532F] text-white text-xs font-bold flex items-center justify-center shadow-xs">
                    {userData.fullName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline-block text-xs font-semibold text-stone-800 max-w-[100px] truncate">
                    {userData.fullName?.split(' ')[0]}
                  </span>
                  <span className="material-symbols-outlined text-xs text-stone-400">expand_more</span>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-full mt-2 w-56 p-1.5 bg-white rounded-2xl shadow-xl border border-stone-200 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-stone-100">
                      <p className="text-xs font-bold text-stone-900 truncate">{userData.fullName}</p>
                      <p className="text-[11px] text-stone-400 truncate">{userData.email}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-100 text-stone-600">
                        {userData.role === 'HomeCook' ? 'Home Chef' : userData.role === 'Admin' ? 'Administrator' : 'Customer'}
                      </span>
                    </div>

                    <div className="py-1">
                      {userData.role === 'HomeCook' ? (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base text-[#D9532F]">dashboard</span>
                          <span>Chef Kitchen Dashboard</span>
                        </button>
                      ) : userData.role === 'Admin' ? (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/admin');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base text-purple-600">admin_panel_settings</span>
                          <span>Admin Control Panel</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            navigate('/profile');
                          }}
                          className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-base text-stone-500">person</span>
                          <span>Account Profile</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/my-orders');
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-50 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base text-stone-500">receipt_long</span>
                        <span>My Orders</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-stone-100">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/signin')}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-stone-700 hover:text-stone-950 transition-colors cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/signup')}
                  className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#D9532F] text-white hover:bg-[#C04321] transition-all shadow-xs cursor-pointer"
                >
                  Join Swaava
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer (<= 768px, 390px, 375px) */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white p-4 space-y-4 animate-in slide-in-from-top-4 duration-200">
          {/* Mobile Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-stone-400">
              <span className="material-symbols-outlined text-base">search</span>
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query.trim()) {
                  setMobileMenuOpen(false);
                  navigate(`/explore?query=${encodeURIComponent(query.trim())}`);
                }
              }}
              placeholder="Search authentic dishes or chefs..."
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-100 text-xs font-medium placeholder:text-stone-400 focus:outline-none focus:bg-stone-200/60"
            />
          </div>

          {/* Quick Links */}
          <div className="grid grid-cols-2 gap-2 text-xs font-medium text-stone-700">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/explore');
              }}
              className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-left flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[#D9532F] text-base">explore</span>
              <span>Explore All</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                navigate('/cart');
              }}
              className="p-3 rounded-xl bg-stone-50 hover:bg-stone-100 text-left flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[#D9532F] text-base">shopping_cart</span>
              <span>Cart ({totalCartCount})</span>
            </button>
          </div>

          {/* State Pills Quick Carousel */}
          <div>
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">
              Browse Regional Kitchens
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {POPULAR_STATES.map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate(`/region/${encodeURIComponent(state)}`);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 hover:bg-[#FDF2ED] hover:text-[#D9532F] shrink-0"
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}