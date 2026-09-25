
import RegionService from "../services/RegionService.js";

class RegionController {
    async getAllRegions(req, res) {
        try {
            const regions = await RegionService.getAllRegions();
            return res.status(200).json(regions);
        } catch (error) {
            console.error("getAllRegions error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching regions." });
        }
    }

    async getRegionByName(req, res) {
        try {
            const region = await RegionService.getRegionByName(req.params.regionName);
            return res.status(200).json(region);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("getRegionByName error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while fetching region." });
        }
    }
}

export default new RegionController();