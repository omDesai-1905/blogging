import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    userEmail: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    content: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    visit: {
      type: Number,
      default: 0,
    },
    topicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Topic",
    }
  },
  {
    timestamps: true,
  }
);
export const Blog = mongoose.model("Blog", blogSchema);
