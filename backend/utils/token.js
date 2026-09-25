
import jwt from "jsonwebtoken";

const generateToken = async (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET environment variable is missing.");
    }
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "9d" });
    return token;
};

export default generateToken;