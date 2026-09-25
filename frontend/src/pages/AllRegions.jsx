import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { serverUrl } from '../App';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import StateCard from '../components/cards/StateCard';

export default function AllRegions() {
  const navigate = useNavigate();
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterQuery, setFilterQuery] = useState('');

  useEffect(() => {
    const fetchRegions = async () => {
      try {
        const res = await axios.get(`${serverUrl}/api/region/all`);
        setRegions(res.data || []);
      } catch (err) {
        console.error('Failed to fetch regions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRegions();
  }, []);

  const filteredRegions = regions.filter((r) => {
    if (!filterQuery.trim()) return true;
    const q = filterQuery.toLowerCase();
    const nameMatch = r.name?.toLowerCase().includes(q);
    const dishMatch = r.famousDishes?.some((d) => d.toLowerCase().includes(q));
    const descMatch = r.description?.toLowerCase().includes(q);
    return nameMatch || dishMatch || descMatch;
  });

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      <Nav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        {/* Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FDF2ED] text-xs font-bold uppercase tracking-wider text-[#D9532F] mb-3">
            <span className="material-symbols-outlined text-sm">map</span>
            <span>12 Indian Culinary States</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-stone-950 tracking-tight leading-tight">
            Explore Regional India
          </h1>

          <p className="text-sm sm:text-base text-stone-600 mt-3 leading-relaxed">
            From the fiery coastal curries of Andhra to the clay-tandoor flatbreads of Punjab, explore authentic dishes prepared by native home chefs.
          </p>

          <div className="flex items-center justify-center gap-2 mt-4">
            <button
              onClick={() => navigate('/explore?tab=dishes')}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-white border border-stone-200 text-stone-700 hover:text-[#D9532F] hover:border-[#D9532F] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">restaurant</span>
              <span>Browse All Dishes</span>
            </button>
            <button
              onClick={() => navigate('/explore?tab=chefs')}
              className="px-4 py-1.5 rounded-full text-xs font-bold bg-white border border-stone-200 text-stone-700 hover:text-[#D9532F] hover:border-[#D9532F] transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-sm">skillet</span>
              <span>Meet All Chefs</span>
            </button>
          </div>

          {/* Quick Filter Search */}
          <div className="relative max-w-md mx-auto mt-6">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-stone-400">
              <span className="material-symbols-outlined text-lg">search</span>
            </span>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter states or dishes (e.g. Biryani, Kulcha, Kerala)..."
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white border border-stone-200 text-xs font-medium text-stone-900 placeholder:text-stone-400 shadow-sm focus:outline-none focus:border-[#D9532F] transition-all"
            />
            {filterQuery && (
              <button
                onClick={() => setFilterQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </div>
        </div>

        {/* Regions Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
            <span className="material-symbols-outlined text-4xl text-[#D9532F] animate-spin">progress_activity</span>
            <p className="text-xs font-semibold">Loading regional kitchens...</p>
          </div>
        ) : filteredRegions.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredRegions.map((region) => (
              <StateCard key={region._id} stateData={region} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-stone-200 p-8 max-w-md mx-auto">
            <span className="material-symbols-outlined text-4xl text-stone-300 mb-2">search_off</span>
            <h3 className="text-base font-bold text-stone-800">No states matched your search</h3>
            <p className="text-xs text-stone-500 mt-1">Try clearing your search query to see all 12 regional states.</p>
            <button
              onClick={() => setFilterQuery('')}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
            >
              Reset Filter
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}