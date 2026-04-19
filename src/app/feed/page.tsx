"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

type UserProfile = {
  id?: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
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

type CommentRecord = {
  id: string;
  post_id: string;
  user_id: string;
  full_name: string | null;
  content: string;
  created_at: string;
};

type LikeRecord = {
  id: string;
  post_id: string;
  user_id: string;
};

type FollowRecord = {
  id: string;
  follower_id: string;
  following_id: string;
};

type NotificationRecord = {
  id: string;
  user_id: string;
  is_read: boolean;
};

type MessageRecord = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string | null;
  content: string;
  created_at: string;
  is_read: boolean;
};

type ConversationParticipantRecord = {
  id: string;
  conversation_id: string;
  user_id: string;
};

type SavedPostRecord = {
  id: string;
  user_id: string;
  post_id: string;
};

type FeedTab = "for-you" | "following";
type ComposerMode = "text" | "photo" | "video";
type TopicFilter = "" | "Faith" | "Business";

const storyChips = [
  { label: "For You", type: "feed" as const },
  { label: "Following", type: "feed" as const },
  { label: "Creators", type: "link" as const, href: "/videos" },
  { label: "Videos", type: "link" as const, href: "/videos" },
  { label: "Faith", type: "filter" as const },
  { label: "Business", type: "filter" as const },
];

