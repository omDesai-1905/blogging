import express from "express";
import {
  verifyJWT,
  getLoggedInUserOrIgnore,
} from "../middleware/auth.middleware.js";
import {
  getUserProfile,
  getUserPost,
  followUser,
  unfollowUser,
  getMyPosts,
  getLikesOnMyPosts,
  getCommentsOnMyPosts,
  getMyFollowers,
  getMyFollowing,
  searchUsers,
} from "../controller/user.controller.js";
const router = express.Router();

// Specific routes MUST come before parameterized routes
router.route("/search").get(searchUsers);
router.route("/my/posts").get(verifyJWT, getMyPosts);
router.route("/my/posts/likes").get(verifyJWT, getLikesOnMyPosts);
router.route("/my/posts/comments").get(verifyJWT, getCommentsOnMyPosts);
router.route("/my/followers").get(verifyJWT, getMyFollowers);
router.route("/my/following").get(verifyJWT, getMyFollowing);

// Parameterized routes come after
router.route("/:userName").get(getLoggedInUserOrIgnore, getUserProfile);
router.route("/:userName/posts").get(getUserPost);
router.route("/:userId/follow").post(verifyJWT, followUser);
router.route("/:userId/unfollow").delete(verifyJWT, unfollowUser);

export default router;
