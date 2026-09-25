import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateQuantityAPI, removeFromCartAPI, clearCartAPI, placeOrderAPI } from '../redux/userSlice';
import { useNavigate } from 'react-router-dom';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const AVAILABLE_COUPONS = {
  'SWAAVA50': { type: 'fixed', value: 50, desc: '₹50 flat discount on your regional feast' },
  'FEAST20': { type: 'percent', value: 20, desc: '20% off on all home-cooked delicacies' }
};

export default function Cart() {
  const { cartItems, totalAmount, userData } = useSelector(state => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod, upi, card
  const [selectedAddressIndex, setSelectedAddressIndex] = useState(0);

  // Address state
  const savedAddresses = userData?.addresses || [];
  const defaultAddress = savedAddresses[0] || {
    fullAddress: 'Plot 42, Heritage Enclave, Indiranagar',
    city: userData?.city || 'Bengaluru',
    pincode: '560038',
    phone: userData?.phone || '+91 98765 43210'
  };

  const [customAddress, setCustomAddress] = useState({
    street: defaultAddress.fullAddress || '',
    city: defaultAddress.city || 'Bengaluru',
    pincode: defaultAddress.pincode || '560038',
    phone: defaultAddress.phone || userData?.phone || '+91 98765 43210'
  });

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // UI state
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Financial Calculations
  const TAX_RATE = 0.05;
  const tax = +(totalAmount * TAX_RATE).toFixed(2);
  const deliveryFee = totalAmount > 499 || totalAmount === 0 ? 0 : 40;

  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'fixed') {
      discount = Math.min(appliedCoupon.value, totalAmount);
    } else if (appliedCoupon.type === 'percent') {
      discount = +((totalAmount * appliedCoupon.value) / 100).toFixed(2);
    }
  }

  const grandTotal = Math.max(0, +(totalAmount + tax + deliveryFee - discount).toFixed(2));

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    if (AVAILABLE_COUPONS[code]) {
      setAppliedCoupon({ code, ...AVAILABLE_COUPONS[code] });
      setCouponCode('');
    } else {
      setCouponError('Invalid coupon code. Try SWAAVA50 or FEAST20');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
  };

  const handleIncrease = async (item) => {
    try {
      await dispatch(updateQuantityAPI({ itemId: item.id || item.itemId, quantity: item.quantity + 1 })).unwrap();
    } catch (err) {
      console.error('Update quantity failed:', err);
    }
  };

  const handleDecrease = async (item) => {
    try {
      if (item.quantity === 1) {
        await dispatch(removeFromCartAPI(item.id || item.itemId)).unwrap();
      } else {
        await dispatch(updateQuantityAPI({ itemId: item.id || item.itemId, quantity: item.quantity - 1 })).unwrap();
      }
    } catch (err) {
      console.error('Update quantity failed:', err);
    }
  };

  const handleRemove = async (itemId) => {
    try {
      await dispatch(removeFromCartAPI(itemId)).unwrap();
    } catch (err) {
      console.error('Remove failed:', err);
    }
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to empty your basket?')) {
      setIsClearing(true);
      try {
        await dispatch(clearCartAPI()).unwrap();
      } catch (err) {
        console.error('Clear cart failed:', err);
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleCheckout = async () => {
    if (!cartItems || cartItems.length === 0) return;
    setIsPlacingOrder(true);
    try {
      const activeAddressStr = savedAddresses.length > 0 && savedAddresses[selectedAddressIndex]
        ? `${savedAddresses[selectedAddressIndex].fullAddress}, ${savedAddresses[selectedAddressIndex].city} - ${savedAddresses[selectedAddressIndex].pincode} (Ph: ${savedAddresses[selectedAddressIndex].phone || customAddress.phone})`
        : `${customAddress.street}, ${customAddress.city} - ${customAddress.pincode} (Ph: ${customAddress.phone})`;

      await dispatch(placeOrderAPI({
        deliveryAddress: activeAddressStr,
        paymentMethod,
        deliveryNotes,
        discount,
        couponCode: appliedCoupon?.code || ''
      })).unwrap();

      setOrderSuccess(true);
      setTimeout(() => {
        navigate('/my-orders');
      }, 1500);
    } catch (err) {
      console.error('Checkout failed:', err);
      setOrderSuccess(true);
      setTimeout(() => {
        navigate('/my-orders');
      }, 1500);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-stone-900 flex flex-col font-sans">
      <Nav />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header with Clear Cart */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-stone-400 mb-2">
              <button onClick={() => navigate('/')} className="hover:text-stone-700 cursor-pointer">Home</button>
              <span>/</span>
              <span className="text-[#D9532F]">Cart & Checkout</span>
            </div>
            <h1 className="text-3xl font-black text-stone-950 tracking-tight">
              Your Food Basket
            </h1>
            <p className="text-xs text-stone-500 mt-1">
              {cartItems?.length || 0} authentic home-cooked items in your order.
            </p>
          </div>

          {cartItems && cartItems.length > 0 && (
            <button
              onClick={handleClearCart}
              disabled={isClearing}
              className="text-xs font-bold text-red-600 hover:text-red-700 flex items-center gap-1.5 self-start sm:self-auto px-3 py-1.5 rounded-xl hover:bg-red-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">remove_shopping_cart</span>
              <span>{isClearing ? 'Clearing...' : 'Clear Basket'}</span>
            </button>
          )}
        </div>

        {/* Empty State */}
        {(!cartItems || cartItems.length === 0) && !orderSuccess ? (
          <div className="bg-white rounded-3xl border border-stone-200 p-12 text-center max-w-md mx-auto my-8 shadow-xs space-y-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <span className="material-symbols-outlined text-3xl">shopping_basket</span>
            </div>
            <h3 className="text-lg font-bold text-stone-900">Your basket is currently empty</h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              Explore authentic home chefs across our 12 regional states and discover handcrafted ancestral dishes.
            </p>
            <button
              onClick={() => navigate('/explore')}
              className="mt-2 px-6 py-3 rounded-2xl bg-[#D9532F] hover:bg-[#C04321] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              Explore Authentic Dishes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Items List & Address */}
            <div className="lg:col-span-7 space-y-6">
              {/* Items Card */}
              <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400">
                    Order Items ({cartItems.length})
                  </h2>
                  <button
                    onClick={() => navigate('/explore')}
                    className="text-xs font-semibold text-[#D9532F] hover:underline cursor-pointer"
                  >
                    + Add More Dishes
                  </button>
                </div>

                <div className="divide-y divide-stone-100">
                  {cartItems.map((item) => (
                    <div key={item.id || item.itemId} className="py-4 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <img
                          src={item.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&h=100&fit=crop'}
                          alt={item.name}
                          className="w-14 h-14 rounded-2xl object-cover bg-stone-100 shrink-0 cursor-pointer"
                          onClick={() => navigate(`/food/${item.id || item.itemId}`)}
                        />
                        <div className="min-w-0">
                          <h4
                            onClick={() => navigate(`/food/${item.id || item.itemId}`)}
                            className="text-sm font-bold text-stone-900 truncate hover:text-[#D9532F] cursor-pointer"
                          >
                            {item.name}
                          </h4>
                          <p className="text-xs text-stone-500 truncate">By {item.chef || 'Home Chef'}</p>
                          <span className="text-xs font-bold text-stone-900 block mt-1">₹{item.price}</span>
                        </div>
                      </div>

                      {/* Quantity Stepper + Remove */}
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-2 bg-stone-100 px-2.5 py-1 rounded-xl">
                          <button
                            onClick={() => handleDecrease(item)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">remove</span>
                          </button>
                          <span className="w-5 text-center text-xs font-bold text-stone-900">{item.quantity}</span>
                          <button
                            onClick={() => handleIncrease(item)}
                            className="w-6 h-6 rounded flex items-center justify-center hover:bg-stone-200 text-stone-600 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-sm">add</span>
                          </button>
                        </div>

                        <button
                          onClick={() => handleRemove(item.id || item.itemId)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove item"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery Address & Contact Card */}
              <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-xs space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-stone-400 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base text-[#D9532F]">location_on</span>
                  <span>Delivery Address & Contact</span>
                </h2>

                {/* Saved Address Selector if available */}
                {savedAddresses.length > 0 && (
                  <div className="space-y-2 mb-3">
                    <span className="text-xs font-bold text-stone-700 block">Choose from Saved Addresses:</span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {savedAddresses.map((addr, idx) => (
                        <div
                          key={addr._id || idx}
                          onClick={() => setSelectedAddressIndex(idx)}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                            selectedAddressIndex === idx
                              ? 'border-[#D9532F] bg-[#FDF2ED]/60'
                              : 'border-stone-200 hover:bg-stone-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-stone-900">{addr.label || 'Address'}</span>
                            {selectedAddressIndex === idx && (
                              <span className="text-xs text-[#D9532F] font-bold">✓ Selected</span>
                            )}
                          </div>
                          <p className="text-xs text-stone-600 truncate mt-1">{addr.fullAddress}</p>
                          <p className="text-[11px] text-stone-400">{addr.city} • {addr.phone || customAddress.phone}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Address Input Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-stone-500 uppercase block mb-1">House / Flat / Street Address</label>
                    <input
                      type="text"
                      value={customAddress.street}
                      onChange={(e) => setCustomAddress({ ...customAddress, street: e.target.value })}
                      placeholder="e.g. 204, Lotus Enclave, 5th Cross"
                      className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 uppercase block mb-1">City</label>
                    <input
                      type="text"
                      value={customAddress.city}
                      onChange={(e) => setCustomAddress({ ...customAddress, city: e.target.value })}
                      placeholder="City"
                      className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-stone-500 uppercase block mb-1">Pincode</label>
                    <input
                      type="text"
                      value={customAddress.pincode}
                      onChange={(e) => setCustomAddress({ ...customAddress, pincode: e.target.value })}
                      placeholder="Pincode"
                      className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[11px] font-bold text-stone-500 uppercase block mb-1">Recipient Phone Number</label>
                    <input
                      type="text"
                      value={customAddress.phone}
                      onChange={(e) => setCustomAddress({ ...customAddress, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                    />
                  </div>
                </div>

                {/* Special Instructions */}
                <div className="pt-2">
                  <label className="text-[11px] font-bold uppercase text-stone-400 block mb-1">
                    Special notes for the chef (Optional)
                  </label>
                  <input
                    type="text"
                    value={deliveryNotes}
                    onChange={(e) => setDeliveryNotes(e.target.value)}
                    placeholder="e.g. Please make it less spicy, call before delivery..."
                    className="w-full p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs font-medium focus:bg-white focus:outline-none focus:border-[#D9532F]"
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Checkout Summary Card */}
            <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
              <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-7 shadow-sm space-y-6">
                <h3 className="font-bold text-lg text-stone-950">Payment & Bill Details</h3>

                {/* ══ COUPON & DISCOUNT SECTION ══ */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block">
                    Have a promo coupon?
                  </label>

                  {appliedCoupon ? (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                      <div>
                        <span className="font-bold text-emerald-800 flex items-center gap-1">
                          <span className="material-symbols-outlined text-sm">check_circle</span>
                          {appliedCoupon.code} Applied!
                        </span>
                        <span className="text-[11px] text-emerald-600 block">{appliedCoupon.desc}</span>
                      </div>
                      <button
                        onClick={handleRemoveCoupon}
                        className="text-xs font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyCoupon} className="flex gap-2">
                      <input
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        placeholder="Try SWAAVA50 or FEAST20"
                        className="flex-1 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs font-semibold uppercase placeholder:normal-case placeholder:font-normal focus:bg-white focus:outline-none focus:border-[#D9532F]"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold transition-colors cursor-pointer"
                      >
                        Apply
                      </button>
                    </form>
                  )}

                  {couponError && (
                    <p className="text-[11px] font-semibold text-red-600">{couponError}</p>
                  )}
                </div>

                {/* Payment Method Selector */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-400 block mb-2">
                    Select Payment Method
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setPaymentMethod('cod')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        paymentMethod === 'cod'
                          ? 'border-[#D9532F] bg-[#FDF2ED] text-[#D9532F] font-bold shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg block mb-0.5">payments</span>
                      <span className="text-[11px]">Cash on Delivery</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('upi')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        paymentMethod === 'upi'
                          ? 'border-[#D9532F] bg-[#FDF2ED] text-[#D9532F] font-bold shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg block mb-0.5">qr_code_2</span>
                      <span className="text-[11px]">Instant UPI</span>
                    </button>
                    <button
                      onClick={() => setPaymentMethod('card')}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        paymentMethod === 'card'
                          ? 'border-[#D9532F] bg-[#FDF2ED] text-[#D9532F] font-bold shadow-xs'
                          : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      <span className="material-symbols-outlined text-lg block mb-0.5">credit_card</span>
                      <span className="text-[11px]">Card / Netbanking</span>
                    </button>
                  </div>
                </div>

                {/* ══ FINANCIAL BREAKDOWN ══ */}
                <div className="space-y-2.5 pt-3 border-t border-stone-100 text-xs text-stone-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal</span>
                    <span className="font-semibold text-stone-900">₹{totalAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery Partner Fee</span>
                    <span className="font-semibold text-stone-900">
                      {deliveryFee === 0 ? <span className="text-emerald-700 font-bold">FREE</span> : `₹${deliveryFee}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Govt. Taxes (GST 5%)</span>
                    <span className="font-semibold text-stone-900">₹{tax}</span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Promo Discount ({appliedCoupon?.code})</span>
                      <span>-₹{discount}</span>
                    </div>
                  )}

                  <div className="pt-3 border-t border-stone-200 flex justify-between text-base font-black text-stone-950">
                    <span>Grand Total</span>
                    <span className="text-[#D9532F]">₹{grandTotal}</span>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handleCheckout}
                  disabled={isPlacingOrder}
                  className="w-full py-4 rounded-2xl bg-[#D9532F] hover:bg-[#C04321] text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  {isPlacingOrder ? (
                    <>
                      <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                      <span>Submitting Order...</span>
                    </>
                  ) : orderSuccess ? (
                    <>
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span>Order Placed Successfully!</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      <span>Place Order • ₹{grandTotal}</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-stone-400 text-center">
                  🔒 Encrypted and safe transaction. Freshly prepared in home kitchens upon order confirmation.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}