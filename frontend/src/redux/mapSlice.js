
import { createSlice } from "@reduxjs/toolkit";

const mapSlice = createSlice({
    name: "map",
    initialState: {
        location: null,
        address: null,
    },
    reducers: {
        setLocation: (state, action) => {
            state.location = action.payload;
        },
        setAddress: (state, action) => {
            state.address = action.payload;
        },
    },
});

export const { setLocation, setAddress } = mapSlice.actions;
export default mapSlice.reducer;