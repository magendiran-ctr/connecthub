import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { protect, admin } from "../middleware/auth.js";
import {
  User,
  Post,
  Comment,
  Like,
  Follow,
  Notification,
  Message,
  SavedPost,
} from "../models/index.js";
const r = Router(),
  token = (u) =>
    jwt.sign({ id: u._id }, process.env.JWT_SECRET, { expiresIn: "7d" }),
  safe = (u) => ({
    id: u._id,
    name: u.name,
    username: u.username,
    email: u.email,
    profileImage: u.profileImage,
    coverImage: u.coverImage,
    bio: u.bio,
    location: u.location,
    skills: u.skills,
    category: u.category,
    isVerified: u.isVerified,
    role: u.role,
  });
const notify = async (recipientId, senderId, type, message, postId) => {
  if (String(recipientId) !== String(senderId))
    await Notification.create({ recipientId, senderId, type, message, postId });
};
r.post("/auth/register", async (req, res, next) => {
  try {
    const name = String(req.body?.name || "").trim(),
      username = String(req.body?.username || "")
        .trim()
        .toLowerCase(),
      email = String(req.body?.email || "")
        .trim()
        .toLowerCase(),
      password = String(req.body?.password || ""),
      profileImage = String(req.body?.profileImage || "").trim();
    if (!name || !username || !email || !password)
      return res
        .status(400)
        .json({ message: "Name, username, email and password are required" });
    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json({ message: "Enter a valid email address" });
    if (!/^[a-z0-9_]{3,30}$/.test(username))
      return res.status(400).json({
        message:
          "Username must be 3–30 characters and use only letters, numbers, or underscores",
      });
    if (password.length < 8)
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    if (await User.exists({ $or: [{ email }, { username }] }))
      return res
        .status(409)
        .json({ message: "Email or username already exists" });
    const u = await User.create({
      name,
      username,
      email,
      password: await bcrypt.hash(password, 12),
      ...(profileImage && { profileImage }),
    });
    res.status(201).json({ token: token(u), user: safe(u) });
  } catch (e) {
    if (e.code === 11000)
      return res
        .status(409)
        .json({ message: "Email or username already exists" });
    next(e);
  }
});
r.post("/auth/login", async (req, res, next) => {
  try {
    const identifier = String(req.body?.email || req.body?.username || "")
        .trim()
        .toLowerCase(),
      password = String(req.body?.password || "");
    if (!identifier || !password)
      return res
        .status(400)
        .json({ message: "Enter your email or username and password" });
    const u = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+password");
    if (!u || !(await bcrypt.compare(password, u.password)))
      return res
        .status(401)
        .json({ message: "Incorrect email, username, or password" });
    res.json({ token: token(u), user: safe(u) });
  } catch (e) {
    next(e);
  }
});
r.get("/auth/me", protect, (req, res) => res.json(safe(req.user)));
r.get("/users/search", protect, async (req, res, next) => {
  try {
    const q = req.query.q || "";
    res.json(
      await User.find({
        $or: [
          { username: { $regex: q, $options: "i" } },
          { name: { $regex: q, $options: "i" } },
        ],
      })
        .select("-password")
        .limit(20),
    );
  } catch (e) {
    next(e);
  }
});
r.get("/channels", protect, async (req, res, next) => {
  try {
    const channels = await User.aggregate([
      { $match: { category: { $ne: "creator" } } },
      {
        $lookup: {
          from: "follows",
          localField: "_id",
          foreignField: "followingId",
          as: "followers",
        },
      },
      { $addFields: { followersCount: { $size: "$followers" } } },
      { $project: { password: 0, email: 0, followers: 0 } },
      { $sort: { isVerified: -1, followersCount: -1 } },
      { $limit: 16 },
    ]);
    res.json(channels);
  } catch (e) {
    next(e);
  }
});
r.get("/users/:id", protect, async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id).select("-password");
    if (!u) return res.status(404).json({ message: "User not found" });
    const [followers, following, posts, isFollowing] = await Promise.all([
      Follow.countDocuments({ followingId: u._id }),
      Follow.countDocuments({ followerId: u._id }),
      Post.countDocuments({ userId: u._id }),
      Follow.exists({ followerId: req.user._id, followingId: u._id }),
    ]);
    res.json({
      ...safe(u),
      followersCount: followers,
      followingCount: following,
      postsCount: posts,
      isFollowing: !!isFollowing,
    });
  } catch (e) {
    next(e);
  }
});
r.put("/users/:id", protect, async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res.status(403).json({ message: "Cannot edit this profile" });
    const u = await User.findByIdAndUpdate(
      req.params.id,
      {
        $set: (({ name, bio, location, profileImage, skills }) => ({
          name,
          bio,
          location,
          profileImage,
          skills,
        }))(req.body),
      },
      { new: true, runValidators: true },
    );
    res.json(safe(u));
  } catch (e) {
    next(e);
  }
});
r.delete("/users/:id", protect, async (req, res, next) => {
  try {
    if (String(req.user._id) !== req.params.id)
      return res.status(403).json({ message: "Cannot delete this account" });
    const postIds = await Post.find({ userId: req.user._id }).distinct("_id");
    await Promise.all([
      Like.deleteMany({
        $or: [{ userId: req.user._id }, { postId: { $in: postIds } }],
      }),
      Comment.deleteMany({
        $or: [{ userId: req.user._id }, { postId: { $in: postIds } }],
      }),
      SavedPost.deleteMany({
        $or: [{ userId: req.user._id }, { postId: { $in: postIds } }],
      }),
      Follow.deleteMany({
        $or: [{ followerId: req.user._id }, { followingId: req.user._id }],
      }),
      Notification.deleteMany({
        $or: [{ recipientId: req.user._id }, { senderId: req.user._id }],
      }),
      Message.deleteMany({
        $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
      }),
      Post.deleteMany({ userId: req.user._id }),
      User.deleteOne({ _id: req.user._id }),
    ]);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
r.post("/users/:id/follow", protect, async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    if (req.params.id === String(req.user._id))
      return res.status(400).json({ message: "Cannot follow yourself" });

    let createdFollow;
    await session.withTransaction(async () => {
      const exists = await Follow.findOne(
        {
          followerId: req.user._id,
          followingId: req.params.id,
        },
        null,
        { session },
      );

      if (exists) {
        const error = new Error("Already following");
        error.code = 11000;
        throw error;
      }

      const [followDoc] = await Follow.create(
        [
          {
            followerId: req.user._id,
            followingId: req.params.id,
          },
        ],
        { session },
      );

      await Notification.create(
        [
          {
            recipientId: req.params.id,
            senderId: req.user._id,
            type: "follow",
            message: `${req.user.name} started following you`,
          },
        ],
        { session },
      );

      createdFollow = followDoc;
    });

    res.status(201).json(createdFollow);
  } catch (e) {
    if (e.code === 11000 || e.message === "Already following") {
      return res.status(409).json({ message: "Already following" });
    }
    next(e);
  } finally {
    await session.endSession();
  }
});
r.delete("/users/:id/follow", protect, async (req, res, next) => {
  await Follow.deleteOne({
    followerId: req.user._id,
    followingId: req.params.id,
  });
  res.status(204).end();
});
r.get(
  "/users/:id/:kind(followers|following)",
  protect,
  async (req, res, next) => {
    try {
      const queryField =
          req.params.kind === "followers" ? "followingId" : "followerId",
        resultField =
          req.params.kind === "followers" ? "followerId" : "followingId",
        ids = await Follow.find({ [queryField]: req.params.id }).distinct(
          resultField,
        );
      res.json(await User.find({ _id: { $in: ids } }).select("-password"));
    } catch (e) {
      next(e);
    }
  },
);
const enrich = [
  {
    $lookup: {
      from: "users",
      localField: "userId",
      foreignField: "_id",
      as: "author",
    },
  },
  { $unwind: "$author" },
  { $project: { "author.password": 0, "author.email": 0 } },
];
r.post("/posts", protect, async (req, res, next) => {
  try {
    const {
      content = "",
      imageUrl,
      hashtags = [],
      location,
      privacy,
    } = req.body;
    if (!content && !imageUrl)
      return res.status(400).json({ message: "Add text or an image" });
    res.status(201).json(
      await Post.create({
        userId: req.user._id,
        content,
        imageUrl,
        hashtags: hashtags.map((x) => x.replace("#", "").toLowerCase()),
        location,
        privacy,
      }),
    );
  } catch (e) {
    next(e);
  }
});
r.get("/posts/feed", protect, async (req, res, next) => {
  try {
    const page = Math.max(+req.query.page || 1, 1),
      limit = Math.min(Math.max(+req.query.limit || 10, 1), 30),
      requestedSort = String(req.query.sort || "latest"),
      sortOptions = {
        latest: { createdAt: -1, _id: -1 },
        popular: { likesCount: -1, createdAt: -1, _id: -1 },
        mostViewed: { viewsCount: -1, createdAt: -1, _id: -1 },
      },
      sort = sortOptions[requestedSort] || sortOptions.latest,
      followed = await Follow.find({ followerId: req.user._id }).distinct(
        "followingId",
      ),
      ids = [...followed, req.user._id];
    const match = {
      $match: { userId: { $in: ids }, privacy: { $ne: "private" } },
    };
    const [posts, total] = await Promise.all([
      Post.aggregate([
        match,
        ...enrich,
        { $sort: sort },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      ]),
      Post.countDocuments({
        userId: { $in: ids },
        privacy: { $ne: "private" },
      }),
    ]);
    res.json({
      posts,
      page,
      limit,
      sort: sortOptions[requestedSort] ? requestedSort : "latest",
      pages: Math.ceil(total / limit),
      total,
      hasMore: page * limit < total,
    });
  } catch (e) {
    next(e);
  }
});
r.get("/posts/explore", protect, async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(+req.query.limit || 30, 1), 60);
    res.json(
      await Post.aggregate([
        { $match: { privacy: "public", imageUrl: { $ne: "" } } },
        ...enrich,
        { $sort: { likesCount: -1, viewsCount: -1, createdAt: -1 } },
        { $limit: limit },
      ]),
    );
  } catch (e) {
    next(e);
  }
});
r.get("/users/:id/posts", protect, async (req, res, next) => {
  try {
    res.json(
      await Post.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(req.params.id),
            privacy: { $ne: "private" },
          },
        },
        ...enrich,
        { $sort: { createdAt: -1 } },
      ]),
    );
  } catch (e) {
    next(e);
  }
});
r.get("/posts/:id", protect, async (req, res, next) => {
  try {
    const x = await Post.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
      ...enrich,
    ]);
    if (!x[0]) return res.status(404).json({ message: "Post not found" });
    res.json(x[0]);
  } catch (e) {
    next(e);
  }
});
r.put("/posts/:id", protect, async (req, res, next) => {
  try {
    const p = await Post.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Post not found" });
    if (String(p.userId) !== String(req.user._id))
      return res.status(403).json({ message: "Not post owner" });
    const {
      content = "",
      imageUrl = "",
      hashtags = [],
      location = "",
      privacy = "public",
    } = req.body;
    if (!content && !imageUrl)
      return res.status(400).json({ message: "Add text or an image" });
    Object.assign(p, {
      content: String(content).trim(),
      imageUrl: String(imageUrl).trim(),
      hashtags: Array.isArray(hashtags)
        ? hashtags.map((x) => String(x).replace("#", "").toLowerCase())
        : [],
      location: String(location).trim(),
      privacy,
    });
    await p.save();
    res.json(p);
  } catch (e) {
    next(e);
  }
});
r.delete("/posts/:id", protect, async (req, res, next) => {
  try {
    const p = await Post.findById(req.params.id);
    if (!p) return res.status(404).json({ message: "Post not found" });
    if (String(p.userId) !== String(req.user._id))
      return res.status(403).json({ message: "Not post owner" });
    await Promise.all([
      p.deleteOne(),
      Like.deleteMany({ postId: p._id }),
      Comment.deleteMany({ postId: p._id }),
      SavedPost.deleteMany({ postId: p._id }),
    ]);
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});
r.post("/posts/:id/like", protect, async (req, res, next) => {
  try {
    const l = await Like.create({
        userId: req.user._id,
        postId: req.params.id,
      }),
      p = await Post.findByIdAndUpdate(
        req.params.id,
        { $inc: { likesCount: 1 } },
        { new: true },
      );
    await notify(
      p.userId,
      req.user._id,
      "like",
      `${req.user.name} liked your post`,
      p._id,
    );
    res.status(201).json(l);
  } catch (e) {
    e.code === 11000
      ? res.status(409).json({ message: "Already liked" })
      : next(e);
  }
});
r.delete("/posts/:id/like", protect, async (req, res) => {
  const x = await Like.deleteOne({
    userId: req.user._id,
    postId: req.params.id,
  });
  if (x.deletedCount)
    await Post.findByIdAndUpdate(req.params.id, { $inc: { likesCount: -1 } });
  res.status(204).end();
});
r.post("/posts/:id/comments", protect, async (req, res, next) => {
  try {
    const c = await Comment.create({
      postId: req.params.id,
      userId: req.user._id,
      text: req.body.text,
    });
    const p = await Post.findByIdAndUpdate(
      req.params.id,
      { $inc: { commentsCount: 1 } },
      { new: true },
    );
    await notify(
      p.userId,
      req.user._id,
      "comment",
      `${req.user.name} commented on your post`,
      p._id,
    );
    res
      .status(201)
      .json(await c.populate("userId", "name username profileImage"));
  } catch (e) {
    next(e);
  }
});
r.get("/posts/:id/comments", protect, async (req, res) =>
  res.json(
    await Comment.find({ postId: req.params.id })
      .populate("userId", "name username profileImage")
      .sort({ createdAt: -1 }),
  ),
);
r.put("/comments/:id", protect, async (req, res, next) => {
  try {
    const c = await Comment.findById(req.params.id);
    if (!c) return res.status(404).json({ message: "Comment not found" });
    if (String(c.userId) !== String(req.user._id))
      return res.status(403).json({ message: "Not comment owner" });
    const text = String(req.body.text || "").trim();
    if (!text)
      return res.status(400).json({ message: "Comment text is required" });
    c.text = text;
    await c.save();
    res.json(await c.populate("userId", "name username profileImage"));
  } catch (e) {
    next(e);
  }
});
r.delete("/comments/:id", protect, async (req, res) => {
  const c = await Comment.findById(req.params.id);
  if (!c) return res.status(404).end();
  if (String(c.userId) !== String(req.user._id)) return res.status(403).end();
  await c.deleteOne();
  await Post.findByIdAndUpdate(c.postId, { $inc: { commentsCount: -1 } });
  res.status(204).end();
});
// saved posts, notifications and direct messages
r.post("/posts/:id/save", protect, async (req, res, next) => {
  try {
    res
      .status(201)
      .json(
        await SavedPost.create({ userId: req.user._id, postId: req.params.id }),
      );
  } catch (e) {
    e.code === 11000
      ? res.status(409).json({ message: "Already saved" })
      : next(e);
  }
});
r.delete("/posts/:id/save", protect, async (req, res) => {
  await SavedPost.deleteOne({ userId: req.user._id, postId: req.params.id });
  res.status(204).end();
});
r.get("/saved-posts", protect, async (req, res, next) => {
  try {
    const ids = await SavedPost.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .distinct("postId");
    res.json(
      await Post.aggregate([
        { $match: { _id: { $in: ids } } },
        ...enrich,
        { $sort: { createdAt: -1 } },
      ]),
    );
  } catch (e) {
    next(e);
  }
});
r.get("/notifications", protect, async (req, res) =>
  res.json(
    await Notification.find({ recipientId: req.user._id })
      .populate("senderId", "name username profileImage")
      .sort({ createdAt: -1 })
      .limit(50),
  ),
);
r.put("/notifications/:id/read", protect, async (req, res) =>
  res.json(
    await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user._id },
      { isRead: true },
      { new: true },
    ),
  ),
);
r.get("/messages/:userId", protect, async (req, res) =>
  res.json(
    await Message.find({
      $or: [
        { senderId: req.user._id, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.user._id },
      ],
    }).sort({ createdAt: 1 }),
  ),
);
r.post("/messages", protect, async (req, res, next) => {
  try {
    const m = await Message.create({
      senderId: req.user._id,
      receiverId: req.body.receiverId,
      message: req.body.message,
    });
    await notify(
      req.body.receiverId,
      req.user._id,
      "message",
      `${req.user.name} sent you a message`,
    );
    res.status(201).json(m);
  } catch (e) {
    next(e);
  }
});
// All calculations remain inside MongoDB aggregation pipelines.
r.get("/admin/analytics", protect, admin, async (req, res, next) => {
  try {
    const [users, posts, comments, likes, active, liked, daily, followers] =
      await Promise.all([
        User.countDocuments(),
        Post.countDocuments(),
        Comment.countDocuments(),
        Like.countDocuments(),
        Post.aggregate([
          { $group: { _id: "$userId", posts: { $sum: 1 } } },
          { $sort: { posts: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "users",
              localField: "_id",
              foreignField: "_id",
              as: "user",
            },
          },
          { $unwind: "$user" },
        ]),
        Post.aggregate([
          { $sort: { likesCount: -1 } },
          { $limit: 5 },
          ...enrich,
        ]),
        Post.aggregate([
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
        ]),
        Follow.aggregate([
          { $group: { _id: "$followingId", followers: { $sum: 1 } } },
          {
            $group: {
              _id: null,
              average: { $avg: "$followers" },
              max: { $max: "$followers" },
            },
          },
        ]),
      ]);
    res.json({
      totals: { users, posts, comments, likes },
      averageLikes: posts ? likes / posts : 0,
      mostActive: active,
      mostLiked: liked,
      postsPerDay: daily,
      followerStats: followers[0] || { average: 0, max: 0 },
    });
  } catch (e) {
    next(e);
  }
});
export default r;
