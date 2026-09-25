
import ChefService from "../services/ChefService.js";

class ChefController {
    async createEditShop(req, res) {
        try {
            const shop = await ChefService.createEditShop({ userId: req.userId, body: req.body, file: req.file });
            return res.status(201).json(shop);
        } catch (error) {
            console.error("createEditShop error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while saving kitchen details." });
        }
    }

    async getMyShop(req, res) {
        try {
            const shop = await ChefService.getMyShop(req.userId);
            return res.status(200).json(shop);
        } catch (error) {
            console.error("getMyShop error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching kitchen details." });
        }
    }

    async getShopByCity(req, res) {
        try {
            const shops = await ChefService.getShopByCity(req.params.city);
            return res.status(200).json(shops);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("getShopByCity error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching chefs by city." });
        }
    }

    async getShopByState(req, res) {
        try {
            const shops = await ChefService.getShopByState(req.params.state);
            return res.status(200).json(shops);
        } catch (error) {
            console.error("getShopByState error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching chefs by state." });
        }
    }

    async getShopById(req, res) {
        try {
            const shop = await ChefService.getShopById(req.params.shopId);
            return res.status(200).json(shop);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("getShopById error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching chef profile." });
        }
    }

    async getAllShops(req, res) {
        try {
            const shops = await ChefService.getAllShops(req.query);
            return res.status(200).json(shops);
        } catch (error) {
            console.error("getAllShops error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching chefs." });
        }
    }
}

export default new ChefController();