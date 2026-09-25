
import Region from "../models/region.model.js";
import { escapeRegex } from "../utils/sanitize.js";

class RegionRepository {
    async findAll() {
        return Region.find().sort({ name: 1 });
    }

    async findByName(name) {
        const safeName = escapeRegex(name || "");
        return Region.findOne({ name: { $regex: new RegExp(`^${safeName}$`, "i") } });
    }
}

export default new RegionRepository();