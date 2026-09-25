
import jwt from "jsonwebtoken";

const isAuth = async (req, res, next) => {
    try {
        let token = req.cookies?.token;
        if (!token && req.headers?.authorization && req.headers.authorization.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({ message: "Authentication token missing or not found" });
        }

        const decodeToken = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        if (!decodeToken || !decodeToken.userId) {
            return res.status(401).json({ message: "Invalid authentication token" });
        }

        req.userId = decodeToken.userId;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
};

export default isAuth;
