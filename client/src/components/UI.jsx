import { useState } from "react";
import {
  Home,
  Search,
  PlusSquare,
  Bell,
  User,
  Bookmark,
  MessageCircle,
  Settings,
  Heart,
  Send,
  MoreHorizontal,
  Image as ImageIcon,
  Pencil,
  Trash2,
  Save,
  X,
} from "lucide-react";

import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { toast } from "sonner";

export const Avatar = ({ user, size = "w-10 h-10" }) => {
  const portrait = `https://i.pravatar.cc/240?u=${encodeURIComponent(
    user?.username || user?._id || user?.id || user?.name || "connecthub",
  )}`;
  const initials = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    user?.name || "?",
  )}&background=6254e7&color=fff`;

  return (
    <img
      alt={`${user?.name || "User"} profile photo`}
      className={`${size} rounded-full object-cover bg-indigo-100`}
      src={user?.profileImage || portrait}
      onError={(event) => {
        const image = event.currentTarget;
        if (image.src !== portrait) image.src = portrait;
        else if (image.src !== initials) image.src = initials;
        else image.onerror = null;
      }}
    />
  );
};

const nav = [
  ["/", Home, "Home"],
  ["/search", Search, "Explore"],
  ["/create", PlusSquare, "Create"],
  ["/notifications", Bell, "Notifications"],
  ["/messages", MessageCircle, "Messages"],
  ["/saved", Bookmark, "Saved"],
  ["/settings", Settings, "Settings"],
];

export function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <aside className="fixed hidden h-screen w-64 flex-col border-r border-slate-100 bg-white px-4 py-7 lg:flex">
      <Link
        to="/"
        className="mb-10 text-2xl font-black tracking-tight text-brand-500"
      >
        Connect<span className="text-slate-800">Hub</span>
      </Link>
      <nav className="space-y-2">
        {nav.map(([to, Icon, label]) => (
          <Link
            key={to}
            to={to}
            className={`flex items-center gap-3 rounded-xl px-3 py-3 font-medium ${location.pathname === to ? "bg-indigo-50 text-brand-600" : "hover:bg-slate-50"}`}
          >
            <Icon size={21} />
            {label}
          </Link>
        ))}
      </nav>
      <Link
        to={`/profile/${user?.id}`}
        className="mt-auto flex items-center gap-3 rounded-xl p-2 hover:bg-slate-50"
      >
        <Avatar user={user} />
        <span className="truncate font-semibold">{user?.name}</span>
      </Link>
    </aside>
  );
}

export function MobileNav() {
  const location = useLocation();
  return (
    <nav className="fixed bottom-0 z-30 flex w-full justify-around border-t bg-white px-2 py-2 lg:hidden">
      {nav.slice(0, 5).map(([to, Icon, label]) => (
        <Link
          aria-label={label}
          key={to}
          to={to}
          className={
            location.pathname === to ? "text-brand-500" : "text-slate-500"
          }
        >
          <Icon size={22} />
        </Link>
      ))}
    </nav>
  );
}

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-slate-100 bg-white/90 px-4 backdrop-blur lg:ml-64">
      <Link to="/" className="text-xl font-black text-brand-500 lg:hidden">
        ConnectHub
      </Link>
      <Link
        to="/search"
        className="ml-auto flex max-w-md flex-1 items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-500"
      >
        <Search size={17} />
        Search ConnectHub
      </Link>
      <Link to="/notifications" className="icon-btn">
        <Bell size={21} />
      </Link>
    </header>
  );
}

export const LoadingSkeleton = () => (
  <div className="card animate-pulse p-5">
    <div className="h-10 w-1/3 rounded bg-slate-200" />
    <div className="mt-4 h-32 rounded bg-slate-100" />
  </div>
);
export const EmptyState = ({
  title = "Nothing here yet",
  text = "Check back soon or create something new.",
}) => (
  <div className="card p-10 text-center">
    <ImageIcon className="mx-auto mb-3 text-brand-500" />
    <h3 className="font-bold">{title}</h3>
    <p className="mt-1 text-sm text-slate-500">{text}</p>
  </div>
);

export function PostCard({ post, onRefresh, onDeleted }) {
  const { user } = useAuth();
  const liked = post.liked;
  const isOwner = String(user?.id) === String(post.userId || post.author?._id);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    content: post.content || "",
    imageUrl: post.imageUrl || "",
    hashtags: (post.hashtags || []).join(" "),
    location: post.location || "",
    privacy: post.privacy || "public",
  });

  const like = async () => {
    try {
      await api[liked ? "delete" : "post"](`/posts/${post._id}/like`);
      onRefresh?.();
    } catch {
      toast.error("Could not update like");
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put(`/posts/${post._id}`, {
        ...draft,
        hashtags: draft.hashtags.split(/\s|,/).filter(Boolean),
      });
      setEditing(false);
      toast.success("Post updated");
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update post");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await api.delete(`/posts/${post._id}`);
      toast.success("Post deleted");
      onDeleted?.();
      onRefresh?.();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete post");
    }
  };

  return (
    <article className="card overflow-hidden">
      <div className="flex items-center gap-3 p-4">
        <Link to={`/profile/${post.author?._id || post.userId}`}>
          <Avatar user={post.author} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            className="font-bold hover:underline"
            to={`/profile/${post.author?._id || post.userId}`}
          >
            {post.author?.name}
          </Link>
          <p className="text-xs text-slate-500">
            @{post.author?.username} ·{" "}
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
        {isOwner ? (
          <div className="flex gap-1">
            <button
              aria-label="Edit post"
              onClick={() => setEditing(true)}
              className="icon-btn"
            >
              <Pencil size={17} />
            </button>
            <button
              aria-label="Delete post"
              onClick={remove}
              className="icon-btn text-rose-500"
            >
              <Trash2 size={17} />
            </button>
          </div>
        ) : (
          <MoreHorizontal size={20} className="text-slate-400" />
        )}
      </div>
      {editing ? (
        <form onSubmit={save} className="space-y-3 px-4 pb-4">
          <textarea
            required={!draft.imageUrl}
            value={draft.content}
            onChange={(event) =>
              setDraft({ ...draft, content: event.target.value })
            }
            className="field min-h-28"
          />
          <input
            className="field"
            placeholder="Image URL"
            value={draft.imageUrl}
            onChange={(event) =>
              setDraft({ ...draft, imageUrl: event.target.value })
            }
          />
          <input
            className="field"
            placeholder="#hashtags"
            value={draft.hashtags}
            onChange={(event) =>
              setDraft({ ...draft, hashtags: event.target.value })
            }
          />
          <div className="flex gap-2">
            <button disabled={saving} className="btn-primary">
              <Save size={16} />
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-secondary"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <Link to={`/posts/${post._id}`}>
            <p className="whitespace-pre-wrap px-4 pb-4 text-sm leading-6">
              {post.content}
            </p>
            {post.imageUrl && (
              <img
                className="max-h-[560px] w-full object-cover"
                src={post.imageUrl}
                alt=""
              />
            )}
          </Link>
          <div className="flex items-center gap-1 p-3">
            <button
              onClick={like}
              className={`icon-btn ${liked ? "text-rose-500" : "hover:text-rose-500"}`}
            >
              <Heart size={20} fill={liked ? "currentColor" : "none"} />
            </button>
            <Link to={`/posts/${post._id}`} className="icon-btn">
              <MessageCircle size={20} />
            </Link>
            <button className="icon-btn">
              <Send size={19} />
            </button>
            <button className="icon-btn ml-auto">
              <Bookmark size={20} />
            </button>
          </div>
          <div className="px-4 pb-4 text-xs font-semibold text-slate-600">
            {post.likesCount || 0} likes · {post.commentsCount || 0} comments
          </div>
        </>
      )}
    </article>
  );
}
