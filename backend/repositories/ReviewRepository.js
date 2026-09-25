
import Review from "../models/review.model.js";

class ReviewRepository {
    async create(data) {
        return Review.create(data);
    }

    async findByChef(chefId) {
        return Review.find({ chef: chefId })
            .populate("customer", "fullName")
            .sort({ isTopComment: -1, createdAt: -1 });
    }

    async findByItem(itemId) {
        return Review.find({ item: itemId })
            .populate("customer", "fullName")
            .sort({ isTopComment: -1, createdAt: -1 });
    }

    async findRawByChef(chefId) {
        return Review.find({ chef: chefId });
    }

    async findRawByItem(itemId) {
        return Review.find({ item: itemId });
    }

    async findOne(query) {
        return Review.findOne(query);
    }
}

export default new ReviewRepository();