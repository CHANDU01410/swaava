
import CartService from "../services/CartService.js";

class CartController {
    async getCart(req, res) {
        try {
            const result = await CartService.getCart(req.userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error("getCart error:", error);
            return res.status(500).json({ message: "Failed to fetch cart" });
        }
    }

    async addToCart(req, res) {
        try {
            const { itemId, quantity } = req.body;
            const result = await CartService.addToCart({ userId: req.userId, itemId, quantity });
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("addToCart error:", error);
            return res.status(500).json({ message: "Failed to add item to cart" });
        }
    }

    async updateCartItem(req, res) {
        try {
            const { itemId, quantity } = req.body;
            const result = await CartService.updateCartItem({ userId: req.userId, itemId, quantity });
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("updateCartItem error:", error);
            return res.status(500).json({ message: "Failed to update cart item" });
        }
    }

    async removeFromCart(req, res) {
        try {
            const result = await CartService.removeFromCart({ userId: req.userId, itemId: req.params.itemId });
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("removeFromCart error:", error);
            return res.status(500).json({ message: "Failed to remove item from cart" });
        }
    }

    async clearCart(req, res) {
        try {
            const result = await CartService.clearCart(req.userId);
            return res.status(200).json(result);
        } catch (error) {
            console.error("clearCart error:", error);
            return res.status(500).json({ message: "Failed to clear cart" });
        }
    }
}

export default new CartController();