
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import { serverUrl as SERVER_URL } from "../config";

// ── Async Thunks ──

export const fetchMyShop = createAsyncThunk("chef/fetchMyShop", async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${SERVER_URL}/api/shop/get-my`, { withCredentials: true });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch shop");
    }
});

export const createEditShop = createAsyncThunk("chef/createEditShop", async (formData, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${SERVER_URL}/api/shop/create-edit`, formData, {
            withCredentials: true
        });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to save shop");
    }
});

export const addItem = createAsyncThunk("chef/addItem", async (formData, { rejectWithValue }) => {
    try {
        const res = await axios.post(`${SERVER_URL}/api/item/add`, formData, {
            withCredentials: true
        });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to add item");
    }
});

export const editItem = createAsyncThunk("chef/editItem", async ({ itemId, formData }, { rejectWithValue }) => {
    try {
        const res = await axios.put(`${SERVER_URL}/api/item/edit/${itemId}`, formData, {
            withCredentials: true
        });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to edit item");
    }
});

export const deleteItem = createAsyncThunk("chef/deleteItem", async (itemId, { rejectWithValue }) => {
    try {
        const res = await axios.delete(`${SERVER_URL}/api/item/delete/${itemId}`, { withCredentials: true });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to delete item");
    }
});

export const fetchChefById = createAsyncThunk("chef/fetchChefById", async (shopId, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${SERVER_URL}/api/shop/${shopId}`);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch chef");
    }
});

export const fetchChefsByState = createAsyncThunk("chef/fetchChefsByState", async (state, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${SERVER_URL}/api/shop/get-by-state/${encodeURIComponent(state)}`);
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch chefs");
    }
});

export const fetchChefOrders = createAsyncThunk("chef/fetchChefOrders", async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${SERVER_URL}/api/order/chef-orders`, { withCredentials: true });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch orders");
    }
});

export const updateOrderStatusAPI = createAsyncThunk("chef/updateOrderStatus", async ({ orderId, status }, { rejectWithValue }) => {
    try {
        const res = await axios.put(`${SERVER_URL}/api/order/update-status/${orderId}`, { status }, { withCredentials: true });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to update status");
    }
});

export const fetchChefAnalytics = createAsyncThunk("chef/fetchChefAnalytics", async (_, { rejectWithValue }) => {
    try {
        const res = await axios.get(`${SERVER_URL}/api/order/chef-analytics`, { withCredentials: true });
        return res.data;
    } catch (err) {
        return rejectWithValue(err.response?.data?.message || "Failed to fetch analytics");
    }
});

// ── Slice ──

const chefSlice = createSlice({
    name: "chef",
    initialState: {
        myShop: null,
        myShopLoading: false,
        myShopError: null,
        viewingChef: null,
        viewingChefLoading: false,
        stateChefs: [],
        stateChefsLoading: false,
        chefOrders: [],
        chefOrdersLoading: false,
        analytics: null,
        analyticsLoading: false,
    },
    reducers: {
        clearViewingChef: (state) => {
            state.viewingChef = null;
        },
        clearStateChefs: (state) => {
            state.stateChefs = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMyShop.pending, (state) => { state.myShopLoading = true; state.myShopError = null; })
            .addCase(fetchMyShop.fulfilled, (state, action) => { state.myShopLoading = false; state.myShop = action.payload; })
            .addCase(fetchMyShop.rejected, (state, action) => { state.myShopLoading = false; state.myShopError = action.payload; })
            .addCase(createEditShop.fulfilled, (state, action) => { state.myShop = action.payload; })
            .addCase(addItem.fulfilled, (state, action) => { state.myShop = action.payload; })
            .addCase(editItem.fulfilled, (state, action) => { state.myShop = action.payload; })
            .addCase(deleteItem.fulfilled, (state, action) => { state.myShop = action.payload; })
            .addCase(fetchChefById.pending, (state) => { state.viewingChefLoading = true; })
            .addCase(fetchChefById.fulfilled, (state, action) => { state.viewingChefLoading = false; state.viewingChef = action.payload; })
            .addCase(fetchChefById.rejected, (state) => { state.viewingChefLoading = false; })
            .addCase(fetchChefsByState.pending, (state) => { state.stateChefsLoading = true; })
            .addCase(fetchChefsByState.fulfilled, (state, action) => { state.stateChefsLoading = false; state.stateChefs = action.payload; })
            .addCase(fetchChefsByState.rejected, (state) => { state.stateChefsLoading = false; })
            .addCase(fetchChefOrders.pending, (state) => { state.chefOrdersLoading = true; })
            .addCase(fetchChefOrders.fulfilled, (state, action) => { state.chefOrdersLoading = false; state.chefOrders = action.payload; })
            .addCase(fetchChefOrders.rejected, (state, action) => { state.chefOrdersLoading = false; })
            .addCase(updateOrderStatusAPI.fulfilled, (state, action) => {
                const idx = state.chefOrders.findIndex(o => o._id === action.payload._id);
                if (idx !== -1) state.chefOrders[idx] = action.payload;
            })
            .addCase(fetchChefAnalytics.pending, (state) => { state.analyticsLoading = true; })
            .addCase(fetchChefAnalytics.fulfilled, (state, action) => {
                state.analyticsLoading = false;
                state.analytics = action.payload;
            })
            .addCase(fetchChefAnalytics.rejected, (state) => { state.analyticsLoading = false; });
    }
});

export const { clearViewingChef, clearStateChefs } = chefSlice.actions;
export default chefSlice.reducer;