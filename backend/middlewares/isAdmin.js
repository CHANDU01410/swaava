import User from "../models/user.model.js";

const isAdmin = async (req, res, next) => {
    try {
        if (!req.userId) {
            return res.status(401).json({ message: "Authentication required" });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(401).json({ message: "User account not found" });
        }

        // Strict Admin RBAC Check
        if (user.role !== "Admin") {
            return res.status(403).json({
                message: "Access forbidden: Administrator privileges required."
            });
        }

        req.userRole = user.role;
        next();
    } catch (error) {
        console.error("isAdmin middleware error:", error);
        return res.status(500).json({ message: "Internal server error during authorization check" });
    }
};

export default isAdmin;
