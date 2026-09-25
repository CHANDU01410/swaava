
import express from "express";
import isAuth from "../middlewares/isAuth.js";
import isHomeChef from "../middlewares/isHomeChef.js";
import OrderController from "../controllers/order.controllers.js";

const orderRouter = express.Router();
orderRouter.get("/top-chefs", (req, res) => OrderController.getTopChefs(req, res));
orderRouter.get("/most-ordered", (req, res) => OrderController.getMostOrderedDishes(req, res));
orderRouter.post("/place", isAuth, (req, res) => OrderController.placeOrder(req, res));
orderRouter.get("/my-orders", isAuth, (req, res) => OrderController.getMyOrders(req, res));
orderRouter.post("/rate/:orderId", isAuth, (req, res) => OrderController.rateOrder(req, res));

// HomeChef Protected Routes
orderRouter.get("/chef-orders", isAuth, isHomeChef, (req, res) => OrderController.getChefOrders(req, res));
orderRouter.get("/chef-analytics", isAuth, isHomeChef, (req, res) => OrderController.getChefAnalytics(req, res));
orderRouter.put("/update-status/:orderId", isAuth, isHomeChef, (req, res) => OrderController.updateOrderStatus(req, res));
orderRouter.put("/status/:orderId", isAuth, isHomeChef, (req, res) => OrderController.updateOrderStatus(req, res));

export default orderRouter;