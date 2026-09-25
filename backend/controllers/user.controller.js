
import UserService from "../services/UserService.js";

class UserController {
    async getCurrentUser(req, res) {
        try {
            const user = await UserService.getCurrentUser(req.userId);
            return res.status(200).json(user);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("getCurrentUser error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while retrieving user details." });
        }
    }

    async updateUserLocation(req, res) {
        try {
            const { lat, lon } = req.body;
            const result = await UserService.updateUserLocation({ userId: req.userId, lat, lon });
            return res.status(200).json(result);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("updateUserLocation error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while updating location." });
        }
    }

    async updateProfile(req, res) {
        try {
            const { fullName, phone, city, dob } = req.body;
            const user = await UserService.updateProfile({ userId: req.userId, fullName, phone, city, dob });
            return res.status(200).json(user);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("updateProfile error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while updating profile." });
        }
    }

    async addAddress(req, res) {
        try {
            const { label, fullAddress, city, state, pincode, phone, isDefault } = req.body;
            const addresses = await UserService.addAddress({
                userId: req.userId,
                label,
                fullAddress,
                city,
                state,
                pincode,
                phone,
                isDefault
            });
            return res.status(201).json(addresses);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("addAddress error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while adding address." });
        }
    }

    async updateAddress(req, res) {
        try {
            const { label, fullAddress, city, state, pincode, phone, isDefault } = req.body;
            const updates = {};
            if (label !== undefined) updates.label = label;
            if (fullAddress !== undefined) updates.fullAddress = fullAddress;
            if (city !== undefined) updates.city = city;
            if (state !== undefined) updates.state = state;
            if (pincode !== undefined) updates.pincode = pincode;
            if (phone !== undefined) updates.phone = phone;
            if (isDefault !== undefined) updates.isDefault = isDefault;

            const addresses = await UserService.updateAddress({
                userId: req.userId,
                addressId: req.params.addressId,
                updates
            });
            return res.status(200).json(addresses);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("updateAddress error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while updating address." });
        }
    }

    async deleteAddress(req, res) {
        try {
            const addresses = await UserService.deleteAddress({ userId: req.userId, addressId: req.params.addressId });
            return res.status(200).json(addresses);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("deleteAddress error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while deleting address." });
        }
    }

    async toggleFavoriteChef(req, res) {
        try {
            const favorites = await UserService.toggleFavoriteChef({ userId: req.userId, chefId: req.params.chefId });
            return res.status(200).json(favorites);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("toggleFavoriteChef error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while toggling favorite chef." });
        }
    }

    async toggleFavoriteFood(req, res) {
        try {
            const favorites = await UserService.toggleFavoriteFood({ userId: req.userId, foodId: req.params.foodId });
            return res.status(200).json(favorites);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("toggleFavoriteFood error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while toggling favorite food." });
        }
    }

    async getFavorites(req, res) {
        try {
            const favorites = await UserService.getFavorites(req.userId);
            return res.status(200).json(favorites);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("getFavorites error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching favorites." });
        }
    }

    async getFavoriteChefs(req, res) {
        return this.getFavorites(req, res);
    }

    async recordRecentlyViewed(req, res) {
        try {
            const { foodId } = req.params;
            const items = await UserService.recordRecentlyViewed({ userId: req.userId, foodId });
            return res.status(200).json(items);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("recordRecentlyViewed error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while recording recently viewed dish." });
        }
    }

    async getRecentlyViewed(req, res) {
        try {
            const items = await UserService.getRecentlyViewed(req.userId);
            return res.status(200).json(items);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("getRecentlyViewed error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching recently viewed dishes." });
        }
    }
}

export default new UserController();