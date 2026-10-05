import mongoose from "mongoose";
const { Schema, model } = mongoose;
const user = new Schema(
  {
    name: { type: String, required: true, trim: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    password: { type: String, required: true, select: false },
    profileImage: { type: String, default: "" },
    coverImage: { type: String, default: "" },
    bio: { type: String, default: "" },
    location: { type: String, default: "" },
    skills: [String],
    category: {
      type: String,
      enum: [
        "creator",
        "news",
        "entertainment",
        "sports",
        "technology",
        "business",
        "fashion",
        "travel",
        "music",
        "fitness",
        "comedy",
        "lifestyle",
        "aesthetics",
        "food",
        "gaming",
        "art",
        "beauty",
        "education",
      ],
      default: "creator",
      index: true,
    },
    isVerified: { type: Boolean, default: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
  },
  { timestamps: true },
);
const post = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    seedKey: { type: String },
    content: { type: String, maxlength: 2000, default: "" },
    imageUrl: String,
    mediaType: { type: String, enum: ["post", "reel"], default: "post" },
    hashtags: [String],
    location: String,
    privacy: {
      type: String,
      enum: ["public", "followers", "private"],
      default: "public",
    },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    viewsCount: { type: Number, default: 0 },
    embedding: [Number],
  },
  { timestamps: true },
);
post.index({ userId: 1, createdAt: -1 });
post.index({ seedKey: 1 }, { unique: true, sparse: true });
post.index({ userId: 1, likesCount: -1, createdAt: -1 });
post.index({ userId: 1, viewsCount: -1, createdAt: -1 });
post.index({ createdAt: -1 });
post.index({ content: "text", hashtags: "text" });
const comment = new Schema(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, maxlength: 1000 },
  },
  { timestamps: true },
);
comment.index({ postId: 1, createdAt: -1 });
comment.index({ userId: 1 });
const like = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true },
);
like.index(
  { userId: 1, postId: 1 },
  { unique: true, name: "unique_user_post_like" },
);
like.index({ postId: 1 });
const follow = new Schema(
  {
    followerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    followingId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);
follow.index(
  { followerId: 1, followingId: 1 },
  { unique: true, name: "unique_follower_following" },
);
follow.index({ followingId: 1 });
const notification = new Schema(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    type: {
      type: String,
      enum: ["like", "comment", "follow", "mention", "message"],
      required: true,
    },
    postId: { type: Schema.Types.ObjectId, ref: "Post" },
    message: String,
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);
notification.index({ recipientId: 1, createdAt: -1 });
notification.index({ recipientId: 1, isRead: 1, createdAt: -1 });
const message = new Schema(
  {
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, maxlength: 3000 },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
);
message.index({ senderId: 1, receiverId: 1, createdAt: -1 });
message.index({ receiverId: 1, senderId: 1, createdAt: -1 });
const saved = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
  },
  { timestamps: true },
);
saved.index(
  { userId: 1, postId: 1 },
  { unique: true, name: "unique_user_saved_post" },
);
saved.index({ userId: 1, createdAt: -1 });
export const User = model("User", user);
export const Post = model("Post", post);
export const Comment = model("Comment", comment);
export const Like = model("Like", like);
export const Follow = model("Follow", follow);
export const Notification = model("Notification", notification);
export const Message = model("Message", message);
export const SavedPost = model("SavedPost", saved);
