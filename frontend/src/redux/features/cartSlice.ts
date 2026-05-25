import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    products: [],
    selectedItems: 0,
    subTotal: 0,
    discount: 0,
    totalPrice: 0,
};

const cartSlice = createSlice({
    name: "cart",
    initialState,
    reducers: {
        addToCart: (state, action) => {
            const {
                product_id,
                assigned_variant_price_id,
                quantity = 1,
            } = action.payload;

            let existingProduct;

            if (assigned_variant_price_id) {
                // ✅ If variant exists, match both product_id and assigned_variant_price_id
                existingProduct = state.products.find(
                    (product) =>
                        product.product_id === product_id &&
                        product.assigned_variant_price_id === assigned_variant_price_id
                );
            } else {
                // ✅ Non-variant or no assigned variant — only match product_id
                existingProduct = state.products.find(
                    (product) => product.product_id === product_id
                );
            }

            if (existingProduct) {
                // ✅ Increase quantity if product exists
                existingProduct.quantity += parseFloat(quantity) || 1;
            } else {
                // ✅ Add new product entry
                state.products.push({
                    ...action.payload,
                    quantity: parseFloat(quantity) || 1,
                });
            }

            updateCartState(state);
        },

        removeFromCart: (state, action) => {
            const { index } = action.payload;
            state.products.splice(index, 1);
            updateCartState(state);
        },

        clearCart: (state) => {
            state.products = [];
            state.selectedItems = 0;
            state.subTotal = 0;
            state.discount = 0;
            state.totalPrice = 0;
        },

        updatedQuantity: (state, action) => {
            const { index, quantity } = action.payload;
            if (state.products[index]) {
                state.products[index].quantity = parseFloat(quantity);
            }
            updateCartState(state);
        },

        setDiscount: (state, action) => {
            state.discount = action.payload;
            updateCartState(state);
        },
    },
});

// 🔹 Calculate total considering sale price
const calculateTotalPrice = (products) => {
    let total = 0;
    products.forEach((product) => {
        total += product.sale_price * product.quantity;
    });
    return total;
};

// 🔹 Update all cart calculations
const updateCartState = (state) => {
    state.selectedItems = state.products.reduce(
        (total, product) => total + product.quantity,
        0
    );

    state.subTotal = state.products.reduce(
        (total, product) => total + product.without_discount_price * product.quantity,
        0
    );

    const totalDiscount = state.products.reduce((total, product) => {
        const discountPerItem =
            product.without_discount_price - product.sale_price;
        return total + discountPerItem * product.quantity;
    }, 0);

    state.discount = totalDiscount;
    state.totalPrice = calculateTotalPrice(state.products);
};

export const {
    addToCart,
    removeFromCart,
    clearCart,
    updatedQuantity,
    setDiscount,
} = cartSlice.actions;

export default cartSlice.reducer;
