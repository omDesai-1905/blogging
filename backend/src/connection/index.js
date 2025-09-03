import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
  try {
    // Remove any trailing slash from MONGODB_URI
    const mongoUri = process.env.MONGODB_URI.replace(/\/$/, "");
    const connectionInstance = await mongoose.connect(`${mongoUri}/${DB_NAME}`);
    console.log(
      `\n MongoDB connected!! DB HOST: ${connectionInstance.connection.host}\n`
    );
  } catch (error) {
    console.log("mongoDB connect error:", error);
    process.exit(1);
  }
};

export default connectDB;
