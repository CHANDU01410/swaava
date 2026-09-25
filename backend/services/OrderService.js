
import OrderRepository from "../repositories/OrderRepository.js";
import ItemRepository from "../repositories/ItemRepository.js";
import ChefRepository from "../repositories/ChefRepository.js";
import CartRepository from "../repositories/CartRepository.js";

class OrderService {
    async placeOrder({ userId, deliveryAddress, paymentMethod }) {
        const cart = await CartRepository.findByUserId(userId);

        if (!cart || cart.items.length === 0) {
            throw { status: 400, message: "Cart is empty" };
        }
        const chefItemsMap = {};
        for (const cartItem of cart.items) {
            const item = await ItemRepository.findById(cartItem.itemId);
            if (!item) continue;
            if (item.shop) await item.populate("shop");
            if (item.chef) await item.populate("chef");

            let chefId = (item.shop?._id || item.chef?._id || item.shop || item.chef)?.toString();
            if (!chefId) {
                const anyChef = await ChefRepository.findOne();
                if (anyChef) chefId = anyChef._id.toString();
            }
            if (!chefId) continue;
            if (!chefItemsMap[chefId]) {
                chefItemsMap[chefId] = { chefId, items: [], totalAmount: 0 };
            }
            const authoritativePrice = item.price;
            const itemQty = Math.max(1, Math.min(99, Math.floor(Number(cartItem.quantity) || 1)));

            chefItemsMap[chefId].items.push({
                item: item._id,
                name: item.name,
                image: item.image,
                price: authoritativePrice,
                quantity: itemQty
            });
            chefItemsMap[chefId].totalAmount += authoritativePrice * itemQty;
            item.orderCount = (item.orderCount || 0) + itemQty;
            await ItemRepository.save(item);
        }
        const orders = [];
        for (const chefData of Object.values(chefItemsMap)) {
            const order = await OrderRepository.create({
                customer: userId,
                chef: chefData.chefId,
                items: chefData.items,
                totalAmount: chefData.totalAmount,
                deliveryAddress: deliveryAddress || "",
                paymentMethod: paymentMethod || "cod"
            });
            const chefDoc = await ChefRepository.findById(chefData.chefId);
            if (chefDoc) {
                chefDoc.mealsServed = (chefDoc.mealsServed || 0) + chefData.items.reduce((sum, i) => sum + i.quantity, 0);
                await ChefRepository.save(chefDoc);
            }

            orders.push(order);
        }
        cart.items = [];
        await CartRepository.save(cart);

        return OrderRepository.findByIds(orders.map(o => o._id));
    }

    async getMyOrders(userId) {
        return OrderRepository.findByCustomer(userId);
    }

    async getChefOrders(userId) {
        const myShop = await ChefRepository.findByUserId(userId);
        if (!myShop) {
            return [];
        }
        return OrderRepository.findByChef(myShop._id);
    }

    async getChefAnalytics(userId) {
        const myShop = await ChefRepository.findByUserId(userId);
        if (!myShop) {
            return {
                totalOrders: 0,
                todaysOrders: 0,
                revenue: 0,
                averageRating: 5.0,
                totalReviews: 0,
                activeDishes: 0,
                totalDishes: 0,
                pendingOrders: 0,
                bestSellingDishes: [],
                recentOrders: []
            };
        }

        const allChefOrders = await OrderRepository.findByChef(myShop._id);
        const shopItems = await ItemRepository.findByShop(myShop._id);

        const totalOrders = allChefOrders.length;

        // Today's orders
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todaysOrders = allChefOrders.filter(o => new Date(o.createdAt) >= startOfToday).length;

        // Revenue (sum of all non-cancelled orders)
        const revenue = allChefOrders
            .filter(o => o.status !== "cancelled")
            .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

        // Pending orders count
        const pendingOrders = allChefOrders.filter(o => o.status === "pending").length;

        // Active vs total dishes
        const totalDishes = shopItems.length;
        const activeDishes = shopItems.filter(i => i.isAvailable !== false && i.available !== false).length;

        // Average rating & review count
        const ratedOrders = allChefOrders.filter(o => o.rating && o.rating > 0);
        const averageRating = ratedOrders.length > 0
            ? Number((ratedOrders.reduce((sum, o) => sum + o.rating, 0) / ratedOrders.length).toFixed(1))
            : Number((myShop.rating?.average || 4.9).toFixed(1));
        const totalReviews = ratedOrders.length || myShop.rating?.count || 0;

        // Best-selling dishes
        const dishSalesMap = {};
        allChefOrders.forEach(order => {
            if (order.status === "cancelled") return;
            order.items.forEach(orderItem => {
                const itemIdStr = (orderItem.item?._id || orderItem.item || orderItem._id || orderItem.name).toString();
                if (!dishSalesMap[itemIdStr]) {
                    dishSalesMap[itemIdStr] = {
                        id: itemIdStr,
                        name: orderItem.name || orderItem.item?.name || "Regional Specialty",
                        image: orderItem.image || orderItem.item?.image || "",
                        price: orderItem.price,
                        orderCount: 0,
                        totalRevenue: 0
                    };
                }
                dishSalesMap[itemIdStr].orderCount += (orderItem.quantity || 1);
                dishSalesMap[itemIdStr].totalRevenue += (orderItem.price || 0) * (orderItem.quantity || 1);
            });
        });

        const bestSellingDishes = Object.values(dishSalesMap)
            .sort((a, b) => b.orderCount - a.orderCount || b.totalRevenue - a.totalRevenue)
            .slice(0, 5);

        // Recent orders (last 5)
        const recentOrders = allChefOrders.slice(0, 5);

        return {
            totalOrders,
            todaysOrders,
            revenue,
            averageRating,
            totalReviews,
            activeDishes,
            totalDishes,
            pendingOrders,
            bestSellingDishes,
            recentOrders
        };
    }

