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
        setFollows((prev) =>
          prev.filter((follow) => follow.id !== existingFollow.id)
        );
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
}"use client";

import Link from "next/link";
import { ChangeEvent, Suspense, useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";
import MobileBottomNav from "../../components/MobileBottomNav";

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
  const [sessionUserName, setSessionUserName] = useState("FaceGrem User");
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
  const [searchText, setSearchText] = useState("");

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
      const loggedInUserName =
        session.user.user_metadata?.full_name || "FaceGrem User";

      setSessionUserId(loggedInUserId);
      setSessionUserName(loggedInUserName);

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
          full_name: loggedInUserName,
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

  const filteredPosts = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    if (!term) return posts;

    return posts.filter((post) => {
      const text = `${post.content} ${profile.full_name} ${profile.username}`.toLowerCase();
      return text.includes(term);
    });
  }, [posts, searchText, profile.full_name, profile.username]);

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
        setFollows((prev) =>
          prev.filter((follow) => follow.id !== existingFollow.id)
        );
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

  const getPostLikesCount = (postId: string) =>
    likes.filter((like) => like.post_id === postId).length;

  const getPostCommentsCount = (postId: string) =>
    comments.filter((comment) => comment.post_id === postId).length;

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const currentAvatar =
    selectedAvatarPreview ||
    profile.avatar_url ||
    getAvatarUrl(profile.full_name || "FaceGrem User");

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
        Loading FaceGrem profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020817] pb-24 text-white xl:pb-0">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.10),transparent_25%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.10),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.08),transparent_22%),linear-gradient(to_bottom,#020817,#07111f_45%,#020817)]" />
        <div className="absolute left-0 rounded-full top-10 h-72 w-72 bg-cyan-400/10 blur-3xl" />
        <div className="absolute top-0 right-0 rounded-full h-96 w-96 bg-blue-500/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#020817]/75 backdrop-blur-2xl">
        <div className="flex items-center gap-3 px-4 py-4 mx-auto max-w-7xl sm:px-6">
          <div className="flex items-center gap-3">
            <Link href="/feed" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 font-bold text-white shadow-[0_12px_40px_rgba(34,211,238,0.28)] sm:h-12 sm:w-12">
                F
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold tracking-tight text-white">FaceGrem</h1>
                <p className="text-xs text-slate-400">Profile</p>
              </div>
            </Link>
          </div>

          <div className="flex-1 hidden lg:block">
            <div className="max-w-xl mx-auto">
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.18)] transition focus-within:border-cyan-400/40">
                <span className="text-sm text-slate-400">⌕</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search posts on this profile..."
                  className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {!isOwnProfile && (
              <button
                onClick={handleToggleFollow}
                disabled={followLoading}
                className="rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-70"
              >
                {followLoading ? "Please wait..." : existingFollow ? "Unfollow" : "Follow"}
              </button>
            )}

            <Link
              href="/feed"
              className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10 md:inline-flex"
            >
              Feed
            </Link>

            <Link
              href="/profile"
              className="flex items-center gap-2 px-2 py-2 transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 sm:px-2 sm:pr-3"
            >
              <img
                src={currentAvatar}
                alt={profile.full_name || "FaceGrem User"}
                className="object-cover h-9 w-9 rounded-xl ring-1 ring-cyan-400/20"
              />
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-white lg:inline-block">
                {profile.full_name || sessionUserName}
              </span>
            </Link>
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-6 lg:hidden">
          <div className="mx-auto space-y-3 max-w-7xl">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-[0_10px_35px_rgba(15,23,42,0.18)] transition focus-within:border-cyan-400/40">
              <span className="text-sm text-slate-400">⌕</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search profile posts..."
                className="w-full text-sm text-white bg-transparent outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <Link
                href="/feed"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Feed
              </Link>
              <Link
                href="/videos"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Videos
              </Link>
              <Link
                href="/communities"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Groups
              </Link>
              <Link
                href="/messages"
                className="px-3 py-3 text-xs font-medium text-center text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Chat
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="hidden xl:block">
          <div className="sticky top-[104px] space-y-4">
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(34,211,238,0.12),rgba(15,23,42,0.94)_45%,rgba(30,41,59,0.94))] p-4 shadow-[0_20px_60px_rgba(6,182,212,0.10)] backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <img
                  src={currentAvatar}
                  alt={profile.full_name || "FaceGrem User"}
                  className="object-cover h-14 w-14 rounded-2xl ring-2 ring-cyan-400/20"
                />
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">
                    {profile.full_name || "FaceGrem User"}
                  </p>
                  <p className="text-sm truncate text-slate-400">
                    {profile.username ? `@${profile.username}` : "@yourusername"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Followers</p>
                  <p className="mt-1 text-sm font-semibold text-white">{followersCount}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Following</p>
                  <p className="mt-1 text-sm font-semibold text-white">{followingCount}</p>
                </div>
                <div className="px-3 py-3 text-center border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-[11px] text-slate-400">Posts</p>
                  <p className="mt-1 text-sm font-semibold text-white">{posts.length}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-3 backdrop-blur-xl">
              <p className="px-2 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                Navigate
              </p>

              <div className="space-y-1.5">
                <Link
                  href="/feed"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">🏠</span>
                    Home feed
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/videos"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">🎬</span>
                    Videos
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/communities"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">👥</span>
                    Communities
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/messages"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">💬</span>
                    Messages
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>

                <Link
                  href="/profile"
                  className="flex items-center justify-between px-4 py-3 text-sm text-white transition rounded-2xl hover:bg-white/10"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-base">👤</span>
                    Profile
                  </span>
                  <span className="text-slate-500">→</span>
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <p className="text-sm font-semibold text-cyan-200">About</p>
              <div className="p-4 mt-4 border rounded-2xl border-white/10 bg-white/5">
                <p className="text-sm leading-7 text-slate-300">
                  {profile.bio || "This user has not added a bio yet."}
                </p>
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5 sm:space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(135deg,rgba(8,47,73,0.95),rgba(15,23,42,0.95)_55%,rgba(30,41,59,0.95))] p-6 shadow-[0_30px_120px_rgba(6,182,212,0.10)]">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <img
                  src={currentAvatar}
                  alt={profile.full_name || "FaceGrem User"}
                  className="h-20 w-20 rounded-[28px] object-cover ring-2 ring-cyan-400/20 sm:h-24 sm:w-24"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-cyan-200">
                    {isOwnProfile ? "Your profile" : "Profile"}
                  </p>
                  <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    {profile.full_name || "FaceGrem User"}
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    {profile.username ? `@${profile.username}` : "@yourusername"}
                  </p>
                  <p className="max-w-xl mt-3 text-sm leading-7 text-slate-300">
                    {profile.bio || "No bio has been added yet."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Followers</p>
                  <p className="mt-2 text-2xl font-bold text-white">{followersCount}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Following</p>
                  <p className="mt-2 text-2xl font-bold text-white">{followingCount}</p>
                </div>
                <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                  <p className="text-xs text-slate-400">Posts</p>
                  <p className="mt-2 text-2xl font-bold text-white">{posts.length}</p>
                </div>
              </div>
            </div>
          </div>

          {isOwnProfile ? (
            <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(30,41,59,0.92)_45%,rgba(15,23,42,0.96))] shadow-[0_25px_80px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:rounded-[34px]">
              <div className="px-4 py-4 border-b border-white/10 sm:px-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-cyan-200">Edit profile</p>
                    <p className="mt-1 text-xs text-slate-400">
                      Update your FaceGrem identity and profile details
                    </p>
                  </div>

                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200">
                    Profile tools
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div className="space-y-4">
                    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-white/5 p-4">
                      <img
                        src={currentAvatar}
                        alt={profile.full_name || "FaceGrem User"}
                        className="h-44 w-full rounded-[24px] object-cover"
                      />
                    </div>

                    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                      <label className="text-sm font-medium text-white">Profile photo</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarFileChange}
                        className="mt-3 block w-full rounded-2xl text-sm text-white file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2.5 file:text-cyan-200"
                      />
                      {selectedAvatarPreview && (
                        <p className="mt-3 text-xs text-cyan-300">
                          New avatar selected. Save profile to upload it.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
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
                    </div>

                    <div>
                      <label className="text-sm text-slate-300">Bio</label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) =>
                          setProfile({ ...profile, bio: e.target.value })
                        }
                        rows={6}
                        placeholder="Tell FaceGrem who you are..."
                        className="w-full px-4 py-3 mt-2 text-white transition border outline-none rounded-2xl border-white/10 bg-white/10 placeholder:text-slate-400 focus:border-cyan-400/60"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={handleSave}
                        disabled={saving || avatarUploading}
                        className="px-6 py-3 font-semibold text-white transition shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 hover:opacity-95 disabled:opacity-70"
                      >
                        {avatarUploading
                          ? "Uploading avatar..."
                          : saving
                          ? "Saving..."
                          : "Save FaceGrem Profile"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-cyan-200">About this person</p>
                  <p className="mt-2 text-sm leading-7 text-slate-300">
                    {profile.bio || "This user has not added a bio yet."}
                  </p>
                </div>

                <div className="flex gap-3">
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

                  <Link
                    href={`/messages?user=${profile.id}`}
                    className="px-5 py-3 text-sm font-medium transition border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                  >
                    Message
                  </Link>
                </div>
              </div>
            </div>
          )}

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Post history</p>
                <h3 className="mt-1 text-2xl font-bold tracking-tight text-white">
                  {isOwnProfile ? "Your posts" : `${profile.full_name || "User"}'s posts`}
                </h3>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
                {filteredPosts.length} visible
              </span>
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="rounded-[30px] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
              <p className="text-lg font-medium text-white">
                {isOwnProfile
                  ? "You have not posted anything yet."
                  : "This user has not posted anything yet."}
              </p>
              <p className="mt-2 text-sm text-slate-400">
                Posts from this profile will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => {
                const likesCount = getPostLikesCount(post.id);
                const commentsCount = getPostCommentsCount(post.id);

                const latestComments = comments
                  .filter((comment) => comment.post_id === post.id)
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                  )
                  .slice(0, 2);

                return (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-[32px] border border-white/10 bg-white/5 shadow-[0_20px_60px_rgba(15,23,42,0.45)] backdrop-blur-xl"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          href={`/profile?id=${post.user_id}`}
                          className="flex items-center min-w-0 gap-3 hover:opacity-90"
                        >
                          <img
                            src={currentAvatar}
                            alt={profile.full_name || "FaceGrem User"}
                            className="object-cover w-12 h-12 rounded-2xl ring-1 ring-white/10"
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-white truncate">
                                {profile.full_name || "FaceGrem User"}
                              </p>

                              {profile.username && (
                                <span className="text-sm truncate text-slate-400">
                                  @{profile.username}
                                </span>
                              )}

                              <span className="hidden w-1 h-1 rounded-full bg-slate-500 sm:block" />

                              <span className="text-xs text-slate-400">
                                {formatTime(post.created_at)}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                                Public
                              </span>

                              {post.video_url && (
                                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-200">
                                  Video post
                                </span>
                              )}

                              {post.image_url && !post.video_url && (
                                <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-2.5 py-1 text-[11px] text-fuchsia-200">
                                  Photo post
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>
                      </div>

                      {post.content && (
                        <div className="mt-5">
                          <p className="text-[15px] leading-8 text-slate-200">
                            {post.content}
                          </p>
                        </div>
                      )}
                    </div>

                    {post.image_url && (
                      <div className="px-3 pb-3 border-y border-white/10 bg-black/20 sm:px-4 sm:pb-4">
                        <div className="overflow-hidden rounded-[28px]">
                          <img
                            src={post.image_url}
                            alt="Post"
                            className="max-h-[720px] w-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {post.video_url && (
                      <div className="px-3 pb-3 border-y border-white/10 bg-black/30 sm:px-4 sm:pb-4">
                        <div className="overflow-hidden rounded-[28px]">
                          {isYouTubeUrl(post.video_url) ? (
                            <iframe
                              src={getYouTubeEmbedUrl(post.video_url)}
                              title={`profile-video-${post.id}`}
                              className="h-80 w-full md:h-[480px]"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              controls
                              className="h-80 w-full bg-black md:h-[480px]"
                              src={post.video_url}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
                            <span className="text-base">❤️</span>
                            <span className="text-slate-200">
                              {likesCount} {likesCount === 1 ? "like" : "likes"}
                            </span>
                          </div>

                          <div className="rounded-full bg-white/5 px-3 py-1.5 text-slate-300">
                            {commentsCount}{" "}
                            {commentsCount === 1 ? "comment" : "comments"}
                          </div>
                        </div>

                        <Link
                          href={`/post/${post.id}`}
                          className="text-sm font-medium transition text-cyan-300 hover:text-cyan-200"
                        >
                          View discussion
                        </Link>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                        <div className="px-4 py-3 text-sm font-medium text-center border rounded-2xl border-white/10 bg-white/5 text-slate-300">
                          {likesCount} Likes
                        </div>

                        <div className="px-4 py-3 text-sm font-medium text-center border rounded-2xl border-white/10 bg-white/5 text-slate-300">
                          {commentsCount} Comments
                        </div>

                        <Link
                          href={`/post/${post.id}`}
                          className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                        >
                          Open
                        </Link>

                        <Link
                          href={`/messages?user=${post.user_id}`}
                          className="px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        >
                          Message
                        </Link>
                      </div>

                      {latestComments.length > 0 && (
                        <div className="pt-4 mt-5 space-y-3 border-t border-white/10">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Recent comments
                          </p>

                          {latestComments.map((comment) => {
                            const commentAuthorAvatar = getAvatarUrl(
                              comment.full_name || "FaceGrem User"
                            );

                            return (
                              <div
                                key={comment.id}
                                className="flex items-start gap-3 px-3 py-3 border rounded-2xl border-white/10 bg-white/5"
                              >
                                <img
                                  src={commentAuthorAvatar}
                                  alt={comment.full_name || "FaceGrem User"}
                                  className="object-cover h-9 w-9 rounded-xl"
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-white">
                                      {comment.full_name || "FaceGrem User"}
                                    </p>
                                    <span className="text-[11px] text-slate-400">
                                      {formatTime(comment.created_at)}
                                    </span>
                                  </div>

                                  <p className="mt-1 text-sm leading-6 line-clamp-2 text-slate-300">
                                    {comment.content}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <aside className="space-y-5 xl:space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Profile snapshot</p>
                <p className="mt-1 text-xs text-slate-400">Quick view of this account</p>
              </div>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                <p className="text-xs text-slate-400">Name</p>
                <p className="mt-2 font-medium text-white">
                  {profile.full_name || "FaceGrem User"}
                </p>
              </div>

              <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                <p className="text-xs text-slate-400">Username</p>
                <p className="mt-2 font-medium text-white">
                  {profile.username ? `@${profile.username}` : "Not set"}
                </p>
              </div>

              <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                <p className="text-xs text-slate-400">Bio</p>
                <p className="mt-2 text-sm leading-7 text-slate-300">
                  {profile.bio || "No bio yet."}
                </p>
              </div>
            </div>
          </div>

          {!isOwnProfile && (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-cyan-200">Actions</p>
                  <p className="mt-1 text-xs text-slate-400">Connect with this person</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <button
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className="w-full px-4 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
                >
                  {followLoading ? "Please wait..." : existingFollow ? "Unfollow" : "Follow"}
                </button>

                <Link
                  href={`/messages?user=${profile.id}`}
                  className="block px-4 py-3 text-sm font-medium text-center transition border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                >
                  Send message
                </Link>
              </div>
            </div>
          )}

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-cyan-200">Quick links</p>
                <p className="mt-1 text-xs text-slate-400">Move around FaceGrem fast</p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <Link
                href="/feed"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Back to feed
              </Link>
              <Link
                href="/videos"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Open videos
              </Link>
              <Link
                href="/communities"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Explore communities
              </Link>
              <Link
                href="/messages"
                className="block px-4 py-3 text-sm text-white transition border rounded-2xl border-white/10 bg-white/5 hover:bg-white/10"
              >
                Open messages
              </Link>
            </div>
          </div>
        </aside>
      </main>

      <MobileBottomNav />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#020817] text-white">
          Loading FaceGrem profile...
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}