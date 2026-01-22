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
  toggleAccountPrivacy,
  getMyPosts,
  getMyLikedPosts,
  getMyComments,
  getMyFollowers,
  getMyFollowing,
  searchUsers,
  acceptFollowRequest,
  rejectFollowRequest,
  cancelFollowRequest,
  getPendingFollowRequests,
  getMySentFollowRequests,
} from "../controller/user.controller.js";
const router = express.Router();

// Specific routes MUST come before parameterized routes
router.route("/search").get(searchUsers);
router.route("/account/privacy").post(verifyJWT, toggleAccountPrivacy);
router.route("/my/posts").get(verifyJWT, getMyPosts);
router.route("/my/liked-posts").get(verifyJWT, getMyLikedPosts);
router.route("/my/comments").get(verifyJWT, getMyComments);
router.route("/my/followers").get(verifyJWT, getMyFollowers);
router.route("/my/following").get(verifyJWT, getMyFollowing);

// Follow request routes
router
  .route("/follow-requests/pending")
  .get(verifyJWT, getPendingFollowRequests);
router.route("/follow-requests/sent").get(verifyJWT, getMySentFollowRequests);
router
  .route("/follow-requests/:requestId/accept")
  .post(verifyJWT, acceptFollowRequest);
router
  .route("/follow-requests/:requestId/reject")
  .delete(verifyJWT, rejectFollowRequest);
router
  .route("/:userId/follow-request/cancel")
  .delete(verifyJWT, cancelFollowRequest);

// Parameterized routes come after
router.route("/:userName").get(getLoggedInUserOrIgnore, getUserProfile);
router.route("/:userName/posts").get(getUserPost);
router.route("/:userId/follow").post(verifyJWT, followUser);
router.route("/:userId/unfollow").delete(verifyJWT, unfollowUser);

export default router;
