
import ReviewRepository from "../repositories/ReviewRepository.js";
import ChefRepository from "../repositories/ChefRepository.js";
import ItemRepository from "../repositories/ItemRepository.js";
import OrderRepository from "../repositories/OrderRepository.js";

class ReviewService {
    async addReview({ customerId, chefId, itemId, orderId, rating, comment }) {
        if (!chefId || rating === undefined || !comment || !comment.trim()) {
            throw { status: 400, message: "Chef, rating, and comment are required." };
        }

        const numRating = Number(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            throw { status: 400, message: "Rating must be a number between 1 and 5." };
        }

        if (orderId) {
            const order = await OrderRepository.findById(orderId);
            if (!order) {
                throw { status: 404, message: "Order not found." };
            }
            if (order.customer.toString() !== customerId.toString()) {
                throw { status: 403, message: "Forbidden: You are not authorized to review this order." };
            }
            if (order.status !== "delivered") {
                throw { status: 400, message: "Reviews are only permitted for completed, delivered orders." };
            }
            if (order.chef.toString() !== chefId.toString()) {
                throw { status: 400, message: "Specified chef does not match the order." };
            }
            if (itemId) {
                const hasItem = order.items.some(i => (i.item?._id || i.item)?.toString() === itemId.toString());
                if (!hasItem) {
                    throw { status: 400, message: "Specified item was not part of this order." };
                }
            }

            // Prevent duplicate review submissions for the same order
            const existingReview = await ReviewRepository.findOne({
                customer: customerId,
                order: orderId
            });
            if (existingReview) {
                throw { status: 400, message: "You have already submitted a review for this order." };
            }
        } else {
            // If orderId is not provided, verify customer has a delivered order for this specific item or chef
            const orderQuery = {
                customer: customerId,
                chef: chefId,
                status: "delivered"
            };
            if (itemId) {
                orderQuery["items.item"] = itemId;
            }
            const verifiedOrder = await OrderRepository.findOne(orderQuery);
            if (!verifiedOrder) {
                throw {
                    status: 403,
                    message: itemId
                        ? "Reviews are only permitted for dishes in completed, delivered orders."
                        : "Reviews are only allowed for verified customers with completed, delivered orders from this chef."
                };
            }
        }

        const review = await ReviewRepository.create({
            customer: customerId,
            chef: chefId,
            item: itemId || null,
            order: orderId || null,
            rating,
            comment
        });
        const reviews = await ReviewRepository.findRawByChef(chefId);
        const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        await ChefRepository.findByIdAndUpdate(chefId, {
            "rating.average": avgRating,
            "rating.count": reviews.length
        });
        if (itemId) {
            const itemReviews = await ReviewRepository.findRawByItem(itemId);
            const itemAvg = itemReviews.reduce((sum, r) => sum + r.rating, 0) / itemReviews.length;
            await ItemRepository.findByIdAndUpdate(itemId, {
                "rating.average": itemAvg,
                "rating.count": itemReviews.length
            });
        }
        if (orderId) {
            const order = await OrderRepository.findById(orderId);
            if (order) {
                order.rating = rating;
                order.review = comment;
                await OrderRepository.save(order);
            }
        }

        return review;
    }

    async getChefReviews(chefId) {
        return ReviewRepository.findByChef(chefId);
    }

    async getItemReviews(itemId) {
        return ReviewRepository.findByItem(itemId);
    }
}

export default new ReviewService();