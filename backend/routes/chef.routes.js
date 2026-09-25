
import express from "express"
import ChefController from "../controllers/chef.controllers.js"
import isAuth from "../middlewares/isAuth.js"
import isHomeChef from "../middlewares/isHomeChef.js"
import { upload } from "../middlewares/multer.js"

const shopRouter = express.Router()

shopRouter.post("/create-edit", isAuth, isHomeChef, upload.single("image"), (req, res) => ChefController.createEditShop(req, res))
shopRouter.get("/get-my", isAuth, isHomeChef, (req, res) => ChefController.getMyShop(req, res))
shopRouter.get("/all", (req, res) => ChefController.getAllShops(req, res))
shopRouter.get("/get-by-city/:city", (req, res) => ChefController.getShopByCity(req, res))
shopRouter.get("/get-by-state/:state", (req, res) => ChefController.getShopByState(req, res))
shopRouter.get("/:shopId", (req, res) => ChefController.getShopById(req, res))

export default shopRouter