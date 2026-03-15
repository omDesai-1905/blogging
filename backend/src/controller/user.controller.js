import { AsyncHandler } from "../utils/asyncHandles.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Blog } from "../model/blog.model.js";
import { User } from "../model/user.model.js";
import { Follow } from "../model/follow.model.js";
import { Like } from "../model/like.model.js";
import { Comment } from "../model/comment.model.js";
import mongoose from "mongoose";

export const getUserProfile = AsyncHandler(async (req, res) => {
  const userName = req.params.userName;

  const user = await User.findOne({ userName }).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }
  const followers = await Follow.find({
    following: user._id,
    status: "accepted",
  });
  const following = await Follow.find({
    follower: user._id,
    status: "accepted",
  });

  let isFollowing = false;
  let isFollowedByUser = false; // Does the profile user follow the logged-in user?

  if (req.user) {
    console.log("Checking follow status for:", {
      loggedInUser: req.user._id,
      profileUser: user._id,
    });

    const followRelation = await Follow.findOne({
      follower: req.user._id,
      following: user._id,
      status: "accepted",
    });

    console.log("Follow relation found:", followRelation);

    if (followRelation) {
      isFollowing = true;
      console.log("Follow status:", { isFollowing });
    } else {
      console.log("No follow relation found");
    }

    // Check if the profile user follows the logged-in user
    const reverseFollow = await Follow.findOne({
      follower: user._id,
      following: req.user._id,
      status: "accepted",
    });
    isFollowedByUser = !!reverseFollow;
  }
  const posts = await Blog.find({ userId: user._id });

  const data = {
    userId: user._id,
    name: user.name,
    userName: user.userName,
    followers: followers.length,
    following: following.length,
    isFollowing,
    isFollowedByUser, // Can show "Follows you" badge
    posts: posts.length,
  };

  const response = new ApiResponse(
    200,
    data,
    "User profile fetched successfully",
  );
  return res.status(response.statusCode).json(response);
});

export const getUserPost = AsyncHandler(async (req, res) => {
  const userName = req.params.userName;
  const AllPosts = await Blog.aggregate([
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $addFields: {
        user: {
          $first: "$user",
        },
      },
    },
    {
      $addFields: {
        userName: "$user.userName",
      },
    },
    {
      $match: {
        userName,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "author",
        pipeline: [
          {
            $project: {
              userName: 1,
              email: 1,
              _id: 1,
              name: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        author: {
          $first: "$author",
        },
      },
    },
    {
      $project: {
        userId: 0,
        __v: 0,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);
  const user = await User.findOne({ userName }).select("-password");
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const posts = await Blog.find({ userId: user._id });

  const data = {
    posts: posts.length,
  };

  const response = new ApiResponse(
    200,
    { AllPosts, data },
    "User posts fetched successfully",
  );
  return res.status(response.statusCode).json(response);
});
export const followUser = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (userId === req.user._id.toString()) {
    throw new ApiError(400, "You cannot follow yourself");
  }

  const userToFollow = await User.findById(userId);
  if (!userToFollow) {
    throw new ApiError(404, "User not found");
  }

  const existingFollow = await Follow.findOne({
    follower: req.user._id,
    following: userId,
  });

  if (existingFollow) {
    // If already following or request already sent, return current status instead of error
    const message =
      existingFollow.status === "accepted"
        ? "You are already following this user"
        : "Follow request already sent";

    const response = new ApiResponse(
      200,
      { status: existingFollow.status },
      message,
    );
    return res.status(response.statusCode).json(response);
  }

  // If user is private, create pending request; otherwise, auto-accept
  const status = "accepted";

  console.log("Creating follow with status:", status);
  console.log("Follower:", req.user._id, "Following:", userId);

  const newFollow = await Follow.create({
    follower: req.user._id,
    following: userId,
    status: status,
  });

  console.log("Created follow:", JSON.stringify(newFollow, null, 2));

  const message = "User followed successfully";

  const response = new ApiResponse(200, { status }, message);
  return res.status(response.statusCode).json(response);
});

export const unfollowUser = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  const existingFollow = await Follow.findOne({
    follower: req.user._id,
    following: userId,
  });

  if (!existingFollow) {
    throw new ApiError(400, "You are not following this user");
  }

  await Follow.findOneAndDelete({
    follower: req.user._id,
    following: userId,
  });

  const response = new ApiResponse(200, null, "User unfollowed successfully");
  return res.status(response.statusCode).json(response);
});

// Accept follow request
export const acceptFollowRequest = AsyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const followRequest = await Follow.findById(requestId);

  if (!followRequest) {
    throw new ApiError(404, "Follow request not found");
  }

  // Verify that the logged-in user is the one being followed
  if (followRequest.following.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to accept this request");
  }

  if (followRequest.status === "accepted") {
    throw new ApiError(400, "Follow request already accepted");
  }

  followRequest.status = "accepted";
  await followRequest.save();

  const response = new ApiResponse(
    200,
    null,
    "Follow request accepted successfully",
  );
  return res.status(response.statusCode).json(response);
});

