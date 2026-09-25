
import express from "express";
import dotenv from "dotenv";
dotenv.config();
import helmet from "helmet";
import connectDb from "./config/db.js";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth.router.js";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import cartRouter from "./routes/cart.routes.js";
import shopRouter from "./routes/chef.routes.js";
import itemRouter from "./routes/item.routes.js";
import regionRouter from "./routes/region.routes.js";
import orderRouter from "./routes/order.routes.js";
import reviewRouter from "./routes/review.routes.js";
import adminRouter from "./routes/admin.routes.js";
import { authLimiter, apiLimiter } from "./middlewares/rateLimiter.js";

const app = express();

const port = process.env.PORT || 5000;

// Reverse proxy support (Render, Railway, Heroku, Nginx, Vercel)
app.set("trust proxy", 1);

// Security audit: Verify critical environment variables
if (!process.env.JWT_SECRET) {
    console.error("CRITICAL SECURITY ERROR: JWT_SECRET environment variable is missing!");
    process.exit(1);
}

// 1. HTTP Security Headers
app.use(helmet());

// 2. CORS configuration (supports comma-separated URLs, trailing slash normalization)
const rawFrontendUrl = process.env.FRONTEND_URL || "";
const configuredOrigins = rawFrontendUrl
    .split(",")
    .map(url => url.trim().replace(/\/$/, ""))
    .filter(Boolean);

const allowedOrigins = [
    ...configuredOrigins,
    "http://localhost:5173",
    "http://localhost:5174"
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, health checks, etc.)
        if (!origin) return callback(null, true);
        const normalizedOrigin = origin.replace(/\/$/, "");
        // Allow official deployment or preview deployment
        if (/^https:\/\/(?:maakhana|swaava)(?:-[a-zA-Z0-9_-]+)?\.vercel\.app$/.test(normalizedOrigin)) {
            return callback(null, true);
        }
        if (allowedOrigins.includes(normalizedOrigin)) return callback(null, true);
        // Reject disallowed origins gracefully without 500 crash
        return callback(null, false);
    },
    credentials: true
}));

// 3. Health check endpoints for cloud monitoring and deployment verification
app.get(["/health", "/api/health"], (req, res) => {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// 3. Rate limiting
app.use("/api/auth", authLimiter, authRouter);
app.use("/api", apiLimiter);

// 4. Application Routes
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/shop", shopRouter);
app.use("/api/item", itemRouter);
app.use("/api/region", regionRouter);
app.use("/api/order", orderRouter);
app.use("/api/review", reviewRouter);
app.use("/api/admin", adminRouter);

// 5. Centralized Global Error Handler (Sanitizes stack traces & internal error details)
app.use((err, req, res, next) => {
    console.error("Unhandled error caught by global handler:", err);
    if (res.headersSent) {
        return next(err);
    }
    const status = err.status || 500;
    const message = (status === 500)
        ? "An internal server error occurred. Please try again later."
        : (err.message || "An error occurred.");
    return res.status(status).json({ message });
});

app.listen(port, () => {
    connectDb();
    console.log(`server started at ${port}`);
});