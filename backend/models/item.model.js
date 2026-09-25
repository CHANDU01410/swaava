import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ""
    },
    image: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    shop: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HomeCook"
    },
    chef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HomeCook"
    },
    category: {
        type: String,
        enum: [
            "Snacks",
            "Main Course",
            "Desserts",
            "Breakfast",
            "Sides & Pickles",
            "Beverages",
            "Breads",
            "Rice Dishes",
            "Traditional",
            "Curry & Gravy",
            "South Indian",
            "North Indian",
            "Chinese",
            "Fast Food",
            "Others"
        ],
        required: true
    },
    price: {
        type: Number,
        min: 0,
        required: true
    },
    foodType: {
        type: String,
        enum: ["veg", "non veg"],
        default: "veg"
    },
    vegetarian: {
        type: Boolean,
        default: true
    },
    spiceLevel: {
        type: Number,
        min: 0,
        max: 3,
        default: 1
    },
    spicyLevel: {
        type: Number,
        min: 0,
        max: 3,
        default: 1
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    available: {
        type: Boolean,
        default: true
    },
    preparationTime: {
        type: String,
        default: "25-30 mins"
    },
    servingSize: {
        type: String,
        default: "1-2 persons"
    },
    ingredients: [{
        type: String
    }],
    rating: {
        average: { type: Number, default: 4.5 },
        count: { type: Number, default: 0 }
    },
    reviewCount: {
        type: Number,
        default: 0
    },
    orderCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

itemSchema.pre("save", function (next) {
    if (!this.chef && this.shop) this.chef = this.shop;
    if (!this.shop && this.chef) this.shop = this.chef;

    if (this.vegetarian !== undefined) {
        this.foodType = this.vegetarian ? "veg" : "non veg";
    } else if (this.foodType) {
        this.vegetarian = (this.foodType === "veg");
    }

    if (this.spicyLevel !== undefined && (this.spiceLevel === undefined || this.spiceLevel === null)) {
        this.spiceLevel = this.spicyLevel;
    } else if (this.spiceLevel !== undefined && (this.spicyLevel === undefined || this.spicyLevel === null)) {
        this.spicyLevel = this.spiceLevel;
    }

    if (this.available !== undefined && (this.isAvailable === undefined || this.isAvailable === null)) {
        this.isAvailable = this.available;
    } else if (this.isAvailable !== undefined && (this.available === undefined || this.available === null)) {
        this.available = this.isAvailable;
    }

    if (this.reviewCount === 0 && this.rating?.count) this.reviewCount = this.rating.count;
    if (this.rating && this.rating.count === 0 && this.reviewCount) this.rating.count = this.reviewCount;

    if (typeof next === "function") next();
});

const Item = mongoose.model("Item", itemSchema);
export default Item;