// Reject/Remove follow request
export const rejectFollowRequest = AsyncHandler(async (req, res) => {
  const { requestId } = req.params;

  const followRequest = await Follow.findById(requestId);

  if (!followRequest) {
    throw new ApiError(404, "Follow request not found");
  }

  // Verify that the logged-in user is the one being followed
  if (followRequest.following.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to reject this request");
  }

  await Follow.findByIdAndDelete(requestId);

  const response = new ApiResponse(
    200,
    null,
    "Follow request rejected successfully",
  );
  return res.status(response.statusCode).json(response);
});

// Cancel follow request (by the requester)
export const cancelFollowRequest = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  console.log("Cancel request - Follower (logged in):", req.user._id);
  console.log("Cancel request - Following (target):", userId);

  // Convert userId to ObjectId for proper comparison
  const followingId = new mongoose.Types.ObjectId(userId);

  // First find any follow
  const anyFollow = await Follow.findOne({
    follower: req.user._id,
    following: followingId,
  });

  console.log("Any follow found:", anyFollow);

  if (anyFollow) {
    console.log("Follow status type:", typeof anyFollow.status);
    console.log("Follow status value:", anyFollow.status);
    console.log("Status === 'pending':", anyFollow.status === "pending");
  }

  if (!anyFollow) {
    throw new ApiError(404, "Follow request not found");
  }

  // Only allow canceling pending requests
  if (anyFollow.status !== "pending") {
    throw new ApiError(400, "Can only cancel pending follow requests");
  }

  await Follow.findByIdAndDelete(anyFollow._id);

  const response = new ApiResponse(
    200,
    null,
    "Follow request cancelled successfully",
  );
  return res.status(response.statusCode).json(response);
});

// Get pending follow requests (requests sent to me)
export const getPendingFollowRequests = AsyncHandler(async (req, res) => {
  console.log("Getting pending requests for user:", req.user._id);

  const pendingRequests = await Follow.find({
    following: req.user._id,
    status: "pending",
  }).populate("follower", "name userName email");

  console.log("Found pending requests:", pendingRequests.length);
  console.log("Requests:", JSON.stringify(pendingRequests, null, 2));

  const response = new ApiResponse(
    200,
    pendingRequests,
    "Pending follow requests fetched successfully",
  );
  return res.status(response.statusCode).json(response);
});

// Get my sent follow requests (pending requests I sent)
export const getMySentFollowRequests = AsyncHandler(async (req, res) => {
  const sentRequests = await Follow.find({
    follower: req.user._id,
    status: "pending",
  }).populate("following", "name userName email");

  const response = new ApiResponse(
    200,
    sentRequests,
    "Sent follow requests fetched successfully",
  );
  return res.status(response.statusCode).json(response);
});

