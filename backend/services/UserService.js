
import UserRepository from "../repositories/UserRepository.js";

class UserService {
    async getCurrentUser(userId) {
        if (!userId) {
            throw { status: 400, message: "userId is not found" };
        }
        const user = await UserRepository.findByIdLean(userId);
        if (!user) {
            throw { status: 400, message: "user is not found" };
        }
        return user;
    }

    async updateUserLocation({ userId, lat, lon }) {
        const user = await UserRepository.findByIdAndUpdate(userId, {
            location: { type: "Point", coordinates: [lon, lat] }
        });
        if (!user) {
            throw { status: 400, message: "user is not found" };
        }
        return { message: "location updated" };
    }

    async updateProfile({ userId, fullName, phone, city, dob }) {
        const updateData = { fullName, phone, dob };
        if (city !== undefined) updateData.city = city;
        const user = await UserRepository.findByIdAndUpdate(userId, updateData);
        if (!user) {
            throw { status: 404, message: "User not found" };
        }
        return user;
    }

    async addAddress({ userId, label, fullAddress, city, state, pincode, phone, isDefault }) {
        if (!fullAddress) {
            throw { status: 400, message: "Full address is required" };
        }
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw { status: 404, message: "User not found" };
        }
        if (isDefault) {
            user.addresses.forEach(a => a.isDefault = false);
        }
        const makeDefault = user.addresses.length === 0 ? true : !!isDefault;

        user.addresses.push({ label, fullAddress, city, state, pincode, phone, isDefault: makeDefault });
        await UserRepository.save(user);
        return user.addresses;
    }

    async updateAddress({ userId, addressId, updates }) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw { status: 404, message: "User not found" };
        }
        const addr = user.addresses.id(addressId);
        if (!addr) {
            throw { status: 404, message: "Address not found" };
        }
        if (updates.isDefault) {
            user.addresses.forEach(a => a.isDefault = false);
        }
        Object.assign(addr, updates);
        await UserRepository.save(user);
        return user.addresses;
    }

    async deleteAddress({ userId, addressId }) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw { status: 404, message: "User not found" };
        }
        user.addresses = user.addresses.filter(a => a._id.toString() !== addressId);
        await UserRepository.save(user);
        return user.addresses;
    }

    async toggleFavoriteChef({ userId, chefId }) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw { status: 404, message: "User not found" };
        }
        if (!user.favoriteChefs) user.favoriteChefs = [];
        const idx = user.favoriteChefs.findIndex(id => id.toString() === chefId);
        if (idx > -1) {
            user.favoriteChefs.splice(idx, 1);
        } else {
            user.favoriteChefs.push(chefId);
        }
        await UserRepository.save(user);
        const populated = await UserRepository.findByIdWithFavorites(userId);
        return {
            favoriteChefs: populated.favoriteChefs || [],
            favoriteFoods: populated.favoriteFoods || []
        };
    }

    async toggleFavoriteFood({ userId, foodId }) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw { status: 404, message: "User not found" };
        }
        if (!user.favoriteFoods) user.favoriteFoods = [];
        const idx = user.favoriteFoods.findIndex(id => id.toString() === foodId);
        if (idx > -1) {
            user.favoriteFoods.splice(idx, 1);
        } else {
            user.favoriteFoods.push(foodId);
        }
        await UserRepository.save(user);
        const populated = await UserRepository.findByIdWithFavorites(userId);
        return {
            favoriteChefs: populated.favoriteChefs || [],
            favoriteFoods: populated.favoriteFoods || []
        };
    }

    async getFavorites(userId) {
        const user = await UserRepository.findByIdWithFavorites(userId);
        if (!user) {
            throw { status: 404, message: "User not found" };
        }
        return {
            favoriteChefs: user.favoriteChefs || [],
            favoriteFoods: user.favoriteFoods || []
        };
    }

    async getFavoriteChefs(userId) {
        return this.getFavorites(userId);
    }

    async recordRecentlyViewed({ userId, foodId }) {
        const user = await UserRepository.findById(userId);
        if (!user) {
            throw { status: 404, message: "User not found" };
        }
        if (!user.recentlyViewed) user.recentlyViewed = [];

        // Deduplicate: remove this foodId if already present in history
        user.recentlyViewed = user.recentlyViewed.filter(id => id && id.toString() !== foodId.toString());

        // Place at the front (most recently viewed first)
        user.recentlyViewed.unshift(foodId);

        // Cap to reasonable history limit (8 items)
        const MAX_RECENT = 8;
        if (user.recentlyViewed.length > MAX_RECENT) {
            user.recentlyViewed = user.recentlyViewed.slice(0, MAX_RECENT);
        }

        await UserRepository.save(user);
        return this.getRecentlyViewed(userId);
    }

    async getRecentlyViewed(userId) {
        const user = await UserRepository.findByIdWithRecentlyViewed(userId);
        if (!user) {
            throw { status: 404, message: "User not found" };
        }
        // Filter out null or deleted dishes safely
        const validItems = (user.recentlyViewed || []).filter(item => item && item._id);
        return validItems;
    }
}

export default new UserService();