
import AuthService from "../services/AuthService.js";

const isProduction = process.env.NODE_ENV === "production" || (process.env.FRONTEND_URL && process.env.FRONTEND_URL.startsWith("https"));

const cookieOptions = {
    secure: isProduction,
    sameSite: isProduction ? "none" : "strict",
    httpOnly: true
};

class AuthController {
    async signUp(req, res) {
        try {
            const { user, token } = await AuthService.signUp(req.body);
            res.cookie("token", token, { ...cookieOptions, maxAge: 9 * 24 * 60 * 60 * 1000 });
            return res.status(201).json({ ...user, token });
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("Sign up error:", error);
            return res.status(500).json({ message: "An unexpected error occurred during sign up." });
        }
    }

    async signIn(req, res) {
        try {
            const { user, token } = await AuthService.signIn(req.body);
            res.cookie("token", token, { ...cookieOptions, maxAge: 9 * 24 * 60 * 60 * 1000 });
            return res.status(200).json({ ...user, token });
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("Sign in error:", error);
            return res.status(500).json({ message: "An unexpected error occurred during sign in." });
        }
    }

    async signOut(req, res) {
        try {
            res.clearCookie("token", cookieOptions);
            return res.status(200).json({ message: "log out successfully" });
        } catch (error) {
            console.error("Sign out error:", error);
            return res.status(500).json({ message: "An unexpected error occurred during sign out." });
        }
    }

    async sendOtp(req, res) {
        try {
            await AuthService.sendOtp(req.body);
            return res.status(200).json({ message: "otp sent successfully" });
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("Send OTP error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while sending OTP." });
        }
    }

    async verifyOtp(req, res) {
        try {
            await AuthService.verifyOtp(req.body);
            return res.status(200).json({ message: "otp verify successfully" });
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("Verify OTP error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while verifying OTP." });
        }
    }

    async resetPassword(req, res) {
        try {
            await AuthService.resetPassword(req.body);
            return res.status(200).json({ message: "password reset successfully" });
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("Reset password error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while resetting password." });
        }
    }

    async googleAuth(req, res) {
        try {
            const { user, token } = await AuthService.googleAuth(req.body);
            res.cookie("token", token, { ...cookieOptions, maxAge: 7 * 24 * 60 * 60 * 1000 });
            return res.status(200).json(user);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("Google auth error:", error);
            return res.status(500).json({ message: "An unexpected error occurred during Google authentication." });
        }
    }

    async setRole(req, res) {
        try {
            const user = await AuthService.setRole({ userId: req.userId, role: req.body.role });
            return res.status(200).json(user);
        } catch (error) {
            if (error.status) return res.status(error.status).json({ message: error.message });
            console.error("Set role error:", error);
            return res.status(500).json({ message: "An unexpected error occurred while setting role." });
        }
    }
}

export default new AuthController();