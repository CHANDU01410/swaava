
import { configureStore } from "@reduxjs/toolkit";
import userSlice from "./userSlice"
import chefSlice from "./chefSlice"
import mapSlice from "./mapSlice"

export const store = configureStore({
    reducer: {
        user: userSlice,
        chef: chefSlice,
        map: mapSlice
    }
})