import User from "../models/user.model.js";
import Chef from "../models/chef.model.js";
import Item from "../models/item.model.js";
import Order from "../models/order.model.js";
import Region from "../models/region.model.js";
import Review from "../models/review.model.js";
import { escapeRegex } from "../utils/sanitize.js";

class AdminService {
    // ── 1. Dashboard Metrics ──
    async getDashboardMetrics() {
        const [
            totalUsers,
            totalHomeChefs,
            pendingChefApprovals,
            totalOrders,
            totalFoodItems,
            revenueResult
        ] = await Promise.all([
            User.countDocuments(),
            Chef.countDocuments(),
            Chef.countDocuments({ isVerified: false }),
            Order.countDocuments(),
            Item.countDocuments(),
            Order.aggregate([
                { $match: { status: { $ne: "cancelled" } } },
                { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } }
            ])
        ]);

        const totalRevenue = revenueResult[0]?.totalRevenue || 0;

        return {
            totalUsers,
            totalHomeChefs,
            pendingChefApprovals,
            totalOrders,
            totalRevenue,
            totalFoodItems
        };
    }

    // ── 2. User Management ──
    async getUsers(search = "") {
        const query = {};
        if (search && typeof search === "string" && search.trim()) {
            const safeSearch = escapeRegex(search.trim());
            query.$or = [
                { fullName: { $regex: safeSearch, $options: "i" } },
                { email: { $regex: safeSearch, $options: "i" } },
                { city: { $regex: safeSearch, $options: "i" } }
            ];
        }
        return User.find(query)
            .select("-password -resetOtp -otpExpires")
            .sort({ createdAt: -1 });
    }

    async updateUserRole({ userId, role }) {
        if (!["Customer", "HomeCook", "Admin"].includes(role)) {
            throw { status: 400, message: "Invalid role specified" };
        }
        const user = await User.findByIdAndUpdate(userId, { role }, { new: true })
            .select("-password -resetOtp -otpExpires");
        if (!user) throw { status: 404, message: "User not found" };
        return user;
    }

    async deleteUser(userId) {
        const user = await User.findByIdAndDelete(userId);
        if (!user) throw { status: 404, message: "User not found" };
        return { message: "User successfully removed", userId };
    }

    // ── 3. HomeChefs & Chef Approvals Management ──
    async getChefs(filter = "all") {
        const query = {};
        if (filter === "pending") query.isVerified = false;
        if (filter === "verified") query.isVerified = true;

        return Chef.find(query)
            .populate("homechef", "fullName email")
            .populate("items", "name price category isAvailable")
            .sort({ createdAt: -1 });
    }

    async verifyChef({ chefId, isVerified }) {
        const chef = await Chef.findByIdAndUpdate(
            chefId,
            { isVerified: Boolean(isVerified) },
            { new: true }
        ).populate("homechef", "fullName email");
        if (!chef) throw { status: 404, message: "Chef not found" };
        return chef;
    }

    async deleteChef(chefId) {
        const chef = await Chef.findByIdAndDelete(chefId);
        if (!chef) throw { status: 404, message: "Chef not found" };
        // Clean up chef items as well
        await Item.deleteMany({ $or: [{ shop: chefId }, { chef: chefId }] });
        return { message: "Chef profile and dishes deleted", chefId };
    }

    // ── 4. Food Management ──
    async getFoods(search = "") {
        const query = {};
        if (search && typeof search === "string" && search.trim()) {
            const safeSearch = escapeRegex(search.trim());
            query.$or = [
                { name: { $regex: safeSearch, $options: "i" } },
                { state: { $regex: safeSearch, $options: "i" } },
                { category: { $regex: safeSearch, $options: "i" } }
            ];
        }
        return Item.find(query)
            .populate("shop", "name city state isVerified")
            .populate("chef", "name city state isVerified")
            .sort({ createdAt: -1 });
    }

    async updateFood({ foodId, updates }) {
        const item = await Item.findByIdAndUpdate(foodId, updates, { new: true })
            .populate("shop", "name city state isVerified")
            .populate("chef", "name city state isVerified");
        if (!item) throw { status: 404, message: "Food item not found" };
        return item;
    }

    async deleteFood(foodId) {
        const item = await Item.findByIdAndDelete(foodId);
        if (!item) throw { status: 404, message: "Food item not found" };
        return { message: "Food item deleted", foodId };
    }

    // ── 5. State / Regional Management ──
    async getStates() {
        const regions = await Region.find().sort({ name: 1 });
        // Augment with dish and chef counts per state
        const augmented = await Promise.all(regions.map(async (reg) => {
            const safeRegName = escapeRegex(reg.name);
            const [dishCount, chefCount] = await Promise.all([
                Item.countDocuments({ state: { $regex: new RegExp(`^${safeRegName}$`, "i") } }),
                Chef.countDocuments({ state: { $regex: new RegExp(`^${safeRegName}$`, "i") } })
            ]);
            return {
                ...reg.toObject(),
                dishCount,
                chefCount
            };
        }));
        return augmented;
    }

    async createState(data) {
        if (!data.name || typeof data.name !== "string" || !data.name.trim()) {
            throw { status: 400, message: "Valid state name is required" };
        }
        const safeName = escapeRegex(data.name.trim());
        const existing = await Region.findOne({ name: { $regex: new RegExp(`^${safeName}$`, "i") } });
        if (existing) throw { status: 400, message: "State already exists" };
        return Region.create({ ...data, name: data.name.trim() });
    }

    async updateState({ stateId, updates }) {
        const region = await Region.findByIdAndUpdate(stateId, updates, { new: true });
        if (!region) throw { status: 404, message: "State not found" };
        return region;
    }

    async deleteState(stateId) {
        const region = await Region.findByIdAndDelete(stateId);
        if (!region) throw { status: 404, message: "State not found" };
        return { message: "State deleted", stateId };
    }

    // ── 6. Order Operations ──
    async getOrders(statusFilter = "all") {
        const query = {};
        if (statusFilter && statusFilter !== "all") {
            query.status = statusFilter;
        }
        return Order.find(query)
            .populate("customer", "fullName email phone")
            .populate("chef", "name city state")
            .populate("items.item", "name price image")
            .sort({ createdAt: -1 });
    }

    async updateOrderStatus({ orderId, status }) {
        const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];
        if (!validStatuses.includes(status)) {
            throw { status: 400, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` };
        }
        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true })
            .populate("customer", "fullName email phone")
            .populate("chef", "name city state")
            .populate("items.item", "name price image");
        if (!order) throw { status: 404, message: "Order not found" };
        return order;
    }

    async deleteOrder(orderId) {
        const order = await Order.findByIdAndDelete(orderId);
        if (!order) throw { status: 404, message: "Order not found" };
        return { message: "Order removed", orderId };
    }

    // ── 7. Review Moderation ──
    async getReviews() {
        return Review.find()
            .populate("customer", "fullName email")
            .populate("chef", "name city state")
            .populate("item", "name state")
            .sort({ createdAt: -1 });
    }

    async deleteReview(reviewId) {
        const review = await Review.findByIdAndDelete(reviewId);
        if (!review) throw { status: 404, message: "Review not found" };
        return { message: "Review deleted successfully", reviewId };
    }
}

export default new AdminService();
