import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

export const uploadOnCouldinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("No file path provided to Cloudinary upload");
      return null;
    }

    console.log("Cloudinary config check:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? "✓ Set" : "✗ Missing",
      api_key: process.env.CLOUDINARY_API_KEY ? "✓ Set" : "✗ Missing",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "✓ Set" : "✗ Missing",
    });

    console.log("Attempting Cloudinary upload for file:", localFilePath);

    // Re-configure before upload to ensure credentials are available
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    //upload the file on coludinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    console.log("Cloudinary upload successful:", response.secure_url);
    //file has been uploaded successfully
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("Cloudinary upload error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return null;
  }
};

export const deleteImage = async (publicId) => {
  try {
    if (!publicId) return null;
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    return null;
  }
};
