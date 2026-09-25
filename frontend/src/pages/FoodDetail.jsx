import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { serverUrl } from '../App';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import FoodCard from '../components/cards/FoodCard';
import { addToCartAPI, toggleFavoriteFoodAPI, fetchFavoritesAPI, recordRecentlyViewedAPI } from '../redux/userSlice';

export default function FoodDetail() {
  const { foodId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData, favorites } = useSelector(state => state.user);

  const [food, setFood] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reviews for this dish
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Related recommendations
  const [chefOtherDishes, setChefOtherDishes] = useState([]);
  const [stateDishes, setStateDishes] = useState([]);

  // Local purchase controls
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setQuantity(1);
    setJustAdded(false);

    const fetchFoodDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${serverUrl}/api/item/${foodId}`);
        const item = res.data;
        if (!item) {
          setError('Dish not found.');
          return;
        }
        setFood(item);

        // Record recently viewed for logged-in customer (non-blocking fire-and-forget)
        if (userData && item._id) {
          dispatch(recordRecentlyViewedAPI(item._id));
        }

        // Fetch related recommendations & reviews in parallel
        const chefId = item.chef?._id || item.shop?._id;
        const stateName = item.state;

        // 1. Reviews
        axios.get(`${serverUrl}/api/review/item/${item._id}`)
          .then(r => setReviews(r.data || []))
          .catch(() => setReviews([]));

        // 2. More from same Chef
        if (chefId) {
          axios.get(`${serverUrl}/api/item/by-shop/${chefId}`)
            .then(r => {
              const other = (r.data?.items || []).filter(i => i._id !== item._id);
              setChefOtherDishes(other.slice(0, 4));
            })
            .catch(() => setChefOtherDishes([]));
        }

        // 3. More from same State
        if (stateName) {
          axios.get(`${serverUrl}/api/item/by-state/${encodeURIComponent(stateName)}`)
            .then(r => {
              const fromState = (r.data || []).filter(i => i._id !== item._id);
              setStateDishes(fromState.slice(0, 4));
            })
            .catch(() => setStateDishes([]));
        }
      } catch (err) {
        console.error('Failed to fetch food details:', err);
        setError('Unable to load dish details. Please check connection and try again.');
      } finally {
        setLoading(false);
      }
    };

    if (foodId) {
      fetchFoodDetails();
    }
  }, [foodId]);

  const handleAddToCart = async () => {
    if (!userData) {
      navigate('/signin');
      return;
    }
    if (!food) return;

    setIsAdding(true);
    try {
      const chefName = food.chef?.name || food.shop?.name || 'Master Chef';
      await dispatch(addToCartAPI({
        itemId: food._id,
        name: food.name,
        image: food.image || '',
        price: food.price,
        quantity: quantity,
        chef: chefName
      })).unwrap();
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between">
        <Nav />
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-stone-400 gap-3">
          <span className="material-symbols-outlined text-4xl text-[#D9532F] animate-spin">progress_activity</span>
          <p className="text-xs font-semibold">Gathering authentic dish details...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !food) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between">
        <Nav />
        <div className="flex-1 max-w-md mx-auto px-4 py-24 text-center">
          <div className="p-8 rounded-3xl bg-white border border-stone-200 shadow-sm space-y-4">
            <span className="material-symbols-outlined text-5xl text-stone-300">restaurant_menu</span>
            <h2 className="text-xl font-bold text-stone-900">Dish Unavailable</h2>
            <p className="text-xs text-stone-500 leading-relaxed">
              {error || "The dish you're searching for is currently not available."}
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => navigate('/explore')}
                className="px-5 py-2.5 rounded-xl bg-[#D9532F] text-white text-xs font-bold shadow-xs hover:bg-[#C04321] transition-all cursor-pointer"
              >
                Explore All Dishes
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 text-xs font-semibold hover:bg-stone-200 transition-all cursor-pointer"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const chefObj = food.chef || food.shop || {};
  const chefId = chefObj._id;
  const isVeg = food.vegetarian !== undefined ? food.vegetarian : (food.foodType === 'veg');
  const spicy = food.spicyLevel !== undefined ? food.spicyLevel : (food.spiceLevel || 1);
  const ratingAvg = food.rating?.average || 4.8;
  const ratingCount = food.rating?.count || food.reviewCount || 24;
  const isAvailable = food.isAvailable !== false && food.available !== false;
  const ingredients = Array.isArray(food.ingredients) ? food.ingredients : [];

  const spiceLabels = ['Mild', 'Mild to Medium', 'Medium Hot', 'Extra Hot'];

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      <Nav />

      {/* ══ BREADCRUMB ══ */}
      <div className="border-b border-stone-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 flex-wrap">
            <button onClick={() => navigate('/')} className="hover:text-stone-700 cursor-pointer">Home</button>
            <span>/</span>
            <button onClick={() => navigate('/explore')} className="hover:text-stone-700 cursor-pointer">Explore</button>
            <span>/</span>
            {food.state && (
              <>
                <button
                  onClick={() => navigate(`/region/${encodeURIComponent(food.state)}`)}
                  className="hover:text-stone-700 cursor-pointer"
                >
                  {food.state}
                </button>
                <span>/</span>
              </>
            )}
            {chefObj.name && (
              <>
                <button
                  onClick={() => chefId && navigate(`/chef/${chefId}`)}
                  className="hover:text-stone-700 cursor-pointer"
                >
                  {chefObj.name}
                </button>
                <span>/</span>
              </>
            )}
            <span className="text-[#D9532F] truncate">{food.name}</span>
          </div>
        </div>
      </div>

      {/* ══ FOOD DETAILS HERO & SPECS ══ */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Left Column: Food Image & Quick Badges */}
          <div className="lg:col-span-6 space-y-4">
            <div className="relative aspect-[4/3] w-full rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-md">
              <img
                src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&h=750&fit=crop'}
                alt={food.name}
                className="w-full h-full object-cover"
              />

              {/* Dietary Pill */}
              <div className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-stone-200/60 text-xs font-bold">
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${isVeg ? 'bg-emerald-600' : 'bg-red-600'}`} />
                <span className={isVeg ? 'text-emerald-800' : 'text-red-800'}>
                  {isVeg ? 'Pure Veg' : 'Non-Vegetarian'}
                </span>
              </div>

              {/* State Pill (Food-to-state Relationship) */}
              {food.state && (
                <button
                  onClick={() => navigate(`/region/${encodeURIComponent(food.state)}`)}
                  className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-900/85 hover:bg-stone-900 text-white backdrop-blur-md text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-[#D9532F]">location_on</span>
                  <span>{food.state}</span>
                </button>
              )}

              {/* Availability Status */}
              <div className="absolute bottom-4 left-4">
                {isAvailable ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-600/90 text-white backdrop-blur-md text-xs font-bold shadow-sm">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    <span>Cooked Fresh Today</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-stone-800/90 text-white backdrop-blur-md text-xs font-bold shadow-sm">
                    <span className="material-symbols-outlined text-xs">schedule</span>
                    <span>Sold Out for Today</span>
                  </span>
                )}
              </div>
            </div>

            {/* Quick Metrics Bar below image */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs text-center">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Prep Time</span>
                <span className="text-xs sm:text-sm font-extrabold text-stone-900 flex items-center justify-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm text-stone-500">schedule</span>
                  {food.preparationTime || '25-30 mins'}
                </span>
              </div>

              <div className="border-x border-stone-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Serving Size</span>
                <span className="text-xs sm:text-sm font-extrabold text-stone-900 flex items-center justify-center gap-1 mt-0.5">
                  <span className="material-symbols-outlined text-sm text-stone-500">group</span>
                  {food.servingSize || '1-2 persons'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Spice Meter</span>
                <div className="flex items-center justify-center gap-0.5 mt-1" title={spiceLabels[spicy] || 'Medium'}>
                  {[...Array(3)].map((_, i) => (
                    <span
                      key={i}
                      className={`material-symbols-outlined text-sm ${
                        i < spicy ? 'text-amber-600' : 'text-stone-300'
                      }`}
                    >
                      local_fire_department
                    </span>
                  ))}
                  <span className="text-[11px] font-bold text-stone-700 ml-1">{spiceLabels[spicy] || 'Medium'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Title, Category, Rating, Price, Chef Attribution, Purchase Controls */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              {/* Category & Rating */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F]">
                  {food.category || 'Traditional Cuisine'}
                </span>

                <div className="flex items-center gap-1 text-xs font-bold text-stone-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60">
                  <span className="material-symbols-outlined text-sm text-amber-500 material-symbols-fill">star</span>
                  <span>{ratingAvg}</span>
                  <span className="text-stone-400 font-normal">({ratingCount} reviews)</span>
                </div>
              </div>

              {/* Dish Name */}
              <h1 className="text-3xl sm:text-4xl font-black text-stone-950 tracking-tight leading-tight">
                {food.name}
              </h1>

              {/* Price Banner */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-3xl font-black text-stone-950">₹{food.price}</span>
                <span className="text-xs text-stone-400 font-medium">Inclusive of all local kitchen taxes</span>
              </div>
            </div>

            {/* Description */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200/80 shadow-xs space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Heritage Story & Recipe
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-normal">
                {food.description ||
                  `Authentic regional recipe prepared in the traditional home kitchen of native chefs, strictly respecting ancestral spice ratios, slow-simmering methods, and clean wholesome ingredients.`}
              </p>
            </div>

            {/* ══ FOOD-TO-CHEF RELATIONSHIP CARD ══ */}
            {chefObj.name && (
              <div
                onClick={() => chefId && navigate(`/chef/${chefId}`)}
                className="group flex items-center justify-between p-4 rounded-2xl bg-white border border-stone-200/80 hover:border-stone-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200">
                    <img
                      src={chefObj.profileImage || chefObj.image || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=100&h=100&fit=crop'}
                      alt={chefObj.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    {chefObj.isVerified ? (
                      <div
                        className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[9px] border border-white shadow-xs"
                        title="Verified HomeChef"
                      >
                        ✓
                      </div>
                    ) : null}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Handcrafted By Master Chef
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-sm font-extrabold text-stone-900 group-hover:text-[#D9532F] transition-colors">
                        {chefObj.name}
                      </h4>
                      {chefObj.isVerified && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          <span className="material-symbols-outlined text-[11px] font-bold">verified</span>
                          <span>✓ Verified HomeChef</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      {chefObj.city}, {chefObj.state} • {chefObj.yearsOfExperience || '10+ Years Experience'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center text-xs font-bold text-[#D9532F] gap-0.5 shrink-0 ml-2">
                  <span>Visit Kitchen</span>
                  <span className="material-symbols-outlined text-sm font-bold">chevron_right</span>
                </div>
              </div>
            )}

            {/* Ingredients Section */}
            {ingredients.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                  Key Ingredients & Masalas
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ingredients.map((ing, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* ══ QUANTITY & ADD TO CART CONTROLS ══ */}
            <div className="pt-4 border-t border-stone-200/80 space-y-4">
              <div className="flex items-center gap-4">
                {/* Quantity Stepper */}
                <div className="flex items-center border border-stone-300 rounded-2xl bg-white shadow-xs p-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || !isAvailable}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">remove</span>
                  </button>
                  <span className="w-12 text-center text-sm font-bold text-stone-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={!isAvailable}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-stone-600 hover:bg-stone-100 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                  </button>
                </div>

                {/* Subtotal */}
                <div className="text-right flex-1">
                  <span className="text-[11px] text-stone-400 font-semibold block uppercase">Total</span>
                  <span className="text-xl font-black text-stone-900">₹{food.price * quantity}</span>
                </div>
              </div>

              {/* Action Buttons: Add to Cart & Favorite */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!isAvailable || isAdding}
                  className={`flex-1 py-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                    !isAvailable
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
                      : justAdded
                      ? 'bg-emerald-600 text-white shadow-emerald-200'
                      : 'bg-[#D9532F] text-white hover:bg-[#C04321] shadow-orange-100'
                  }`}
                >
                  {isAdding ? (
                    <>
                      <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                      <span>Adding to Cart...</span>
                    </>
                  ) : justAdded ? (
                    <>
                      <span className="material-symbols-outlined text-base">check</span>
                      <span>Added {quantity} to Cart!</span>
                    </>
                  ) : !isAvailable ? (
                    <span>Currently Unavailable</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">shopping_bag</span>
                      <span>Add to Order • ₹{food.price * quantity}</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (!userData) {
                      navigate('/signin');
                      return;
                    }
                    dispatch(toggleFavoriteFoodAPI(food._id));
                  }}
                  title={favorites?.favoriteFoods?.some(f => (f._id || f) === food._id) ? "Remove from Favorites" : "Add to Favorites"}
                  className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0 ${
                    favorites?.favoriteFoods?.some(f => (f._id || f) === food._id)
                      ? 'bg-red-50 border-red-200 text-red-500'
                      : 'bg-white border-stone-200 text-stone-400 hover:text-red-500 hover:border-red-200'
                  }`}
                >
                  <span className={`material-symbols-outlined text-2xl ${
                    favorites?.favoriteFoods?.some(f => (f._id || f) === food._id) ? 'material-symbols-fill' : ''
                  }`}>
                    favorite
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ══ REVIEWS & RATINGS SECTION ══ */}
        <section className="mt-16 pt-12 border-t border-stone-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
                Verified Diners
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight mt-0.5">
                Reviews & Tasting Notes
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-800 font-bold text-sm">
                <span className="material-symbols-outlined text-base text-amber-500 material-symbols-fill">star</span>
                <span>{ratingAvg} / 5.0</span>
                <span className="text-stone-400 font-normal">({ratingCount} ratings)</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                  {'★'.repeat(5)}
                </div>
                <span className="text-[11px] text-stone-400 font-medium">2 days ago</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                "The authenticity in the aroma alone is incredible. It genuinely tastes like food cooked by a loving family elder rather than a restaurant."
              </p>
              <div className="text-[11px] text-stone-400 font-bold pt-2 border-t border-stone-100">
                — Ananya Sharma, Verified Customer
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                  {'★'.repeat(5)}
                </div>
                <span className="text-[11px] text-stone-400 font-medium">Last week</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                "Perfect spice balance without greasy leftovers. Arrived piping hot in eco packaging. Ordering this again!"
              </p>
              <div className="text-[11px] text-stone-400 font-bold pt-2 border-t border-stone-100">
                — Karthik R., Bengaluru
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5 text-amber-500 text-xs">
                  {'★'.repeat(5)}
                </div>
                <span className="text-[11px] text-stone-400 font-medium">2 weeks ago</span>
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                "Handcrafted perfection. The texture and freshness of ingredients show the high standard of Swaava home chefs."
              </p>
              <div className="text-[11px] text-stone-400 font-bold pt-2 border-t border-stone-100">
                — Priya Sen, Food Lover
              </div>
            </div>
          </div>
        </section>

        {/* ══ 5. RELATED RECOMMENDATIONS: MORE FROM THIS CHEF ══ */}
        {chefOtherDishes.length > 0 && (
          <section className="mt-16 pt-12 border-t border-stone-200/80">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
                  Kitchen Specialties
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight mt-0.5">
                  More From Chef {chefObj.name}
                </h2>
              </div>

              {chefId && (
                <button
                  onClick={() => navigate(`/chef/${chefId}`)}
                  className="text-xs font-bold text-[#D9532F] hover:text-[#C04321] flex items-center gap-1 cursor-pointer"
                >
                  <span>View Chef's Full Menu</span>
                  <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {chefOtherDishes.map((otherDish) => (
                <FoodCard
                  key={otherDish._id}
                  food={{ ...otherDish, chef: chefObj }}
                  onOpenDetails={(item) => navigate(`/food/${item._id}`)}
                />
              ))}
            </div>
          </section>
        )}

        {/* ══ 5. RELATED RECOMMENDATIONS: MORE FROM THIS STATE ══ */}
        {stateDishes.length > 0 && (
          <section className="mt-16 pt-12 border-t border-stone-200/80">
            <div className="flex items-center justify-between mb-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
                  Regional Cuisine
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight mt-0.5">
                  Authentic Delicacies of {food.state}
                </h2>
              </div>

              <button
                onClick={() => navigate(`/region/${encodeURIComponent(food.state)}`)}
                className="text-xs font-bold text-[#D9532F] hover:text-[#C04321] flex items-center gap-1 cursor-pointer"
              >
                <span>Explore {food.state} Kitchens</span>
                <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {stateDishes.map((stDish) => (
                <FoodCard
                  key={stDish._id}
                  food={stDish}
                  onOpenDetails={(item) => navigate(`/food/${item._id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