export default function FeedPage() {
  const router = useRouter();

  const [userProfile, setUserProfile] = useState<UserProfile>({});
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [postText, setPostText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [composerMode, setComposerMode] = useState<ComposerMode>("text");
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState("");

  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [follows, setFollows] = useState<FollowRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [messages, setMessages] = useState<MessageRecord[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipantRecord[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPostRecord[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [creatingPost, setCreatingPost] = useState(false);
  const [feedTab, setFeedTab] = useState<FeedTab>("for-you");
  const [topicFilter, setTopicFilter] = useState<TopicFilter>("");
  const [followLoadingId, setFollowLoadingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostText, setEditingPostText] = useState("");

  const trending = [
    "#FaceGremLaunch",
    "#CreatorMode",
    "#NairobiConnect",
    "#ShortVideo",
    "#CommunityFirst",
  ];

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

  const resetComposerExtras = () => {
    setVideoUrl("");
    setSelectedImageFile(null);
    setSelectedImagePreview("");
  };

  const getProfileById = (profileId?: string) => {
    if (!profileId) return undefined;
    return profiles.find((profile) => profile.id === profileId);
  };

  const getBestAvatarForUser = (
    userId?: string,
    fallbackName?: string,
    fallbackAvatarUrl?: string | null
  ) => {
    const profile = userId ? getProfileById(userId) : undefined;

    return (
      profile?.avatar_url ||
      fallbackAvatarUrl ||
      getAvatarUrl(fallbackName || profile?.full_name || "FaceGrem User")
    );
  };

  const getBestNameForUser = (
    userId?: string,
    fallbackName?: string | null
  ) => {
    const profile = userId ? getProfileById(userId) : undefined;
    return profile?.full_name || fallbackName || "FaceGrem User";
  };

  useEffect(() => {
    const loadFeed = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      const fullName = session.user.user_metadata?.full_name || "FaceGrem User";
      const metadataAvatarUrl = session.user.user_metadata?.avatar_url as
        | string
        | undefined;

      const { data: myProfileData } = await supabase
        .from("profiles")
        .select("id, full_name, username, bio, avatar_url")
        .eq("id", session.user.id)
        .single();

      setUserProfile({
        id: session.user.id,
        email: session.user.email,
        full_name: myProfileData?.full_name || fullName,
        avatar_url:
          myProfileData?.avatar_url ||
          metadataAvatarUrl ||
          getAvatarUrl(myProfileData?.full_name || fullName),
      });

      const [
        { data: postsData, error: postsError },
        { data: likesData },
        { data: commentsData },
        { data: followsData },
        { data: profilesData },
        { data: notificationsData },
        { data: messagesData },
        { data: participantsData },
        { data: savedPostsData },
      ] = await Promise.all([
        supabase
          .from("posts")
          .select(
            "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
          )
          .is("community_id", null)
          .order("created_at", { ascending: false }),
        supabase.from("likes").select("id, post_id, user_id"),
        supabase
          .from("comments")
          .select("id, post_id, user_id, full_name, content, created_at")
          .order("created_at", { ascending: true }),
        supabase.from("follows").select("id, follower_id, following_id"),
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase.from("notifications").select("id, user_id, is_read"),
        supabase
          .from("messages")
          .select(
            "id, conversation_id, sender_id, sender_name, content, created_at, is_read"
          ),
        supabase
          .from("conversation_participants")
          .select("id, conversation_id, user_id"),
        supabase.from("saved_posts").select("id, user_id, post_id"),
      ]);

      if (postsError) {
        alert(postsError.message);
      } else {
        setPosts(postsData || []);
      }

      setLikes(likesData || []);
      setComments(commentsData || []);
      setFollows(followsData || []);
      setProfiles(profilesData || []);
      setNotifications(notificationsData || []);
      setMessages(messagesData || []);
      setParticipants(participantsData || []);
      setSavedPosts(savedPostsData || []);
      setLoadingPosts(false);
    };

    void loadFeed();
  }, [router]);

  useEffect(() => {
    if (!userProfile.id) return;

    const channel = supabase
      .channel(`feed-notifications-${userProfile.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          const newNotification = payload.new as NotificationRecord;

          setNotifications((prev) => {
            const exists = prev.some((item) => item.id === newNotification.id);
            if (exists) return prev;
            return [newNotification, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userProfile.id}`,
        },
        (payload) => {
          const updatedNotification = payload.new as NotificationRecord;

          setNotifications((prev) =>
            prev.map((item) =>
              item.id === updatedNotification.id ? updatedNotification : item
            )
          );
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userProfile.id]);

  const followingIds = useMemo(() => {
    if (!userProfile.id) return [];
    return follows
      .filter((follow) => follow.follower_id === userProfile.id)
      .map((follow) => follow.following_id);
  }, [follows, userProfile.id]);

  const visiblePosts = useMemo(() => {
    const basePosts =
      feedTab === "for-you"
        ? posts
        : posts.filter(
            (post) =>
              followingIds.includes(post.user_id) || post.user_id === userProfile.id
          );

    if (!topicFilter) return basePosts;

    const keywords =
      topicFilter === "Faith"
        ? ["faith", "jesus", "christ", "bible", "prayer", "gospel", "church"]
        : ["business", "money", "startup", "marketing", "brand", "sales", "client"];

    return basePosts.filter((post) => {
      const text = (post.content || "").toLowerCase();
      return keywords.some((keyword) => text.includes(keyword));
    });
  }, [feedTab, posts, followingIds, userProfile.id, topicFilter]);

  const suggestedProfiles = useMemo(() => {
    if (!userProfile.id) return [];

    return profiles
      .filter((profile) => profile.id !== userProfile.id)
      .filter((profile) => !followingIds.includes(profile.id))
      .slice(0, 5);
  }, [profiles, followingIds, userProfile.id]);

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];

    return profiles
      .filter((profile) => profile.id !== userProfile.id)
      .filter((profile) => {
        const fullName = (profile.full_name || "").toLowerCase();
        const username = (profile.username || "").toLowerCase();
        return fullName.includes(term) || username.includes(term);
      })
      .slice(0, 6);
  }, [profiles, searchTerm, userProfile.id]);

  const unreadNotificationCount = useMemo(() => {
    if (!userProfile.id) return 0;

    return notifications.filter(
      (notification) =>
        notification.user_id === userProfile.id && !notification.is_read
    ).length;
  }, [notifications, userProfile.id]);

  const myConversationIds = useMemo(() => {
    if (!userProfile.id) return [];

    return participants
      .filter((participant) => participant.user_id === userProfile.id)
      .map((participant) => participant.conversation_id);
  }, [participants, userProfile.id]);

  const unreadMessageCount = useMemo(() => {
    if (!userProfile.id) return 0;

    return messages.filter(
      (message) =>
        myConversationIds.includes(message.conversation_id) &&
        message.sender_id !== userProfile.id &&
        !message.is_read
    ).length;
  }, [messages, myConversationIds, userProfile.id]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleImageFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedImageFile(file);

    if (!file) {
      setSelectedImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setSelectedImagePreview(previewUrl);
  };

  const uploadSelectedImage = async (userId: string) => {
    if (!selectedImageFile) return null;

    const fileExt = selectedImageFile.name.split(".").pop() || "jpg";
    const safeExt = fileExt.toLowerCase();
    const filePath = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${safeExt}`;

    const { error: uploadError } = await supabase.storage
      .from("post-images")
      .upload(filePath, selectedImageFile, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("post-images").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleCreatePost = async () => {
    const trimmedText = postText.trim();
    const trimmedVideoUrl = videoUrl.trim();

    if (!trimmedText && !selectedImageFile && !trimmedVideoUrl) {
      alert("Add text, select a photo, or add a video URL before posting.");
      return;
    }

    if (composerMode === "photo" && !selectedImageFile) {
      alert("Please choose a photo from your device.");
      return;
    }

    if (composerMode === "video" && !trimmedVideoUrl) {
      alert("Please add a video URL.");
      return;
    }

    setCreatingPost(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        alert("You must be logged in.");
        setCreatingPost(false);
        router.push("/");
        return;
      }

      const fullName =
        userProfile.full_name ||
        session.user.user_metadata?.full_name ||
        "FaceGrem User";
      const avatarUrl =
        userProfile.avatar_url ||
        (session.user.user_metadata?.avatar_url as string | undefined) ||
        getAvatarUrl(fullName);

      let uploadedImageUrl: string | null = null;

      if (composerMode === "photo" && selectedImageFile) {
        uploadedImageUrl = await uploadSelectedImage(session.user.id);
      }

      const insertPayload = {
        content: trimmedText,
        user_id: session.user.id,
        full_name: fullName,
        avatar_url: avatarUrl,
        image_url: composerMode === "photo" ? uploadedImageUrl : null,
        video_url: composerMode === "video" ? trimmedVideoUrl : null,
        community_id: null,
      };

      const { data, error } = await supabase
        .from("posts")
        .insert([insertPayload])
        .select(
          "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
        );

      if (error) {
        alert(error.message);
      } else if (data && data.length > 0) {
        setPosts((prevPosts) => [data[0], ...prevPosts]);
        setPostText("");
        resetComposerExtras();
        setComposerMode("text");
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image upload failed.";
      alert(message);
    }

    setCreatingPost(false);
  };

  const handleToggleLike = async (postId: string) => {
    if (!userProfile.id) return;

    const existingLike = likes.find(
      (like) => like.post_id === postId && like.user_id === userProfile.id
    );

    if (existingLike) {
      const { error } = await supabase.from("likes").delete().eq("id", existingLike.id);

      if (!error) {
        setLikes((prev) => prev.filter((like) => like.id !== existingLike.id));
      }
    } else {
      const { data, error } = await supabase
        .from("likes")
        .insert([{ post_id: postId, user_id: userProfile.id }])
        .select("id, post_id, user_id");

      if (!error && data && data.length > 0) {
        setLikes((prev) => [...prev, data[0]]);

        const targetPost = posts.find((post) => post.id === postId);

        if (targetPost && targetPost.user_id !== userProfile.id) {
          await supabase.from("notifications").insert([
            {
              user_id: targetPost.user_id,
              actor_id: userProfile.id,
              type: "like",
              post_id: postId,
              actor_name: getBestNameForUser(userProfile.id, userProfile.full_name),
            },
          ]);
        }
      } else if (error) {
        alert(error.message);
      }
    }
  };

  const handleCommentChange = (postId: string, value: string) => {
    setCommentInputs((prev) => ({
      ...prev,
      [postId]: value,
    }));
  };

  const handleAddComment = async (postId: string) => {
    const content = (commentInputs[postId] || "").trim();
    if (!content || !userProfile.id) return;

    const { data, error } = await supabase
      .from("comments")
      .insert([
        {
          post_id: postId,
          user_id: userProfile.id,
          full_name: getBestNameForUser(userProfile.id, userProfile.full_name),
          content,
        },
      ])
      .select("id, post_id, user_id, full_name, content, created_at");

    if (!error && data && data.length > 0) {
      setComments((prev) => [...prev, data[0]]);
      setCommentInputs((prev) => ({
        ...prev,
        [postId]: "",
      }));

      const targetPost = posts.find((post) => post.id === postId);

      if (targetPost && targetPost.user_id !== userProfile.id) {
        await supabase.from("notifications").insert([
          {
            user_id: targetPost.user_id,
            actor_id: userProfile.id,
            type: "comment",
            post_id: postId,
            actor_name: getBestNameForUser(userProfile.id, userProfile.full_name),
            content,
          },
        ]);
      }
    } else if (error) {
      alert(error.message);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const { error } = await supabase.from("comments").delete().eq("id", commentId);

    if (error) {
      alert(error.message);
      return;
    }

    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  };

  const handleFollowUser = async (targetUserId: string) => {
    if (!userProfile.id || userProfile.id === targetUserId) return;

    setFollowLoadingId(targetUserId);

    const { data, error } = await supabase
      .from("follows")
      .insert([
        {
          follower_id: userProfile.id,
          following_id: targetUserId,
        },
      ])
      .select("id, follower_id, following_id");

    if (error) {
      alert(error.message);
    } else if (data && data.length > 0) {
      setFollows((prev) => [...prev, data[0]]);

      await supabase.from("notifications").insert([
        {
          user_id: targetUserId,
          actor_id: userProfile.id,
          type: "follow",
          actor_name: getBestNameForUser(userProfile.id, userProfile.full_name),
        },
      ]);
    }

    setFollowLoadingId(null);
  };

  const isPostSaved = (postId: string) => {
    if (!userProfile.id) return false;

    return savedPosts.some(
      (savedPost) =>
        savedPost.user_id === userProfile.id && savedPost.post_id === postId
    );
  };

  const handleToggleSavePost = async (postId: string) => {
    if (!userProfile.id) return;

    const existingSavedPost = savedPosts.find(
      (savedPost) =>
        savedPost.user_id === userProfile.id && savedPost.post_id === postId
    );

    if (existingSavedPost) {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", existingSavedPost.id);

      if (!error) {
        setSavedPosts((prev) =>
          prev.filter((savedPost) => savedPost.id !== existingSavedPost.id)
        );
      }
      return;
    }

    const { data, error } = await supabase
      .from("saved_posts")
      .insert([
        {
          user_id: userProfile.id,
          post_id: postId,
        },
      ])
      .select("id, user_id, post_id");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setSavedPosts((prev) => [...prev, data[0]]);
    }
  };

  const handleStartEditPost = (post: PostRecord) => {
    setEditingPostId(post.id);
    setEditingPostText(post.content);
  };

  const handleCancelEditPost = () => {
    setEditingPostId(null);
    setEditingPostText("");
  };

  const handleSaveEditedPost = async (postId: string) => {
    const trimmedContent = editingPostText.trim();

    if (!trimmedContent) {
      alert("Post cannot be empty.");
      return;
    }

    const { error } = await supabase
      .from("posts")
      .update({ content: trimmedContent })
      .eq("id", postId);

    if (error) {
      alert(error.message);
      return;
    }

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, content: trimmedContent } : post
      )
    );

    setEditingPostId(null);
    setEditingPostText("");
  };

  const handleDeletePost = async (postId: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this post?");
    if (!confirmed) return;

    const { error } = await supabase.from("posts").delete().eq("id", postId);

    if (error) {
      alert(error.message);
      return;
    }

    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setLikes((prev) => prev.filter((like) => like.post_id !== postId));
    setComments((prev) => prev.filter((comment) => comment.post_id !== postId));
    setSavedPosts((prev) => prev.filter((savedPost) => savedPost.post_id !== postId));
  };

  const handleComingSoon = (feature: "Live" | "Story") => {
    alert(`${feature} is coming soon on FaceGrem.`);
  };

  const handleSharePost = async (postId: string) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("Post link copied!");
    } catch {
      alert("Could not copy post link.");
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getPostLikes = (postId: string) =>
    likes.filter((like) => like.post_id === postId).length;

  const hasLikedPost = (postId: string) =>
    !!likes.find((like) => like.post_id === postId && like.user_id === userProfile.id);

  const getPostComments = (postId: string) =>
    comments.filter((comment) => comment.post_id === postId);

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-4 mx-auto max-w-7xl sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">Your social home</p>
            </div>
          </div>

          <div className="relative flex-1 hidden md:flex md:justify-center">
            <div className="w-full max-w-xl">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search people by name or username..."
                className="w-full px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
              />

              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-[60px] z-40 mx-auto w-full max-w-xl rounded-2xl border border-white/10 bg-[#0b1220] p-3 shadow-2xl">
                  <div className="space-y-2">
                    {searchResults.map((profile) => (
                      <Link
                        key={profile.id}
                        href={`/profile?id=${profile.id}`}
                        onClick={() => setSearchTerm("")}
                        className="flex items-center gap-3 px-3 py-3 transition rounded-2xl hover:bg-white/5"
                      >
                        <img
                          src={getBestAvatarForUser(profile.id, profile.full_name, profile.avatar_url)}
                          alt={profile.full_name || "FaceGrem User"}
                          className="object-cover w-10 h-10 rounded-2xl"
                        />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {profile.full_name || "FaceGrem User"}
                          </p>
                          <p className="text-xs text-slate-400">
                            {profile.username ? `@${profile.username}` : "@user"}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/notifications"
              className="relative px-4 py-2 text-sm font-medium transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Notifications
              {unreadNotificationCount > 0 && (
                <span className="absolute -right-2 -top-2 rounded-full bg-cyan-400 px-2 py-0.5 text-xs font-semibold text-slate-900">
                  {unreadNotificationCount}
                </span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm font-medium transition border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[260px_minmax(0,1fr)_320px]">
        <aside className="hidden lg:block">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm text-slate-400">Signed in as</p>

            <div className="flex items-center gap-3 mt-4">
              <img
                src={getBestAvatarForUser(userProfile.id, userProfile.full_name, userProfile.avatar_url)}
                alt={userProfile.full_name || "FaceGrem User"}
                className="object-cover h-14 w-14 rounded-2xl"
              />
              <div>
                <h2 className="text-xl font-semibold">{userProfile.full_name}</h2>
                <p className="text-sm text-slate-400">{userProfile.email}</p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm">
              <div className="px-4 py-3 rounded-2xl bg-white/10">Home Feed</div>

              <Link
                href="/messages"
                className="flex items-center justify-between px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/10"
              >
                <span>Messages</span>
                {unreadMessageCount > 0 && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-400 text-slate-900">
                    {unreadMessageCount}
                  </span>
                )}
              </Link>

              <Link
                href="/videos"
                className="block px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/10"
              >
                Videos
              </Link>

              <Link
                href="/communities"
                className="block px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/10"
              >
                Communities
              </Link>

              <Link
                href="/notifications"
                className="flex items-center justify-between px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/10"
              >
                <span>Notifications</span>
                {unreadNotificationCount > 0 && (
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-cyan-400 text-slate-900">
                    {unreadNotificationCount}
                  </span>
                )}
              </Link>

              <Link
                href="/saved"
                className="block px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/10"
              >
                Saved Posts
              </Link>

              <Link
                href="/profile"
                className="block px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/10"
              >
                Profile
              </Link>
            </div>
          </div>
        </aside>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl">
            <p className="text-sm font-medium text-cyan-200">Welcome back</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Good to see you, {userProfile.full_name || "FaceGrem User"}.
            </h2>
            <p className="max-w-2xl mt-3 text-sm leading-7 text-slate-300">
              Share text, photos, and video links on FaceGrem.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex flex-wrap gap-3">
              {storyChips.map((story) => {
                if (story.type === "link") {
                  return (
                    <Link
                      key={story.label}
                      href={story.href}
                      className="px-4 py-2 text-sm transition border rounded-full border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    >
                      {story.label}
                    </Link>
                  );
                }

                if (story.label === "For You") {
                  return (
                    <button
                      key={story.label}
                      onClick={() => {
                        setFeedTab("for-you");
                        setTopicFilter("");
                      }}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        feedTab === "for-you" && !topicFilter
                          ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
                          : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {story.label}
                    </button>
                  );
                }

                if (story.label === "Following") {
                  return (
                    <button
                      key={story.label}
                      onClick={() => {
                        setFeedTab("following");
                        setTopicFilter("");
                      }}
                      className={`rounded-full px-4 py-2 text-sm transition ${
                        feedTab === "following" && !topicFilter
                          ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
                          : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                      }`}
                    >
                      {story.label}
                    </button>
                  );
                }

                return (
                  <button
                    key={story.label}
                    onClick={() => {
                      setFeedTab("for-you");
                      setTopicFilter(story.label as TopicFilter);
                    }}
                    className={`rounded-full px-4 py-2 text-sm transition ${
                      topicFilter === story.label
                        ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
                        : "border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
                    }`}
                  >
                    {story.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/10 p-5 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <img
                src={getBestAvatarForUser(userProfile.id, userProfile.full_name, userProfile.avatar_url)}
                alt={userProfile.full_name || "FaceGrem User"}
                className="object-cover w-12 h-12 rounded-2xl"
              />

              <div className="flex-1">
                <textarea
                  value={postText}
                  onChange={(e) => setPostText(e.target.value)}
                  rows={4}
                  placeholder="What do you want to share today?"
                  className="w-full px-4 py-3 text-sm text-white transition border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 focus:border-cyan-400/60"
                />

                {composerMode === "photo" && (
                  <div className="mt-4 space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="block w-full px-4 py-3 text-sm text-white border rounded-2xl border-white/10 bg-white/5 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-3 file:py-2 file:text-cyan-200"
                    />

                    {selectedImagePreview && (
                      <div className="overflow-hidden rounded-[24px] border border-white/10">
                        <img
                          src={selectedImagePreview}
                          alt="Preview"
                          className="object-cover w-full max-h-80"
                        />
                      </div>
                    )}
                  </div>
                )}

                {composerMode === "video" && (
                  <div className="mt-4">
                    <input
                      type="text"
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="Paste video URL..."
                      className="w-full px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
                  <div className="flex flex-wrap gap-2 text-xs text-slate-300">
                    <button
                      onClick={() => {
                        setComposerMode((prev) => (prev === "photo" ? "text" : "photo"));
                        if (composerMode !== "photo") {
                          setVideoUrl("");
                        }
                      }}
                      className={`rounded-full px-3 py-2 ${
                        composerMode === "photo"
                          ? "bg-cyan-500/20 text-cyan-200"
                          : "bg-white/10"
                      }`}
                    >
                      Photo
                    </button>

                    <button
                      onClick={() => {
                        setComposerMode((prev) => (prev === "video" ? "text" : "video"));
                        if (composerMode !== "video") {
                          setSelectedImageFile(null);
                          setSelectedImagePreview("");
                        }
                      }}
                      className={`rounded-full px-3 py-2 ${
                        composerMode === "video"
                          ? "bg-cyan-500/20 text-cyan-200"
                          : "bg-white/10"
                      }`}
                    >
                      Video
                    </button>

                    <button
                      onClick={() => handleComingSoon("Live")}
                      className="px-3 py-2 rounded-full bg-white/10"
                    >
                      Live
                    </button>

                    <button
                      onClick={() => handleComingSoon("Story")}
                      className="px-3 py-2 rounded-full bg-white/10"
                    >
                      Story
                    </button>
                  </div>

                  <button
                    onClick={handleCreatePost}
                    disabled={creatingPost}
                    className="px-5 py-3 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
                  >
                    {creatingPost ? "Posting..." : "Post to FaceGrem"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {loadingPosts ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-slate-300 backdrop-blur-xl">
              Loading posts...
            </div>
          ) : visiblePosts.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm text-slate-300 backdrop-blur-xl">
              {topicFilter
                ? `No ${topicFilter.toLowerCase()} posts found yet.`
                : feedTab === "following"
                ? "No posts from people you follow yet."
                : "No posts yet. Be the first to post on FaceGrem."}
            </div>
          ) : (
            visiblePosts.map((post) => {
              const postComments = getPostComments(post.id);
              const liked = hasLikedPost(post.id);
              const likeCount = getPostLikes(post.id);

              const authorName = getBestNameForUser(post.user_id, post.full_name);
              const authorAvatar = getBestAvatarForUser(
                post.user_id,
                post.full_name || undefined,
                post.avatar_url
              );

              return (
                <article
                  key={post.id}
                  className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between gap-4">
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
                          {formatTime(post.created_at)}
                        </p>
                      </div>
                    </Link>

                    <span className="px-3 py-1 text-xs rounded-full bg-white/10 text-slate-300">
                      Public
                    </span>
                  </div>

                  {post.user_id === userProfile.id && editingPostId !== post.id && (
                    <div className="flex gap-3 mt-4">
                      <button
                        onClick={() => handleStartEditPost(post)}
                        className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="px-4 py-2 text-sm text-red-200 border rounded-2xl border-red-400/20 bg-red-500/10 hover:bg-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  )}

                  {editingPostId === post.id ? (
                    <div className="mt-4 space-y-3">
                      <textarea
                        value={editingPostText}
                        onChange={(e) => setEditingPostText(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 text-sm text-white border outline-none resize-none rounded-2xl border-white/10 bg-white/5"
                      />
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleSaveEditedPost(post.id)}
                          className="px-4 py-2 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelEditPost}
                          className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {post.content && (
                        <p className="mt-4 text-sm leading-7 text-slate-200">{post.content}</p>
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
                              title={`video-${post.id}`}
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

                      {!post.image_url && !post.video_url && (
                        <div className="mt-5 h-40 rounded-[28px] bg-gradient-to-br from-cyan-400/10 via-blue-500/10 to-purple-500/10" />
                      )}
                    </>
                  )}

                  <Link
                    href={`/post/${post.id}`}
                    className="inline-block mt-4 text-sm font-medium text-cyan-300 hover:text-cyan-200"
                  >
                    Open post
                  </Link>

                  <div className="flex flex-wrap items-center gap-3 mt-5 text-sm">
                    <button
                      onClick={() => handleToggleLike(post.id)}
                      className={`rounded-2xl px-4 py-2 font-medium transition ${
                        liked
                          ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      ❤️ {likeCount} {likeCount === 1 ? "Like" : "Likes"}
                    </button>

                    <div className="px-4 py-2 border rounded-2xl border-white/10 bg-white/5 text-slate-300">
                      💬 {postComments.length} {postComments.length === 1 ? "Comment" : "Comments"}
                    </div>

                    <button
                      onClick={() => handleToggleSavePost(post.id)}
                      className={`rounded-2xl px-4 py-2 font-medium transition ${
                        isPostSaved(post.id)
                          ? "border border-cyan-400/20 bg-cyan-500/20 text-cyan-200"
                          : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      🔖 {isPostSaved(post.id) ? "Saved" : "Save"}
                    </button>

                    <button
                      onClick={() => handleSharePost(post.id)}
                      className="px-4 py-2 border rounded-2xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                    >
                      ↗ Share
                    </button>
                  </div>

                  <div className="mt-5 space-y-3">
                    {postComments.map((comment) => {
                      const commentAuthorName = getBestNameForUser(
                        comment.user_id,
                        comment.full_name
                      );
                      const commentAuthorAvatar = getBestAvatarForUser(
                        comment.user_id,
                        comment.full_name || undefined,
                        null
                      );

                      return (
                        <div
                          key={comment.id}
                          className="px-4 py-3 border rounded-2xl border-white/10 bg-white/5"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex gap-3">
                              <img
                                src={commentAuthorAvatar}
                                alt={commentAuthorName}
                                className="object-cover w-10 h-10 rounded-2xl"
                              />
                              <div>
                                <p className="text-sm font-semibold text-white">
                                  {commentAuthorName}
                                </p>
                                <p className="mt-1 text-sm text-slate-300">
                                  {comment.content}
                                </p>
                                <p className="mt-2 text-xs text-slate-500">
                                  {formatTime(comment.created_at)}
                                </p>
                              </div>
                            </div>

                            {comment.user_id === userProfile.id && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                className="px-3 py-2 text-xs border rounded-xl border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex gap-3 mt-4">
                    <input
                      type="text"
                      value={commentInputs[post.id] || ""}
                      onChange={(e) => handleCommentChange(post.id, e.target.value)}
                      placeholder="Write a comment..."
                      className="flex-1 px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="px-4 py-3 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600"
                    >
                      Comment
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>

        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-slate-300">Suggested users</p>
            <div className="mt-4 space-y-4">
              {suggestedProfiles.length === 0 ? (
                <p className="text-sm text-slate-400">No suggestions right now.</p>
              ) : (
                suggestedProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <Link
                      href={`/profile?id=${profile.id}`}
                      className="flex items-center gap-3 hover:opacity-90"
                    >
                      <img
                        src={getBestAvatarForUser(profile.id, profile.full_name, profile.avatar_url)}
                        alt={profile.full_name || "FaceGrem User"}
                        className="object-cover w-10 h-10 rounded-2xl"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">
                          {profile.full_name || "FaceGrem User"}
                        </p>
                        <p className="text-xs text-slate-400">
                          {profile.username ? `@${profile.username}` : "@user"}
                        </p>
                      </div>
                    </Link>

                    <button
                      onClick={() => handleFollowUser(profile.id)}
                      disabled={followLoadingId === profile.id}
                      className="px-3 py-2 text-xs font-semibold bg-white rounded-xl text-slate-900 disabled:opacity-70"
                    >
                      {followLoadingId === profile.id ? "..." : "Follow"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-slate-300">Trending now</p>
            <div className="mt-4 space-y-3">
              {trending.map((item) => (
                <div
                  key={item}
                  className="px-4 py-3 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}