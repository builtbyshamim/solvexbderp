
// redux/slices/adminAuthSlice.js
import { createSlice } from "@reduxjs/toolkit";
const initialState = {
    aside: false,
};

const toggleSlice = createSlice({
    name: "toggle",
    initialState,
    reducers: {
       asideToggle: (state) => {
            state.aside = !state.aside;
        }
    },
});

export const {asideToggle} = toggleSlice.actions;
export default toggleSlice.reducer;