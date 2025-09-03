import { Like } from "../model/like.model.js";
import { AsyncHandler } from "../utils/asyncHandles.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Blog } from "../model/blog.model.js";
export const likeBlogPost = AsyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }
  const AlreadyLike = await Like.findOne({
    userId: req.user._id,
    blogId: blog._id,
  });
  if (AlreadyLike) {
    throw new ApiError(400, "You have already liked this blog post");
  }
  await Like.create({
    userId: req.user._id,
    blogId: blog._id,
  });
  const response = new ApiResponse(200, "Blog post liked successfully");
  return res.status(response.statusCode).json(response);
});

export const unlikedBlogPost = AsyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }
  const AlreadyLike = await Like.findOne({
    userId: req.user._id,
    blogId: blog._id,
  });
  if (!AlreadyLike) {
    throw new ApiError(400, "You have not liked this blog post");
  }
  await Like.findOneAndDelete({
    userId: req.user._id,
    blogId: blog._id,
  });
  const response = new ApiResponse(200, "Blog post unliked successfully");
  return res.status(response.statusCode).json(response);
});
