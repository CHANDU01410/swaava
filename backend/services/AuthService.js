
import UserRepository from "../repositories/UserRepository.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/token.js";
import { sendOtpMail } from "../utils/mail.js";

class AuthService {
    async signUp({ fullName, email, password, role }) {
        if (!fullName || typeof fullName !== "string" || !email || typeof email !== "string" || !password) {
            throw { status: 400, message: "Valid name, email and password are required." };
        }

        if (typeof password !== "string" || password.length < 8 || password.length > 128) {
            throw { status: 400, message: "Password must be between 8 and 128 characters." };
        }

        const normalizedEmail = email.trim().toLowerCase();
        const existingUser = await UserRepository.findByEmail(normalizedEmail);
        if (existingUser) {
            throw { status: 400, message: "User already exists." };
        }

        // Prevent privilege escalation: Admin role cannot be created via public signup
        let assignedRole = "Customer";
        if (role === "HomeCook") {
            assignedRole = "HomeCook";
        } else if (role && role !== "Customer") {
            throw { status: 400, message: "Invalid role specified for signup." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await UserRepository.create({
            fullName: fullName.trim(),
            email: normalizedEmail,
            role: assignedRole,
            password: hashedPassword
        });

        const token = await generateToken(user._id);
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.resetOtp;
        delete userObj.otpExpires;

        return { user: userObj, token };
    }

    async signIn({ email, password }) {
        if (!email || typeof email !== "string" || !password || typeof password !== "string") {
            throw { status: 400, message: "Valid email and password are required." };
        }

        const normalizedEmail = email.trim().toLowerCase();
        const user = await UserRepository.findByEmail(normalizedEmail, true);
        if (!user) {
            throw { status: 400, message: "User does not exist." };
        }
        if (!user.password) {
            throw { status: 400, message: "This account uses Google sign-in. Please use Google to log in." };
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            throw { status: 400, message: "Wrong password." };
        }

        const token = await generateToken(user._id);
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.resetOtp;
        delete userObj.otpExpires;

        return { user: userObj, token };
    }

    async sendOtp({ email }) {
        if (!email || typeof email !== "string") {
            throw { status: 400, message: "Email is required." };
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await UserRepository.findByEmail(normalizedEmail, true);
        if (!user) {
            throw { status: 400, message: "User does not exist." };
        }

        // Standard 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        user.resetOtp = otp;
        user.otpExpires = Date.now() + 5 * 60 * 1000;
        user.isOtpVerified = false;
        await UserRepository.save(user);
        await sendOtpMail(normalizedEmail, otp);
    }

    async verifyOtp({ email, otp }) {
        if (!email || !otp) {
            throw { status: 400, message: "Email and OTP are required." };
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await UserRepository.findByEmail(normalizedEmail, true);
        if (!user || user.resetOtp != otp || user.otpExpires < Date.now()) {
            throw { status: 400, message: "invalid/expired otp" };
        }
        user.isOtpVerified = true;
        user.resetOtp = undefined;
        user.otpExpires = undefined;
        await UserRepository.save(user);
    }

    async resetPassword({ email, newPassword }) {
        if (!newPassword || typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) {
            throw { status: 400, message: "Password must be between 8 and 128 characters." };
        }
        const normalizedEmail = email.trim().toLowerCase();
        const user = await UserRepository.findByEmail(normalizedEmail, true);
        if (!user || !user.isOtpVerified) {
            throw { status: 400, message: "otp verification required" };
        }
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.isOtpVerified = false;
        await UserRepository.save(user);
    }

    async googleAuth({ fullName, email, role }) {
        if (!email || typeof email !== "string") {
            throw { status: 400, message: "Valid email is required." };
        }
        const normalizedEmail = email.trim().toLowerCase();
        let user = await UserRepository.findByEmail(normalizedEmail, true);
        let isNewUser = false;

        // Security check: Never permit Administrator login through unverified Google OAuth
        if (user && user.role === "Admin") {
            throw { status: 403, message: "Forbidden: Administrator accounts cannot sign in via social login." };
        }

        // Security check: Prevent account takeover for existing email/password accounts
        if (user && user.password) {
            throw {
                status: 400,
                message: "This account was registered with email and password. Please sign in using your password."
            };
        }

        // Prevent privilege escalation to Admin via Google OAuth payload
        const assignedRole = role === "HomeCook" ? "HomeCook" : "Customer";

        if (!user) {
            isNewUser = true;
            user = await UserRepository.create({
                fullName: (fullName && typeof fullName === "string") ? fullName.trim() : "Google User",
                email: normalizedEmail,
                role: assignedRole
            });
        }

        const token = await generateToken(user._id);
        const userObj = user.toObject();
        delete userObj.password;
        delete userObj.resetOtp;
        delete userObj.otpExpires;

        return { user: { ...userObj, isNewUser }, token };
    }

    async setRole({ userId, role }) {
        if (!role || !["Customer", "HomeCook"].includes(role)) {
            throw { status: 400, message: "Invalid role" };
        }
        const currentUser = await UserRepository.findById(userId);
        if (!currentUser) {
            throw { status: 404, message: "User not found" };
        }
        if (currentUser.role === "Admin") {
            throw { status: 403, message: "Forbidden: Administrator role cannot be changed via this endpoint." };
        }
        currentUser.role = role;
        await UserRepository.save(currentUser);
        return currentUser;
    }
}

export default new AuthService();