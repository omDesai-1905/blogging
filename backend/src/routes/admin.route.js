import express from "express";
import { verifyJWT, verifyAdmin } from "../middleware/auth.middleware.js";
import {
  getAdminDashboard,
  getAdminUserDetails,
} from "../controller/admin.controller.js";

const router = express.Router();

router.get("/dashboard", verifyJWT, verifyAdmin, getAdminDashboard);
router.get("/user/:userId", verifyJWT, verifyAdmin, getAdminUserDetails);

export default router;
