import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";
import dotenv from "dotenv";

// Load environment variables first
dotenv.config({ path: ".env" });

const app = express();

// Debug middleware BEFORE CORS
app.use((req, res, next) => {
  console.log(`\n=== ${req.method} ${req.path} ===`);
  console.log("Origin:", req.headers.origin);

  // Log response
  const oldSend = res.send;
  res.send = function (data) {
    console.log("Response Status:", res.statusCode);
    console.log("Response Headers:", res.getHeaders());
    if (data) {
      try {
        const jsonData = JSON.parse(data);
        console.log("Response Body:", JSON.stringify(jsonData, null, 2));
      } catch (e) {
        console.log("Response Data:", data.substring(0, 200));
      }
    }
    return oldSend.apply(res, arguments);
  };

  next();
});

// Configure CORS properly
const corsOptions = {
  origin: process.env.CORS_ORIGIN === "*" ? true : process.env.CORS_ORIGIN,
  credentials: process.env.CORS_ORIGIN !== "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 200,
};

console.log("CORS Config:", corsOptions);
app.use(cors(corsOptions));

// Configure multer for form-data
const upload = multer();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //extended: true allows for nested objects in the request body

app.use(express.static("public")); //static is used to store flies like image,pdfs etc in public folder
//public is a folder
app.use(cookieParser()); //cookie-parser is used to access cookies from the user's browser and perform curd operations on them
//only server can read and remove cookies

//routes import
import authRoute from "./src/routes/auth.route.js";
import blogRoute from "./src/routes/blog.routes.js";
import userRoute from "./src/routes/user.route.js";
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/blog", blogRoute);
app.use("/api/v1/user", userRoute);

// Error handling middleware - MUST BE AFTER ROUTES
app.use((err, req, res, next) => {
  const statusCode = err.staticCode || 500;
  const message = err.message || "Internal Server Error";

  console.error("Error:", err);

  res.status(statusCode).json({
    success: false,
    message: message,
    errors: err.errors || [],
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
  });
});

export { app };
