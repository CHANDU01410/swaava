
import User from "../models/user.model.js";

class UserRepository {
    async findByEmail(email, includeSecrets = false) {
        let query = User.findOne({ email });
        if (includeSecrets) {
            query = query.select("+password +resetOtp +otpExpires");
        }
        return query;
    }

    async findById(userId) {
        return User.findById(userId);
    }

    async findByIdWithFavorites(userId) {
        return User.findById(userId)
            .populate({
                path: "favoriteChefs",
                select: "name specialty image profileImage city state rating"
            })
            .populate({
                path: "favoriteFoods",
                select: "name price image state foodType vegetarian rating category preparationTime"
            });
    }

    async findByIdWithRecentlyViewed(userId) {
        return User.findById(userId)
            .populate({
                path: "recentlyViewed",
                select: "name price image state foodType vegetarian rating category preparationTime spiceLevel isAvailable description"
            })
            .lean();
    }

    async findByIdLean(userId) {
        return User.findById(userId)
            .populate({
                path: "favoriteChefs",
                select: "name specialty image profileImage city state rating"
            })
            .populate({
                path: "favoriteFoods",
                select: "name price image state foodType vegetarian rating category preparationTime"
            })
            .lean();
    }

    async create(data) {
        return User.create(data);
    }

    async findByIdAndUpdate(userId, updateData) {
        return User.findByIdAndUpdate(userId, updateData, { new: true });
    }

    async save(user) {
        return user.save();
    }
}

export default new UserRepository();