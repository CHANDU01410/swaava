
// In production, use VITE_SERVER_URL if provided, else empty string for same-domain proxy (e.g. Vercel rewrites)
// In development, use VITE_SERVER_URL if provided, else default to localhost backend
const rawUrl = import.meta.env.VITE_SERVER_URL
    ? import.meta.env.VITE_SERVER_URL
    : (import.meta.env.DEV ? "http://localhost:5000" : "");

export const serverUrl = rawUrl.replace(/\/$/, "");