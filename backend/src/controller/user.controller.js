import { AsyncHandler } from "../utils/asyncHandles.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { Blog } from "../model/blog.model.js";
import { User } from "../model/user.model.js";
import {Follow} from "../model/follow.model.js"

export const getUserProfile = AsyncHandler(async (req, res) => {
    const userName = req.params.userName;

    const user = await User.findOne({ userName }).select("-password");
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    const followers = await Follow.find({ following: user._id });
    const following = await Follow.find({ follower: user._id });

    let isFollowing = false;

    if(req.user) {
        const isFollow = await Follow.findOne({ 
            follower: req.user._id,
            following: user._id
        });
        if(isFollow) {
            isFollowing = true;
        }
    }
    const posts = await Blog.find({ userId: user._id });

    const data = {
        followers: followers.length,
        following: following.length,
        isFollowing,
        posts: posts.length
    }

    const response = new ApiResponse(200, data, "User profile fetched successfully");
    return res.status(response.statusCode).json(response);
})

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
              avatar: 1,
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
    ])
    const user = await User.findOne({ userName }).select("-password");
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const posts = await Blog.find({ userId: user._id });

    const data = {
        posts: posts.length
    }

    const response = new ApiResponse(200, {AllPosts,data}, "User posts fetched successfully");
    return res.status(response.statusCode).json(response);
})