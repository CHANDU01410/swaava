
import CartRepository from "../repositories/CartRepository.js";
import ItemRepository from "../repositories/ItemRepository.js";

class CartService {
    async getCart(userId) {
        const cart = await CartRepository.findByUserId(userId);
        if (!cart) {
            return { items: [], totalAmount: 0 };
        }
        return { items: cart.items, totalAmount: cart.totalAmount };
    }

    async addToCart({ userId, itemId, quantity = 1 }) {
        if (!itemId) {
            throw { status: 400, message: "itemId is required" };
        }

        const validQty = Math.floor(Number(quantity));
        if (isNaN(validQty) || validQty <= 0) {
            throw { status: 400, message: "Quantity must be a positive integer" };
        }
        const safeQuantity = Math.min(validQty, 99);

        // Security: Always fetch authoritative price and details directly from database
        const itemDoc = await ItemRepository.findById(itemId);
        if (!itemDoc) {
            throw { status: 404, message: "Food item not found" };
        }
        if (itemDoc.isAvailable === false || itemDoc.available === false) {
            throw { status: 400, message: "This dish is currently unavailable" };
        }

        const authoritativePrice = itemDoc.price;
        const itemName = itemDoc.name;
        const itemImage = itemDoc.image || "";
        const itemChef = (itemDoc.shop?._id || itemDoc.shop || itemDoc.chef?._id || itemDoc.chef || "").toString();

        let cart = await CartRepository.findByUserId(userId);

        if (!cart) {
            cart = CartRepository.create({
                userId,
                items: [{
                    itemId,
                    name: itemName,
                    image: itemImage,
                    price: authoritativePrice,
                    quantity: safeQuantity,
                    chef: itemChef
                }]
            });
        } else {
            const existingItem = cart.items.find(i => i.itemId === itemId);
            if (existingItem) {
                // Ensure price is synced with current authoritative price
                existingItem.price = authoritativePrice;
                existingItem.quantity = Math.min(existingItem.quantity + safeQuantity, 99);
            } else {
                cart.items.push({
                    itemId,
                    name: itemName,
                    image: itemImage,
                    price: authoritativePrice,
                    quantity: safeQuantity,
                    chef: itemChef
                });
            }
        }

        cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await CartRepository.save(cart);
        return { message: "Item added to cart", items: cart.items, totalAmount: cart.totalAmount };
    }

    async updateCartItem({ userId, itemId, quantity }) {
        if (!itemId || quantity === undefined) {
            throw { status: 400, message: "itemId and quantity are required" };
        }

        const parsedQty = Math.floor(Number(quantity));
        if (isNaN(parsedQty)) {
            throw { status: 400, message: "Invalid quantity specified" };
        }

        const cart = await CartRepository.findByUserId(userId);
        if (!cart) {
            throw { status: 404, message: "Cart not found" };
        }

        const item = cart.items.find(i => i.itemId === itemId);
        if (!item) {
            throw { status: 404, message: "Item not found in cart" };
        }

        if (parsedQty <= 0) {
            cart.items = cart.items.filter(i => i.itemId !== itemId);
        } else {
            // Keep price synced with database if item still exists
            const itemDoc = await ItemRepository.findById(itemId);
            if (itemDoc) {
                item.price = itemDoc.price;
            }
            item.quantity = Math.min(parsedQty, 99);
        }

        cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await CartRepository.save(cart);
        return { message: "Cart updated", items: cart.items, totalAmount: cart.totalAmount };
    }

    async removeFromCart({ userId, itemId }) {
        const cart = await CartRepository.findByUserId(userId);
        if (!cart) {
            throw { status: 404, message: "Cart not found" };
        }

        cart.items = cart.items.filter(i => i.itemId !== itemId);
        cart.totalAmount = cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
        await CartRepository.save(cart);
        return { message: "Item removed from cart", items: cart.items, totalAmount: cart.totalAmount };
    }

    async clearCart(userId) {
        const cart = await CartRepository.findByUserId(userId);
        if (cart) {
            cart.items = [];
            await CartRepository.save(cart);
        }
        return { message: "Cart cleared", items: [], totalAmount: 0 };
    }
}

export default new CartService();