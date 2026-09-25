
import mongoose from "mongoose";
import ChefRepository from "../repositories/ChefRepository.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { escapeRegex } from "../utils/sanitize.js";

class ChefService {
    async createEditShop({ userId, body, file }) {
        const { name, city, state, address, bio, specialty, experience } = body;
        let image;
        if (file) {
            image = await uploadOnCloudinary(file.path);
        }

        let shop = await ChefRepository.findByUserId(userId);

        if (!shop) {
            shop = await ChefRepository.create({
                name, city, state, address, bio, specialty, experience,
                image: image || "",
                homechef: userId
            });
        } else {
            const updateData = { name, city, state, address, bio, specialty, experience };
            if (image) updateData.image = image;
            shop = await ChefRepository.findByIdAndUpdate(shop._id, updateData);
        }

        await shop.populate("homechef");
        await shop.populate({ path: "items", options: { sort: { updatedAt: -1 } } });
        return shop;
    }

    async getMyShop(userId) {
        const shop = await ChefRepository.findByUserIdPopulated(userId);
        return shop || null;
    }

    async getShopByCity(city) {
        const shops = await ChefRepository.findByCity(city);
        if (!shops) {
            throw { status: 400, message: "shops not found" };
        }
        return shops;
    }

    async getShopByState(state) {
        const shops = await ChefRepository.findByState(state);
        return shops || [];
    }

    async getShopById(shopId) {
        if (!shopId || !mongoose.isValidObjectId(shopId)) {
            throw { status: 404, message: "Chef not found" };
        }
        const shop = await ChefRepository.findByIdWithDetails(shopId);
        if (!shop) {
            throw { status: 404, message: "Chef not found" };
        }
        return shop;
    }

    async getAllShops(params = {}) {
        let state = typeof params === 'string' ? params : params?.state;
        let search = typeof params === 'object' ? (params?.search || params?.query) : null;

        const andConditions = [];

        if (state && state !== 'all' && state !== 'All' && state !== 'All States') {
            const safeState = escapeRegex(state.trim());
            andConditions.push({ state: { $regex: new RegExp(`^${safeState}$`, "i") } });
        }

        if (search && typeof search === 'string' && search.trim()) {
            const safeQ = escapeRegex(search.trim());
            andConditions.push({
                $or: [
                    { name: { $regex: safeQ, $options: "i" } },
                    { specialty: { $regex: safeQ, $options: "i" } },
                    { specialization: { $regex: safeQ, $options: "i" } },
                    { city: { $regex: safeQ, $options: "i" } },
                    { bio: { $regex: safeQ, $options: "i" } }
                ]
            });
        }

        const filter = andConditions.length > 0 ? { $and: andConditions } : {};
        const shops = await ChefRepository.findAll(filter);
        return shops || [];
    }
}

export default new ChefService();