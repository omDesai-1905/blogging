import express from "express";
import multer from "multer";
import { upload } from "../middleware/multer.middleware.js";
import {
  verifyJWT,
  getLoggedInUserOrIgnore,
} from "../middleware/auth.middleware.js";

import {
  createBlogPost,
  deleteBlogPost,
  updateBlogPost,
  getAllBlogPosts,
  getBlogPost,
  shareBlog,
} from "../controller/blog.controller.js";

import {
  likeBlogPost,
  unlikedBlogPost,
} from "../controller/like.controller.js";

import {
  createComment,
  getAllComment,
} from "../controller/comment.controller.js";

const router = express.Router();
router
  .route("/")
  .get(getAllBlogPosts)
  .post(verifyJWT, upload.single("image"), createBlogPost);

router
  .route("/:blogId")
  .get(getLoggedInUserOrIgnore, getBlogPost)
  .post(verifyJWT, updateBlogPost)
  .delete(verifyJWT, deleteBlogPost);

router
  .route("/:blogId/comments")
  .post(verifyJWT, createComment)
  .get(getAllComment);

router.route("/:blogId/like").post(verifyJWT, likeBlogPost);

router.route("/:blogId/like").delete(verifyJWT, unlikedBlogPost);

router.route("/:blogId/share").get(shareBlog);

export default router;
