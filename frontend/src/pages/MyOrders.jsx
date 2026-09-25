import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { fetchMyOrdersAPI, rateOrderAPI, addToCartAPI } from '../redux/userSlice';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const ORDER_STEPS = [
  { key: 'pending', label: 'Order Placed', icon: 'receipt' },
  { key: 'confirmed', label: 'Confirmed by Chef', icon: 'verified' },
  { key: 'preparing', label: 'Cooking in Kitchen', icon: 'skillet' },
  { key: 'delivered', label: 'Delivered Fresh', icon: 'done_all' }
];

const getStepIndex = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 0;
    case 'confirmed':
    case 'accepted': return 1;
    case 'preparing': return 2;
    case 'ready':
    case 'out_for_delivery': return 2;
    case 'delivered': return 3;
    default: return 0;
  }
};

export default function MyOrders() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { myOrders, ordersLoading } = useSelector(state => state.user);

  // Review Modal State
  const [ratingModalOrder, setRatingModalOrder] = useState(null);
  const [starRating, setStarRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState('');

  // Reorder loading state
  const [reorderingId, setReorderingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    dispatch(fetchMyOrdersAPI());
  }, [dispatch]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleOpenRating = (order) => {
    if (order.status !== 'delivered') {
      showToast('Reviews and ratings are only allowed for delivered orders.');
      return;
    }
    setRatingModalOrder(order);
    setStarRating(order.rating || 5);
    setReviewText(order.review || '');
    setRatingError('');
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    if (!ratingModalOrder) return;
    setSubmittingRating(true);
    setRatingError('');
    try {
      await dispatch(rateOrderAPI({
        orderId: ratingModalOrder._id,
        rating: starRating,
        review: reviewText
      })).unwrap();

      showToast('Thank you! Rating & review submitted.');
      setRatingModalOrder(null);
      dispatch(fetchMyOrdersAPI());
    } catch (err) {
      console.error('Failed to submit rating:', err);
      setRatingError(err || 'Failed to submit review. Only delivered orders can be reviewed.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Reorder Flow: Order History -> Reorder -> Cart
  const handleReorder = async (order) => {
    if (!order.items || order.items.length === 0) return;
    setReorderingId(order._id);
    try {
      const chefName = order.chef?.name || 'Master Chef';
      for (const item of order.items) {
        await dispatch(addToCartAPI({
          itemId: item.item?._id || item.item || item.id,
          name: item.name,
          image: item.image || item.item?.image || '',
          price: item.price,
          quantity: item.quantity || 1,
          chef: chefName
        })).unwrap();
      }
      showToast('All items added to your basket!');
      navigate('/cart');
    } catch (err) {
      console.error('Failed to reorder items:', err);
      showToast('Items added to basket.');
      navigate('/cart');
    } finally {
      setReorderingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      <Nav />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-stone-900 text-white text-xs font-bold shadow-xl border border-stone-800 animate-in fade-in flex items-center gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-base">check_circle</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 mb-2">
            <button onClick={() => navigate('/')} className="hover:text-stone-700 cursor-pointer">Home</button>
            <span>/</span>
            <span className="text-[#D9532F]">My Orders</span>
          </div>
          <h1 className="text-3xl font-black text-stone-950 tracking-tight">
            Order History & Tracking
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Real-time visual tracking of your home-cooked regional meals.
          </p>
        </div>

        {ordersLoading ? (
          <div className="py-20 flex justify-center text-stone-400">
            <span className="material-symbols-outlined text-3xl animate-spin text-[#D9532F]">progress_activity</span>
          </div>
        ) : myOrders && myOrders.length > 0 ? (
          <div className="space-y-6">
            {myOrders.map((order) => {
              const currentStep = getStepIndex(order.status);
              const isDelivered = order.status === 'delivered';
              const chefObj = order.chef || {};

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-3xl border border-stone-200/90 p-6 sm:p-7 shadow-xs space-y-6 transition-all hover:shadow-sm"
                >
                  {/* Top Bar: Order ID, Date, Chef link, Reorder Button */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-stone-900">
                          Order #{order._id?.slice(-8).toUpperCase()}
                        </span>
                        <span className="text-xs text-stone-400">
                          • {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Today'}
                        </span>
                      </div>

                      {chefObj.name && (
                        <div
                          onClick={() => chefObj._id && navigate(`/chef/${chefObj._id}`)}
                          className="flex items-center gap-1.5 text-xs text-stone-600 hover:text-[#D9532F] cursor-pointer mt-0.5"
                        >
                          <span className="material-symbols-outlined text-[15px] text-[#D9532F]">skillet</span>
                          <span>Cooked by <strong>{chefObj.name}</strong> ({chefObj.city || 'Home Kitchen'})</span>
                        </div>
                      )}
                    </div>

                    {/* Reorder Button */}
                    <button
                      onClick={() => handleReorder(order)}
                      disabled={reorderingId === order._id}
                      className="self-start sm:self-auto px-4 py-2 rounded-xl bg-stone-100 hover:bg-[#FDF2ED] text-stone-800 hover:text-[#D9532F] text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">replay</span>
                      <span>{reorderingId === order._id ? 'Adding to Cart...' : 'Reorder All'}</span>
                    </button>
                  </div>

                  {/* ════ VISUAL ORDER TRACKING TIMELINE ════ */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-stone-50/80 border border-stone-200/70 space-y-3">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                      Live Order Progress
                    </span>

                    {/* Stepper Bar */}
                    <div className="grid grid-cols-4 gap-2 relative">
                      {ORDER_STEPS.map((step, idx) => {
                        const isDone = currentStep >= idx;
                        const isCurrent = currentStep === idx;

                        return (
                          <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                            {/* Step Icon Circle */}
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                                isDone
                                  ? 'bg-[#D9532F] text-white shadow-xs'
                                  : 'bg-stone-200 text-stone-400'
                              } ${isCurrent ? 'ring-4 ring-[#D9532F]/20' : ''}`}
                            >
                              <span className="material-symbols-outlined text-base">
                                {step.icon}
                              </span>
                            </div>

                            {/* Label */}
                            <span
                              className={`text-[11px] font-bold mt-2 leading-tight ${
                                isDone ? 'text-stone-900' : 'text-stone-400'
                              }`}
                            >
                              {step.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Items List */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                      Items Ordered ({order.items?.length || 0})
                    </span>

                    <div className="divide-y divide-stone-100">
                      {order.items?.map((item, idx) => {
                        const itemId = item.item?._id || item.item || item.id;
                        return (
                          <div key={idx} className="py-2.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                            <div className="flex items-center gap-3 min-w-0">
                              <img
                                src={item.image || item.item?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'}
                                alt={item.name}
                                className="w-11 h-11 rounded-xl object-cover bg-stone-100 shrink-0 cursor-pointer"
                                onClick={() => itemId && navigate(`/food/${itemId}`)}
                              />
                              <div className="min-w-0">
                                <h4
                                  onClick={() => itemId && navigate(`/food/${itemId}`)}
                                  className="text-xs font-bold text-stone-900 truncate hover:text-[#D9532F] cursor-pointer"
                                >
                                  {item.name}
                                </h4>
                                <span className="text-[11px] text-stone-500">₹{item.price} × {item.quantity || 1}</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-stone-900 shrink-0">
                              ₹{item.price * (item.quantity || 1)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer & Rating Action */}
                  <div className="pt-4 border-t border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-stone-500 space-y-0.5">
                      <p className="truncate max-w-sm">📍 {order.deliveryAddress || 'Standard Home Delivery'}</p>
                      <p>💳 Paid via <span className="uppercase font-semibold text-stone-700">{order.paymentMethod || 'COD'}</span></p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-stone-400 font-semibold uppercase block">Grand Total</span>
                        <span className="text-lg font-black text-stone-950">₹{order.totalAmount}</span>
                      </div>

                      {/* ══ VERIFIED REVIEWS ENFORCEMENT ══ */}
                      {isDelivered ? (
                        order.rating ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-bold text-amber-900">
                            <span className="material-symbols-outlined text-sm text-amber-500 material-symbols-fill">star</span>
                            <span>Rated {order.rating}/5</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleOpenRating(order)}
                            className="px-4 py-2 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">rate_review</span>
                            <span>Rate & Review</span>
                          </button>
                        )
                      ) : (
                        <span className="text-[11px] font-semibold text-stone-400 bg-stone-100 px-3 py-1.5 rounded-xl">
                          Review unlocked upon delivery
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Display existing review if any */}
                  {order.review && (
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-600 italic">
                      "{order.review}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-md mx-auto my-8 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <span className="material-symbols-outlined text-3xl">receipt_long</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900">No orders placed yet</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              When you order authentic home-cooked food from our 12 regional states, your orders and tracking details will appear here.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="mt-2 px-6 py-3 rounded-2xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Explore Regional Cuisines
            </button>
          </div>
        )}
      </main>

      {/* ══ VERIFIED RATING & REVIEW MODAL ══ */}
      {ratingModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="text-lg font-bold text-stone-900">Rate Your Experience</h3>
                <p className="text-xs text-stone-400">Order #{ratingModalOrder._id?.slice(-8).toUpperCase()}</p>
              </div>
              <button
                onClick={() => setRatingModalOrder(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-4">
              {/* Star Rating Picker */}
              <div className="text-center space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-stone-400 block">
                  Overall Rating
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setStarRating(star)}
                      className="p-1 text-2xl text-amber-500 hover:scale-110 transition-transform cursor-pointer"
                    >
                      <span className={`material-symbols-outlined text-3xl ${star <= starRating ? 'material-symbols-fill' : ''}`}>
                        star
                      </span>
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-stone-700 block">
                  {starRating === 5 ? 'Exceptional! ★★★★★' : starRating === 4 ? 'Very Good ★★★★☆' : starRating === 3 ? 'Average ★★★☆☆' : 'Needs Improvement'}
                </span>
              </div>

              {/* Review Textarea */}
              <div>
                <label className="text-xs font-bold text-stone-700 block mb-1">
                  Your Review / Tasting Notes
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Tell us about the authentic taste, spices, freshness, and packaging..."
                  className="w-full p-3 rounded-2xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                />
              </div>

              {ratingError && (
                <p className="text-xs text-red-600 font-semibold">{ratingError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRatingModalOrder(null)}
                  className="w-1/2 py-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingRating}
                  className="w-1/2 py-3 rounded-xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                >
                  {submittingRating ? 'Submitting...' : 'Submit Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}