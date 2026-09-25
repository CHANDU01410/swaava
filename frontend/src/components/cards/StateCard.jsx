import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function StateCard({ stateData }) {
  const navigate = useNavigate();

  if (!stateData) return null;

  const name = stateData.name;
  const image = stateData.image || stateData.sourceImg || 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&h=400&fit=crop';
  const description = stateData.description || 'Explore authentic regional home chefs and signature traditional dishes.';
  const dishes = stateData.famousDishes || [];
  const tags = stateData.tags || [];

  return (
    <div
      onClick={() => navigate(`/region/${encodeURIComponent(name)}`)}
      className="group relative h-80 rounded-2xl overflow-hidden cursor-pointer border border-stone-200/60 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-stone-900"
    >
      {/* Background Image */}
      <img
        src={image}
        alt={name}
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108 opacity-85 group-hover:opacity-90"
      />

      {/* Subtle Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/40 to-transparent" />

      {/* Top Floating Tag */}
      {tags.length > 0 && (
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-1.5 z-10">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-semibold text-stone-800 shadow-sm">
            <span className="material-symbols-outlined text-[13px] text-[#D9532F]">
              {tags[0].icon || 'restaurant'}
            </span>
            <span>{tags[0].label}</span>
          </span>
        </div>
      )}

      {/* Arrow Indicator */}
      <div className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-stone-800 shadow-sm transition-all duration-300 group-hover:bg-[#D9532F] group-hover:text-white group-hover:rotate-45">
        <span className="material-symbols-outlined text-sm font-bold">north_east</span>
      </div>

      {/* Content at Bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5 flex flex-col justify-end z-10">
        <h3 className="text-xl font-bold text-white tracking-tight leading-snug group-hover:text-[#FDF2ED] transition-colors">
          {name}
        </h3>

        <p className="text-xs text-stone-300 mt-1 line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Famous Dishes Chips */}
        {dishes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-white/10">
            {dishes.slice(0, 3).map((dish, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-sm text-[11px] font-medium text-white/90 truncate max-w-[140px]"
              >
                {dish}
              </span>
            ))}
            {dishes.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-[10px] font-medium text-white/75">
                +{dishes.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
