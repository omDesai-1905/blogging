import express from "express";
import multer from "multer";
import {
  registerUser,
  loginUser,
  loggedOutUser,
  getCurrentUser,
  changeCurrentPassword,
  resetPassword,
} from "../controller/auth.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const upload = multer();
const router = express.Router();

router.post("/login", loginUser);

router.post("/logout", loggedOutUser);

router.post("/register", registerUser);

router.get("/myProfile/:id", getCurrentUser);

router.post("/change-password", verifyJWT, changeCurrentPassword);

router.post("/reset-password/:token", resetPassword);

export default router;
