
import OrderService from "../services/OrderService.js";

class OrderController {
    async placeOrder(req, res) {
        try {
            const orders = await OrderService.placeOrder({
                userId: req.userId,
                deliveryAddress: req.body.deliveryAddress,
                paymentMethod: req.body.paymentMethod
            });
            return res.status(201).json(orders);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("placeOrder error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while placing order." });
        }
    }

    async getMyOrders(req, res) {
        try {
            const orders = await OrderService.getMyOrders(req.userId);
            return res.status(200).json(orders);
        } catch (error) {
            console.error("getMyOrders error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching orders." });
        }
    }

    async getChefOrders(req, res) {
        try {
            const orders = await OrderService.getChefOrders(req.userId);
            return res.status(200).json(orders);
        } catch (error) {
            console.error("getChefOrders error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching chef orders." });
        }
    }

    async getChefAnalytics(req, res) {
        try {
            const analytics = await OrderService.getChefAnalytics(req.userId);
            return res.status(200).json(analytics);
        } catch (error) {
            console.error("getChefAnalytics error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching chef analytics." });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const order = await OrderService.updateOrderStatus({
                orderId: req.params.orderId,
                status: req.body.status,
                userId: req.userId,
                userRole: req.userRole
            });
            return res.status(200).json(order);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("updateOrderStatus error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while updating order status." });
        }
    }

    async rateOrder(req, res) {
        try {
            const result = await OrderService.rateOrder({
                orderId: req.params.orderId,
                userId: req.userId,
                rating: req.body.rating,
                review: req.body.review
            });
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("rateOrder error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while rating order." });
        }
    }

    async getTopChefs(req, res) {
        try {
            const chefs = await OrderService.getTopChefs();
            return res.status(200).json(chefs);
        } catch (error) {
            console.error("getTopChefs error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching top chefs." });
        }
    }

    async getMostOrderedDishes(req, res) {
        try {
            const dishes = await OrderService.getMostOrderedDishes();
            return res.status(200).json(dishes);
        } catch (error) {
            console.error("getMostOrderedDishes error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching popular dishes." });
        }
    }
}

export default new OrderController();