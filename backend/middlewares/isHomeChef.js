import User from "../models/user.model.js";

const isHomeChef = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(401).json({ message: "User account not found" });
        }

        // RBAC Check: User must be a HomeCook or Admin
        if (user.role !== "HomeCook" && user.role !== "Admin") {
            return res.status(403).json({
                message: "Access forbidden: HomeChef role required. Customers are not permitted to access kitchen management."
            });
        }

        req.userRole = user.role;
        next();
    } catch (error) {
        console.error("isHomeChef middleware error:", error);
        return res.status(500).json({ message: "Internal server error during authorization check" });
    }
};

export default isHomeChef;
