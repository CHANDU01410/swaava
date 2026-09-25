import mongoose from "mongoose";
import ItemRepository from "../repositories/ItemRepository.js";
import ChefRepository from "../repositories/ChefRepository.js";
import OrderRepository from "../repositories/OrderRepository.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import Chef from "../models/chef.model.js";
import Item from "../models/item.model.js";
import { escapeRegex } from "../utils/sanitize.js";

class ItemService {
    async addItem({ userId, body, file }) {
        const {
            name,
            description,
            category,
            foodType,
            vegetarian,
            price,
            spiceLevel,
            spicyLevel,
            preparationTime,
            servingSize,
            ingredients
        } = body;

        let image = "";
        if (file) {
            try {
                image = await uploadOnCloudinary(file.path);
            } catch (uploadErr) {
                console.error("Cloudinary upload failed (continuing without image):", uploadErr.message);
            }
        } else if (body.image) {
            image = body.image;
        }

        const shop = await ChefRepository.findByUserId(userId);
        if (!shop) {
            console.log("Shop not found for user:", userId);
            throw { status: 400, message: "Shop not found. Please create your shop first." };
        }

        const item = await ItemRepository.create({
            name,
            description,
            category,
            foodType: foodType || (vegetarian ? "veg" : "non veg"),
            vegetarian: vegetarian !== undefined ? vegetarian : (foodType === "veg"),
            price,
            spiceLevel: spiceLevel !== undefined ? spiceLevel : (spicyLevel !== undefined ? spicyLevel : 1),
            spicyLevel: spicyLevel !== undefined ? spicyLevel : (spiceLevel !== undefined ? spiceLevel : 1),
            preparationTime: preparationTime || "25-30 mins",
            servingSize: servingSize || "1-2 persons",
            ingredients: Array.isArray(ingredients) ? ingredients : (ingredients ? ingredients.split(",").map(s => s.trim()) : []),
            state: shop.state,
            shop: shop._id,
            chef: shop._id,
            ...(image ? { image } : {})
        });
        console.log("Item created:", item._id);

        shop.items.push(item._id);
        await ChefRepository.save(shop);
        await shop.populate("homechef");
        await shop.populate({ path: "items", options: { sort: { updatedAt: -1 } } });
        return shop;
    }

    async editItem({ userId, itemId, body, file }) {
        const shop = await ChefRepository.findByUserId(userId);
        if (!shop) {
            throw { status: 403, message: "Shop not found. HomeChef authorization required." };
        }

        const existingItem = await ItemRepository.findById(itemId);
        if (!existingItem) {
            throw { status: 404, message: "Item not found." };
        }

        // Enforce ownership: item must belong to this chef's shop
        const itemShopId = (existingItem.shop?._id || existingItem.shop || existingItem.chef?._id || existingItem.chef)?.toString();
        if (itemShopId !== shop._id.toString()) {
            throw { status: 403, message: "Forbidden: You are not authorized to modify this food item." };
        }

        const {
            name,
            description,
            category,
            foodType,
            vegetarian,
            price,
            spiceLevel,
            spicyLevel,
            preparationTime,
            servingSize,
            ingredients,
            isAvailable,
            available
        } = body;

        let image;
        if (file) {
            image = await uploadOnCloudinary(file.path);
        } else if (body.image) {
            image = body.image;
        }

        const updateData = { name, description, category, price };
        if (foodType) updateData.foodType = foodType;
        if (vegetarian !== undefined) updateData.vegetarian = vegetarian;
        if (spiceLevel !== undefined) updateData.spiceLevel = spiceLevel;
        if (spicyLevel !== undefined) updateData.spicyLevel = spicyLevel;
        if (preparationTime) updateData.preparationTime = preparationTime;
        if (servingSize) updateData.servingSize = servingSize;
        if (ingredients) {
            updateData.ingredients = Array.isArray(ingredients) ? ingredients : ingredients.split(",").map(s => s.trim());
        }
        if (image) updateData.image = image;
        if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
        if (available !== undefined) updateData.available = available;

        await ItemRepository.findByIdAndUpdate(itemId, updateData);
        await shop.populate({
            path: "items",
            options: { sort: { updatedAt: -1 } }
        });
        return shop;
    }

    async getItemById(itemId) {
        if (!itemId || !mongoose.isValidObjectId(itemId)) {
            throw { status: 404, message: "Item not found" };
        }
        const item = await ItemRepository.findByIdWithShop(itemId);
        if (!item) {
            throw { status: 404, message: "Item not found" };
        }
        return item;
    }

    async deleteItem({ userId, itemId }) {
        const shop = await ChefRepository.findByUserId(userId);
        if (!shop) {
            throw { status: 403, message: "Shop not found. HomeChef authorization required." };
        }

        const existingItem = await ItemRepository.findById(itemId);
        if (!existingItem) {
            throw { status: 404, message: "Item not found." };
        }

        const itemShopId = (existingItem.shop?._id || existingItem.shop || existingItem.chef?._id || existingItem.chef)?.toString();
        if (itemShopId !== shop._id.toString()) {
            throw { status: 403, message: "Forbidden: You are not authorized to delete this food item." };
        }

        await ItemRepository.findByIdAndDelete(itemId);
        shop.items = shop.items.filter(i => i.toString() !== itemId);
        await ChefRepository.save(shop);
        await shop.populate({ path: "items", options: { sort: { updatedAt: -1 } } });
        return shop;
    }