export const getMyPosts = AsyncHandler(async (req, res) => {
  const posts = await Blog.aggregate([
    {
      $match: {
        userId: req.user._id,
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "blogId",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "blogId",
        as: "comments",
      },
    },
    {
      $addFields: {
        likesCount: { $size: "$likes" },
        commentsCount: { $size: "$comments" },
      },
    },
    {
      $project: {
        title: 1,
        slug: 1,
        content: 1,
        featureImage: 1,
        category: 1,
        createdAt: 1,
        likesCount: 1,
        commentsCount: 1,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  const response = new ApiResponse(200, posts, "My posts fetched successfully");
  return res.status(response.statusCode).json(response);
});

// Get likes on my posts (who liked my posts)
export const getLikesOnMyPosts = AsyncHandler(async (req, res) => {
  // First, get all posts by the current user
  const myPosts = await Blog.find({ userId: req.user._id }).select("_id");
  const myPostIds = myPosts.map((post) => post._id);

  // Then get all likes on those posts
  const likes = await Like.aggregate([
    {
      $match: {
        blogId: { $in: myPostIds },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "blogs",
        localField: "blogId",
        foreignField: "_id",
        as: "blog",
      },
    },
    {
      $unwind: "$blog",
    },
    {
      $project: {
        _id: 1,
        createdAt: 1,
        user: {
          _id: "$user._id",
          name: "$user.name",
          userName: "$user.userName",
        },
        blog: {
          _id: "$blog._id",
          title: "$blog.title",
          slug: "$blog.slug",
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  const response = new ApiResponse(
    200,
    likes,
    "Likes on my posts fetched successfully",
  );
  return res.status(response.statusCode).json(response);
});

// Get comments on my posts
export const getCommentsOnMyPosts = AsyncHandler(async (req, res) => {
  // First, get all posts by the current user
  const myPosts = await Blog.find({ userId: req.user._id }).select("_id");
  const myPostIds = myPosts.map((post) => post._id);

  // Then get all comments on those posts
  const comments = await Comment.aggregate([
    {
      $match: {
        blogId: { $in: myPostIds },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $lookup: {
        from: "blogs",
        localField: "blogId",
        foreignField: "_id",
        as: "blog",
      },
    },
    {
      $unwind: "$blog",
    },
    {
      $project: {
        _id: 1,
        content: 1,
        createdAt: 1,
        user: {
          _id: "$user._id",
          name: "$user.name",
          userName: "$user.userName",
        },
        blog: {
          _id: "$blog._id",
          title: "$blog.title",
          slug: "$blog.slug",
        },
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);

  const response = new ApiResponse(
    200,
    comments,
    "Comments on my posts fetched successfully",
  );
  return res.status(response.statusCode).json(response);
});

export const getMyFollowers = AsyncHandler(async (req, res) => {
  const followers = await Follow.aggregate([
    {
      $match: {
        following: req.user._id,
        status: "accepted",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "follower",
        foreignField: "_id",
        as: "followerUser",
      },
    },
    {
      $unwind: "$followerUser",
    },
    {
      $project: {
        _id: "$followerUser._id",
        name: "$followerUser.name",
        userName: "$followerUser.userName",
        followedAt: "$createdAt",
      },
    },
    {
      $sort: { followedAt: -1 },
    },
  ]);

  const response = new ApiResponse(
    200,
    followers,
    "Followers fetched successfully",
  );
  return res.status(response.statusCode).json(response);
});

export const getMyFollowing = AsyncHandler(async (req, res) => {
  const following = await Follow.aggregate([
    {
      $match: {
        follower: req.user._id,
        status: "accepted",
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "following",
        foreignField: "_id",
        as: "followingUser",
      },
    },
    {
      $unwind: "$followingUser",
    },
    {
      $project: {
        _id: "$followingUser._id",
        name: "$followingUser.name",
        userName: "$followingUser.userName",
        followedAt: "$createdAt",
      },
    },
    {
      $sort: { followedAt: -1 },
    },
  ]);

  const response = new ApiResponse(
    200,
    following,
    "Following fetched successfully",
  );
  return res.status(response.statusCode).json(response);
});

export const searchUsers = AsyncHandler(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length === 0) {
    throw new ApiError(400, "Search query is required");
  }

  const users = await User.find({
    $or: [
      { name: { $regex: query, $options: "i" } },
      { userName: { $regex: query, $options: "i" } },
    ],
  })
    .select("_id name userName")
    .limit(20);

  const response = new ApiResponse(200, users, "Users found successfully");
  return res.status(response.statusCode).json(response);
});
