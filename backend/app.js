import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import multer from "multer";

const app = express();

// Configure multer for form-data
const upload = multer();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //extended: true allows for nested objects in the request body

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  next();
});

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
export { app };
