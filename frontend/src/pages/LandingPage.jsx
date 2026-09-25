import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App';
import { fetchRecentlyViewedAPI } from '../redux/userSlice';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import FoodCard from '../components/cards/FoodCard';
import StateCard from '../components/cards/StateCard';
import ChefCard from '../components/cards/ChefCard';
import FoodDetailModal from '../components/FoodDetailModal';

const POPULAR_SEARCH_TAGS = [
  'Hyderabadi Biryani',
  'Amritsari Kulcha',
  'Gongura Pachadi',
  'Chettinad Chicken',
  'Sarson da Saag',
  'Dal Baati Churma'
];

const REGIONAL_ZONES = [
  {
    id: 'north',
    name: 'Northern Hearth',
    tagline: 'Clay Tandoors & Rich Golden Gravies',
    states: ['Punjab', 'Uttar Pradesh', 'Rajasthan'],
    description: 'Slow-simmered black lentils in butter, clay-oven tandoori kulchas, fragrant Awadhi kebabs, and royal Rajputana gravies.',
    icon: 'fireplace',
    accent: '#D9532F'
  },
  {
    id: 'south',
    name: 'Southern Spice Coast',
    tagline: 'Stone-Ground Masalas & Fresh Coconut',
    states: ['Andhra Pradesh', 'Telangana', 'Tamil Nadu', 'Kerala', 'Karnataka'],
    description: 'Fiery red Guntur chillies, aromatic curry leaves, slow-cooked royal dum biryanis, and coconut-infused Malabar curries.',
    icon: 'flare',
    accent: '#2D5A43'
  },
  {
    id: 'west',
    name: 'Western Tablelands',
    tagline: 'Farsan, Coastal Seafood & Desert Craft',
    states: ['Gujarat', 'Maharashtra'],
    description: 'Delicate steamed dhoklas, festive puran polis, spicy Kolhapuri rassas, and coastal Malvani fish curries.',
    icon: 'bakery_dining',
    accent: '#E59A28'
  },
  {
    id: 'east',
    name: 'Eastern Delta Kitchens',
    tagline: 'Mustard Seeds & Sacred Confections',
    states: ['West Bengal', 'Odisha'],
    description: 'Pungent kachi ghani mustard oil, delicate freshwater river catch, ancient temple bhog, and caramelized chhena poda.',
    icon: 'waves',
    accent: '#8B4513'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData, recentlyViewed } = useSelector(state => state.user);

  const [regions, setRegions] = useState([]);
  const [featuredChefs, setFeaturedChefs] = useState([]);
  const [popularDishes, setPopularDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);

  // Search input state
  const [heroSearch, setHeroSearch] = useState('');

  // Dish dietary filter on home page
  const [dishFilter, setDishFilter] = useState('all'); // 'all' | 'veg' | 'non-veg'

  // Active regional zone tab
  const [activeZone, setActiveZone] = useState('north');

  useEffect(() => {
    if (userData) {
      dispatch(fetchRecentlyViewedAPI());
    }
  }, [dispatch, userData]);

  useEffect(() => {
    const fetchMarketplaceData = async () => {
      setLoading(true);
      try {
        const [regionsRes, chefsRes, itemsRes] = await Promise.all([
          axios.get(`${serverUrl}/api/region/all`),
          axios.get(`${serverUrl}/api/shop/all`),
          axios.get(`${serverUrl}/api/item/search-items?sortBy=popular_desc`)
        ]);

        setRegions(regionsRes.data || []);
        setFeaturedChefs((chefsRes.data || []).slice(0, 6));
        setPopularDishes((itemsRes.data || []).slice(0, 8));
      } catch (err) {
        console.error('Failed to load marketplace content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMarketplaceData();
  }, []);

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/explore?query=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate('/explore');
    }
  };

  const filteredDishes = popularDishes.filter((dish) => {
    if (dishFilter === 'veg') return dish.vegetarian || dish.foodType === 'veg';
    if (dishFilter === 'non-veg') return !dish.vegetarian && dish.foodType === 'non veg';
    return true;
  });

  const currentZoneData = REGIONAL_ZONES.find(z => z.id === activeZone) || REGIONAL_ZONES[0];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      <Nav />

      {/* ══════════════════════════════════════════════════
          HERO SECTION
          Exact Headline: "Discover India, One Dish at a Time."
          ══════════════════════════════════════════════════ */}
      <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 border-b border-stone-200/80 overflow-hidden bg-gradient-to-b from-[#FDF8F5] via-[#FAFAF8] to-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline, Subtitle, Search, CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#FDF2ED] border border-[#D9532F]/20 text-xs font-semibold text-[#D9532F] shadow-xs">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>Authentic Homestyle Food Marketplace</span>
              </div>

              {/* Exact Hero Headline Required */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-stone-950 tracking-tight leading-[1.08]">
                Discover India, One Dish at a Time.
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-stone-600 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Generational home cooking from India’s culinary heartlands. Cooked in small batches by master home chefs using pure desi ghee, cold-pressed oils, and authentic family recipes.
              </p>

              {/* ══ SECTION: SEARCH (Integrated in Hero) ══ */}
              <div className="pt-2 max-w-xl mx-auto lg:mx-0">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                  <span className="absolute left-4 text-stone-400 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-xl">search</span>
                  </span>
                  <input
                    type="text"
                    value={heroSearch}
                    onChange={(e) => setHeroSearch(e.target.value)}
                    placeholder="Search by Dish, Chef, State, or Cuisine..."
                    className="w-full pl-12 pr-28 py-3.5 rounded-2xl bg-white border border-stone-300 shadow-sm text-xs sm:text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#D9532F] focus:ring-2 focus:ring-[#D9532F]/10 transition-all"
                  />
                  <button
                    type="submit"
                    className="absolute right-2 px-4 py-2 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    Search
                  </button>
                </form>

                {/* Popular Search Suggestions */}
                <div className="flex items-center gap-1.5 flex-wrap mt-3 text-[11px] text-stone-500">
                  <span className="font-semibold text-stone-400">Popular:</span>
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => navigate(`/explore?query=${encodeURIComponent(tag)}`)}
                      className="px-2.5 py-0.5 rounded-full bg-stone-100 hover:bg-[#FDF2ED] hover:text-[#D9532F] text-stone-600 transition-colors cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="pt-6 flex items-center justify-center lg:justify-start gap-8 text-xs text-stone-500 border-t border-stone-200/80">
                <div>
                  <strong className="text-stone-900 font-extrabold text-base block">12 States</strong>
                  <span>Dedicated Kitchens</span>
                </div>
                <div className="w-px h-8 bg-stone-200" />
                <div>
                  <strong className="text-stone-900 font-extrabold text-base block">24 Home Chefs</strong>
                  <span>Verified Masters</span>
                </div>
                <div className="w-px h-8 bg-stone-200" />
                <div>
                  <strong className="text-stone-900 font-extrabold text-base block">60 Dishes</strong>
                  <span>Authentic Recipes</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Composition */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] max-w-md mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-stone-100">
                <img
                  src="https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=800&h=1000&fit=crop"
                  alt="Authentic Dum Biryani"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent" />

                {/* Floating Dish Badge */}
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg border border-white/50 flex items-center justify-between">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9532F] block">
                      Telangana • Signature
                    </span>
                    <h4 className="font-bold text-sm text-stone-900 truncate">Hyderabadi Dum Biryani</h4>
                    <p className="text-[11px] text-stone-500 truncate">Slow-cooked with pure saffron & ghee</p>
                  </div>
                  <span className="text-base font-extrabold text-stone-900 shrink-0 ml-2">₹390</span>
                </div>

                {/* Floating Chef Verification Tag */}
                <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-stone-950/80 backdrop-blur-md text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
                  <span className="material-symbols-outlined text-sm text-emerald-400">verified</span>
                  <span>100% Home Cooked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION: POPULAR STATES
          ══════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 border-b border-stone-200/80 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
                Regional Tapestry
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight mt-1">
                Popular States
              </h2>
              <p className="text-sm text-stone-500 mt-1 max-w-lg">
                Explore distinct regional food cultures — each state with its own ancestral cooking rituals and heritage spices.
              </p>
            </div>

            <button
              onClick={() => navigate('/explore?tab=states')}
              className="self-start sm:self-auto text-xs font-bold text-[#D9532F] hover:text-[#C04321] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>Explore All 12 States</span>
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {regions.slice(0, 8).map((region) => (
              <StateCard key={region._id} stateData={region} />
            ))}
          </div>

          {regions.length > 8 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate('/explore?tab=states')}
                className="px-6 py-2.5 rounded-full text-xs font-bold bg-white border border-stone-300 hover:border-stone-400 text-stone-800 transition-all shadow-xs cursor-pointer"
              >
                + View Remaining {regions.length - 8} Indian States
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION: RECENTLY VIEWED (LOGGED-IN CUSTOMER)
          ══════════════════════════════════════════════════ */}
      {userData && recentlyViewed && recentlyViewed.length > 0 && (
        <section className="py-12 sm:py-16 border-b border-stone-200/80 bg-stone-50/70">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#D9532F] text-lg font-bold">history</span>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F]">
                    Pick Up Where You Left Off
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight mt-1">
                  Recently Viewed
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Dishes you recently explored across India's regional kitchens.
                </p>
              </div>

              <button
                onClick={() => navigate('/profile?tab=recently-viewed')}
                className="self-start sm:self-auto text-xs font-bold text-stone-700 hover:text-[#D9532F] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View All In Your Profile</span>
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyViewed.slice(0, 4).map((food) => (
                <FoodCard
                  key={food._id}
                  food={food}
                  onOpenDetails={(item) => setSelectedFood(item)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════
          SECTION: POPULAR DISHES
          ══════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 border-b border-stone-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
                Handcrafted Daily
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight mt-1">
                Popular Dishes
              </h2>
              <p className="text-sm text-stone-500 mt-1 max-w-lg">
                Prepared strictly in small batches on order by verified native home chefs.
              </p>
            </div>

            {/* Quick Dietary Filter Buttons */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setDishFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dishFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                All Dishes
              </button>
              <button
                onClick={() => setDishFilter('veg')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dishFilter === 'veg'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Veg Only
              </button>
              <button
                onClick={() => setDishFilter('non-veg')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dishFilter === 'non-veg'
                    ? 'bg-white text-red-800 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Non-Veg Only
              </button>
            </div>
          </div>

          {/* Dishes Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredDishes.map((food) => (
              <FoodCard
                key={food._id}
                food={food}
                onOpenDetails={(item) => setSelectedFood(item)}
              />
            ))}
          </div>

          <div className="mt-10 text-center">
            <button
              onClick={() => navigate('/explore?tab=dishes')}
              className="px-7 py-3 rounded-2xl bg-[#D9532F] hover:bg-[#C04321] text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Browse Complete Food Catalog →
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION: FEATURED CHEFS
          ══════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 border-b border-stone-200/80 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
                The Artisans Behind The Food
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight mt-1">
                Featured Chefs
              </h2>
              <p className="text-sm text-stone-500 mt-1 max-w-lg">
                Certified home cooks preserving generational recipes in hygienic, audited home kitchens.
              </p>
            </div>

            <button
              onClick={() => navigate('/explore?tab=chefs')}
              className="self-start sm:self-auto text-xs font-bold text-[#D9532F] hover:text-[#C04321] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <span>View All 24 Chefs</span>
              <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredChefs.map((chef) => (
              <ChefCard key={chef._id} chef={chef} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION: REGIONAL DISCOVERY
          ══════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 border-b border-stone-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
              Indigenous Culinary Map
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight mt-1">
              Regional Discovery
            </h2>
            <p className="text-sm text-stone-500 mt-2">
              Explore India’s diverse culinary ecosystems defined by indigenous terrain, seasonal produce, and ancestral techniques.
            </p>
          </div>

          {/* Regional Zone Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl mx-auto mb-10">
            {REGIONAL_ZONES.map((zone) => (
              <button
                key={zone.id}
                onClick={() => setActiveZone(zone.id)}
                className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer ${
                  activeZone === zone.id
                    ? 'bg-[#FDF2ED] border-[#D9532F] shadow-sm'
                    : 'bg-stone-50 border-stone-200 hover:bg-stone-100/80'
                }`}
              >
                <span className="material-symbols-outlined text-lg mb-1 block" style={{ color: zone.accent }}>
                  {zone.icon}
                </span>
                <span className="text-xs font-bold text-stone-900 block">{zone.name}</span>
                <span className="text-[10px] text-stone-400 block truncate">{zone.states.length} States</span>
              </button>
            ))}
          </div>

          {/* Active Zone Detail Card */}
          <div className="max-w-4xl mx-auto p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-stone-900 to-stone-950 text-white shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-stone-800">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
                  {currentZoneData.tagline}
                </span>
                <h3 className="text-2xl sm:text-3xl font-black mt-1">{currentZoneData.name}</h3>
              </div>
              <button
                onClick={() => navigate(`/explore?query=${encodeURIComponent(currentZoneData.states[0])}`)}
                className="px-5 py-2.5 rounded-xl bg-white text-stone-900 hover:bg-stone-100 font-bold text-xs transition-colors self-start md:self-auto cursor-pointer"
              >
                Explore {currentZoneData.name} →
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed mt-6 max-w-2xl">
              {currentZoneData.description}
            </p>

            <div className="mt-8 pt-6 border-t border-stone-800/80">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block mb-3">
                Featured States in this Region:
              </span>
              <div className="flex flex-wrap gap-2">
                {currentZoneData.states.map((st) => (
                  <button
                    key={st}
                    onClick={() => navigate(`/region/${encodeURIComponent(st)}`)}
                    className="px-4 py-2 rounded-xl bg-stone-800/80 hover:bg-[#D9532F] text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{st}</span>
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION: HOW IT WORKS
          ══════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 border-b border-stone-200/80 bg-[#FAFAF8]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
              Transparent & Fresh
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight mt-1">
              How It Works
            </h2>
            <p className="text-sm text-stone-500 mt-2">
              From an authentic family kitchen directly to your dining table in four simple steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2ED] text-[#D9532F] flex items-center justify-center font-black text-sm">
                01
              </div>
              <h3 className="font-bold text-base text-stone-900">Choose a Region</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Browse authentic regional cuisines across 12 Indian states, from Punjabi clay tandoors to Chettinad spices.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2ED] text-[#D9532F] flex items-center justify-center font-black text-sm">
                02
              </div>
              <h3 className="font-bold text-base text-stone-900">Select a Home Chef</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Meet verified home cooks with audited kitchens, customer ratings, and rich culinary heritage stories.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2ED] text-[#D9532F] flex items-center justify-center font-black text-sm">
                03
              </div>
              <h3 className="font-bold text-base text-stone-900">Cooked Fresh in Batches</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                No dark kitchens or commercial reheats. Dishes are prepared with pure desi ghee and fresh stone-ground spices.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-xl bg-[#FDF2ED] text-[#D9532F] flex items-center justify-center font-black text-sm">
                04
              </div>
              <h3 className="font-bold text-base text-stone-900">Delivered Warm</h3>
              <p className="text-xs text-stone-500 leading-relaxed">
                Packed in eco-friendly insulated packaging and delivered promptly so you savor the comforting taste of home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          SECTION: CTA FOR BECOMING A HOMECHEF
          ══════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 bg-stone-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-r from-[#D9532F] to-[#B33E1D] p-8 sm:p-12 overflow-hidden shadow-2xl">
            <div className="relative z-10 max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
                <span className="material-symbols-outlined text-sm">skillet</span>
                <span>Cook with Swaava</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
                Turn your home kitchen into a celebrated culinary destination.
              </h2>

              <p className="text-xs sm:text-sm text-white/90 leading-relaxed">
                Are you a passionate home cook with cherished family recipes? Join Swaava's family of verified regional home chefs. Set your own menu, cook on your schedule, and share your ancestral heritage with food lovers in your city.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => navigate('/signup?role=HomeCook')}
                  className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  Apply as a HomeChef
                </button>
                <button
                  onClick={() => navigate('/explore?tab=chefs')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/30 transition-all cursor-pointer"
                >
                  Meet Existing HomeChefs
                </button>
              </div>
            </div>

            {/* Background Decorative Element */}
            <div className="absolute right-0 top-0 bottom-0 w-1/3 hidden lg:block opacity-15 pointer-events-none">
              <span className="material-symbols-outlined text-[280px] text-white">restaurant</span>
            </div>
          </div>
        </div>
      </section>

      {/* Food Detail Modal */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={!!selectedFood}
        onClose={() => setSelectedFood(null)}
      />

      <Footer />
    </div>
  );
}