    async updateOrderStatus({ orderId, status, userId, userRole }) {
        const validStatuses = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "delivered", "cancelled"];
        if (!status || !validStatuses.includes(status)) {
            throw { status: 400, message: `Invalid status. Must be one of: ${validStatuses.join(", ")}` };
        }

        const order = await OrderRepository.findById(orderId);
        if (!order) {
            throw { status: 404, message: "Order not found" };
        }

        // If caller is not Admin, ensure they are the HomeChef owning this order
        if (userRole !== "Admin") {
            const myShop = await ChefRepository.findByUserId(userId);
            if (!myShop || order.chef.toString() !== myShop._id.toString()) {
                throw { status: 403, message: "Forbidden: You are not authorized to update orders for another chef." };
            }
        }

        order.status = status;
        await OrderRepository.save(order);
        return OrderRepository.findByIdPopulated(orderId);
    }

    async rateOrder({ orderId, userId, rating, review }) {
        if (!rating || rating < 1 || rating > 5) {
            throw { status: 400, message: "Rating must be between 1 and 5" };
        }

        const order = await OrderRepository.findById(orderId);
        if (!order) {
            throw { status: 404, message: "Order not found" };
        }

        if (order.customer.toString() !== userId) {
            throw { status: 403, message: "Not authorized" };
        }

        if (order.status !== "delivered") {
            throw { status: 400, message: "Reviews and ratings are only allowed for completed, delivered orders." };
        }

        order.rating = rating;
        order.review = review || "";
        await OrderRepository.save(order);
        const chefDoc = await ChefRepository.findById(order.chef);
        if (chefDoc) {
            const allOrders = await OrderRepository.findRatedOrdersByChef(chefDoc._id);
            const totalRating = allOrders.reduce((sum, o) => sum + o.rating, 0);
            chefDoc.rating.average = totalRating / allOrders.length;
            chefDoc.rating.count = allOrders.length;
            await ChefRepository.save(chefDoc);
        }

        return { message: "Rating submitted", order };
    }

    async getTopChefs() {
        const pipeline = [
            {
                $addFields: {
                    sortPriority: { $cond: [{ $gt: ["$rating.count", 0] }, 0, 1] },
                    sortValue: {
                        $cond: [
                            { $gt: ["$rating.count", 0] },
                            "$rating.average",
                            { $multiply: [{ $toLong: "$createdAt" }, -1] }
                        ]
                    }
                }
            },
            { $sort: { sortPriority: 1, sortValue: -1 } },
            { $limit: 4 },
            {
                $lookup: {
                    from: "users",
                    localField: "homechef",
                    foreignField: "_id",
                    as: "homechef",
                    pipeline: [{ $project: { fullName: 1, email: 1 } }]
                }
            },
            { $unwind: { path: "$homechef", preserveNullAndEmptyArrays: true } },
            { $project: { sortPriority: 0, sortValue: 0 } }
        ];
        return ChefRepository.aggregate(pipeline);
    }

    async getMostOrderedDishes() {
        const pipeline = [
            { $match: { isAvailable: true } },
            {
                $addFields: {
                    sortPriority: { $cond: [{ $gt: [{ $ifNull: ["$orderCount", 0] }, 0] }, 0, 1] },
                    sortValue: {
                        $cond: [
                            { $gt: [{ $ifNull: ["$orderCount", 0] }, 0] },
                            "$orderCount",
                            { $multiply: [{ $toLong: "$createdAt" }, -1] }
                        ]
                    }
                }
            },
            { $sort: { sortPriority: 1, sortValue: -1 } },
            { $limit: 6 },
            {
                $lookup: {
                    from: "chefs",
                    localField: "shop",
                    foreignField: "_id",
                    as: "shop",
                    pipeline: [{ $project: { name: 1, image: 1, city: 1, state: 1 } }]
                }
            },
            { $unwind: { path: "$shop", preserveNullAndEmptyArrays: true } },
            { $project: { sortPriority: 0, sortValue: 0 } }
        ];
        return ItemRepository.aggregate(pipeline);
    }
}

export default new OrderService();