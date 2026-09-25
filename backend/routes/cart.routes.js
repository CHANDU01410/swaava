
import express from "express";
import isAuth from "../middlewares/isAuth.js";
import CartController from "../controllers/cart.controllers.js";

const cartRouter = express.Router();
cartRouter.get("/", isAuth, (req, res) => CartController.getCart(req, res));
cartRouter.post("/add", isAuth, (req, res) => CartController.addToCart(req, res));
cartRouter.put("/update", isAuth, (req, res) => CartController.updateCartItem(req, res));
cartRouter.delete("/remove/:itemId", isAuth, (req, res) => CartController.removeFromCart(req, res));
cartRouter.delete("/clear", isAuth, (req, res) => CartController.clearCart(req, res));

export default cartRouter;