import mongoose from "mongoose";

const connectDb = async () => {
    const mongoUrl = process.env.MONGODB_URL || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/swaava";
    const sanitizedUrl = mongoUrl.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
    try {
        await mongoose.connect(mongoUrl, { serverSelectionTimeoutMS: 5000 });
        console.log(`Database connected successfully to ${sanitizedUrl}`);
    } catch (error) {
        console.error(`Database Error connecting to ${sanitizedUrl}:`, error.message);
        throw error;
    }
};

export default connectDb;