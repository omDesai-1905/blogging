import { AsyncHandler } from "../utils/asyncHandles.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../model/user.model.js";
import jwt from "jsonwebtoken";

export const verifyJWT = AsyncHandler(async (req, res, next) => {
  console.log("=== AUTH MIDDLEWARE ===");
  console.log("Cookies:", req.cookies);
  console.log("Authorization header:", req.header("Authorization"));

  // Check for token in cookies or Authorization header
  const token =
    req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

  console.log("Extracted token:", token);

  if (!token) {
    throw new ApiError(401, "Unauthorized");
  }
  try {
    const verifyToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = await User.findById(verifyToken._id).select("-password");
    next();
  } catch (error) {
    console.log("JWT Verification Error:", error.message);
    throw new ApiError(401, "Unauthorized");
  }
});

export const getLoggedInUserOrIgnore = AsyncHandler(async (req, res, next) => {
  const { token } = req.cookies;

  try {
    const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedData?._id).select(
      "-password -createdAt -updatedAt -__v"
    );

    req.user = user;
    next();
  } catch (error) {
    next();
  }
});
