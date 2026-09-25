
import ItemService from "../services/ItemService.js";

class ItemController {
    async addItem(req, res) {
        try {
            const shop = await ItemService.addItem({ userId: req.userId, body: req.body, file: req.file });
            return res.status(201).json(shop);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("addItem error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while adding item." });
        }
    }

    async editItem(req, res) {
        try {
            const shop = await ItemService.editItem({ userId: req.userId, itemId: req.params.itemId, body: req.body, file: req.file });
            return res.status(200).json(shop);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("editItem error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while editing item." });
        }
    }

    async getItemById(req, res) {
        try {
            const item = await ItemService.getItemById(req.params.itemId);
            return res.status(200).json(item);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("getItemById error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching item." });
        }
    }

    async deleteItem(req, res) {
        try {
            const shop = await ItemService.deleteItem({ userId: req.userId, itemId: req.params.itemId });
            return res.status(200).json(shop);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("deleteItem error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while deleting item." });
        }
    }

    async getItemByCity(req, res) {
        try {
            const items = await ItemService.getItemsByCity(req.params.city);
            return res.status(200).json(items);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("getItemByCity error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching items by city." });
        }
    }

    async getItemsByShop(req, res) {
        try {
            const result = await ItemService.getItemsByShop(req.params.shopId);
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("getItemsByShop error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching shop items." });
        }
    }

    async getItemsByState(req, res) {
        try {
            const items = await ItemService.getItemsByState(req.params.state);
            return res.status(200).json(items);
        } catch (error) {
            console.error("getItemsByState error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching items by state." });
        }
    }

    async searchItems(req, res) {
        try {
            const items = await ItemService.searchItems(req.query);
            return res.status(200).json(items);
        } catch (error) {
            console.error("searchItems error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while searching items." });
        }
    }

    async rating(req, res) {
        try {
            const result = await ItemService.rateItem({
                userId: req.userId,
                itemId: req.body.itemId,
                rating: req.body.rating
            });
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("rating error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while submitting rating." });
        }
    }
}

export default new ItemController();