// Import environment configuration, database connector, app, HTTP, and Socket.IO
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { app } from "./app.js";
import http from "http";
import { Server } from "socket.io";

// Load environment variables from .env file
dotenv.config({ path: "./.env" });

// Create an HTTP server using the Express app
const server = http.createServer(app);

/**
 * Initialize Socket.IO server
 * Enables real-time communication with proper CORS configuration
 */
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:3000", // Allowed frontend origins
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"], // Allowed HTTP methods
    credentials: true, // Allow credentials (cookies, auth headers)
  },
});

/**
 * Handle new WebSocket connections
 */
io.on("connection", (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);

  // Listen for client disconnections
  socket.on("disconnect", () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
  });

  // You can add more socket event listeners here
});

// Export the io instance to use in other parts of the application
export { io };

/**
 * Connect to the MongoDB database and start the server
 */
connectDB()
  .then(() => {
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`✅ Server is running on port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed!", err);
  });
