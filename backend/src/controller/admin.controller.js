import { AsyncHandler } from "../utils/asyncHandles.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Blog } from "../model/blog.model.js";
import { User } from "../model/user.model.js";
import { Like } from "../model/like.model.js";
import { Comment } from "../model/comment.model.js";

export const getAdminDashboard = AsyncHandler(async (req, res) => {
  const [totalUsers, totalBlogs, totalLikes, totalComments] = await Promise.all(
    [
      User.countDocuments(),
      Blog.countDocuments(),
      Like.countDocuments(),
      Comment.countDocuments(),
    ],
  );

  const blogStatsByUser = await Blog.aggregate([
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
      $group: {
        _id: "$userId",
        totalBlogs: { $sum: 1 },
        totalLikes: { $sum: "$likesCount" },
        totalComments: { $sum: "$commentsCount" },
        blogs: {
          $push: {
            _id: "$_id",
            title: "$title",
            slug: "$slug",
            category: "$category",
            content: "$content",
            image: "$image",
            createdAt: "$createdAt",
            likesCount: "$likesCount",
            commentsCount: "$commentsCount",
          },
        },
      },
    },
  ]);

  const statsMap = new Map(
    blogStatsByUser.map((item) => [String(item._id), item]),
  );

  const users = await User.find({})
    .select("name userName email avatar role")
    .lean();

  const userActivity = users
    .map((user) => {
      const stat = statsMap.get(String(user._id));
      return {
        _id: user._id,
        name: user.name,
        userName: user.userName,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        totalBlogs: stat?.totalBlogs || 0,
        totalLikes: stat?.totalLikes || 0,
        totalComments: stat?.totalComments || 0,
        blogs: stat?.blogs || [],
      };
    })
    .sort((a, b) => b.totalBlogs - a.totalBlogs);

  const response = new ApiResponse(
    200,
    {
      summary: {
        totalUsers,
        totalBlogs,
        totalLikes,
        totalComments,
      },
      users: userActivity,
    },
    "Admin dashboard fetched successfully",
  );

  return res.status(response.statusCode).json(response);
});

export const getAdminUserDetails = AsyncHandler(async (req, res) => {
  const { userId } = req.params;

  const [totalUsers, totalBlogs, totalLikes, totalComments] = await Promise.all(
    [
      User.countDocuments(),
      Blog.countDocuments(),
      Like.countDocuments(),
      Comment.countDocuments(),
    ],
  );

  const user = await User.findById(userId)
    .select("name userName email avatar role")
    .lean();

  if (!user) {
    return res.status(404).json(new ApiResponse(404, {}, "User not found"));
  }

  const blogs = await Blog.aggregate([
    {
      $match: {
        userId: user._id,
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
        category: 1,
        content: 1,
        image: 1,
        createdAt: 1,
        likesCount: 1,
        commentsCount: 1,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);

  const response = new ApiResponse(
    200,
    {
      summary: {
        totalUsers,
        totalBlogs,
        totalLikes,
        totalComments,
      },
      user: {
        ...user,
        blogs,
      },
    },
    "Admin user details fetched successfully",
  );

  return res.status(response.statusCode).json(response);
});
