import AdminService from "../services/AdminService.js";

class AdminController {
    // ── 1. Dashboard ──
    async getDashboardMetrics(req, res) {
        try {
            const metrics = await AdminService.getDashboardMetrics();
            return res.status(200).json(metrics);
        } catch (error) {
            console.error("getDashboardMetrics error:", error);
            return res.status(500).json({ message: "Failed to load admin metrics" });
        }
    }

    // ── 2. Users ──
    async getUsers(req, res) {
        try {
            const users = await AdminService.getUsers(req.query.search);
            return res.status(200).json(users);
        } catch (error) {
            console.error("getUsers error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching users." });
        }
    }

    async updateUserRole(req, res) {
        try {
            const user = await AdminService.updateUserRole({
                userId: req.params.userId,
                role: req.body.role
            });
            return res.status(200).json(user);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("updateUserRole error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while updating user role." });
        }
    }

    async deleteUser(req, res) {
        try {
            const result = await AdminService.deleteUser(req.params.userId);
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("deleteUser error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while deleting user." });
        }
    }

    // ── 3. Chefs & Approvals ──
    async getChefs(req, res) {
        try {
            const chefs = await AdminService.getChefs(req.query.filter);
            return res.status(200).json(chefs);
        } catch (error) {
            console.error("getChefs error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching chefs." });
        }
    }

    async verifyChef(req, res) {
        try {
            const chef = await AdminService.verifyChef({
                chefId: req.params.chefId,
                isVerified: req.body.isVerified
            });
            return res.status(200).json(chef);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("verifyChef error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while verifying chef." });
        }
    }

    async deleteChef(req, res) {
        try {
            const result = await AdminService.deleteChef(req.params.chefId);
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("deleteChef error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while deleting chef." });
        }
    }

    // ── 4. Foods ──
    async getFoods(req, res) {
        try {
            const foods = await AdminService.getFoods(req.query.search);
            return res.status(200).json(foods);
        } catch (error) {
            console.error("getFoods error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching foods." });
        }
    }

    async updateFood(req, res) {
        try {
            const food = await AdminService.updateFood({
                foodId: req.params.foodId,
                updates: req.body
            });
            return res.status(200).json(food);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("updateFood error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while updating food." });
        }
    }

    async deleteFood(req, res) {
        try {
            const result = await AdminService.deleteFood(req.params.foodId);
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("deleteFood error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while deleting food." });
        }
    }

    // ── 5. States ──
    async getStates(req, res) {
        try {
            const states = await AdminService.getStates();
            return res.status(200).json(states);
        } catch (error) {
            console.error("getStates error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching states." });
        }
    }

    async createState(req, res) {
        try {
            const state = await AdminService.createState(req.body);
            return res.status(201).json(state);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("createState error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while creating state." });
        }
    }

    async updateState(req, res) {
        try {
            const state = await AdminService.updateState({
                stateId: req.params.stateId,
                updates: req.body
            });
            return res.status(200).json(state);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("updateState error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while updating state." });
        }
    }

    async deleteState(req, res) {
        try {
            const result = await AdminService.deleteState(req.params.stateId);
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("deleteState error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while deleting state." });
        }
    }

    // ── 6. Orders ──
    async getOrders(req, res) {
        try {
            const orders = await AdminService.getOrders(req.query.status);
            return res.status(200).json(orders);
        } catch (error) {
            console.error("getOrders error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching orders." });
        }
    }

    async updateOrderStatus(req, res) {
        try {
            const order = await AdminService.updateOrderStatus({
                orderId: req.params.orderId,
                status: req.body.status
            });
            return res.status(200).json(order);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("updateOrderStatus error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while updating order status." });
        }
    }

    async deleteOrder(req, res) {
        try {
            const result = await AdminService.deleteOrder(req.params.orderId);
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("deleteOrder error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while deleting order." });
        }
    }

    // ── 7. Reviews ──
    async getReviews(req, res) {
        try {
            const reviews = await AdminService.getReviews();
            return res.status(200).json(reviews);
        } catch (error) {
            console.error("getReviews error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching reviews." });
        }
    }

    async deleteReview(req, res) {
        try {
            const result = await AdminService.deleteReview(req.params.reviewId);
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("deleteReview error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while deleting review." });
        }
    }
}

export default new AdminController();
