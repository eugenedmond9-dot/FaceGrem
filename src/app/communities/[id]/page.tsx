"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

type CommunityRecord = {
  id: string;
  creator_id: string;
  name: string;
  category: string | null;
  description: string | null;
  created_at: string;
};

type CommunityMemberRecord = {
  id: string;
  community_id: string;
  user_id: string;
  created_at: string;
};

type ProfileRecord = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
};

type PostRecord = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  full_name: string | null;
  avatar_url: string | null;
  image_url?: string | null;
  video_url?: string | null;
  community_id?: string | null;
};

type LikeRecord = {
  id: string;
  post_id: string;
  user_id: string;
};

type CommentRecord = {
  id: string;
  post_id: string;
  user_id: string;
  full_name: string | null;
  content: string;
  created_at: string;
};

export default function CommunityDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const communityId = params?.id || "";

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");

  const [community, setCommunity] = useState<CommunityRecord | null>(null);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [communityMembers, setCommunityMembers] = useState<CommunityMemberRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [postText, setPostText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [posting, setPosting] = useState(false);

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0f172a&color=ffffff&bold=true`;

  const getProfileById = (profileId?: string) => {
    if (!profileId) return undefined;
    return profiles.find((profile) => profile.id === profileId);
  };

  const getBestNameForUser = (uid?: string, fallbackName?: string | null) => {
    const profile = getProfileById(uid);
    return profile?.full_name || fallbackName || "FaceGrem User";
  };

  const getBestAvatarForUser = (
    uid?: string,
    fallbackName?: string | null,
    fallbackAvatarUrl?: string | null
  ) => {
    const profile = getProfileById(uid);
    return (
      profile?.avatar_url ||
      fallbackAvatarUrl ||
      getAvatarUrl(profile?.full_name || fallbackName || "FaceGrem User")
    );
  };

  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const parsed = new URL(url);

      if (parsed.hostname.includes("youtube.com")) {
        const id = parsed.searchParams.get("v");
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }

      if (parsed.hostname.includes("youtu.be")) {
        const id = parsed.pathname.replace("/", "");
        return id ? `https://www.youtube.com/embed/${id}` : url;
      }

      return url;
    } catch {
      return url;
    }
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  useEffect(() => {
    const loadCommunity = async () => {
      if (!communityId) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      const currentUserId = session.user.id;
      const currentUserName =
        session.user.user_metadata?.full_name || "FaceGrem User";

      setUserId(currentUserId);
      setUserName(currentUserName);

      const [
        { data: communityData, error: communityError },
        { data: profilesData },
        { data: membersData },
        { data: postsData },
        { data: likesData },
        { data: commentsData },
      ] = await Promise.all([
        supabase
          .from("communities")
          .select("id, creator_id, name, category, description, created_at")
          .eq("id", communityId)
          .single(),
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase
          .from("community_members")
          .select("id, community_id, user_id, created_at")
          .eq("community_id", communityId),
        supabase
          .from("posts")
          .select(
            "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
          )
          .eq("community_id", communityId)
          .order("created_at", { ascending: false }),
        supabase.from("likes").select("id, post_id, user_id"),
        supabase
          .from("comments")
          .select("id, post_id, user_id, full_name, content, created_at"),
      ]);

      if (communityError || !communityData) {
        alert(communityError?.message || "Community not found.");
        router.push("/communities");
        return;
      }

      const allProfiles = profilesData || [];
      const myProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setCommunity(communityData);
      setProfiles(allProfiles);
      setCommunityMembers(membersData || []);
      setPosts(postsData || []);
      setLikes(likesData || []);
      setComments(commentsData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );
      setLoading(false);
    };

    void loadCommunity();
  }, [communityId, router]);

  const isMember = useMemo(() => {
    return communityMembers.some(
      (member) => member.community_id === communityId && member.user_id === userId
    );
  }, [communityId, communityMembers, userId]);

  const membersCount = communityMembers.length;

  const creatorName = useMemo(() => {
    if (!community) return "FaceGrem User";
    return getBestNameForUser(community.creator_id);
  }, [community, profiles]);

  const creatorAvatar = useMemo(() => {
    if (!community) return getAvatarUrl("FaceGrem User");
    return getBestAvatarForUser(community.creator_id);
  }, [community, profiles]);

  const getPostLikesCount = (postId: string) =>
    likes.filter((like) => like.post_id === postId).length;

  const getPostCommentsCount = (postId: string) =>
    comments.filter((comment) => comment.post_id === postId).length;

  const isLiked = (postId: string) =>
    likes.some((like) => like.user_id === userId && like.post_id === postId);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);

    if (!file) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  const uploadPostImage = async () => {
    if (!imageFile || !userId) return null;

    const fileExt = imageFile.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt.toLowerCase()}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(filePath, imageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleJoinOrLeaveCommunity = async () => {
    if (!communityId || !userId) return;

    if (isMember) {
      const existingMember = communityMembers.find(
        (member) => member.community_id === communityId && member.user_id === userId
      );

      if (!existingMember) return;

      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("id", existingMember.id);

      if (error) {
        alert(error.message);
        return;
      }

      setCommunityMembers((prev) =>
        prev.filter((member) => member.id !== existingMember.id)
      );
      return;
    }

    const { data, error } = await supabase
      .from("community_members")
      .insert([
        {
          community_id: communityId,
          user_id: userId,
        },
      ])
      .select("id, community_id, user_id, created_at");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setCommunityMembers((prev) => [...prev, data[0]]);
    }
  };

  const handleCreateCommunityPost = async () => {
    if (!userId || !communityId) return;

    if (!isMember) {
      alert("Join this community before posting.");
      return;
    }

    const trimmedContent = postText.trim();
    const trimmedVideoUrl = videoUrl.trim();

    if (!trimmedContent && !imageFile && !trimmedVideoUrl) {
      alert("Add text, an image, or a video link.");
      return;
    }

    setPosting(true);

    try {
      let imageUrl: string | null = null;

      if (imageFile) {
        imageUrl = await uploadPostImage();
      }

      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            user_id: userId,
            content: trimmedContent,
            full_name: userName,
            avatar_url: userAvatar,
            image_url: imageUrl,
            video_url: trimmedVideoUrl || null,
            community_id: communityId,
          },
        ])
        .select(
          "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
        );

      if (error) {
        alert(error.message);
        setPosting(false);
        return;
      }

      if (data && data.length > 0) {
        setPosts((prev) => [data[0], ...prev]);
      }

      setPostText("");
      setVideoUrl("");
      setImageFile(null);
      setImagePreview("");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not create post.");
    }

    setPosting(false);
  };

  const handleToggleLike = async (postId: string) => {
    const existingLike = likes.find(
      (like) => like.post_id === postId && like.user_id === userId
    );

    if (existingLike) {
      const { error } = await supabase.from("likes").delete().eq("id", existingLike.id);

      if (!error) {
        setLikes((prev) => prev.filter((like) => like.id !== existingLike.id));
      }

      return;
    }

    const { data, error } = await supabase
      .from("likes")
      .insert([{ post_id: postId, user_id: userId }])
      .select("id, post_id, user_id");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setLikes((prev) => [...prev, data[0]]);
    }
  };

  if (loading || !community) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Loading community...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-6xl gap-4 px-4 py-4 mx-auto sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{community.name}</h1>
              <p className="text-xs text-slate-400">
                {community.category || "Community"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleJoinOrLeaveCommunity}
              className={`rounded-2xl px-4 py-2 text-sm font-semibold ${
                isMember
                  ? "border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                  : "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
              }`}
            >
              {isMember ? "Leave community" : "Join community"}
            </button>

            <Link
              href="/communities"
              className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Back to Communities
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-cyan-200">About community</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">{community.name}</h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              {community.description || "No description yet."}
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-cyan-200">Stats</p>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                <p className="text-xs text-slate-400">Members</p>
                <p className="mt-2 text-xl font-bold text-white">{membersCount}</p>
              </div>
              <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                <p className="text-xs text-slate-400">Posts</p>
                <p className="mt-2 text-xl font-bold text-white">{posts.length}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-cyan-200">Creator</p>
            <div className="flex items-center gap-3 mt-4">
              <img
                src={creatorAvatar}
                alt={creatorName}
                className="object-cover w-12 h-12 rounded-2xl"
              />
              <div>
                <p className="font-medium text-white">{creatorName}</p>
                <p className="text-xs text-slate-400">Community creator</p>
              </div>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-4">
              <img
                src={userAvatar || getAvatarUrl(userName)}
                alt={userName}
                className="object-cover w-12 h-12 rounded-2xl"
              />
              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                rows={3}
                placeholder={
                  isMember
                    ? `Share with ${community.name}...`
                    : "Join this community to post."
                }
                disabled={!isMember}
                className="w-full px-4 py-3 text-sm text-white border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 disabled:opacity-60"
              />
            </div>

            <div className="grid gap-4 mt-4 md:grid-cols-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={!isMember}
                className="block w-full px-4 py-3 text-sm text-white border rounded-2xl border-white/10 bg-white/5 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-3 file:py-2 file:text-cyan-200 disabled:opacity-60"
              />

              <input
                type="text"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Paste a YouTube or video URL"
                disabled={!isMember}
                className="w-full px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 disabled:opacity-60"
              />
            </div>

            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="object-cover w-full mt-4 max-h-72 rounded-3xl"
              />
            )}

            <div className="flex justify-end mt-5">
              <button
                onClick={handleCreateCommunityPost}
                disabled={posting || !isMember}
                className="px-6 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
              >
                {posting ? "Posting..." : "Post to community"}
              </button>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-300">
              No posts in this community yet.
            </div>
          ) : (
            <div className="space-y-6">
              {posts.map((post) => {
                const authorName = getBestNameForUser(post.user_id, post.full_name);
                const authorAvatar = getBestAvatarForUser(
                  post.user_id,
                  post.full_name,
                  post.avatar_url
                );
                const likesCount = getPostLikesCount(post.id);
                const commentsCount = getPostCommentsCount(post.id);

                return (
                  <article
                    key={post.id}
                    className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <Link
                        href={`/profile?id=${post.user_id}`}
                        className="flex items-center gap-3 hover:opacity-90"
                      >
                        <img
                          src={authorAvatar}
                          alt={authorName}
                          className="object-cover w-12 h-12 rounded-2xl"
                        />
                        <div>
                          <p className="font-semibold text-white">{authorName}</p>
                          <p className="text-xs text-slate-400">
                            {new Date(post.created_at).toLocaleString()}
                          </p>
                        </div>
                      </Link>

                      <span className="px-3 py-1 text-xs border rounded-full border-white/10 bg-white/5 text-slate-300">
                        {community.name}
                      </span>
                    </div>

                    {post.content && (
                      <p className="mt-4 text-sm leading-7 text-slate-200">{post.content}</p>
                    )}

                    {post.image_url && (
                      <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10">
                        <img
                          src={post.image_url}
                          alt="Post"
                          className="max-h-[560px] w-full object-cover"
                        />
                      </div>
                    )}

                    {post.video_url && (
                      <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
                        {isYouTubeUrl(post.video_url) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(post.video_url)}
                            title={`community-video-${post.id}`}
                            className="w-full h-72 md:h-96"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            controls
                            className="w-full bg-black h-72 md:h-96"
                            src={post.video_url}
                          />
                        )}
                      </div>
                    )}

                    {!post.image_url && !post.video_url && !post.content && (
                      <div className="mt-5 h-40 rounded-[28px] bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-purple-500/10" />
                    )}

                    <div className="flex flex-wrap gap-3 mt-5">
                      <button
                        onClick={() => handleToggleLike(post.id)}
                        className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                          isLiked(post.id)
                            ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                            : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        }`}
                      >
                        ❤️ {likesCount}
                      </button>

                      <Link
                        href={`/post/${post.id}`}
                        className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      >
                        💬 {commentsCount}
                      </Link>

                      <Link
                        href={`/post/${post.id}`}
                        className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                      >
                        Open post
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}