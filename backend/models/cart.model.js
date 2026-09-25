
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    itemId: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        default: ""
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1
    },
    chef: {
        type: String,
        default: ""
    }
}, { _id: false });

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
        unique: true
    },
    items: {
        type: [cartItemSchema],
        default: []
    },
    totalAmount: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Auto-calculate totalAmount before saving
cartSchema.pre("save", function () {
    this.totalAmount = this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
});

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;