
import express from "express"
import isAuth from "../middlewares/isAuth.js"
import isHomeChef from "../middlewares/isHomeChef.js"
import { upload } from "../middlewares/multer.js"
import ItemController from "../controllers/item.controllers.js"

const itemRouter = express.Router()
itemRouter.post("/add", isAuth, isHomeChef, upload.single("image"), (req, res) => ItemController.addItem(req, res))
itemRouter.put("/edit/:itemId", isAuth, isHomeChef, upload.single("image"), (req, res) => ItemController.editItem(req, res))
itemRouter.delete("/delete/:itemId", isAuth, isHomeChef, (req, res) => ItemController.deleteItem(req, res))
itemRouter.get("/search-items", (req, res) => ItemController.searchItems(req, res))
itemRouter.get("/by-city/:city", (req, res) => ItemController.getItemByCity(req, res))
itemRouter.get("/by-state/:state", (req, res) => ItemController.getItemsByState(req, res))
itemRouter.get("/by-shop/:shopId", (req, res) => ItemController.getItemsByShop(req, res))
itemRouter.get("/all", (req, res) => ItemController.searchItems(req, res))
itemRouter.get("/:itemId", (req, res) => ItemController.getItemById(req, res))
itemRouter.post("/rate", isAuth, (req, res) => ItemController.rating(req, res))

export default itemRouter