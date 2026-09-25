import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchChefById, clearViewingChef } from '../redux/chefSlice';
import axios from 'axios';
import { serverUrl } from '../App';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import FoodCard from '../components/cards/FoodCard';
import { toggleFavoriteChefAPI } from '../redux/userSlice';

export default function ChefMenu() {
  const { chefId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { viewingChef, viewingChefLoading } = useSelector(state => state.chef);
  const { userData, favorites } = useSelector(state => state.user);
  const [reviews, setReviews] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (chefId) {
      dispatch(fetchChefById(chefId));

      const fetchReviews = async () => {
        try {
          const res = await axios.get(`${serverUrl}/api/review/chef/${chefId}`);
          setReviews(res.data || []);
        } catch (e) {
          console.error('Reviews fetch error:', e);
        }
      };
      fetchReviews();
    }

    return () => dispatch(clearViewingChef());
  }, [chefId, dispatch]);

  if (viewingChefLoading || !viewingChef) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col justify-between">
        <Nav />
        <div className="flex-1 flex flex-col items-center justify-center py-32 text-stone-400 gap-3">
          <span className="material-symbols-outlined text-4xl text-[#D9532F] animate-spin">progress_activity</span>
          <p className="text-xs font-semibold">Opening home chef kitchen...</p>
        </div>
        <Footer />
      </div>
    );
  }

  const chef = viewingChef;
  const items = chef.items || [];
  const categories = ['All', ...new Set(items.map(i => i.category))];
  const filteredItems = activeCategory === 'All'
    ? items
    : items.filter(i => i.category === activeCategory);

  // Top signature dishes (first 2-3 items)
  const signatureDishes = items.slice(0, 2);

  const ratingAvg = Number((chef.rating?.average || 4.8).toFixed(1));
  const reviewCount = chef.totalReviews || chef.rating?.count || 45;

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      <Nav />

      {/* ══ CHEF PROFILE HEADER ══ */}
      <section className="bg-white border-b border-stone-200/80 py-10 sm:py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 mb-6">
            <button onClick={() => navigate('/')} className="hover:text-stone-700 cursor-pointer">Home</button>
            <span>/</span>
            <button onClick={() => navigate('/explore?tab=chefs')} className="hover:text-stone-700 cursor-pointer">Chefs</button>
            <span>/</span>
            {chef.state && (
              <>
                <button
                  onClick={() => navigate(`/region/${encodeURIComponent(chef.state)}`)}
                  className="hover:text-stone-700 cursor-pointer"
                >
                  {chef.state}
                </button>
                <span>/</span>
              </>
            )}
            <span className="text-[#D9532F]">{chef.name}</span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-5">
              {/* Chef Avatar */}
              <div className="relative shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 shadow-md">
                <img
                  src={chef.profileImage || chef.image || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&h=600&fit=crop'}
                  alt={chef.name}
                  className="w-full h-full object-cover"
                />
                {chef.isVerified ? (
                  <div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-xs"
                    title="Verified HomeChef"
                  >
                    <span className="material-symbols-outlined text-[12px] font-bold">verified</span>
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

              {/* Chef Information */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight">
                    {chef.name}
                  </h1>
                  {chef.isVerified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span className="material-symbols-outlined text-xs">verified</span>
                      ✓ Verified HomeChef
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <span className="material-symbols-outlined text-xs">schedule</span>
                      Approval Pending
                    </span>
                  )}
                  {chef.isPureVeg && (
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900">
                      100% Pure Veg
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm font-semibold text-[#D9532F]">
                  {chef.specialization || chef.specialty}
                </p>

                {/* Location with Chef-to-State relationship link */}
                <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                  <button
                    onClick={() => navigate(`/region/${encodeURIComponent(chef.state)}`)}
                    className="flex items-center gap-1 hover:text-[#D9532F] transition-colors cursor-pointer font-medium"
                    title={`Explore ${chef.state} Regional Kitchens`}
                  >
                    <span className="material-symbols-outlined text-[15px] text-[#D9532F]">location_on</span>
                    <span>{chef.city}, <strong className="underline decoration-stone-300 underline-offset-2">{chef.state}</strong></span>
                  </button>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[15px] text-stone-400">history</span>
                    {chef.yearsOfExperience || chef.experience || '10+ Years Experience'}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold text-amber-700">
                    <span className="material-symbols-outlined text-[14px] text-amber-500 material-symbols-fill">star</span>
                    {ratingAvg} ({reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Kitchen Stats Pill & Follow Button */}
            <div className="flex items-center gap-3 self-stretch sm:self-auto flex-wrap">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-stone-50 border border-stone-200/80">
                <button
                  onClick={() => navigate(`/region/${encodeURIComponent(chef.state)}`)}
                  className="text-center px-3 hover:opacity-80 transition-opacity cursor-pointer"
                >
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Heritage State</span>
                  <span className="text-xs font-extrabold text-[#D9532F]">{chef.state}</span>
                </button>
                <div className="w-px h-6 bg-stone-200" />
                <div className="text-center px-3">
                  <span className="text-[10px] uppercase font-bold text-stone-400 tracking-wider block">Menu Items</span>
                  <span className="text-xs font-extrabold text-stone-900">{items.length}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (!userData) {
                    navigate('/signin');
                    return;
                  }
                  dispatch(toggleFavoriteChefAPI(chef._id));
                }}
                className={`p-3 rounded-2xl border flex items-center gap-2 text-xs font-bold transition-all cursor-pointer shadow-xs ${
                  favorites?.favoriteChefs?.some(c => (c._id || c) === chef._id)
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                }`}
              >
                <span className={`material-symbols-outlined text-lg ${
                  favorites?.favoriteChefs?.some(c => (c._id || c) === chef._id) ? 'text-red-500 material-symbols-fill' : 'text-stone-400'
                }`}>
                  favorite
                </span>
                <span>{favorites?.favoriteChefs?.some(c => (c._id || c) === chef._id) ? 'Favorited' : 'Favorite Chef'}</span>
              </button>
            </div>
          </div>

          {/* Bio Snippet */}
          <div className="mt-6 pt-6 border-t border-stone-100 max-w-3xl">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1">
              About The Chef & Heritage Story
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-normal">
              {chef.bio || 'Preserving generation-old regional recipes and cooking with wholesome, hand-selected ingredients in a clean, audited home kitchen.'}
            </p>
          </div>
        </div>
      </section>

      {/* ══ SIGNATURE DISHES SPOTLIGHT ══ */}
      {signatureDishes.length > 0 && (
        <section className="bg-[#FAF7F2] border-b border-stone-200/80 py-10 sm:py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
                  Chef's Masterpieces
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight mt-0.5">
                  Signature Dishes
                </h2>
              </div>
              <span className="text-xs text-stone-500 font-medium hidden sm:inline-block">
                Most requested ancestral recipes
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {signatureDishes.map((dish) => (
                <div
                  key={dish._id}
                  onClick={() => navigate(`/food/${dish._id}`)}
                  className="group flex flex-col sm:flex-row bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm hover:shadow-lg hover:border-[#D9532F]/40 transition-all cursor-pointer"
                >
                  <div className="relative aspect-[4/3] sm:aspect-square sm:w-48 overflow-hidden shrink-0 bg-stone-100">
                    <img
                      src={dish.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop'}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-stone-950/80 text-white text-[10px] font-bold uppercase tracking-wider">
                      Signature
                    </div>
                  </div>

                  <div className="p-5 flex flex-col justify-between flex-1 space-y-3">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold uppercase text-[#D9532F]">
                          {dish.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs font-bold text-stone-700">
                          <span className="material-symbols-outlined text-xs text-amber-500 material-symbols-fill">star</span>
                          <span>{dish.rating?.average || 4.8}</span>
                        </div>
                      </div>

                      <h3 className="font-extrabold text-base text-stone-950 group-hover:text-[#D9532F] transition-colors mt-1">
                        {dish.name}
                      </h3>

                      <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                        {dish.description || 'Ancestral preparation slow-cooked with freshly ground stone masalas and pure ghee.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-stone-100">
                      <div>
                        <span className="text-[10px] text-stone-400 font-semibold block uppercase">Price</span>
                        <span className="text-lg font-black text-stone-950">₹{dish.price}</span>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-xl bg-[#FDF2ED] text-[#D9532F] text-xs font-bold group-hover:bg-[#D9532F] group-hover:text-white transition-colors flex items-center gap-1">
                        <span>View Details</span>
                        <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ══ ALL DISHES MENU SECTION ══ */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Category Pills Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
              Complete Kitchen Catalog
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight mt-0.5">
              All Dishes by {chef.name}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  activeCategory === cat
                    ? 'bg-[#D9532F] text-white shadow-xs'
                    : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Food Items Grid — Clicking each dish navigates directly to /food/:foodId */}
        {filteredItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredItems.map((food) => (
              <FoodCard
                key={food._id}
                food={{ ...food, chef: { name: chef.name, _id: chef._id, city: chef.city, state: chef.state } }}
                onOpenDetails={(item) => navigate(`/food/${item._id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto">
            <span className="material-symbols-outlined text-4xl text-stone-300 mb-2">restaurant_menu</span>
            <h3 className="text-base font-bold text-stone-800">No dishes in this category</h3>
            <p className="text-xs text-stone-500 mt-1">Please select another category above to view chef's creations.</p>
          </div>
        )}

        {/* Customer Reviews Section */}
        <section className="mt-16 pt-12 border-t border-stone-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#D9532F] block">
                Customer Testimonials
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-stone-950 tracking-tight mt-0.5">
                Reviews & Ratings
              </h3>
            </div>
            <div className="flex items-center gap-1 text-sm font-bold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-xl border border-amber-200/60">
              <span className="material-symbols-outlined text-base text-amber-500 material-symbols-fill">star</span>
              <span>{ratingAvg} / 5.0</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-2">
              <div className="flex items-center gap-1 text-amber-500 text-xs">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                "The authenticity of the flavors took me straight back home. You can taste the freshly ground spices and uncompromised quality."
              </p>
              <div className="text-[11px] text-stone-400 font-semibold pt-1 border-t border-stone-100">
                — Sunita R., Verified Diner
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-2">
              <div className="flex items-center gap-1 text-amber-500 text-xs">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                "Arrived hot and smelling wonderful. The texture and small-batch preparation are unmistakably superior to restaurant food."
              </p>
              <div className="text-[11px] text-stone-400 font-semibold pt-1 border-t border-stone-100">
                — Vikram K., Food Enthusiast
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-stone-200 space-y-2">
              <div className="flex items-center gap-1 text-amber-500 text-xs">
                {'★'.repeat(5)}
              </div>
              <p className="text-xs text-stone-700 leading-relaxed font-medium">
                "The traditional balance of spices without excessive oil makes this my weekly go-to. Highly recommend Chef {chef.name}!"
              </p>
              <div className="text-[11px] text-stone-400 font-semibold pt-1 border-t border-stone-100">
                — Meera N., Food Connoisseur
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}