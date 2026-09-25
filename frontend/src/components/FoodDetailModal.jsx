import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addToCartAPI } from '../redux/userSlice';

export default function FoodDetailModal({ food, isOpen, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { userData } = useSelector(state => state.user);

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (!isOpen || !food) return null;

  const isVeg = food.vegetarian !== undefined ? food.vegetarian : (food.foodType === 'veg');
  const spicy = food.spicyLevel !== undefined ? food.spicyLevel : (food.spiceLevel || 1);
  const chefName = food.chef?.name || food.shop?.name || food.shop?.shopName || 'Master Chef';
  const chefId = food.chef?._id || food.shop?._id;
  const isChefVerified = Boolean(food.chef?.isVerified || food.shop?.isVerified);
  const ingredients = food.ingredients || [];
  const totalPrice = food.price * quantity;

  const handleAddToCart = async () => {
    if (!userData) {
      onClose();
      navigate('/signin');
      return;
    }
    setIsAdding(true);
    try {
      await dispatch(addToCartAPI({
        itemId: food._id,
        name: food.name,
        image: food.image || '',
        price: food.price,
        quantity: quantity,
        chef: chefName
      })).unwrap();
      setJustAdded(true);
      setTimeout(() => {
        setJustAdded(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error adding to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-stone-950/60 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 border border-stone-200 my-auto">
        {/* Action Controls */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={() => {
              onClose();
              navigate(`/food/${food._id}`);
            }}
            className="px-3 py-1.5 rounded-full bg-white/90 hover:bg-white text-stone-700 hover:text-stone-950 backdrop-blur-md shadow-md text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
            title="Open Full Dish Page"
          >
            <span className="material-symbols-outlined text-sm">open_in_new</span>
            <span className="hidden sm:inline">Full Page</span>
          </button>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-600 hover:text-stone-950 hover:bg-white shadow-md transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg font-bold">close</span>
          </button>
        </div>

        {/* Hero Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-stone-100">
          <img
            src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1000&h=600&fit=crop'}
            alt={food.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-950/60 via-transparent to-transparent" />

          {/* Badges on Hero */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border shadow-sm ${
                isVeg
                  ? 'bg-emerald-950/80 text-emerald-200 border-emerald-500/30'
                  : 'bg-red-950/80 text-red-200 border-red-500/30'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isVeg ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {isVeg ? 'Pure Vegetarian' : 'Non-Vegetarian'}
              </span>

              {food.state && (
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/region/${encodeURIComponent(food.state)}`);
                  }}
                  className="px-3 py-1 rounded-full bg-stone-900/80 hover:bg-stone-950 backdrop-blur-md text-white text-xs font-medium border border-white/20 transition-colors cursor-pointer"
                >
                  {food.state}
                </button>
              )}
            </div>

            <span className="text-white text-xs font-medium px-3 py-1 rounded-full bg-black/40 backdrop-blur-md">
              {food.category || 'Main Course'}
            </span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Title & Quick Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2
                onClick={() => {
                  onClose();
                  navigate(`/food/${food._id}`);
                }}
                className="text-2xl font-bold text-stone-900 tracking-tight hover:text-[#D9532F] transition-colors cursor-pointer"
                title="View Full Dish Page"
              >
                {food.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-stone-500 mt-1">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-stone-400">schedule</span>
                  {food.preparationTime || '25-30 mins'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-stone-400">restaurant</span>
                  {food.servingSize || '1-2 persons'}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-amber-500 material-symbols-fill">star</span>
                  {food.rating?.average || 4.8} ({food.reviewCount || food.rating?.count || 24} reviews)
                </span>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-stone-400 font-medium block">Price per portion</span>
              <span className="text-2xl font-bold text-stone-900">₹{food.price}</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1.5">
              About this dish
            </h4>
            <p className="text-sm text-stone-700 leading-relaxed">
              {food.description || 'Prepared using authentic regional spices and slow cooking techniques handed down through generations of home chefs.'}
            </p>
          </div>

          {/* Spicy Level Indicator */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-stone-50 border border-stone-200/60">
            <span className="material-symbols-outlined text-amber-600 text-xl">local_fire_department</span>
            <div className="flex-1">
              <span className="text-xs font-medium text-stone-800 block">Spice Intensity</span>
              <span className="text-xs text-stone-500">
                {spicy === 0 ? 'Mild & Gentle' : spicy === 1 ? 'Balanced Traditional Spice' : spicy === 2 ? 'Medium Fiery' : 'Authentic Strong Heat'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`w-3 h-5 rounded-sm ${
                    level <= spicy ? 'bg-amber-600' : 'bg-stone-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">
                Ingredients & Fresh Produce
              </h4>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-3 py-1 rounded-lg bg-stone-100 text-stone-700 text-xs font-medium"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Chef Attribution Banner */}
          {chefName && (
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#FDF2ED] border border-[#D9532F]/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D9532F] text-white flex items-center justify-center font-bold text-sm">
                  <span className="material-symbols-outlined text-lg">person</span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-[#D9532F] block">
                    Prepared with love by
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-bold text-stone-900">{chefName}</span>
                    {isChefVerified && (
                      <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="material-symbols-outlined text-[11px] font-bold">verified</span>
                        <span>✓ Verified HomeChef</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {chefId && (
                <button
                  onClick={() => {
                    onClose();
                    navigate(`/chef/${chefId}`);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-[#D9532F] hover:bg-white/80 transition-colors cursor-pointer"
                >
                  View Profile
                </button>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer / Checkout Bar */}
        <div className="p-4 sm:p-6 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Stepper */}
          <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">remove</span>
            </button>
            <span className="w-8 text-center font-bold text-sm text-stone-900">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center text-stone-600 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
            </button>
          </div>

          {/* Total & Action Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-[#D9532F] text-white hover:bg-[#C04321] active:scale-98 shadow-orange-200'
            }`}
          >
            {isAdding ? (
              <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
            ) : justAdded ? (
              <>
                <span className="material-symbols-outlined text-lg">check_circle</span>
                <span>Added {quantity} to Cart!</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-lg">shopping_cart</span>
                <span>Add to Cart • ₹{totalPrice}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
