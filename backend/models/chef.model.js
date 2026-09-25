import mongoose from "mongoose";

const chefSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        default: ""
    },
    profileImage: {
        type: String,
        default: ""
    },
    homechef: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: false
    },
    bio: {
        type: String,
        default: ""
    },
    specialty: {
        type: String,
        default: ""
    },
    specialization: {
        type: String,
        default: ""
    },
    experience: {
        type: String,
        default: ""
    },
    yearsOfExperience: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    address: {
        type: String,
        default: ""
    },
    rating: {
        average: { type: Number, default: 4.5 },
        count: { type: Number, default: 0 }
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    available: {
        type: Boolean,
        default: true
    },
    mealsServed: {
        type: Number,
        default: 0
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    }],
    isPureVeg: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

chefSchema.pre("save", function (next) {
    if (!this.profileImage && this.image) this.profileImage = this.image;
    if (!this.image && this.profileImage) this.image = this.profileImage;

    if (!this.specialization && this.specialty) this.specialization = this.specialty;
    if (!this.specialty && this.specialization) this.specialty = this.specialization;

    if (!this.yearsOfExperience && this.experience) this.yearsOfExperience = this.experience;
    if (!this.experience && this.yearsOfExperience) this.experience = this.yearsOfExperience;

    if (this.totalReviews === 0 && this.rating?.count) this.totalReviews = this.rating.count;
    if (this.rating && this.rating.count === 0 && this.totalReviews) this.rating.count = this.totalReviews;

    if (typeof next === "function") next();
});

const chef = mongoose.model("HomeCook", chefSchema);
export default chef;