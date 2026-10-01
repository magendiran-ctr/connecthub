# ConnectHub

A full-stack social network built with React, Vite, Express, MongoDB and JWT.

## Run

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and `JWT_SECRET`.
2. `npm install && npm install --prefix server && npm install --prefix client`
3. `npm run seed` (optional sample content)
4. `npm run dev`

Client: http://localhost:5173. API: http://localhost:5000.

## MongoDB testing snippets

```js
// CRUD / text search / pagination
db.posts.find({ $text: { $search: "design" } }).sort({ createdAt: -1 }).skip(0).limit(10)
db.posts.updateOne({ _id: ObjectId("...") }, { $addToSet: { hashtags: "mongodb" } })
db.posts.deleteOne({ _id: ObjectId("...") })

// Inspect index usage
db.posts.find({ userId: ObjectId("...") }).sort({ createdAt: -1 }).explain("executionStats")

// Feed-style aggregation ($match/$lookup/$unwind/$group/$sort/$skip/$limit)
db.posts.aggregate([
 { $match: { userId: { $in: [ObjectId("...")] } } },
 { $lookup: { from: "users", localField: "userId", foreignField: "_id", as: "author" } },
 { $unwind: "$author" }, { $sort: { createdAt: -1 } }, { $skip: 0 }, { $limit: 20 },
 { $group: { _id: "$userId", posts: { $push: "$$ROOT" } } }
])

// Transaction pattern (requires replica set)
const s = db.getMongo().startSession(); s.startTransaction();
try { s.getDatabase("connecthub").follows.insertOne({ followerId: ObjectId("..."), followingId: ObjectId("...") }, { session:s }); s.commitTransaction(); } catch(e) { s.abortTransaction(); } finally { s.endSession(); }
```

Vector search preparation: `Post.embedding` is reserved for Atlas Vector Search embeddings; create an Atlas vector index after populating it from your embedding provider.
