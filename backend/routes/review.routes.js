
import express from "express";
import ReviewController from "../controllers/review.controllers.js";
import isAuth from "../middlewares/isAuth.js";

const router = express.Router();

router.post("/add", isAuth, (req, res) => ReviewController.addReview(req, res));
router.get("/chef/:chefId", (req, res) => ReviewController.getChefReviews(req, res));
router.get("/item/:itemId", (req, res) => ReviewController.getItemReviews(req, res));

export default router;