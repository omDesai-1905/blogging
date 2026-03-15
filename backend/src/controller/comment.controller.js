import { AsyncHandler } from "../utils/asyncHandles.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Blog } from "../model/blog.model.js";
import { Comment } from "../model/comment.model.js";
import mongoose from "mongoose";
export const createComment = AsyncHandler(async (req, res) => {
  const user = req.user;
  const { blogId } = req.params;
  const { content } = req.body;

  if (!user) {
    throw new ApiError(401, "User not authenticated");
  }

  const blogPost = await Blog.findById(blogId);
  if (!blogPost) {
    throw new ApiError(404, "Blog post not found");
  }

  const created = await Comment.create({
    content,
    blogId: blogPost._id,
    userId: user._id,
  });
  if (!created) throw new ApiError(500, "Failed to create comment");

  const comment = await Comment.aggregate([
    { $match: { _id: created._id } },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
        pipeline: [
          { $project: { password: 0, createdAt: 0, updatedAt: 0, __v: 0 } },
        ],
      },
    },
    { $addFields: { author: { $first: "$user" } } },
    { $project: { __v: 0 } },
  ]);

  const response = new ApiResponse(
    201,
    comment[0],
    "Comment created successfully",
  );
  return res.status(response.statusCode).json(response);
});

export const getAllComment = AsyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const comments = await Comment.aggregate([
    {
      $match: {
        blogId: new mongoose.Types.ObjectId(blogId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user",
        pipeline: [
          {
            $project: {
              password: 0,
              createdAt: 0,
              updatedAt: 0,
              __v: 0,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        author: { $first: "$user" },
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        __v: 0,
      },
    },
  ]);
  if (comments.length == 0) {
    const response = new ApiResponse(200, {}, "No Comment found on this post");
    return res.status(response.statusCode).json(response);
  }

  const response = new ApiResponse(200, comments, "Comment found.");
  return res.status(response.statusCode).json(response);
});
