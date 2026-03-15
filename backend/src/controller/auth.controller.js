import { User } from "../model/user.model.js";
import { AsyncHandler } from "../utils/asyncHandles.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from "../schema/auth.schema.js";
import { deleteImage, uploadOnCouldinary } from "../utils/couldinary.js";
import { UserRole } from "../constants.js";

export const registerUser = AsyncHandler(async (req, res) => {
  try {
    const { name, email, userName, password, gender } = req.body;

    // Validate request body
    await registerSchema.validate({ name, email, userName, password, gender });

    const userExits = await User.findOne({
      $or: [{ email }, { userName }],
    });
    if (userExits) {
      throw new ApiError(400, "user already exists");
    }

    const user = await User.create({
      name,
      email,
      userName,
      password,
      ...(gender && { gender }),
    });

    const createdUser = await User.findById(user._id).select("-password");

    if (!createdUser) {
      throw new ApiError(400, "Failed to create User");
    }

    const accessToken = createdUser.generateAccessToken();

    const response = new ApiResponse(
      201,
      { user: createdUser, accessToken },
      "user Created Successfully",
    );
    return res.status(response.statusCode).json(response);
  } catch (error) {
    if (error.name === "ValidationError") {
      throw new ApiError(400, error.message);
    }
    throw error;
  }
});

export const loginUser = AsyncHandler(async (req, res) => {
  try {
    const { userName, email, emailOrUsername, password } = req.body;
    await loginSchema.validate({ email, userName, emailOrUsername, password });

    // If emailOrUsername is provided, use it for both email and userName search
    const searchEmail = emailOrUsername || email;
    const searchUserName = emailOrUsername || userName;

    // Allow env-based admin login for dedicated admin credentials.
    const adminIdentifier = process.env.ADMIN_LOGIN_IDENTIFIER;
    const adminPassword = process.env.ADMIN_LOGIN_PASSWORD;
    const matchedAdminIdentifier =
      searchEmail === adminIdentifier || searchUserName === adminIdentifier;

    if (adminIdentifier && adminPassword && matchedAdminIdentifier) {
      if (password !== adminPassword) {
        throw new ApiError(400, "Invalid Credentials Password Incorrect");
      }

      const configuredAdminUserName = (
        process.env.ADMIN_USERNAME || "blogsphere_admin"
      ).toLowerCase();

      const loggedInAdmin = {
        _id: "env-admin",
        name: process.env.ADMIN_DISPLAY_NAME || "BlogSphere Admin",
        email: adminIdentifier,
        userName: configuredAdminUserName,
        role: UserRole.ADMIN,
      };

      const accessToken = jwt.sign(
        {
          _id: loggedInAdmin._id,
          email: loggedInAdmin.email,
          userName: loggedInAdmin.userName,
          name: loggedInAdmin.name,
          role: loggedInAdmin.role,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
        },
      );

      const response = new ApiResponse(
        200,
        { user: loggedInAdmin, accessToken },
        "Admin Logged In Successfully",
      );

      return res.status(response.statusCode).json(response);
    }

    const user = await User.findOne({
      $or: [{ email: searchEmail }, { userName: searchUserName }],
    });
    if (!user) {
      throw new ApiError(400, "Invalid Credentials");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(password);

    if (!isPasswordCorrect) {
      throw new ApiError(400, "Invalid Credentials Password Incorrect");
    }

    const accessToken = user.generateAccessToken();

    const loggedInUser = await User.findById(user._id).select("-password");

    const response = new ApiResponse(
      200,
      { user: loggedInUser, accessToken },
      "User Logged In Successfully",
    );
    return res.status(response.statusCode).json(response);
  } catch (error) {
    if (error.name === "ValidationError") {
      throw new ApiError(400, error.message);
    }
    throw error;
  }
});

export const loggedOutUser = AsyncHandler(async (req, res) => {
  const response = new ApiResponse(200, {}, "user loggedout successfully");
  return res.status(response.statusCode).json(response);
});

export const getCurrentUser = AsyncHandler(async (req, res) => {
  const { id } = req.params;

  let user;
  let message;

  if (id) {
    // If ID is provided, get that user's profile (public access)
    user = await User.findById(id).select("-password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    message = "User profile fetched successfully";
  } else {
    // If no ID, get current user's profile (requires authentication)
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }
    user = req.user;
    message = "Current user fetched successfully";
  }

  const response = new ApiResponse(200, user, message);
  return res.status(response.statusCode).json(response);
});

export const changeCurrentPassword = AsyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  // Validate required fields
  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  await changePasswordSchema.validate({ oldPassword, newPassword });

  // User is already verified by JWT middleware
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Invalid old password");
  }

  user.password = newPassword;
  await user.save();
  const response = new ApiResponse(200, {}, "Password changed successfully");
  return res.status(response.statusCode).json(response);
});

export const resetPassword = AsyncHandler(async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;

  if (!newPassword) {
    throw new ApiError(400, "new password is required");
  }

  const user = await User.findOne({ resetToken: token });
  if (!user) {
    throw new ApiError(400, "Invalid or expired reset token");
  }
  if (user.resetTokenExpiry < Date.now()) {
    throw new ApiError(400, "Reset token has expired");
  }

  user.password = newPassword;
  user.resetToken = undefined;
  user.resetTokenExpiry = undefined;
  await user.save();

  const response = new ApiResponse(200, {}, "Password reset successfully");
  return res.status(response.statusCode).json(response);
});

export const changeAvatar = AsyncHandler(async (req, res) => {
  const user = req.user;
  const file = req.file;
  if (!file) {
    throw new ApiError(400, "No file uploaded, please provide an image");
  }

  if (!user.avatar) {
    await deleteImage(user.avatar);
  }

  const imageUrl = await uploadOnCouldinary(file.path);
  if (!imageUrl) {
    throw new ApiError(400, "Image upload failed");
  }

  user.avatar = imageUrl.secure_url;
  await user.save();

  const response = new ApiResponse(
    200,
    { avatar: user.avatar },
    "Avatar changed successfully",
  );
  return res.status(response.statusCode).json(response);
});

export const updateUser = AsyncHandler(async (req, res) => {
  const user = req.user;
  const { name, email, userName, gender } = req.body;

  // if (!name && !email && !userName && !gender) {
  //   throw new ApiError(400, "At least one field is required");
  // }
  await updateUserSchema.validate({ name, email, userName, gender });
  const isEmailTaken = await User.findOne({ email });

  if (isEmailTaken && isEmailTaken._id.toString() !== user._id.toString()) {
    throw new ApiError(400, "Email is already taken");
  }

  if (
    isUserNameTaken &&
    isUserNameTaken._id.toString() !== user._id.toString()
  ) {
    throw new ApiError(400, "Username is already taken");
  }

  user.name = name || user.name;
  user.email = email || user.email;
  user.userName = userName || user.userName;
  user.gender = gender || user.gender;

  await user.save();

  const response = new ApiResponse(200, user, "User updated successfully");
  return res.status(response.statusCode).json(response);
});
