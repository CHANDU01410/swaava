
import ReviewService from "../services/ReviewService.js";

class ReviewController {
    async addReview(req, res) {
        try {
            const { chefId, itemId, orderId, rating, comment } = req.body;
            const review = await ReviewService.addReview({
                customerId: req.userId,
                chefId,
                itemId,
                orderId,
                rating,
                comment
            });
            return res.status(201).json(review);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("addReview error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while adding review." });
        }
    }

    async getChefReviews(req, res) {
        try {
            const reviews = await ReviewService.getChefReviews(req.params.chefId);
            return res.status(200).json(reviews);
        } catch (error) {
            console.error("getChefReviews error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching chef reviews." });
        }
    }

    async getItemReviews(req, res) {
        try {
            const reviews = await ReviewService.getItemReviews(req.params.itemId);
            return res.status(200).json(reviews);
        } catch (error) {
            console.error("getItemReviews error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching item reviews." });
        }
    }
}

export default new ReviewController();