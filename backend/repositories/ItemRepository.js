import Item from "../models/item.model.js";
import { escapeRegex } from "../utils/sanitize.js";

class ItemRepository {
    async create(data) {
        return Item.create(data);
    }

    async findById(itemId) {
        return Item.findById(itemId);
    }

    async findByIdWithShop(itemId) {
        return Item.findById(itemId)
            .populate("shop", "name image profileImage city state specialization specialty experience yearsOfExperience rating isVerified bio mealsServed isPureVeg")
            .populate("chef", "name image profileImage city state specialization specialty experience yearsOfExperience rating isVerified bio mealsServed isPureVeg");
    }

    async findByIdAndUpdate(itemId, updateData) {
        return Item.findByIdAndUpdate(itemId, updateData, { new: true });
    }

    async findByIdAndDelete(itemId) {
        return Item.findByIdAndDelete(itemId);
    }

    async findByShopIds(shopIds) {
        return Item.find({
            $or: [{ shop: { $in: shopIds } }, { chef: { $in: shopIds } }],
            isAvailable: true
        })
            .populate("shop", "name image profileImage city state specialization specialty rating isVerified")
            .populate("chef", "name image profileImage city state specialization specialty rating isVerified");
    }

    async findByShop(shopId) {
        return Item.find({
            $or: [{ shop: shopId }, { chef: shopId }]
        }).sort({ createdAt: -1 });
    }

    async findByState(state) {
        const safeState = escapeRegex(state || "");
        return Item.find({
            state: { $regex: new RegExp(`^${safeState}$`, "i") },
            isAvailable: true
        })
            .populate("shop", "name image profileImage city state specialization specialty rating isVerified")
            .populate("chef", "name image profileImage city state specialization specialty rating isVerified");
    }

    async searchByShopIds(shopIds, query) {
        const safeQ = escapeRegex(query || "");
        return Item.find({
            $or: [{ shop: { $in: shopIds } }, { chef: { $in: shopIds } }],
            $and: [
                {
                    $or: [
                        { name: { $regex: safeQ, $options: "i" } },
                        { category: { $regex: safeQ, $options: "i" } },
                        { state: { $regex: safeQ, $options: "i" } }
                    ]
                }
            ]
        })
            .populate("shop", "name image profileImage isVerified")
            .populate("chef", "name image profileImage isVerified");
    }

    async findWithFilters(filters = {}, sortOptions = { createdAt: -1 }) {
        return Item.find(filters)
            .sort(sortOptions)
            .populate("shop", "name image profileImage city state specialization specialty rating isVerified")
            .populate("chef", "name image profileImage city state specialization specialty rating isVerified");
    }

    async save(item) {
        return item.save();
    }

    async aggregate(pipeline) {
        return Item.aggregate(pipeline);
    }
}

export default new ItemRepository();