    async getItemsByCity(city) {
        if (!city) {
            throw { status: 400, message: "city is required" };
        }
        const safeCity = escapeRegex(city);
        const shops = await Chef.find({ city: { $regex: new RegExp(`^${safeCity}$`, "i") } });
        if (!shops || shops.length === 0) {
            return [];
        }
        const shopIds = shops.map(s => s._id);
        return ItemRepository.findByShopIds(shopIds);
    }

    async getItemsByShop(shopId) {
        const shop = await ChefRepository.findById(shopId);
        if (!shop) {
            throw { status: 404, message: "shop not found" };
        }
        await shop.populate({ path: "items", options: { sort: { category: 1, updatedAt: -1 } } });
        return { shop, items: shop.items };
    }

    async getItemsByState(state) {
        if (!state) return [];
        // First check directly by state
        const safeState = escapeRegex(state);
        const items = await ItemRepository.findByState(state);
        if (items && items.length > 0) {
            return items;
        }
        // Fallback by chefs in state
        const shops = await Chef.find({ state: { $regex: new RegExp(`^${safeState}$`, "i") } });
        if (!shops || shops.length === 0) {
            return [];
        }
        const shopIds = shops.map(s => s._id);
        return ItemRepository.findByShopIds(shopIds);
    }

    async searchItems(params = {}) {
        const {
            query,
            search,
            dish,
            chef,
            state,
            cuisine,
            category,
            vegetarian,
            foodType,
            minPrice,
            maxPrice,
            minRating,
            rating,
            isAvailable,
            available,
            spiceLevel,
            spicyLevel,
            sortBy,
            city
        } = params;

        const filters = {};
        const andConditions = [];

        // 1. Search Query: Matches Dish name, Chef name, State, Cuisine/Category, or description
        const rawSearch = (query || search || dish || cuisine || "").trim();
        if (rawSearch) {
            const searchQuery = escapeRegex(rawSearch);
            const matchedChefs = await Chef.find({
                $or: [
                    { name: { $regex: searchQuery, $options: "i" } },
                    { specialty: { $regex: searchQuery, $options: "i" } },
                    { specialization: { $regex: searchQuery, $options: "i" } },
                    { city: { $regex: searchQuery, $options: "i" } },
                    { state: { $regex: searchQuery, $options: "i" } }
                ]
            }).select("_id");
            const matchedChefIds = matchedChefs.map(c => c._id);

            const searchOr = [
                { name: { $regex: searchQuery, $options: "i" } },
                { description: { $regex: searchQuery, $options: "i" } },
                { category: { $regex: searchQuery, $options: "i" } },
                { state: { $regex: searchQuery, $options: "i" } }
            ];

            if (matchedChefIds.length > 0) {
                searchOr.push({ shop: { $in: matchedChefIds } });
                searchOr.push({ chef: { $in: matchedChefIds } });
            }

            andConditions.push({ $or: searchOr });
        }

        // Specific chef search (by chef name or ID)
        if (chef && chef.trim()) {
            const chefTerm = chef.trim();
            if (chefTerm.match(/^[0-9a-fA-F]{24}$/)) {
                andConditions.push({
                    $or: [{ shop: chefTerm }, { chef: chefTerm }]
                });
            } else {
                const safeChefTerm = escapeRegex(chefTerm);
                const chefsByName = await Chef.find({
                    name: { $regex: safeChefTerm, $options: "i" }
                }).select("_id");
                const chefIds = chefsByName.map(c => c._id);
                andConditions.push({
                    $or: [{ shop: { $in: chefIds } }, { chef: { $in: chefIds } }]
                });
            }
        }

        // 2. State Filter
        if (state && state !== "all" && state !== "All" && state !== "All States") {
            const safeState = escapeRegex(state.trim());
            andConditions.push({
                state: { $regex: new RegExp(`^${safeState}$`, "i") }
            });
        }

        // 3. Category / Cuisine Filter
        const catFilter = category || cuisine;
        if (catFilter && catFilter !== "all" && catFilter !== "All" && catFilter !== "All Categories") {
            const safeCat = escapeRegex(catFilter.trim());
            andConditions.push({
                category: { $regex: new RegExp(`^${safeCat}$`, "i") }
            });
        }

        // 4. Dietary (Vegetarian / Non-Vegetarian)
        if (vegetarian !== undefined && vegetarian !== null && vegetarian !== "" && vegetarian !== "all") {
            const isVeg = vegetarian === true || vegetarian === "true" || vegetarian === "veg";
            andConditions.push({
                $or: [
                    { vegetarian: isVeg },
                    { foodType: isVeg ? "veg" : "non veg" }
                ]
            });
        } else if (foodType && foodType !== "all") {
            const isVeg = foodType.toLowerCase() === "veg";
            andConditions.push({
                $or: [
                    { foodType: isVeg ? "veg" : "non veg" },
                    { vegetarian: isVeg }
                ]
            });
        }

        // 5. Price Range
        const parsedMinPrice = minPrice !== undefined && minPrice !== "" ? Number(minPrice) : null;
        const parsedMaxPrice = maxPrice !== undefined && maxPrice !== "" ? Number(maxPrice) : null;
        if (parsedMinPrice !== null || parsedMaxPrice !== null) {
            const priceCondition = {};
            if (parsedMinPrice !== null && !isNaN(parsedMinPrice)) priceCondition.$gte = parsedMinPrice;
            if (parsedMaxPrice !== null && !isNaN(parsedMaxPrice)) priceCondition.$lte = parsedMaxPrice;
            if (Object.keys(priceCondition).length > 0) {
                andConditions.push({ price: priceCondition });
            }
        }

        // 6. Rating Filter
        const minRatingVal = minRating !== undefined && minRating !== "" ? Number(minRating) : (rating ? Number(rating) : null);
        if (minRatingVal !== null && !isNaN(minRatingVal) && minRatingVal > 0) {
            andConditions.push({
                "rating.average": { $gte: minRatingVal }
            });
        }

        // 7. Availability Filter
        const availVal = isAvailable !== undefined ? isAvailable : available;
        if (availVal !== undefined && availVal !== null && availVal !== "" && availVal !== "all") {
            const isAvail = availVal === true || availVal === "true";
            andConditions.push({
                $or: [
                    { isAvailable: isAvail },
                    { available: isAvail }
                ]
            });
        }

        // 8. Spice Level Filter (0 to 3)
        const spiceVal = spiceLevel !== undefined ? spiceLevel : spicyLevel;
        if (spiceVal !== undefined && spiceVal !== null && spiceVal !== "" && spiceVal !== "all") {
            const numSpice = Number(spiceVal);
            if (!isNaN(numSpice)) {
                andConditions.push({
                    $or: [
                        { spiceLevel: numSpice },
                        { spicyLevel: numSpice }
                    ]
                });
            }
        }

        // 9. City Filter
        if (city && city.trim()) {
            const safeCity = escapeRegex(city.trim());
            const shopsInCity = await Chef.find({ city: { $regex: new RegExp(`^${safeCity}$`, "i") } }).select("_id");
            const cityShopIds = shopsInCity.map(s => s._id);
            andConditions.push({
                $or: [{ shop: { $in: cityShopIds } }, { chef: { $in: cityShopIds } }]
            });
        }

        if (andConditions.length > 0) {
            filters.$and = andConditions;
        }

        // 10. Sorting
        let sortOptions = { createdAt: -1 };
        if (sortBy) {
            switch (sortBy.toLowerCase()) {
                case "price_asc":
                case "price-asc":
                case "price_low_high":
                    sortOptions = { price: 1 };
                    break;
                case "price_desc":
                case "price-desc":
                case "price_high_low":
                    sortOptions = { price: -1 };
                    break;
                case "rating_desc":
                case "rating":
                case "highest_rated":
                    sortOptions = { "rating.average": -1, "rating.count": -1 };
                    break;
                case "popular_desc":
                case "popularity":
                case "most_popular":
                    sortOptions = { orderCount: -1, "rating.count": -1, "rating.average": -1 };
                    break;
                case "newest":
                case "latest":
                    sortOptions = { createdAt: -1 };
                    break;
                default:
                    sortOptions = { createdAt: -1 };
            }
        }

        return ItemRepository.findWithFilters(filters, sortOptions);
    }

    async rateItem({ userId, itemId, rating }) {
        if (!userId) {
            throw { status: 401, message: "Authentication required to submit rating." };
        }
        if (!itemId || !rating) {
            throw { status: 400, message: "itemId and rating is required" };
        }
        if (rating < 1 || rating > 5) {
            throw { status: 400, message: "rating must be between 1 to 5" };
        }

        const item = await ItemRepository.findById(itemId);
        if (!item) {
            throw { status: 404, message: "item not found" };
        }

        // Verification: User must have completed a delivered order containing this item
        const verifiedOrder = await OrderRepository.findOne({
            customer: userId,
            "items.item": itemId,
            status: "delivered"
        });
        if (!verifiedOrder) {
            throw { status: 403, message: "Ratings are only permitted for items in completed, delivered orders." };
        }

        const newCount = (item.rating?.count || 0) + 1;
        const currentAvg = item.rating?.average || 0;
        const newAverage = Number(((currentAvg * (item.rating?.count || 0) + rating) / newCount).toFixed(1));
        item.rating = {
            count: newCount,
            average: newAverage
        };
        item.reviewCount = newCount;
        await ItemRepository.save(item);
        return { rating: item.rating };
    }
}

export default new ItemService();