import { Blog } from "../model/blog.model.js";
import { Comment } from "../model/comment.model.js";
import { Like } from "../model/like.model.js";
import { createBlogAndPostSchema } from "../schema/blog.schema.js";
import { AsyncHandler } from "../utils/asyncHandles.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import mongoose from "mongoose";
import { uploadOnCouldinary, deleteImage } from "../utils/couldinary.js";
import { UserRole } from "../constants.js";

export const createBlogPost = AsyncHandler(async (req, res) => {
  const user = req.user;
  const { title, content, slug, category } = req.body;

  // Validate required fields
  if (!title || !content || !slug || !category) {
    throw new ApiError(400, "Title, content, slug, and category are required");
  }

  // Check if image file is uploaded
  if (!req.file) {
    throw new ApiError(400, "Image file is required");
  }

  await createBlogAndPostSchema.validate({ title, content, slug });
  const existingBlog = await Blog.findOne({ slug });
  if (existingBlog) {
    throw new ApiError(400, "Blog post with this slug already exists");
  }

  // Upload to Cloudinary (will auto-remove local file on success)
  let imageUrl = "";
  if (!req.file) {
    throw new ApiError(400, "Image file is required");
  }

  console.log("Image saved locally at:", req.file.path);

  // Upload to Cloudinary using your existing utility
  const cloudinaryResponse = await uploadOnCouldinary(req.file.path);
  console.log("Raw Cloudinary response:", cloudinaryResponse);

  if (cloudinaryResponse && cloudinaryResponse.secure_url) {
    imageUrl = cloudinaryResponse.secure_url;
    console.log(
      "Image uploaded to Cloudinary and local file removed:",
      imageUrl,
    );
  } else {
    // If Cloudinary fails, use local file URL
    imageUrl = `/images/${req.file.filename}`;
    console.log("Cloudinary upload failed. Response was:", cloudinaryResponse);
    console.log("Cloudinary upload failed, using local file:", imageUrl);
  }

  const blog = await Blog.create({
    userId: user._id,
    userEmail: user.email,
    title,
    content,
    slug,
    category,
    image: imageUrl,
  });
  if (!blog) {
    throw new ApiError(500, "Failed to create blog post");
  }
  const response = new ApiResponse(201, blog, "blog created successfully");
  return res.status(response.statusCode).json(response);
});

export const deleteBlogPost = AsyncHandler(async (req, res) => {
  const { blogId } = req.params;
  let blog;
  try {
    blog = await Blog.findById(blogId);
  } catch (e) {
    throw new ApiError(400, "Invalid blog ID");
  }
  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }
  const isOwner = blog.userId.toString() === req.user._id.toString();
  const isAdmin = req.user.role === UserRole.ADMIN;

  if (!isOwner && !isAdmin) {
    throw new ApiError(403, "You are not authorized to delete this blog post");
  }

  await deleteImage(blog.image);

  await Blog.findByIdAndDelete(blog._id);
  await Comment.deleteMany({ blogId: blog._id });
  await Like.deleteMany({ blogId: blog._id });
  const response = new ApiResponse(200, "blog deleted successfully");
  return res.status(response.statusCode).json(response);
});

export const updateBlogPost = AsyncHandler(async (req, res) => {
  const { blogId } = req.params;
  const { title, content, slug, category } = req.body;
  let blog;
  try {
    blog = await Blog.findById(blogId);
  } catch (e) {
    throw new ApiError(400, "Invalid blog ID");
  }
  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }
  if (blog.userId.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this blog post");
  }

  // Handle image upload if new image is provided
  if (req.file) {
    // Delete old image from Cloudinary
    await deleteImage(blog.image);

    // Upload new image to Cloudinary
    const cloudinaryResponse = await uploadOnCouldinary(req.file.path);
    if (cloudinaryResponse && cloudinaryResponse.secure_url) {
      blog.image = cloudinaryResponse.secure_url;
    } else {
      // Fallback to local file URL if Cloudinary fails
      blog.image = `/images/${req.file.filename}`;
    }
  }

  if (slug && slug !== blog.slug) {
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      throw new ApiError(400, "Blog post with this slug already exists");
    }
    blog.slug = slug;
  }
  if (title) blog.title = title;
  if (content) blog.content = content;
  if (category) blog.category = category;
  await blog.save();

  const response = new ApiResponse(200, blog, "blog updated successfully");
  return res.status(response.statusCode).json(response);
});

export const getAllBlogPosts = AsyncHandler(async (req, res) => {
  const currentUserId = req.user?._id;

  const blog = await Blog.aggregate([
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
              avatar: 1,
            },
          },
        ],
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
        user: {
          $first: "$author",
        },
        likesCount: {
          $size: "$likes",
        },
        commentsCount: {
          $size: "$comments",
        },
        isLiked: {
          $cond: {
            if: { $eq: [currentUserId, null] },
            then: false,
            else: {
              $in: [
                currentUserId,
                {
                  $map: {
                    input: "$likes",
                    as: "like",
                    in: "$$like.userId",
                  },
                },
              ],
            },
          },
        },
      },
    },
    {
      $project: {
        userId: 0,
        __v: 0,
        likes: 0,
        comments: 0,
        author: 0,
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
  ]);
  const response = new ApiResponse(200, blog, "blogs fetched successfully");
  return res.status(response.statusCode).json(response);
});

export const getBlogPost = AsyncHandler(async (req, res) => {
  const { blogId } = req.params;
  let objectId;
  try {
    objectId = new mongoose.Types.ObjectId(blogId);
  } catch (e) {
    throw new ApiError(400, "Invalid blog ID");
  }

  const blog = await Blog.aggregate([
    {
      $match: {
        _id: objectId,
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
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        user: {
          $first: "$author",
        },
      },
    },
    {
      $project: {
        userId: 0,
        __v: 0,
        author: 0,
      },
    },
  ]);

  if (blog.length == 0) {
    throw new ApiError(404, "Blog post not found");
  }

  await Blog.updateOne({ _id: blog[0]._id }, { visits: blog[0].visits + 1 });

  let isLiked = false;
  if (req.user) {
    const like = await Like.findOne({
      userId: req.user._id,
      blogId: blog[0]._id,
    });

    if (like) {
      isLiked = true;
    }
  }

  const likes = await Like.find({ blogId: blog[0]._id });

  const comments = await Comment.find({ blogId: blog[0]._id });

  const response = new ApiResponse(
    200,
    {
      ...blog[0],
      isLiked,
      likesCount: likes.length,
      commentsCount: comments.length,
    },
    "Blog post retrieved successfully",
  );

  return res.status(response.statusCode).json(response);
});

export const shareBlog = AsyncHandler(async (req, res) => {
  const { blogId } = req.params;

  const blog = await Blog.findById(blogId);
  if (!blog) {
    throw new ApiError(404, "Blog post not found");
  }

  // Generate a shareable link
  const shareUrl = `${req.protocol}://${req.get("host")}/blog/${blogId}`;

  const response = new ApiResponse(
    200,
    {
      shareUrl,
      title: blog.title,
      slug: blog.slug,
    },
    "Share link generated successfully",
  );

  return res.status(response.statusCode).json(response);
});
