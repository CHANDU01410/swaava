import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChefsByState, clearStateChefs } from '../redux/chefSlice';
import axios from 'axios';
import { serverUrl } from '../App';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import ChefCard from '../components/cards/ChefCard';
import FoodCard from '../components/cards/FoodCard';
import FoodDetailModal from '../components/FoodDetailModal';

const STATE_META = {
  'Punjab': {
    desc: 'The land of golden fields, rich dairy, hand-churned white butter, and aromatic clay tandoors.',
    tags: [
      { icon: 'breakfast_dining', label: 'Tandoori Classics' },
      { icon: 'local_dining', label: 'Dairy-Rich Dishes' },
      { icon: 'history_edu', label: 'Village Heritage' }
    ]
  },
  'Andhra Pradesh': {
    desc: 'Known for bold fiery Guntur chillies, tangy gongura leaves, Krishna delta seafood, and age-old culinary pride.',
    tags: [
      { icon: 'local_fire_department', label: 'Fiery Spices' },
      { icon: 'set_meal', label: 'Coastal Delicacies' },
      { icon: 'eco', label: 'Gongura Specialties' }
    ]
  },
  'Telangana': {
    desc: 'The grand royal Nizami dastarkhwan meets rustic Deccan hearth cooking with robust whole spices and rich textures.',
    tags: [
      { icon: 'local_fire_department', label: 'Deccan Spices' },
      { icon: 'set_meal', label: 'Dum Biryani Capital' },
      { icon: 'history_edu', label: 'Nizami Heritage' }
    ]
  },
  'Tamil Nadu': {
    desc: 'Fragrant filter coffee, crispy dosas, steaming morning tiffins, and legendary Chettinad spice blends.',
    tags: [
      { icon: 'local_cafe', label: 'Filter Coffee' },
      { icon: 'set_meal', label: 'Chettinad Masalas' },
      { icon: 'eco', label: 'Temple Prasadams' }
    ]
  },
  'Kerala': {
    desc: 'God’s Own Country brings coconut-infused curries, fresh Malabar catch, fragrant spices, and lacy rice hoppers.',
    tags: [
      { icon: 'set_meal', label: 'Seafood Specials' },
      { icon: 'local_fire_department', label: 'Coconut Curries' },
      { icon: 'eco', label: 'Ayurvedic Touch' }
    ]
  },
  'Karnataka': {
    desc: 'From Mysore Masala Dosa and aromatic Bisi Bele Bath to the delicate Neer Dosas and seafood of the Karavali coast.',
    tags: [
      { icon: 'local_cafe', label: 'Filter Coffee' },
      { icon: 'eco', label: 'Millet & Rice Craft' },
      { icon: 'set_meal', label: 'Karavali Seafood' }
    ]
  },
  'Maharashtra': {
    desc: 'From iconic Mumbai street bites and fiery Kolhapuri rassas to festive puran poli and coastal Konkani delights.',
    tags: [
      { icon: 'storefront', label: 'Street Food Icons' },
      { icon: 'local_fire_department', label: 'Kolhapuri Spice' },
      { icon: 'set_meal', label: 'Konkan Coastal' }
    ]
  },
  'Gujarat': {
    desc: 'A predominantly vegetarian cuisine bursting with sweetness, subtle spice, and crunch — dhoklas, theplas, and slow-cooked undhiyu.',
    tags: [
      { icon: 'eco', label: 'Pure Vegetarian' },
      { icon: 'cake', label: 'Farsan Snacks' },
      { icon: 'local_dining', label: 'Thali Feasts' }
    ]
  },
  'Rajasthan': {
    desc: 'The royal kitchens of Rajputana gifted dal baati churma, laal maas, and ker sangri — a desert cuisine of royal opulence.',
    tags: [
      { icon: 'local_fire_department', label: 'Laal Maas Special' },
      { icon: 'history_edu', label: 'Royal Recipes' },
      { icon: 'brightness_7', label: 'Desert Delicacies' }
    ]
  },
  'West Bengal': {
    desc: 'Where pungent mustard oil meets freshwater fish, fluffy luchis, and delicate earthen-pot mishti doi.',
    tags: [
      { icon: 'set_meal', label: 'River Fish Delights' },
      { icon: 'cake', label: 'Sweet Confections' },
      { icon: 'history_edu', label: 'Zamindari Kitchens' }
    ]
  },
  'Odisha': {
    desc: 'Ancient Jagannath Mahaprasad roots, comforting pakhala bhata, delicate mustard gravies, and caramelized chhena poda.',
    tags: [
      { icon: 'temple_hindu', label: 'Mahaprasad Roots' },
      { icon: 'eco', label: 'Pakhala Delicacies' },
      { icon: 'icecream', label: 'Burnt Chhena Sweets' }
    ]
  },
  'Uttar Pradesh': {
    desc: 'The zenith of Awadhi dum-pukht cuisine, slow-cooked galouti kebabs, fragrant yakhni biryanis, and sacred Varanasi ghat tiffins.',
    tags: [
      { icon: 'restaurant', label: 'Awadhi Dastarkhwan' },
      { icon: 'local_fire_department', label: 'Banarasi Street Chaat' },
      { icon: 'history_edu', label: 'Nawabi Heritage' }
    ]
  }
};

