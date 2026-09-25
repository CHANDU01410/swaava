import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { addToCartAPI } from '../../redux/userSlice';

export default function FoodCard({ food, onOpenDetails }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector(state => state.user);

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  if (!food) return null;

  const isVeg = food.vegetarian !== undefined ? food.vegetarian : (food.foodType === 'veg');
  const spicy = food.spicyLevel !== undefined ? food.spicyLevel : (food.spiceLevel || 1);
  const chefName = food.chef?.name || food.shop?.name || food.shop?.shopName || 'Master Chef';
  const chefId = food.chef?._id || food.shop?._id;
  const ratingAvg = food.rating?.average || 4.8;
  const reviewCount = food.reviewCount || food.rating?.count || 24;

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    if (!userData) {
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
        quantity: 1,
        chef: chefName
      })).unwrap();
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 1600);
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      onClick={() => onOpenDetails ? onOpenDetails(food) : navigate(`/food/${food._id}`)}
      className="group flex flex-col justify-between bg-white rounded-2xl border border-stone-200/80 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-stone-300 hover:-translate-y-0.5 cursor-pointer"
    >
      {/* Visual Header */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-100">
        <img
          src={food.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop'}
          alt={food.name}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />

        {/* Dietary Pill (Veg/Non-Veg) */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md shadow-sm border border-stone-200/60 text-xs font-semibold">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isVeg ? 'bg-emerald-600' : 'bg-red-600'
            }`}
          />
          <span className={isVeg ? 'text-emerald-800' : 'text-red-800'}>
            {isVeg ? 'Veg' : 'Non-Veg'}
          </span>
        </div>

        {/* State Tag */}
        {food.state && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/region/${encodeURIComponent(food.state)}`);
            }}
            className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-stone-900/80 hover:bg-stone-950 backdrop-blur-md text-white text-xs font-medium tracking-wide transition-colors cursor-pointer"
          >
            {food.state}
          </div>
        )}

        {/* Prep Time pill */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-medium text-stone-700">
          <span className="material-symbols-outlined text-[13px] text-stone-500">schedule</span>
          <span>{food.preparationTime || '25-30 mins'}</span>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Category & Spice */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-medium text-stone-500 tracking-wider uppercase">
              {food.category || 'Traditional'}
            </span>
            {spicy > 0 && (
              <div className="flex items-center gap-0.5" title={`Spiciness Level: ${spicy}/3`}>
                {[...Array(spicy)].map((_, i) => (
                  <span key={i} className="material-symbols-outlined text-[14px] text-amber-600">
                    local_fire_department
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Dish Name */}
          <h3 className="font-semibold text-base text-stone-900 leading-snug line-clamp-1 group-hover:text-[#D9532F] transition-colors">
            {food.name}
          </h3>

          {/* Description */}
          <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
            {food.description || 'Authentic regional preparation crafted using traditional small-batch techniques.'}
          </p>

          {/* Chef Attribution */}
          {chefName && (
            <div
              onClick={(e) => {
                if (chefId) {
                  e.stopPropagation();
                  navigate(`/chef/${chefId}`);
                }
              }}
              className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-stone-100 text-xs text-stone-600 hover:text-stone-900"
            >
              <span className="material-symbols-outlined text-[15px] text-[#D9532F]">skillet</span>
              <span className="font-medium truncate">By {chefName}</span>
            </div>
          )}
        </div>

        {/* Footer: Price & Add Action */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-stone-100">
          <div>
            <span className="text-[11px] text-stone-400 font-medium block">Price</span>
            <span className="text-lg font-bold text-stone-900">₹{food.price}</span>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white shadow-emerald-200'
                : 'bg-[#D9532F] text-white hover:bg-[#C04321] shadow-orange-100'
            }`}
          >
            {isAdding ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : justAdded ? (
              <>
                <span className="material-symbols-outlined text-sm">check</span>
                <span>Added</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
