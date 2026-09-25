
import express from "express"
import AuthController from "../controllers/auth.controllers.js"
import isAuth from "../middlewares/isAuth.js"
import { otpLimiter } from "../middlewares/rateLimiter.js"

const authRouter = express.Router()
authRouter.post("/signup", (req, res) => AuthController.signUp(req, res))
authRouter.post("/signin", (req, res) => AuthController.signIn(req, res))
authRouter.get("/signout", (req, res) => AuthController.signOut(req, res))
authRouter.post("/send-otp", otpLimiter, (req, res) => AuthController.sendOtp(req, res))
authRouter.post("/verify-otp", otpLimiter, (req, res) => AuthController.verifyOtp(req, res))
authRouter.post("/reset-password", otpLimiter, (req, res) => AuthController.resetPassword(req, res))
authRouter.post("/google-auth", (req, res) => AuthController.googleAuth(req, res))
authRouter.post("/set-role", isAuth, (req, res) => AuthController.setRole(req, res))

export default authRouter