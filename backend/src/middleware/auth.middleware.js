import { AsyncHandler } from "../utils/asyncHandles.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../model/user.model.js";
import { UserRole } from "../constants.js";
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

    const isEnvAdminToken =
      verifyToken?.role === UserRole.ADMIN &&
      verifyToken?.email === process.env.ADMIN_LOGIN_IDENTIFIER;

    if (isEnvAdminToken) {
      req.user = {
        _id: verifyToken._id || "env-admin",
        name: verifyToken.name,
        userName: verifyToken.userName,
        email: verifyToken.email,
        role: verifyToken.role,
      };
      return next();
    }

    const user = verifyToken?._id
      ? await User.findById(verifyToken._id).select("-password")
      : null;

    if (user) {
      req.user = user;
      return next();
    }

    throw new ApiError(401, "Unauthorized");
  } catch (error) {
    console.log("JWT Verification Error:", error.message);
    throw new ApiError(401, "Unauthorized");
  }
});

export const getLoggedInUserOrIgnore = AsyncHandler(async (req, res, next) => {
  // Check for token in cookies or Authorization header
  const token =
    req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");

  try {
    const decodedData = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedData?._id).select(
      "-password -createdAt -updatedAt -__v",
    );

    req.user = user;
    next();
  } catch (error) {
    next();
  }
});

export const verifyAdmin = AsyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Unauthorized");
  }

  if (req.user.role !== UserRole.ADMIN) {
    throw new ApiError(403, "Admin access required");
  }

  next();
});
