import express from "express";
import isAuth from "../middlewares/isAuth.js";
import isAdmin from "../middlewares/isAdmin.js";
import AdminController from "../controllers/admin.controllers.js";

const adminRouter = express.Router();

// Strict Admin Authorization Middleware applied to all admin routes
adminRouter.use(isAuth, isAdmin);

// ── 1. Dashboard ──
adminRouter.get("/dashboard", (req, res) => AdminController.getDashboardMetrics(req, res));

// ── 2. Users ──
adminRouter.get("/users", (req, res) => AdminController.getUsers(req, res));
adminRouter.put("/users/:userId/role", (req, res) => AdminController.updateUserRole(req, res));
adminRouter.delete("/users/:userId", (req, res) => AdminController.deleteUser(req, res));

// ── 3. HomeChefs & Approvals ──
adminRouter.get("/chefs", (req, res) => AdminController.getChefs(req, res));
adminRouter.put("/chefs/:chefId/verify", (req, res) => AdminController.verifyChef(req, res));
adminRouter.delete("/chefs/:chefId", (req, res) => AdminController.deleteChef(req, res));

// ── 4. Foods ──
adminRouter.get("/foods", (req, res) => AdminController.getFoods(req, res));
adminRouter.put("/foods/:foodId", (req, res) => AdminController.updateFood(req, res));
adminRouter.delete("/foods/:foodId", (req, res) => AdminController.deleteFood(req, res));

// ── 5. States / Regions ──
adminRouter.get("/states", (req, res) => AdminController.getStates(req, res));
adminRouter.post("/states", (req, res) => AdminController.createState(req, res));
adminRouter.put("/states/:stateId", (req, res) => AdminController.updateState(req, res));
adminRouter.delete("/states/:stateId", (req, res) => AdminController.deleteState(req, res));

// ── 6. Orders ──
adminRouter.get("/orders", (req, res) => AdminController.getOrders(req, res));
adminRouter.put("/orders/:orderId/status", (req, res) => AdminController.updateOrderStatus(req, res));
adminRouter.delete("/orders/:orderId", (req, res) => AdminController.deleteOrder(req, res));

// ── 7. Reviews ──
adminRouter.get("/reviews", (req, res) => AdminController.getReviews(req, res));
adminRouter.delete("/reviews/:reviewId", (req, res) => AdminController.deleteReview(req, res));

export default adminRouter;
