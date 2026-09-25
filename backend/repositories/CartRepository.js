
import Cart from "../models/cart.model.js";

class CartRepository {
    async findByUserId(userId) {
        return Cart.findOne({ userId });
    }

    create(data) {
        return new Cart(data);
    }

    async save(cart) {
        return cart.save();
    }
}

export default new CartRepository();