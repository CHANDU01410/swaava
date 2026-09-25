import React from 'react';
import { useNavigate } from 'react-router-dom';

const ALL_STATES = [
  'Punjab', 'Andhra Pradesh', 'Telangana', 'Tamil Nadu',
  'Kerala', 'Karnataka', 'Maharashtra', 'Gujarat',
  'Rajasthan', 'West Bengal', 'Odisha', 'Uttar Pradesh'
];

export default function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-stone-900 text-stone-300 pt-16 pb-12 border-t border-stone-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-stone-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div
              className="flex items-center gap-2.5 cursor-pointer"
              onClick={() => {
                navigate('/');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <img src="/swaava-logo.svg" alt="Swaava" className="w-8 h-8 rounded-xl shadow-sm" />
              <span className="text-2xl font-black tracking-tight text-white">
                Swaava<span className="text-[#D9532F]">.</span>
              </span>
            </div>

            <p className="text-sm text-stone-400 max-w-sm leading-relaxed">
              India's premier regional food marketplace connecting discerning diners with verified master home chefs cooking generational family recipes.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 border border-stone-700/60 text-xs text-stone-300">
                <span className="material-symbols-outlined text-emerald-400 text-sm">verified</span>
                <span>Verified Home Chefs</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-800 border border-stone-700/60 text-xs text-stone-300">
                <span className="material-symbols-outlined text-amber-400 text-sm">skillet</span>
                <span>Small Batch</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Platform
            </h4>
            <ul className="space-y-2 text-sm text-stone-400">
              <li>
                <button
                  onClick={() => navigate('/regions')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Explore 12 States
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/signup')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Become a Home Chef
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/cart')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  My Cart
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigate('/my-orders')}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Track Orders
                </button>
              </li>
            </ul>
          </div>

          {/* 12 States Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Regional Kitchens
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-stone-400">
              {ALL_STATES.map((state) => (
                <button
                  key={state}
                  onClick={() => {
                    navigate(`/region/${encodeURIComponent(state)}`);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="text-left hover:text-[#D9532F] transition-colors truncate cursor-pointer"
                >
                  {state}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-stone-500">
          <p>© {new Date().getFullYear()} Swaava Marketplace Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Authentic Regional Flavors</span>
            <span>•</span>
            <span>Food Safety Verified</span>
            <span>•</span>
            <span>Pure Home Craft</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
