
import express from "express"
import UserController from "../controllers/user.controller.js"
import isAuth from "../middlewares/isAuth.js"

const userRouter = express.Router()

userRouter.get("/current", isAuth, (req, res) => UserController.getCurrentUser(req, res))
userRouter.post('/update-location', isAuth, (req, res) => UserController.updateUserLocation(req, res))
userRouter.put("/profile", isAuth, (req, res) => UserController.updateProfile(req, res))
userRouter.post("/address", isAuth, (req, res) => UserController.addAddress(req, res))
userRouter.put("/address/:addressId", isAuth, (req, res) => UserController.updateAddress(req, res))
userRouter.delete("/address/:addressId", isAuth, (req, res) => UserController.deleteAddress(req, res))
userRouter.get("/favorites", isAuth, (req, res) => UserController.getFavorites(req, res))
userRouter.post("/favorites/:chefId", isAuth, (req, res) => UserController.toggleFavoriteChef(req, res))
userRouter.post("/favorite-chef/:chefId", isAuth, (req, res) => UserController.toggleFavoriteChef(req, res))
userRouter.post("/favorite-food/:foodId", isAuth, (req, res) => UserController.toggleFavoriteFood(req, res))
userRouter.get("/recently-viewed", isAuth, (req, res) => UserController.getRecentlyViewed(req, res))
userRouter.post("/recently-viewed/:foodId", isAuth, (req, res) => UserController.recordRecentlyViewed(req, res))

export default userRouter