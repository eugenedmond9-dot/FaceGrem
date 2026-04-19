"use client";

import Link from "next/link";
import { ChangeEvent, Suspense, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

type Profile = {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  avatar_url?: string | null;
};

type FollowRecord = {
  id: string;
  follower_id: string;
  following_id: string;
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

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [sessionUserId, setSessionUserId] = useState("");
  const [profile, setProfile] = useState<Profile>({
    id: "",
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
  });

  const [follows, setFollows] = useState<FollowRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [selectedAvatarPreview, setSelectedAvatarPreview] = useState("");

  const requestedProfileId = searchParams.get("id");

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0f172a&color=ffffff&bold=true`;

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
    const loadProfile = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      const loggedInUserId = session.user.id;
      setSessionUserId(loggedInUserId);

      const profileIdToLoad = requestedProfileId || loggedInUserId;

      const [
        { data: profileData, error: profileError },
        { data: followsData },
        { data: postsData },
        { data: likesData },
        { data: commentsData },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, username, bio, avatar_url")
          .eq("id", profileIdToLoad)
          .single(),
        supabase.from("follows").select("id, follower_id, following_id"),
        supabase
          .from("posts")
          .select(
            "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
          )
          .eq("user_id", profileIdToLoad)
          .is("community_id", null)
          .order("created_at", { ascending: false }),
        supabase.from("likes").select("id, post_id, user_id"),
        supabase
          .from("comments")
          .select("id, post_id, user_id, full_name, content, created_at"),
      ]);

      if (profileError && profileError.code !== "PGRST116") {
        alert(profileError.message);
        setLoading(false);
        return;
      }

      if (profileData) {
        setProfile(profileData);
      } else if (profileIdToLoad === loggedInUserId) {
        const newProfile = {
          id: loggedInUserId,
          full_name: session.user.user_metadata?.full_name || "FaceGrem User",
          username: "",
          bio: "",
          avatar_url: "",
        };

        const { error: insertError } = await supabase
          .from("profiles")
          .insert([newProfile]);

        if (insertError) {
          alert(insertError.message);
        } else {
          setProfile(newProfile);
        }
      }

      setFollows(followsData || []);
      setPosts(postsData || []);
      setLikes(likesData || []);
      setComments(commentsData || []);
      setLoading(false);
    };

    void loadProfile();
  }, [router, requestedProfileId]);

  const isOwnProfile = useMemo(() => {
    return !!sessionUserId && sessionUserId === profile.id;
  }, [sessionUserId, profile.id]);

  const existingFollow = useMemo(() => {
    return follows.find(
      (follow) =>
        follow.follower_id === sessionUserId && follow.following_id === profile.id
    );
  }, [follows, sessionUserId, profile.id]);

  const followersCount = useMemo(() => {
    return follows.filter((follow) => follow.following_id === profile.id).length;
  }, [follows, profile.id]);

  const followingCount = useMemo(() => {
    return follows.filter((follow) => follow.follower_id === profile.id).length;
  }, [follows, profile.id]);

  const getPostLikesCount = (postId: string) => {
    return likes.filter((like) => like.post_id === postId).length;
  };

  const getPostCommentsCount = (postId: string) => {
    return comments.filter((comment) => comment.post_id === postId).length;
  };

  const handleAvatarFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedAvatarFile(file);

    if (!file) {
      setSelectedAvatarPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedAvatarPreview(previewUrl);
  };

  const uploadAvatar = async () => {
    if (!selectedAvatarFile || !profile.id) return null;

    const fileExt = selectedAvatarFile.name.split(".").pop() || "jpg";
    const safeExt = fileExt.toLowerCase();
    const filePath = `${profile.id}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, selectedAvatarFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async () => {
    if (!profile.id) {
      alert("Profile not ready yet.");
      return;
    }

    setSaving(true);

    try {
      let avatarUrl = profile.avatar_url || "";

      if (selectedAvatarFile) {
        setAvatarUploading(true);
        const uploadedAvatarUrl = await uploadAvatar();
        avatarUrl = uploadedAvatarUrl || avatarUrl;
        setAvatarUploading(false);
      }

      const trimmedFullName = profile.full_name.trim();
      const trimmedUsername = profile.username.trim();
      const trimmedBio = profile.bio.trim();

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: trimmedFullName,
          username: trimmedUsername,
          bio: trimmedBio,
          avatar_url: avatarUrl,
        })
        .eq("id", profile.id);

      if (profileError) {
        alert(profileError.message);
        setSaving(false);
        return;
      }

      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: trimmedFullName || "FaceGrem User",
          avatar_url: avatarUrl,
        },
      });

      if (authError) {
        alert(authError.message);
        setSaving(false);
        return;
      }

      setProfile((prev) => ({
        ...prev,
        full_name: trimmedFullName,
        username: trimmedUsername,
        bio: trimmedBio,
        avatar_url: avatarUrl,
      }));

      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          full_name: trimmedFullName || post.full_name,
          avatar_url: avatarUrl || post.avatar_url,
        }))
      );

      setSelectedAvatarFile(null);
      setSelectedAvatarPreview("");
      alert("FaceGrem profile updated!");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Avatar upload failed.";
      alert(message);
    }

    setAvatarUploading(false);
    setSaving(false);
  };

  const handleToggleFollow = async () => {
    if (!sessionUserId || !profile.id || isOwnProfile) return;

    setFollowLoading(true);

    if (existingFollow) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("id", existingFollow.id);

      if (error) {
        alert(error.message);
      } else {
        setFollows((prev) => prev.filter((follow) => follow.id !== existingFollow.id));
      }
    } else {
      const { data, error } = await supabase
        .from("follows")
        .insert([
          {
            follower_id: sessionUserId,
            following_id: profile.id,
          },
        ])
        .select("id, follower_id, following_id");

      if (error) {
        alert(error.message);
      } else if (data && data.length > 0) {
        setFollows((prev) => [...prev, data[0]]);
      }
    }

    setFollowLoading(false);
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const currentAvatar =
    selectedAvatarPreview ||
    profile.avatar_url ||
    getAvatarUrl(profile.full_name || "FaceGrem User");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Loading FaceGrem profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-5xl px-6 py-4 mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">Profile</p>
            </div>
          </div>

          <Link
            href="/feed"
            className="px-4 py-2 text-sm font-medium transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
          >
            Back to Feed
          </Link>
        </div>
      </header>

      <div className="max-w-4xl px-6 py-10 mx-auto">
        <div className="mb-8 rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-cyan-200">FaceGrem profile</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight">
                {profile.full_name || "FaceGrem User"}
              </h2>
              <p className="mt-2 text-sm text-slate-300">
                {profile.username ? `@${profile.username}` : "@yourusername"}
              </p>
            </div>

            {!isOwnProfile && (
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className="px-5 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
              >
                {followLoading
                  ? "Please wait..."
                  : existingFollow
                  ? "Unfollow"
                  : "Follow"}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6 sm:grid-cols-4">
            <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
              <p className="text-xs text-slate-400">Followers</p>
              <p className="mt-2 text-2xl font-bold">{followersCount}</p>
            </div>
            <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
              <p className="text-xs text-slate-400">Following</p>
              <p className="mt-2 text-2xl font-bold">{followingCount}</p>
            </div>
            <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
              <p className="text-xs text-slate-400">Posts</p>
              <p className="mt-2 text-2xl font-bold">{posts.length}</p>
            </div>
            <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
              <p className="text-xs text-slate-400">Username</p>
              <p className="mt-2 text-base font-semibold">
                {profile.username ? `@${profile.username}` : "Not set"}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-8">
            <img
              src={currentAvatar}
              alt={profile.full_name || "FaceGrem User"}
              className="object-cover w-20 h-20 rounded-3xl"
            />

            <div>
              <h3 className="text-2xl font-semibold">
                {profile.full_name || "FaceGrem User"}
              </h3>
              <p className="text-sm text-slate-400">
                {profile.username ? `@${profile.username}` : "@yourusername"}
              </p>
            </div>
          </div>

          {isOwnProfile ? (
            <div className="space-y-5">
              <div>
                <label className="text-sm text-slate-300">Profile Photo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="block w-full px-4 py-3 mt-2 text-white border rounded-2xl border-white/10 bg-white/10 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-3 file:py-2 file:text-cyan-200"
                />
                {selectedAvatarPreview && (
                  <p className="mt-2 text-xs text-cyan-300">
                    New avatar selected. Save profile to upload it.
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm text-slate-300">Full Name</label>
                <input
                  type="text"
                  value={profile.full_name}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 mt-2 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">Username</label>
                <input
                  type="text"
                  value={profile.username}
                  onChange={(e) =>
                    setProfile({ ...profile, username: e.target.value })
                  }
                  placeholder="yourusername"
                  className="w-full px-4 py-3 mt-2 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">Bio</label>
                <textarea
                  value={profile.bio}
                  onChange={(e) =>
                    setProfile({ ...profile, bio: e.target.value })
                  }
                  rows={5}
                  placeholder="Tell FaceGrem who you are..."
                  className="w-full px-4 py-3 mt-2 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || avatarUploading}
                className="w-full py-3 font-semibold text-white transition shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 hover:opacity-95 disabled:opacity-70"
              >
                {avatarUploading
                  ? "Uploading avatar..."
                  : saving
                  ? "Saving..."
                  : "Save FaceGrem Profile"}
              </button>
            </div>
          ) : (
            <div className="p-5 border rounded-2xl border-white/10 bg-white/5">
              <p className="text-sm text-slate-300">
                {profile.bio || "This user has not added a bio yet."}
              </p>
            </div>
          )}
        </div>

        <div className="mt-8 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-sm font-medium text-cyan-200">Post history</p>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">
                {isOwnProfile ? "Your posts" : `${profile.full_name || "User"}'s posts`}
              </h3>
            </div>
          </div>

          {posts.length === 0 ? (
            <div className="p-5 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-400">
              {isOwnProfile
                ? "You have not posted anything yet."
                : "This user has not posted anything yet."}
            </div>
          ) : (
            <div className="space-y-5">
              {posts.map((post) => {
                const likesCount = getPostLikesCount(post.id);
                const commentsCount = getPostCommentsCount(post.id);
                const postAuthorName = profile.full_name || post.full_name || "FaceGrem User";
                const postAuthorAvatar =
                  profile.avatar_url ||
                  post.avatar_url ||
                  getAvatarUrl(postAuthorName);

                return (
                  <article
                    key={post.id}
                    className="rounded-[28px] border border-white/10 bg-white/5 p-5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Link
                        href={`/profile?id=${post.user_id}`}
                        className="flex items-center gap-3 hover:opacity-90"
                      >
                        <img
                          src={postAuthorAvatar}
                          alt={postAuthorName}
                          className="object-cover w-12 h-12 rounded-2xl"
                        />
                        <div>
                          <p className="font-semibold text-white">
                            {postAuthorName}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatTime(post.created_at)}
                          </p>
                        </div>
                      </Link>

                      <span className="px-3 py-1 text-xs rounded-full bg-white/10 text-slate-300">
                        Public
                      </span>
                    </div>

                    {post.content && (
                      <p className="mt-4 text-sm leading-7 text-slate-200">
                        {post.content}
                      </p>
                    )}

                    {post.image_url && (
                      <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10">
                        <img
                          src={post.image_url}
                          alt="Post"
                          className="max-h-[520px] w-full object-cover"
                        />
                      </div>
                    )}

                    {post.video_url && (
                      <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-black/30">
                        {isYouTubeUrl(post.video_url) ? (
                          <iframe
                            src={getYouTubeEmbedUrl(post.video_url)}
                            title={`profile-video-${post.id}`}
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

                    <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                      <div className="px-4 py-2 border rounded-2xl border-white/10 bg-white/5 text-slate-300">
                        ❤️ {likesCount} {likesCount === 1 ? "Like" : "Likes"}
                      </div>

                      <div className="px-4 py-2 border rounded-2xl border-white/10 bg-white/5 text-slate-300">
                        💬 {commentsCount} {commentsCount === 1 ? "Comment" : "Comments"}
                      </div>
                    </div>

                    <Link
                      href={`/post/${post.id}`}
                      className="inline-block mt-4 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                    >
                      Open post
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
          Loading FaceGrem profile...
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}