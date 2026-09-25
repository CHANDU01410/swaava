import rateLimit from "express-rate-limit";

// Rate limiter for authentication routes (login, register, forgot/reset password)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: () => process.env.NODE_ENV === "test",
  message: {
    message: "Too many authentication attempts from this IP, please try again after 15 minutes.",
  },
});

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    message: "Too many requests from this IP, please try again later.",
  },
});

// Strict rate limiter for sensitive OTP and password reset attempts
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 OTP attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === "test",
  message: {
    message: "Too many OTP attempts from this IP. Please try again after 15 minutes.",
  },
});

export default {
  authLimiter,
  otpLimiter,
  apiLimiter,
};
