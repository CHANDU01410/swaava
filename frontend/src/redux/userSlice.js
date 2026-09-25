
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { serverUrl as SERVER_URL } from "../App";

// ── Async Thunks for Cart API ──
export const fetchCart = createAsyncThunk("user/fetchCart", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${SERVER_URL}/api/cart`, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch cart");
  }
});

export const addToCartAPI = createAsyncThunk("user/addToCartAPI", async (item, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${SERVER_URL}/api/cart/add`, item, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to add to cart");
  }
});

export const updateQuantityAPI = createAsyncThunk("user/updateQuantityAPI", async ({ itemId, quantity }, { rejectWithValue }) => {
  try {
    const res = await axios.put(`${SERVER_URL}/api/cart/update`, { itemId, quantity }, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to update quantity");
  }
});

export const removeFromCartAPI = createAsyncThunk("user/removeFromCartAPI", async (itemId, { rejectWithValue }) => {
  try {
    const res = await axios.delete(`${SERVER_URL}/api/cart/remove/${itemId}`, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to remove item");
  }
});

export const clearCartAPI = createAsyncThunk("user/clearCartAPI", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.delete(`${SERVER_URL}/api/cart/clear`, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to clear cart");
  }
});

// ── Order Thunks ──
export const placeOrderAPI = createAsyncThunk("user/placeOrder", async (orderData, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${SERVER_URL}/api/order/place`, orderData, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to place order");
  }
});

export const fetchMyOrdersAPI = createAsyncThunk("user/fetchMyOrders", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${SERVER_URL}/api/order/my-orders`, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch orders");
  }
});

export const rateOrderAPI = createAsyncThunk("user/rateOrder", async ({ orderId, rating, review }, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${SERVER_URL}/api/order/rate/${orderId}`, { rating, review }, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to rate");
  }
});

export const addReviewAPI = createAsyncThunk("user/addReview", async (reviewData, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${SERVER_URL}/api/review/add`, reviewData, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to submit review");
  }
});

export const fetchTopChefsAPI = createAsyncThunk("user/fetchTopChefs", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${SERVER_URL}/api/order/top-chefs`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch top chefs");
  }
});

export const fetchMostOrderedAPI = createAsyncThunk("user/fetchMostOrdered", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${SERVER_URL}/api/order/most-ordered`);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch popular dishes");
  }
});

export const fetchFavoritesAPI = createAsyncThunk("user/fetchFavorites", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${SERVER_URL}/api/user/favorites`, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch favorites");
  }
});

export const fetchRecentlyViewedAPI = createAsyncThunk("user/fetchRecentlyViewed", async (_, { rejectWithValue }) => {
  try {
    const res = await axios.get(`${SERVER_URL}/api/user/recently-viewed`, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to fetch recently viewed");
  }
});

export const recordRecentlyViewedAPI = createAsyncThunk("user/recordRecentlyViewed", async (foodId, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${SERVER_URL}/api/user/recently-viewed/${foodId}`, {}, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to record recently viewed");
  }
});

export const toggleFavoriteFoodAPI = createAsyncThunk("user/toggleFavoriteFood", async (foodId, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${SERVER_URL}/api/user/favorite-food/${foodId}`, {}, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to toggle favorite food");
  }
});

export const toggleFavoriteChefAPI = createAsyncThunk("user/toggleFavoriteChef", async (chefId, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${SERVER_URL}/api/user/favorite-chef/${chefId}`, {}, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to toggle favorite chef");
  }
});

export const addAddressAPI = createAsyncThunk("user/addAddress", async (addressData, { rejectWithValue }) => {
  try {
    const res = await axios.post(`${SERVER_URL}/api/user/address`, addressData, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to add address");
  }
});

export const deleteAddressAPI = createAsyncThunk("user/deleteAddress", async (addressId, { rejectWithValue }) => {
  try {
    const res = await axios.delete(`${SERVER_URL}/api/user/address/${addressId}`, { withCredentials: true });
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || "Failed to delete address");
  }
});

