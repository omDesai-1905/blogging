import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Blog",
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

export const Comment = mongoose.model("Comment", commentSchema);
