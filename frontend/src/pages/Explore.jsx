import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../App';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import FoodCard from '../components/cards/FoodCard';
import ChefCard from '../components/cards/ChefCard';
import StateCard from '../components/cards/StateCard';
import FoodDetailModal from '../components/FoodDetailModal';

const ALL_STATES = [
  'Punjab', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu',
  'Kerala', 'Karnataka', 'Maharashtra', 'Gujarat',
  'Rajasthan', 'West Bengal', 'Odisha', 'Uttar Pradesh'
];

const CATEGORIES = [
  'Main Course', 'Snacks', 'Breakfast', 'Desserts',
  'Sides & Pickles', 'Breads', 'Rice Dishes', 'Beverages'
];

const SORT_OPTIONS = [
  { value: 'popular_desc', label: 'Most Popular' },
  { value: 'rating_desc', label: 'Highest Rated' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' }
];

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Tab mode: 'dishes' | 'chefs' | 'states'
  const activeTab = searchParams.get('tab') || 'dishes';

  // Filters State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('query') || '');
  const [selectedState, setSelectedState] = useState(searchParams.get('state') || 'all');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [dietary, setDietary] = useState(searchParams.get('dietary') || 'all'); // 'all' | 'veg' | 'non-veg'
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || 'all');
  const [availabilityOnly, setAvailabilityOnly] = useState(searchParams.get('available') === 'true');
  const [spiceLevel, setSpiceLevel] = useState(searchParams.get('spiceLevel') || 'all');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'popular_desc');

  // Mobile drawer filter toggle
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Data states
  const [dishes, setDishes] = useState([]);
  const [chefs, setChefs] = useState([]);
  const [regions, setRegions] = useState([]);

  // UI status
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFood, setSelectedFood] = useState(null);

  // Sync state to URL params cleanly
  const updateURLParams = useCallback((updates = {}) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val === undefined || val === null || val === '' || val === 'all' || val === false) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, String(val));
      }
    });
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Fetch Dishes from Backend API with all query parameters
  const fetchDishes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('query', searchQuery.trim());
      if (selectedState !== 'all') params.append('state', selectedState);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (dietary === 'veg') params.append('vegetarian', 'true');
      if (dietary === 'non-veg') params.append('vegetarian', 'false');
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (minRating !== 'all') params.append('minRating', minRating);
      if (availabilityOnly) params.append('isAvailable', 'true');
      if (spiceLevel !== 'all') params.append('spiceLevel', spiceLevel);
      if (sortBy) params.append('sortBy', sortBy);

      const res = await axios.get(`${serverUrl}/api/item/search-items?${params.toString()}`);
      setDishes(res.data || []);
    } catch (err) {
      console.error('Failed to fetch dishes:', err);
      setError('Unable to load dishes. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [
    searchQuery, selectedState, selectedCategory, dietary,
    minPrice, maxPrice, minRating, availabilityOnly, spiceLevel, sortBy
  ]);

  // Fetch Chefs from Backend API
  const fetchChefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedState !== 'all') params.append('state', selectedState);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await axios.get(`${serverUrl}/api/shop/all?${params.toString()}`);
      setChefs(res.data || []);
    } catch (err) {
      console.error('Failed to fetch chefs:', err);
      setError('Unable to load home chefs.');
    } finally {
      setLoading(false);
    }
  }, [selectedState, searchQuery]);

  // Fetch States/Regions from Backend API
  const fetchRegions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${serverUrl}/api/region/all`);
      setRegions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch regions:', err);
      setError('Unable to load regional kitchens.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Main data trigger based on activeTab
  useEffect(() => {
    if (activeTab === 'dishes') {
      fetchDishes();
    } else if (activeTab === 'chefs') {
      fetchChefs();
    } else if (activeTab === 'states') {
      fetchRegions();
    }
  }, [activeTab, fetchDishes, fetchChefs, fetchRegions]);

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedState('all');
    setSelectedCategory('all');
    setDietary('all');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('all');
    setAvailabilityOnly(false);
    setSpiceLevel('all');
    setSortBy('popular_desc');
    setSearchParams(activeTab !== 'dishes' ? { tab: activeTab } : {}, { replace: true });
  };

  // Active filters count
  const activeFiltersCount = [
    selectedState !== 'all',
    selectedCategory !== 'all',
    dietary !== 'all',
    minPrice !== '',
    maxPrice !== '',
    minRating !== 'all',
    availabilityOnly,
    spiceLevel !== 'all'
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      <Nav />

      {/* ══ HEADER & SEARCH BAR ══ */}
      <section className="bg-gradient-to-b from-[#FDF8F5] via-[#FAFAF8] to-[#FAFAF8] border-b border-stone-200/80 pt-8 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FDF2ED] text-xs font-semibold text-[#D9532F]">
              <span className="material-symbols-outlined text-sm">explore</span>
              <span>Authentic Culinary Discovery</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight">
              Explore Regional India
            </h1>

            <p className="text-xs sm:text-sm text-stone-500 max-w-xl mx-auto">
              Find authentic dishes, verified master home chefs, and regional culinary cultures across 12 states.
            </p>

            {/* Live Search Input */}
            <div className="relative max-w-2xl mx-auto mt-4">
              <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
                <span className="material-symbols-outlined text-xl">search</span>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  updateURLParams({ query: e.target.value });
                }}
                placeholder="Search by Dish, Chef, State, or Cuisine (e.g., Biryani, Harpreet, Punjab)..."
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white border border-stone-200/90 shadow-sm text-xs sm:text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#D9532F] focus:ring-2 focus:ring-[#D9532F]/10 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    updateURLParams({ query: '' });
                  }}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-stone-400 hover:text-stone-600 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              )}
            </div>

            {/* Discovery Tabs */}
            <div className="flex items-center justify-center gap-2 pt-3">
              <button
                onClick={() => updateURLParams({ tab: 'dishes' })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'dishes'
                    ? 'bg-[#D9532F] text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">restaurant</span>
                <span>Dishes ({dishes.length})</span>
              </button>

              <button
                onClick={() => updateURLParams({ tab: 'chefs' })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'chefs'
                    ? 'bg-[#D9532F] text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">skillet</span>
                <span>Home Chefs ({chefs.length})</span>
              </button>

              <button
                onClick={() => updateURLParams({ tab: 'states' })}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'states'
                    ? 'bg-[#D9532F] text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-600 hover:text-stone-900'
                }`}
              >
                <span className="material-symbols-outlined text-sm">map</span>
                <span>States (12)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ MAIN DISCOVERY WORKSPACE ══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Control Bar (Sorting & Mobile Filter Button) */}
        <div className="flex items-center justify-between gap-4 pb-6 border-b border-stone-200/80 mb-6">
          <div className="flex items-center gap-2">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setFilterDrawerOpen(!filterDrawerOpen)}
              className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-xs font-bold text-stone-800 shadow-xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-base text-[#D9532F]">tune</span>
              <span>Filters</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#D9532F] text-white text-[10px] font-bold flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <span className="text-xs text-stone-500 font-medium hidden sm:inline-block">
              {loading ? (
                'Searching catalog...'
              ) : activeTab === 'dishes' ? (
                `Showing ${dishes.length} authentic dishes`
              ) : activeTab === 'chefs' ? (
                `Showing ${chefs.length} verified home chefs`
              ) : (
                `Showing ${regions.length || 12} culinary states`
              )}
            </span>
          </div>

          {/* Active Filter Chips / Reset */}
          {activeFiltersCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="text-xs font-semibold text-[#D9532F] hover:text-[#C04321] flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
              <span>Reset Filters ({activeFiltersCount})</span>
            </button>
          )}

          {/* Sorting Dropdown */}
          {activeTab === 'dishes' && (
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs font-semibold text-stone-500 hidden md:inline-block">
                Sort by:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  updateURLParams({ sortBy: e.target.value });
                }}
                className="px-3 py-2 rounded-xl bg-white border border-stone-200 text-xs font-semibold text-stone-800 shadow-xs focus:outline-none focus:border-[#D9532F] cursor-pointer"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Content Area: Sidebar + Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ══ DESKTOP FILTER SIDEBAR ══ */}
          {activeTab === 'dishes' && (
            <aside className="hidden lg:block lg:col-span-3 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs space-y-6 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#D9532F]">tune</span>
                  <span>Filter Dishes</span>
                </span>
                {activeFiltersCount > 0 && (
                  <button
                    onClick={handleResetFilters}
                    className="text-[11px] font-semibold text-[#D9532F] hover:underline cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* 1. State Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 block">Regional State</label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    updateURLParams({ state: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#D9532F]"
                >
                  <option value="all">All 12 States</option>
                  {ALL_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* 2. Category Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 block">Category / Cuisine</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    updateURLParams({ category: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#D9532F]"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* 3. Vegetarian / Dietary */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 block">Dietary Preference</label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-stone-100 rounded-xl">
                  {['all', 'veg', 'non-veg'].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setDietary(val);
                        updateURLParams({ dietary: val });
                      }}
                      className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        dietary === val
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {val === 'all' ? 'All' : val === 'veg' ? 'Veg' : 'Non-Veg'}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Price Range */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 block">Price Range (₹)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      updateURLParams({ minPrice: e.target.value });
                    }}
                    placeholder="Min"
                    className="w-1/2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#D9532F]"
                  />
                  <span className="text-stone-400 text-xs">-</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      updateURLParams({ maxPrice: e.target.value });
                    }}
                    placeholder="Max"
                    className="w-1/2 px-3 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#D9532F]"
                  />
                </div>
              </div>

              {/* 5. Rating Filter */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 block">Customer Rating</label>
                <select
                  value={minRating}
                  onChange={(e) => {
                    setMinRating(e.target.value);
                    updateURLParams({ minRating: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800 focus:outline-none focus:border-[#D9532F]"
                >
                  <option value="all">Any Rating</option>
                  <option value="4.0">★ 4.0 & above</option>
                  <option value="4.5">★ 4.5 & above</option>
                  <option value="4.8">★ 4.8 & above</option>
                </select>
              </div>

              {/* 6. Spice Level */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-700 block">Spice Level</label>
                <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 rounded-xl">
                  {[
                    { val: 'all', label: 'All' },
                    { val: '0', label: 'Mild' },
                    { val: '1', label: 'Med' },
                    { val: '2', label: 'Hot' }
                  ].map((s) => (
                    <button
                      key={s.val}
                      onClick={() => {
                        setSpiceLevel(s.val);
                        updateURLParams({ spiceLevel: s.val });
                      }}
                      className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        spiceLevel === s.val
                          ? 'bg-white text-[#D9532F] shadow-xs'
                          : 'text-stone-500 hover:text-stone-900'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 7. Availability Toggle */}
              <div className="pt-2 border-t border-stone-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-stone-700">Available Today Only</span>
                  <input
                    type="checkbox"
                    checked={availabilityOnly}
                    onChange={(e) => {
                      setAvailabilityOnly(e.target.checked);
                      updateURLParams({ available: e.target.checked });
                    }}
                    className="w-4 h-4 rounded text-[#D9532F] focus:ring-[#D9532F] accent-[#D9532F] cursor-pointer"
                  />
                </label>
              </div>
            </aside>
          )}

          {/* ══ RESULTS GRID ══ */}
          <div className={activeTab === 'dishes' ? 'lg:col-span-9' : 'col-span-12'}>
            {/* Loading State */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-stone-200 overflow-hidden p-4 space-y-3">
                    <div className="aspect-[4/3] bg-stone-200 rounded-xl" />
                    <div className="h-4 bg-stone-200 rounded w-3/4" />
                    <div className="h-3 bg-stone-100 rounded w-1/2" />
                    <div className="h-8 bg-stone-100 rounded mt-4" />
                  </div>
                ))}
              </div>
            )}

            {/* Error State */}
            {!loading && error && (
              <div className="text-center py-16 bg-white rounded-3xl border border-red-200 p-8 max-w-lg mx-auto">
                <span className="material-symbols-outlined text-4xl text-red-500 mb-2">error</span>
                <h3 className="text-base font-bold text-stone-900">Something went wrong</h3>
                <p className="text-xs text-stone-500 mt-1">{error}</p>
                <button
                  onClick={activeTab === 'dishes' ? fetchDishes : activeTab === 'chefs' ? fetchChefs : fetchRegions}
                  className="mt-4 px-5 py-2 rounded-xl text-xs font-bold bg-[#D9532F] text-white hover:bg-[#C04321] transition-all cursor-pointer"
                >
                  Retry Search
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && activeTab === 'dishes' && dishes.length === 0 && (
              <div className="text-center py-16 bg-white rounded-3xl border border-stone-200/80 p-8 max-w-md mx-auto">
                <span className="material-symbols-outlined text-4xl text-stone-300 mb-2">search_off</span>
                <h3 className="text-base font-bold text-stone-800">No dishes match your criteria</h3>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                  We couldn't find any dishes matching your active search and filter combinations.
                </p>
                <div className="mt-5 flex items-center justify-center gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#D9532F] text-white hover:bg-[#C04321] transition-all shadow-xs cursor-pointer"
                  >
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Dishes View */}
            {!loading && !error && activeTab === 'dishes' && dishes.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {dishes.map((dish) => (
                  <FoodCard
                    key={dish._id}
                    food={dish}
                    onOpenDetails={(item) => setSelectedFood(item)}
                  />
                ))}
              </div>
            )}

            {/* Chefs View (Chef Discovery) */}
            {!loading && !error && activeTab === 'chefs' && (
              <div>
                {/* State selector for Chefs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
                  <button
                    onClick={() => {
                      setSelectedState('all');
                      updateURLParams({ state: 'all' });
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      selectedState === 'all'
                        ? 'bg-[#D9532F] text-white shadow-xs'
                        : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    All States
                  </button>
                  {ALL_STATES.map((st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setSelectedState(st);
                        updateURLParams({ state: st });
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                        selectedState === st
                          ? 'bg-[#D9532F] text-white shadow-xs'
                          : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {chefs.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {chefs.map((chef) => (
                      <ChefCard key={chef._id} chef={chef} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto">
                    <span className="material-symbols-outlined text-4xl text-stone-300 mb-2">person_search</span>
                    <h3 className="text-base font-bold text-stone-800">No home chefs found</h3>
                    <p className="text-xs text-stone-500 mt-1">Try selecting a different state or clearing your search.</p>
                    <button
                      onClick={handleResetFilters}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* States View (State Discovery) */}
            {!loading && !error && activeTab === 'states' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {(regions.length > 0 ? regions : ALL_STATES.map((name, i) => ({ _id: String(i), name }))).map((region) => (
                  <StateCard
                    key={region._id || region.name}
                    stateData={typeof region === 'string' ? { name: region } : region}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ══ MOBILE FILTER MODAL DRAWER ══ */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-stone-950/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-200">
          <div className="w-full max-w-xs bg-white h-full p-5 overflow-y-auto space-y-6 flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <span className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-base text-[#D9532F]">tune</span>
                  <span>Filters</span>
                </span>
                <button
                  onClick={() => setFilterDrawerOpen(false)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-600"
                >
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>

              {/* State Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Regional State</label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    updateURLParams({ state: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800"
                >
                  <option value="all">All 12 States</option>
                  {ALL_STATES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    updateURLParams({ category: e.target.value });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium text-stone-800"
                >
                  <option value="all">All Categories</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Dietary Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Dietary</label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-stone-100 rounded-xl">
                  {['all', 'veg', 'non-veg'].map((val) => (
                    <button
                      key={val}
                      onClick={() => {
                        setDietary(val);
                        updateURLParams({ dietary: val });
                      }}
                      className={`py-1.5 rounded-lg text-xs font-semibold capitalize ${
                        dietary === val ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700">Price (₹)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={minPrice}
                    onChange={(e) => {
                      setMinPrice(e.target.value);
                      updateURLParams({ minPrice: e.target.value });
                    }}
                    placeholder="Min"
                    className="w-1/2 px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                  />
                  <span>-</span>
                  <input
                    type="number"
                    value={maxPrice}
                    onChange={(e) => {
                      setMaxPrice(e.target.value);
                      updateURLParams({ maxPrice: e.target.value });
                    }}
                    placeholder="Max"
                    className="w-1/2 px-2.5 py-1.5 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-200 flex gap-2">
              <button
                onClick={handleResetFilters}
                className="w-1/2 py-2.5 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700"
              >
                Reset
              </button>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="w-1/2 py-2.5 rounded-xl text-xs font-bold bg-[#D9532F] text-white"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Food Details Modal */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={!!selectedFood}
        onClose={() => setSelectedFood(null)}
      />

      <Footer />
    </div>
  );
}
