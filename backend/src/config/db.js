import mongoose from "mongoose";

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    throw new Error("MONGODB_URI is missing from environment variables");
  }

  await mongoose.connect(mongoURI, {
    autoIndex: true,
  });

  console.log("MongoDB connected");
};
