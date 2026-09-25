
import mongoose from "mongoose";

const regionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    image: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    famousDishes: [{
        type: String
    }],
    tags: [{
        icon: { type: String },
        label: { type: String }
    }]
}, { timestamps: true });

const Region = mongoose.model("Region", regionSchema);
export default Region;