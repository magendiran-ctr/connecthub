import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import api from "../services/api";
import { toast } from "sonner";
import {
  Avatar,
  EmptyState,
  LoadingSkeleton,
  PostCard,
} from "../components/UI";
import { useAuth } from "../context/AuthContext";
export function CreatePost() {
  const nav = useNavigate(),
    [f, setF] = useState({
      content: "",
      imageUrl: "",
      mediaType: "post",
      hashtags: "",
      location: "",
      privacy: "public",
    }),
    [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api.post("/posts", {
        ...f,
        hashtags: f.hashtags.split(/\s|,/).filter(Boolean),
      });
      toast.success("Post published");
      nav(`/posts/${r.data._id}`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not publish");
    } finally {
      setBusy(false);
    }
  };
  return (
    <form onSubmit={submit} className="card p-5">
      <h1 className="text-xl font-bold">Create post</h1>
      <p className="mb-5 text-sm text-slate-500">
        Share something meaningful with your network.
      </p>
      <textarea
        required
        value={f.content}
        onChange={(e) => setF({ ...f, content: e.target.value })}
        className="field min-h-36"
        placeholder="What’s on your mind?"
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input
          className="field"
          placeholder={f.mediaType === "reel" ? "Reel cover image URL" : "Image URL (optional)"}
          value={f.imageUrl}
          onChange={(e) => setF({ ...f, imageUrl: e.target.value })}
        />
        <input
          className="field"
          placeholder="#hashtags, #topics"
          value={f.hashtags}
          onChange={(e) => setF({ ...f, hashtags: e.target.value })}
        />
        <input
          className="field"
          placeholder="Location"
          value={f.location}
          onChange={(e) => setF({ ...f, location: e.target.value })}
        />
        <select
          className="field"
          value={f.mediaType}
          onChange={(e) => setF({ ...f, mediaType: e.target.value })}
        >
          <option value="post">Photo post</option>
          <option value="reel">Reel</option>
        </select>
        <select
          className="field"
          value={f.privacy}
          onChange={(e) => setF({ ...f, privacy: e.target.value })}
        >
          <option value="public">Public</option>
          <option value="followers">Followers</option>
          <option value="private">Only me</option>
        </select>
      </div>
      {f.imageUrl && (
        <img
          className="mt-4 max-h-64 rounded-xl object-cover"
          src={f.imageUrl}
        />
      )}
      <button disabled={busy} className="btn-primary mt-5">
        {busy ? "Publishing…" : "Publish post"}
      </button>
    </form>
  );
}
export function Profile() {
  const { id } = useParams(),
    { user } = useAuth(),
    [p, setP] = useState();
  useEffect(() => api.get(`/users/${id}`).then((r) => setP(r.data)), [id]);
  if (!p) return <LoadingSkeleton />;
  const self = p.id === user?.id;
  const follow = async () => {
    try {
      await api[p.isFollowing ? "delete" : "post"](`/users/${p.id}/follow`);
      setP({
        ...p,
        isFollowing: !p.isFollowing,
        followersCount: p.followersCount + (p.isFollowing ? -1 : 1),
      });
    } catch (e) {
      toast.error(e.response?.data?.message);
    }
  };
  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <Avatar user={p} size="w-24 h-24" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{p.name}</h1>
            <p className="text-slate-500">
              @{p.username} {p.location && ` · ${p.location}`}
            </p>
            <p className="mt-2 text-sm">{p.bio}</p>
            <div className="mt-3 flex gap-4 text-sm">
              <b>{p.postsCount} posts</b>
              <b>{p.followersCount} followers</b>
              <b>{p.followingCount} following</b>
            </div>
          </div>
          {self ? (
            <Link to="/settings" className="btn-secondary">
              Edit profile
            </Link>
          ) : (
            <button
              onClick={follow}
              className={p.isFollowing ? "btn-secondary" : "btn-primary"}
            >
              {p.isFollowing ? "Following" : "Follow"}
            </button>
          )}
        </div>
      </section>
      <EmptyState
        title="Posts coming soon"
        text="This profile’s public posts will appear in this grid."
      />
    </div>
  );
}
export function SearchPage() {
  const [q, setQ] = useState(""),
    [items, setItems] = useState([]);
  useEffect(() => {
    const t = setTimeout(
      () => q && api.get(`/users/search?q=${q}`).then((r) => setItems(r.data)),
      250,
    );
    return () => clearTimeout(t);
  }, [q]);
  return (
    <div className="card p-5">
      <h1 className="text-xl font-bold">Discover people and ideas</h1>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="field mt-4"
        placeholder="Search users, posts, hashtags"
      />
      {q && (
        <div className="mt-5 space-y-3">
          {items.map((u) => (
            <Link
              to={`/profile/${u._id}`}
              className="flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50"
              key={u._id}
            >
              <Avatar user={u} />
              <div className="flex-1">
                <b>{u.name}</b>
                <p className="text-sm text-slate-500">@{u.username}</p>
              </div>
              <span className="btn-secondary">View</span>
            </Link>
          ))}
          {!items.length && (
            <EmptyState
              title="No results"
              text="Try another name or username."
            />
          )}
        </div>
      )}
    </div>
  );
}
export function PostDetails() {
  const { id } = useParams(),
    nav = useNavigate(),
    { user } = useAuth(),
    [post, setPost] = useState(),
    [comments, setComments] = useState([]),
    [text, setText] = useState(""),
    [editing, setEditing] = useState(),
    [draft, setDraft] = useState("");
  const load = () => {
    api.get(`/posts/${id}`).then((r) => setPost(r.data));
    api.get(`/posts/${id}/comments`).then((r) => setComments(r.data));
  };
  useEffect(load, [id]);
  const comment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await api.post(`/posts/${id}/comments`, { text });
    setText("");
    load();
  };
  const updateComment = async (commentId) => {
    if (!draft.trim()) return;
    try {
      await api.put(`/comments/${commentId}`, { text: draft });
      setEditing();
      setDraft("");
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not update comment");
    }
  };
  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await api.delete(`/comments/${commentId}`);
      setComments((items) => items.filter((item) => item._id !== commentId));
    } catch (e) {
      toast.error(e.response?.data?.message || "Could not delete comment");
    }
  };
  return (
    <div className="space-y-5">
      {post ? (
        <PostCard post={post} onRefresh={load} onDeleted={() => nav("/")} />
      ) : (
        <LoadingSkeleton />
      )}
      <section className="card p-5">
        <h2 className="font-bold">Comments ({comments.length})</h2>
        <form className="mt-3 flex gap-2" onSubmit={comment}>
          <input
            className="field"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a thoughtful comment…"
          />
          <button className="btn-primary">Post</button>
        </form>
        <div className="mt-5 space-y-4">
          {comments.map((c) => {
            const owner = String(user?.id) === String(c.userId?._id);
            return (
              <div className="flex gap-3" key={c._id}>
                <Avatar user={c.userId} size="w-8 h-8" />
                <div className="flex-1">
                  {editing === c._id ? (
                    <div className="flex gap-2">
                      <input
                        className="field"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                      />
                      <button
                        onClick={() => updateComment(c._id)}
                        className="btn-primary"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditing()}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-3 text-sm">
                      <b>{c.userId?.name}</b> {c.text}
                    </p>
                  )}
                  {owner && editing !== c._id && (
                    <div className="mt-1 flex gap-3 text-xs">
                      <button
                        onClick={() => {
                          setEditing(c._id);
                          setDraft(c.text);
                        }}
                        className="text-brand-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteComment(c._id)}
                        className="text-rose-500"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
export function Notifications() {
  const [items, setItems] = useState();
  useEffect(() => api.get("/notifications").then((r) => setItems(r.data)), []);
  if (!items) return <LoadingSkeleton />;
  return (
    <section className="card p-5">
      <h1 className="text-xl font-bold">Notifications</h1>
      <div className="mt-4 space-y-2">
        {items.length ? (
          items.map((n) => (
            <button
              onClick={() =>
                api
                  .put(`/notifications/${n._id}/read`)
                  .then(() =>
                    setItems(
                      items.map((x) =>
                        x._id === n._id ? { ...x, isRead: true } : x,
                      ),
                    ),
                  )
              }
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-left ${!n.isRead ? "bg-indigo-50" : "hover:bg-slate-50"}`}
              key={n._id}
            >
              <Avatar user={n.senderId} />
              <div className="flex-1 text-sm">
                <b>{n.senderId?.name}</b>{" "}
                {n.message?.replace(n.senderId?.name, "")}
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
              {!n.isRead && <i className="h-2 w-2 rounded-full bg-brand-500" />}
            </button>
          ))
        ) : (
          <EmptyState />
        )}
      </div>
    </section>
  );
}
export function Saved() {
  const [posts, setPosts] = useState();
  useEffect(() => api.get("/saved-posts").then((r) => setPosts(r.data)), []);
  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">Saved posts</h1>
      {!posts ? (
        <LoadingSkeleton />
      ) : posts.length ? (
        posts.map((p) => <PostCard key={p._id} post={p} />)
      ) : (
        <EmptyState
          title="No saved posts"
          text="Save posts to revisit them later."
        />
      )}
    </div>
  );
}
export function Settings() {
  const { user, setUser, logout } = useAuth(),
    [f, setF] = useState(user || {});
  const save = async (e) => {
    e.preventDefault();
    try {
      const r = await api.put(`/users/${user.id}`, f);
      setUser(r.data);
      toast.success("Profile updated");
    } catch {
      toast.error("Unable to save");
    }
  };
  const removeAccount = async () => {
    if (!window.confirm("Delete your account and all related content?")) return;
    try {
      await api.delete(`/users/${user.id}`);
      logout();
      toast.success("Account deleted");
    } catch (e) {
      toast.error(e.response?.data?.message || "Unable to delete account");
    }
  };
  return (
    <div className="card max-w-2xl p-5">
      <h1 className="text-xl font-bold">Settings</h1>
      <form onSubmit={save} className="mt-5 grid gap-4 sm:grid-cols-2">
        {[
          ["name", "Name"],
          ["bio", "Bio"],
          ["location", "Location"],
          ["profileImage", "Profile image URL"],
        ].map(([k, l]) => (
          <label className="text-sm font-medium" key={k}>
            {l}
            <input
              className="field mt-1"
              value={f[k] || ""}
              onChange={(e) => setF({ ...f, [k]: e.target.value })}
            />
          </label>
        ))}
        <div className="sm:col-span-2">
          <button className="btn-primary">Save changes</button>
          <button
            type="button"
            onClick={logout}
            className="btn-secondary ml-2 text-rose-600"
          >
            Log out
          </button>
          <button
            type="button"
            onClick={removeAccount}
            className="btn-secondary ml-2 text-rose-600"
          >
            Delete account
          </button>
        </div>
      </form>
    </div>
  );
}
export function Messages() {
  const { user } = useAuth(),
    [users, setUsers] = useState([]),
    [peer, setPeer] = useState(),
    [messages, setMessages] = useState([]),
    [text, setText] = useState("");
  const getAutoReply = (input = "") => {
    const v = input.toLowerCase().trim();
    if (!v) return "Thanks for your message!";
    if (/hi\s+hi|hello\s+hello|hey\s+hey/.test(v))
      return "Hi hi! I’m good, thanks for asking. How are you?";
    if (/hi|hello|hey/.test(v)) return "Hi! How are you doing today?";
    if (/how are you|how r u|are you ok|are you fine/.test(v))
      return "I’m good, thank you. How about you?";
    if (/fine|good|great|awesome|okay|ok|alright/.test(v))
      return "Nice to hear that! What would you like to chat about?";
    if (/bye|goodbye|see you/.test(v)) return "Bye! Take care and talk soon.";
    if (/thanks|thank you/.test(v)) return "You’re welcome!";
    if (/love|like|like it/.test(v)) return "That sounds lovely!";
    return "Thanks for your message! I’ll get back to you soon.";
  };
  useEffect(
    () => api.get("/users/search?q=").then((r) => setUsers(r.data)),
    [],
  );
  useEffect(() => {
    if (peer) api.get(`/messages/${peer._id}`).then((r) => setMessages(r.data));
  }, [peer]);
  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !peer) return;
    const clean = text.trim();
    const r = await api.post("/messages", {
      receiverId: peer._id,
      message: clean,
    });
    setMessages((prev) => [...prev, r.data]);
    setText("");
    window.setTimeout(() => {
      const reply = {
        _id: Date.now() + Math.random(),
        senderId: peer._id,
        receiverId: user?.id || peer._id,
        message: getAutoReply(clean),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 700);
  };
  return (
    <div className="card flex h-[calc(100vh-8rem)] overflow-hidden">
      <aside className="w-2/5 border-r p-3">
        <h1 className="mb-3 font-bold">Message</h1>
        {users.map((u) => (
          <button
            onClick={() => setPeer(u)}
            className={`flex w-full items-center gap-2 rounded-xl p-2 text-left ${peer?._id === u._id ? "bg-indigo-50" : "hover:bg-slate-50"}`}
            key={u._id}
          >
            <Avatar user={u} size="w-9 h-9" />
            <span className="truncate text-sm font-medium">{u.name}</span>
          </button>
        ))}
      </aside>
      <main className="flex flex-1 flex-col">
        {peer ? (
          <>
            <div className="border-b p-4 font-bold">
              {peer.name}{" "}
              <span className="text-xs font-normal text-emerald-500">
                ● online
              </span>
            </div>
            <div className="flex-1 space-y-2 overflow-auto p-4">
              {messages.map((m) => (
                <p
                  key={m._id}
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${m.senderId === peer._id ? "bg-slate-100" : "ml-auto bg-brand-500 text-white"}`}
                >
                  {m.message}
                </p>
              ))}
            </div>
            <form onSubmit={send} className="flex gap-2 border-t p-3">
              <input
                className="field"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a message…"
              />
              <button className="btn-primary">Send</button>
            </form>
          </>
        ) : (
          <div className="m-auto text-sm text-slate-400">
            Select a conversation
          </div>
        )}
      </main>
    </div>
  );
}
