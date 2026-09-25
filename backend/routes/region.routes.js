
import express from "express";
import RegionController from "../controllers/region.controllers.js";

const regionRouter = express.Router();

regionRouter.get("/all", (req, res) => RegionController.getAllRegions(req, res));
regionRouter.get("/:regionName", (req, res) => RegionController.getRegionByName(req, res));

export default regionRouter;