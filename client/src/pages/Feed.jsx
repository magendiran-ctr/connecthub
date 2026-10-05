import { useEffect, useState } from "react";
import {
  BadgeCheck,
  Users,
  ArrowRight,
  Compass,
  LayoutGrid,
} from "lucide-react";
import api from "../services/api";
import {
  PostCard,
  LoadingSkeleton,
  EmptyState,
  Avatar,
} from "../components/UI";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const formatFollowers = (count) =>
  count >= 1000 ? `${(count / 1000).toFixed(count >= 10000 ? 0 : 1)}k` : count;
function ChannelCard({ channel, onFollow }) {
  return (
    <article className="min-w-[220px] snap-start rounded-2xl border border-slate-100 bg-gradient-to-b from-indigo-50 to-white p-4">
      <div className="flex items-start gap-3">
        <Avatar user={channel} />
        <div className="min-w-0 flex-1">
          <Link
            to={`/profile/${channel._id}`}
            className="flex items-center gap-1 truncate font-bold hover:underline"
          >
            {channel.name}
            {channel.isVerified && (
              <BadgeCheck
                size={16}
                className="shrink-0 text-brand-500"
                fill="currentColor"
                stroke="white"
              />
            )}
          </Link>
          <p className="truncate text-xs text-slate-500">
            @{channel.username} · {channel.category}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-slate-600">{channel.bio}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className="flex items-center gap-1 text-xs font-semibold text-slate-500">
          <Users size={14} />
          {formatFollowers(channel.followersCount)} followers
        </span>
        <button
          disabled={channel.isSelf}
          onClick={() => onFollow(channel)}
          className="btn-secondary px-3 py-1.5 text-xs disabled:cursor-not-allowed disabled:opacity-50"
        >
          {channel.isSelf ? "You" : channel.isFollowing ? "Following" : "Follow"}
        </button>
      </div>
    </article>
  );
}
function Stories({ user, channels }) {
  return (
    <section className="card p-4">
      <div className="mb-3 flex justify-between">
        <h2 className="font-bold">Stories</h2>
        <span className="text-sm text-brand-500">View all</span>
      </div>
      <div className="flex gap-4 overflow-hidden">
        {[user, ...channels.slice(0, 5)].map((item, index) => (
          <div key={item?._id || index} className="shrink-0 text-center">
            <Avatar user={item || { name: "ConnectHub" }} size="w-14 h-14" />
            <span className="mt-1 block w-14 truncate text-xs">
              {item?.name?.split(" ")[0] || "You"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
function ExploreGrid({ posts }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {posts.map((post) => (
        <Link
          key={post._id}
          to={`/posts/${post._id}`}
          className="group relative aspect-square overflow-hidden rounded-xl bg-slate-200"
        >
          <img
            src={post.imageUrl}
            alt={post.content.slice(0, 70)}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
          {post.mediaType === "reel" && (
            <span className="absolute right-2 top-2 rounded-lg bg-black/65 px-2 py-1 text-xs font-bold text-white">
              REEL
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 p-2 text-xs font-semibold text-white">
            ♥ {post.likesCount || 0}
          </span>
        </Link>
      ))}
    </div>
  );
}
export default function Feed() {
  const [posts, setPosts] = useState(),
    [channels, setChannels] = useState([]),
    [mode, setMode] = useState("feed"),
    [sort, setSort] = useState("latest"),
    [page, setPage] = useState(1),
    [hasMore, setHasMore] = useState(false),
    [loadingMore, setLoadingMore] = useState(false),
    { user } = useAuth();
  const load = async (
    nextMode = mode,
    nextPage = 1,
    nextSort = sort,
    append = false,
  ) => {
    try {
      const r = await api.get(
        nextMode === "explore" ? "/posts/explore" : "/posts/feed",
        { params: { page: nextPage, limit: 10, sort: nextSort } },
      );
      if (nextMode === "explore") {
        setPosts(r.data);
      } else {
        setPosts((current) =>
          append ? [...(current || []), ...r.data.posts] : r.data.posts,
        );
        setHasMore(r.data.hasMore);
        setPage(r.data.page);
      }
    } catch {
      if (!append) setPosts([]);
    } finally {
      setLoadingMore(false);
    }
  };
  useEffect(() => {
    load("feed");
    api
      .get("/channels")
      .then((r) => setChannels(r.data))
      .catch(() => setChannels([]));
  }, []);
  const changeMode = (nextMode) => {
    setMode(nextMode);
    setPosts();
    setPage(1);
    setHasMore(false);
    load(nextMode, 1, sort);
  };
  const changeSort = (event) => {
    const nextSort = event.target.value;
    setSort(nextSort);
    setPosts();
    setPage(1);
    load("feed", 1, nextSort);
  };
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      load("feed", page + 1, sort, true);
    }
  };
  const follow = async (channel) => {
    const isFollowing = channel.isFollowing;
    try {
      await api[isFollowing ? "delete" : "post"](
        `/users/${channel._id}/follow`,
      );
      setChannels((items) =>
        items.map((item) =>
          item._id === channel._id
            ? {
                ...item,
                isFollowing: !isFollowing,
                followersCount: item.followersCount + (isFollowing ? -1 : 1),
              }
            : item,
        ),
      );
      if (mode === "feed") load("feed", 1, sort);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not update follow");
    }
  };
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-[#f1f0ff] p-4 text-slate-900 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_40%] sm:items-center sm:gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
              Your daily pulse
            </p>
            <h1 className="mt-2 max-w-sm text-xl font-black leading-tight sm:text-2xl lg:text-3xl">
              Good things are happening in your circle.
            </h1>
            <p className="mt-2 max-w-sm text-sm text-slate-600">
              Little wins, fresh ideas, and moments worth a double-tap.
            </p>
            <Link
              to="/search"
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white hover:bg-brand-700 sm:w-auto sm:py-2.5"
            >
              Find your people <ArrowRight size={16} />
            </Link>
          </div>
          <div className="relative aspect-[16/10] overflow-hidden rounded-xl sm:aspect-[4/3]">
            <img
              src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=85"
              alt="Friends sharing a moment together"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/65 to-transparent px-3 pb-3 pt-8 text-xs font-semibold text-white">
              Good vibes from your community
            </span>
          </div>
        </div>
      </section>
      <section className="card p-4">
        <div className="flex gap-3">
          <Avatar user={user} />
          <Link
            to="/create"
            className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-500"
          >
            Share an update, idea, or moment…
          </Link>
        </div>
      </section>
      <div className="flex gap-2 rounded-xl bg-slate-100 p-1">
        <button
          onClick={() => changeMode("feed")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${mode === "feed" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"}`}
        >
          <LayoutGrid size={16} />
          Following
        </button>
        <button
          onClick={() => changeMode("explore")}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-bold ${mode === "explore" ? "bg-white text-brand-600 shadow-sm" : "text-slate-500"}`}
        >
          <Compass size={16} />
          Explore
        </button>
      </div>
      {mode === "feed" && (
        <>
          <section className="card p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-500">
                  Curated for you
                </p>
                <h2 className="font-bold">Channels worth following</h2>
              </div>
              <Link
                to="/search"
                className="text-sm font-semibold text-brand-500"
              >
                See all
              </Link>
            </div>
            <div className="flex snap-x gap-3 overflow-x-auto pb-1">
              {channels.length ? (
                channels.map((channel) => (
                  <ChannelCard
                    key={channel._id}
                    channel={channel}
                    onFollow={follow}
                  />
                ))
              ) : (
                <p className="py-4 text-sm text-slate-500">Loading channels…</p>
              )}
            </div>
          </section>
          <Stories user={user} channels={channels} />
        </>
      )}
      {mode === "feed" && (
        <div className="flex items-center justify-between">
          <h2 className="font-bold">Your feed</h2>
          <label className="flex items-center gap-2 text-sm text-slate-500">
            Sort by
            <select
              value={sort}
              onChange={changeSort}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 font-semibold text-slate-700"
            >
              <option value="latest">Latest</option>
              <option value="popular">Popular</option>
              <option value="mostViewed">Most viewed</option>
            </select>
          </label>
        </div>
      )}
      {mode === "explore" && posts && (
        <p className="text-sm font-semibold text-slate-500">
          Trending posts, photos and reels
        </p>
      )}
      {!posts ? (
        <>
          <LoadingSkeleton />
          <LoadingSkeleton />
        </>
      ) : posts.length ? (
        mode === "explore" ? (
          <ExploreGrid posts={posts} />
        ) : (
          <>
            {posts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onRefresh={() => load(mode, 1, sort)}
              />
            ))}
            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="btn-secondary mx-auto block px-5 py-2"
              >
                {loadingMore ? "Loading…" : "Load more"}
              </button>
            )}
          </>
        )
      ) : (
        <EmptyState
          title="Your feed is ready"
          text="Follow channels and people to make it feel alive."
        />
      )}
    </div>
  );
}
