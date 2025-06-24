// Import necessary packages
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import "./config/passport.js"; // Load passport config

// Initialize express application
const app = express();

// Define allowed origins from environment variables
const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || [];

/**
 * CORS Configuration
 * This setup restricts cross-origin requests to allowed domains only.
 */
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman) or from allowed domains
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true, // Allow cookies and credentials in cross-origin requests
  methods: ["GET", "POST", "OPTIONS", "PUT", "PATCH"], // Allowed HTTP methods
  allowedHeaders: ["Content-Type", "Authorization"], // Allowed custom headers
};

// Apply CORS middleware globally using the configured options
app.use(cors(corsOptions));

/**
 * Middleware to parse incoming JSON requests
 * Limits request payload to 16KB to prevent large payload attacks
 */
app.use(express.json({ limit: "16kb" }));

/**
 * Middleware to parse URL-encoded form data
 * Extended mode allows nested objects in request bodies
 */
app.use(express.urlencoded({ extended: true }));

/**
 * Middleware to serve static files
 * Static assets like images, CSS, JS files will be served from the 'public' directory
 */
app.use(express.static("public"));

/**
 * Middleware to parse cookies from incoming requests
 * Parsed cookies are available on req.cookies
 */
app.use(cookieParser());

/**
 * Express Session Setup (Required for Passport)
 * You can use in-memory store for development, but for production use Redis or another store
 */
app.use(
  session({
    secret: process.env.SESSION_SECRET || "keyboard cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set true if using HTTPS
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  })
);

/**
 * Initialize Passport Middleware
 * This enables authentication sessions
 */
app.use(passport.initialize());
app.use(passport.session());

// Create routes for the app
import authRouter from "./routes/authRoutes.js";
import otpRouter from "./routes/otpRoutes.js";
import collegeRouter from "./routes/collegeRoutes.js";
import notesRouter from "./routes/noteRoutes.js";
import pyqRouter from "./routes/PYQRoutes.js";
import newRouter from "./routes/newRoutes.js";
import globalSearchRouter from "./routes/searchRoutes.js";
// Route declarations for the app
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/otp", otpRouter);
app.use("/api/v1/college", collegeRouter);
app.use("/api/v1/notes", notesRouter);
app.use("/api/v1/PYQ", pyqRouter);
app.use("/api/v1/news", newRouter);
app.use("/api/v1/global", globalSearchRouter);
// Export the configured express app
export { app };
