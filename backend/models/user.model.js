
import mongoose from "mongoose";

const addressSchema = new mongoose.Schema({
    label: { type: String, default: "Home" },       // Home, Work, Other
    fullAddress: { type: String, required: true },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    pincode: { type: String, default: "" },
    phone: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
}, { _id: true, timestamps: false });

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        select: false
    },
    role: {
        type: String,
        enum: ["Customer", "HomeCook", "Admin"],
        default: "Customer",
        required: true
    },
    phone: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    dob: {
        type: String,
        default: ""
    },
    addresses: [addressSchema],
    favoriteChefs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "HomeCook"
    }],
    favoriteFoods: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    }],
    recentlyViewed: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item"
    }],
    resetOtp: {
        type: String,
        select: false
    },
    isOtpVerified: {
        type: Boolean,
        default: false
    },
    otpExpires: {
        type: Date,
        select: false
    }

}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.resetOtp;
            delete ret.otpExpires;
            return ret;
        }
    },
    toObject: {
        transform: function (doc, ret) {
            delete ret.password;
            delete ret.resetOtp;
            delete ret.otpExpires;
            return ret;
        }
    }
})

const User = mongoose.model("Customer", userSchema)
export default User;