// ── Slice ──
const userSlice = createSlice({
  name: "user",
  initialState: {
    authLoading: true,
    userData: null,
    currentCity: null,
    currentState: null,
    currentAddress: null,
    shopInMyCity: null,
    itemsInMyCity: null,
    cartItems: [],
    totalAmount: 0,
    cartLoading: false,
    cartError: null,
    myOrders: [],
    ordersLoading: false,
    topChefs: [],
    mostOrderedDishes: [],
    searchItems: null,
    favorites: { favoriteChefs: [], favoriteFoods: [] },
    favoritesLoading: false,
    recentlyViewed: [],
    recentlyViewedLoading: false,
    socket: null
  },
  reducers: {
    setUserData: (state, action) => { state.userData = action.payload },
    setAuthLoading: (state, action) => { state.authLoading = action.payload },
    setCurrentCity: (state, action) => { state.currentCity = action.payload },
    setCurrentState: (state, action) => { state.currentState = action.payload },
    setCurrentAddress: (state, action) => { state.currentAddress = action.payload },
    setShopsInMyCity: (state, action) => { state.shopInMyCity = action.payload },
    setItemsInMyCity: (state, action) => { state.itemsInMyCity = action.payload },
    setSocket: (state, action) => { state.socket = action.payload },
    addToCart: (state, action) => {
      const cartItem = action.payload;
      const existingItem = state.cartItems.find(i => i.id == cartItem.id);
      if (existingItem) { existingItem.quantity += cartItem.quantity; }
      else { state.cartItems.push(cartItem); }
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    },
    setTotalAmount: (state, action) => { state.totalAmount = action.payload },
    updateQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.cartItems.find(i => i.id == id);
      if (item) item.quantity = quantity;
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    },
    removeCartItem: (state, action) => {
      state.cartItems = state.cartItems.filter(i => i.id !== action.payload);
      state.totalAmount = state.cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    },
    setMyOrders: (state, action) => { state.myOrders = action.payload },
    addMyOrder: (state, action) => { state.myOrders = [action.payload, ...state.myOrders] },
    updateOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;
      const order = state.myOrders.find(o => o._id == orderId);
      if (order) { if (order.shopOrders && order.shopOrders.shop._id == shopId) order.shopOrders.status = status; }
    },
    updateRealtimeOrderStatus: (state, action) => {
      const { orderId, shopId, status } = action.payload;
      const order = state.myOrders.find(o => o._id == orderId);
      if (order) { const shopOrder = order.shopOrders?.find(so => so.shop._id == shopId); if (shopOrder) shopOrder.status = status; }
    },
    setSearchItems: (state, action) => { state.searchItems = action.payload }
  },
  extraReducers: (builder) => {
    const mapCartItems = (items) => (items || []).map(i => ({ id: i.itemId, name: i.name, image: i.image, price: i.price, quantity: i.quantity, chef: i.chef }));

    builder
      .addCase(fetchCart.pending, (s) => { s.cartLoading = true; s.cartError = null; })
      .addCase(fetchCart.fulfilled, (s, a) => { s.cartLoading = false; s.cartItems = mapCartItems(a.payload.items); s.totalAmount = a.payload.totalAmount || 0; })
      .addCase(fetchCart.rejected, (s, a) => { s.cartLoading = false; s.cartError = a.payload; })
      .addCase(addToCartAPI.fulfilled, (s, a) => { s.cartItems = mapCartItems(a.payload.items); s.totalAmount = a.payload.totalAmount || 0; })
      .addCase(updateQuantityAPI.fulfilled, (s, a) => { s.cartItems = mapCartItems(a.payload.items); s.totalAmount = a.payload.totalAmount || 0; })
      .addCase(removeFromCartAPI.fulfilled, (s, a) => { s.cartItems = mapCartItems(a.payload.items); s.totalAmount = a.payload.totalAmount || 0; })
      .addCase(clearCartAPI.fulfilled, (s) => { s.cartItems = []; s.totalAmount = 0; })
      // Orders
      .addCase(placeOrderAPI.fulfilled, (s, a) => { s.myOrders = [...a.payload, ...s.myOrders]; s.cartItems = []; s.totalAmount = 0; })
      .addCase(fetchMyOrdersAPI.pending, (s) => { s.ordersLoading = true; })
      .addCase(fetchMyOrdersAPI.fulfilled, (s, a) => { s.ordersLoading = false; s.myOrders = a.payload; })
      .addCase(fetchMyOrdersAPI.rejected, (s) => { s.ordersLoading = false; })
      .addCase(rateOrderAPI.fulfilled, (s, a) => {
        const idx = s.myOrders.findIndex(o => o._id === a.payload.order._id);
        if (idx !== -1) { s.myOrders[idx].rating = a.payload.order.rating; s.myOrders[idx].review = a.payload.order.review; }
      })
      .addCase(fetchTopChefsAPI.fulfilled, (s, a) => { s.topChefs = a.payload; })
      .addCase(fetchMostOrderedAPI.fulfilled, (s, a) => { s.mostOrderedDishes = a.payload; })
      // Favorites
      .addCase(fetchFavoritesAPI.pending, (s) => { s.favoritesLoading = true; })
      .addCase(fetchFavoritesAPI.fulfilled, (s, a) => {
        s.favoritesLoading = false;
        s.favorites = a.payload || { favoriteChefs: [], favoriteFoods: [] };
      })
      .addCase(fetchFavoritesAPI.rejected, (s) => { s.favoritesLoading = false; })
      .addCase(toggleFavoriteFoodAPI.fulfilled, (s, a) => {
        s.favorites = a.payload || s.favorites;
      })
      .addCase(toggleFavoriteChefAPI.fulfilled, (s, a) => {
        s.favorites = a.payload || s.favorites;
      })
      // Recently Viewed
      .addCase(fetchRecentlyViewedAPI.pending, (s) => { s.recentlyViewedLoading = true; })
      .addCase(fetchRecentlyViewedAPI.fulfilled, (s, a) => {
        s.recentlyViewedLoading = false;
        s.recentlyViewed = a.payload || [];
      })
      .addCase(fetchRecentlyViewedAPI.rejected, (s) => { s.recentlyViewedLoading = false; })
      .addCase(recordRecentlyViewedAPI.fulfilled, (s, a) => {
        s.recentlyViewed = a.payload || s.recentlyViewed;
      })
      // Addresses
      .addCase(addAddressAPI.fulfilled, (s, a) => {
        if (s.userData) s.userData.addresses = a.payload;
      })
      .addCase(deleteAddressAPI.fulfilled, (s, a) => {
        if (s.userData) s.userData.addresses = a.payload;
      });
  }
});

export const { setUserData, setAuthLoading, setCurrentAddress, setCurrentCity, setCurrentState, setShopsInMyCity, setItemsInMyCity, addToCart, updateQuantity, removeCartItem, setMyOrders, addMyOrder, updateOrderStatus, setSearchItems, setTotalAmount, setSocket, updateRealtimeOrderStatus } = userSlice.actions;
export default userSlice.reducer;