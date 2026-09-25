import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function ChefCard({ chef }) {
  const navigate = useNavigate();

  if (!chef) return null;

  const id = chef._id;
  const name = chef.name || 'Master Chef';
  const city = chef.city || '';
  const state = chef.state || '';
  const image = chef.profileImage || chef.image || 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=600&h=600&fit=crop';
  const specialty = chef.specialization || chef.specialty || 'Authentic Regional Kitchen';
  const bio = chef.bio || 'Preserving generation-old regional recipes and cooking with wholesome, hand-selected ingredients.';
  const experience = chef.yearsOfExperience || chef.experience || '10+ Years';
  const ratingAvg = Number((chef.rating?.average || 4.8).toFixed(1));
  const reviewCount = chef.totalReviews || chef.rating?.count || 45;
  const isPureVeg = chef.isPureVeg;

  return (
    <div
      onClick={() => navigate(`/chef/${id}`)}
      className="group flex flex-col justify-between bg-white rounded-2xl border border-stone-200/80 p-5 transition-all duration-300 hover:shadow-lg hover:border-stone-300 hover:-translate-y-0.5 cursor-pointer"
    >
      <div>
        {/* Top Header: Avatar + Meta */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0 w-16 h-16 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shadow-sm">
            <img
              src={image}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {/* Verified icon on image (Only when actually verified by admin) */}
            {chef.isVerified ? (
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center border-2 border-white shadow-sm"
                title="Verified HomeChef"
              >
                <span className="material-symbols-outlined text-[11px] font-bold">verified</span>
              </div>
            ) : null}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="font-bold text-stone-900 text-base truncate group-hover:text-[#D9532F] transition-colors">
                {name}
              </h3>
              {chef.isVerified && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  <span className="material-symbols-outlined text-[11px] font-bold">verified</span>
                  <span>✓ Verified HomeChef</span>
                </span>
              )}
              {isPureVeg && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Pure Veg
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-xs text-stone-500 mt-0.5">
              <span className="material-symbols-outlined text-[14px] text-stone-400">location_on</span>
              <span className="truncate">{city}{city && state ? ', ' : ''}{state}</span>
            </div>

            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1 text-xs font-semibold text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                <span className="material-symbols-outlined text-[13px] text-amber-500 material-symbols-fill">star</span>
                <span>{ratingAvg}</span>
                <span className="text-stone-400 font-normal">({reviewCount})</span>
              </div>
              <span className="text-[11px] font-medium text-stone-500 bg-stone-100 px-2 py-0.5 rounded-md">
                {experience}
              </span>
            </div>
          </div>
        </div>

        {/* Specialization */}
        <div className="mt-4 pt-3 border-t border-stone-100">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-[#D9532F] block">
            Specialization
          </span>
          <p className="font-medium text-xs text-stone-800 line-clamp-1 mt-0.5">
            {specialty}
          </p>
        </div>

        {/* Bio */}
        <p className="text-xs text-stone-500 line-clamp-2 mt-2 leading-relaxed">
          {bio}
        </p>
      </div>

      {/* Footer Action */}
      <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between">
        <div className="text-xs text-stone-500">
          <span className="font-semibold text-stone-800">{chef.items?.length || '5'}</span> signature dishes
        </div>

        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#D9532F] group-hover:translate-x-0.5 transition-transform">
          <span>View Menu</span>
          <span className="material-symbols-outlined text-sm font-bold">arrow_forward</span>
        </span>
      </div>
    </div>
  );
}
