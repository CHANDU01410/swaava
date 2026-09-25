
import Order from "../models/order.model.js";

class OrderRepository {
    async create(data) {
        return Order.create(data);
    }

    async findById(orderId) {
        return Order.findById(orderId);
    }

    async findByIdPopulated(orderId) {
        return Order.findById(orderId)
            .populate("customer", "fullName email")
            .populate("chef", "name image city state")
            .populate("items.item", "name image price");
    }

    async findByCustomer(customerId) {
        return Order.find({ customer: customerId })
            .populate("chef", "name image city state")
            .populate("items.item", "name image price")
            .sort({ createdAt: -1 });
    }

    async findByChef(chefId) {
        return Order.find({ chef: chefId })
            .populate("customer", "fullName email")
            .populate("items.item", "name image price")
            .sort({ createdAt: -1 });
    }

    async findByIds(ids) {
        return Order.find({ _id: { $in: ids } })
            .populate("chef", "name image city state")
            .populate("items.item", "name image price")
            .sort({ createdAt: -1 });
    }

    async findRatedOrdersByChef(chefId) {
        return Order.find({ chef: chefId, rating: { $ne: null } });
    }

    async findOne(query) {
        return Order.findOne(query);
    }

    async save(order) {
        return order.save();
    }
}

export default new OrderRepository();