export default function RegionChefs() {
  const { stateName } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { stateChefs, stateChefsLoading } = useSelector(state => state.chef);
  const [stateDishes, setStateDishes] = useState([]);
  const [dishesLoading, setDishesLoading] = useState(true);
  const [selectedFood, setSelectedFood] = useState(null);
  const [dietFilter, setDietFilter] = useState('all'); // all, veg, non-veg

  const meta = STATE_META[stateName] || {
    desc: `Discover authentic home cooks preparing traditional regional meals in ${stateName}.`,
    tags: [{ icon: 'restaurant', label: 'Authentic Heritage' }]
  };

  useEffect(() => {
    if (stateName) {
      dispatch(fetchChefsByState(stateName));

      // Fetch authentic dishes in this state
      const fetchDishes = async () => {
        setDishesLoading(true);
        try {
          const res = await axios.get(`${serverUrl}/api/item/by-state/${encodeURIComponent(stateName)}`);
          setStateDishes(res.data || []);
        } catch (err) {
          console.error('Failed to load state dishes:', err);
        } finally {
          setDishesLoading(false);
        }
      };

      fetchDishes();
    }

    return () => dispatch(clearStateChefs());
  }, [stateName, dispatch]);

  const filteredDishes = stateDishes.filter((d) => {
    if (dietFilter === 'veg') return d.vegetarian || d.foodType === 'veg';
    if (dietFilter === 'non-veg') return !d.vegetarian && d.foodType === 'non veg';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      <Nav />

      {/* ══ HERO BANNER ══ */}
      <section className="bg-gradient-to-b from-[#FDF8F5] to-[#FAFAF8] border-b border-stone-200/70 pt-8 pb-12 sm:pt-12 sm:pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 mb-6">
            <button onClick={() => navigate('/')} className="hover:text-stone-700 cursor-pointer">Home</button>
            <span>/</span>
            <button onClick={() => navigate('/regions')} className="hover:text-stone-700 cursor-pointer">Regions</button>
            <span>/</span>
            <span className="text-[#D9532F]">{stateName}</span>
          </div>

          <div className="max-w-3xl space-y-4">
            {/* Tag Pills */}
            <div className="flex flex-wrap gap-2">
              {meta.tags.map((tag, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-stone-200 text-xs font-semibold text-stone-700 shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[14px] text-[#D9532F]">
                    {tag.icon}
                  </span>
                  <span>{tag.label}</span>
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-5xl font-black text-stone-950 tracking-tight leading-tight">
              {stateName} Kitchens
            </h1>

            {/* Description */}
            <p className="text-sm sm:text-base text-stone-600 leading-relaxed font-normal">
              {meta.desc}
            </p>

            {/* Quick Counts */}
            <div className="flex items-center gap-6 pt-3 text-xs text-stone-500 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-emerald-600">verified</span>
                <strong className="text-stone-900">{stateChefs?.length || 2}</strong> Verified Home Chefs
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-base text-[#D9532F]">restaurant</span>
                <strong className="text-stone-900">{stateDishes?.length || 5}</strong> Authentic Dishes
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SECTION 1: MASTER HOME CHEFS ══ */}
      <section className="py-12 sm:py-16 border-b border-stone-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
              Certified Artisans
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight mt-1">
              Home Chefs of {stateName}
            </h2>
            <p className="text-xs text-stone-500 mt-1">
              Select a chef to view their complete regional kitchen menu and family story.
            </p>
          </div>

          {stateChefsLoading ? (
            <div className="py-12 flex justify-center text-stone-400">
              <span className="material-symbols-outlined text-3xl animate-spin text-[#D9532F]">progress_activity</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {stateChefs?.map((chef) => (
                <ChefCard key={chef._id} chef={chef} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══ SECTION 2: AUTHENTIC REGIONAL DISHES ══ */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
                Ancestral Recipes
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight mt-1">
                Authentic Dishes of {stateName}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Cooked fresh on order by native home chefs.
              </p>
            </div>

            {/* Dietary Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl self-start sm:self-auto">
              <button
                onClick={() => setDietFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dietFilter === 'all'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                All ({stateDishes.length})
              </button>
              <button
                onClick={() => setDietFilter('veg')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dietFilter === 'veg'
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Veg
              </button>
              <button
                onClick={() => setDietFilter('non-veg')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  dietFilter === 'non-veg'
                    ? 'bg-white text-red-800 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Non-Veg
              </button>
            </div>
          </div>

          {dishesLoading ? (
            <div className="py-12 flex justify-center text-stone-400">
              <span className="material-symbols-outlined text-3xl animate-spin text-[#D9532F]">progress_activity</span>
            </div>
          ) : filteredDishes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredDishes.map((food) => (
                <FoodCard
                  key={food._id}
                  food={food}
                  onOpenDetails={(item) => setSelectedFood(item)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-stone-400">
              <p className="text-xs">No dishes match the selected dietary filter.</p>
            </div>
          )}
        </div>
      </section>

      {/* ══ FOOD DETAIL MODAL ══ */}
      <FoodDetailModal
        food={selectedFood}
        isOpen={!!selectedFood}
        onClose={() => setSelectedFood(null)}
      />

      <Footer />
    </div>
  );
}