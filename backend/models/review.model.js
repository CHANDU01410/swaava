
import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true
    },
    chef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HomeCook",
        required: true
    },
    item: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    },
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order"
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true
    },
    isTopComment: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;