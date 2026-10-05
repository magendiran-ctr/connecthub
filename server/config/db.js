import mongoose from "mongoose";
export const connectDB = () => {
  if (mongoose.connection.readyState === 1)
    return Promise.resolve(mongoose.connection);
  return mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => {
      console.log("MongoDB connected");
      return mongoose.connection;
    });
};
