"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import MobileBottomNav from "../../components/MobileBottomNav";
import FaceGremLogo from "../../components/FaceGremLogo";
import { CommunityCircleIcon, FriendsFistIcon, GroupPeopleIcon, MessageBubblesIcon, TranslateLanguageIcon } from "../../components/FaceGremCustomIcons";

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

type SavedPostRecord = {
  id: string;
  user_id: string;
  post_id: string;
};

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

type VideoRecord = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string | null;
  video_url: string;
  thumbnail_url: string | null;
  views_count: number | null;
  created_at: string;
};

type NotificationRecord = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  post_id: string | null;
  actor_name: string | null;
  content: string | null;
  is_read: boolean | null;
  created_at: string;
};

type StoryRecord = {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
};

type FollowRecord = {
  id: string;
  follower_id: string;
  following_id: string;
};

const quickActions = ["Photo", "Video", "Live", "Story"] as const;
const feedTabs = ["For You", "Following", "Creators", "Videos", "Faith", "Business"] as const;

const glassCard =
  "border border-slate-200 bg-white shadow-sm";
const softCard =
  "border border-slate-200 bg-white shadow-sm";

export default function FeedPage() {
  const router = useRouter();
  const storyInputRef = useRef<HTMLInputElement | null>(null);

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [userAvatar, setUserAvatar] = useState("");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [posts, setPosts] = useState<PostRecord[]>([]);
  const [likes, setLikes] = useState<LikeRecord[]>([]);
  const [comments, setComments] = useState<CommentRecord[]>([]);
  const [savedPosts, setSavedPosts] = useState<SavedPostRecord[]>([]);
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [communityMembers, setCommunityMembers] = useState<CommunityMemberRecord[]>([]);
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [stories, setStories] = useState<StoryRecord[]>([]);
  const [follows, setFollows] = useState<FollowRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeComposerAction, setActiveComposerAction] =
    useState<(typeof quickActions)[number]>("Photo");
  const [activeFeedTab, setActiveFeedTab] =
    useState<(typeof feedTabs)[number]>("For You");

  const [postText, setPostText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [posting, setPosting] = useState(false);
  const [searchText, setSearchText] = useState("");

  const [storyUploading, setStoryUploading] = useState(false);
  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [activeStoryUserId, setActiveStoryUserId] = useState("");
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileCardOpen, setIsProfileCardOpen] = useState(false);

  const [activeRightPanel, setActiveRightPanel] = useState<
    "friends" | "communities" | "messages" | "videos"
  >("friends");
  const [activeFriendsTab, setActiveFriendsTab] = useState<
    "online" | "suggestions" | "your_friends"
  >("online");

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
    const loadFeed = async () => {
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

      const nowIso = new Date().toISOString();

      const [
        { data: profilesData },
        { data: postsData },
        { data: likesData },
        { data: commentsData },
        { data: savedPostsData },
        { data: communitiesData },
        { data: communityMembersData },
        { data: videosData },
        { data: notificationsData },
        { data: storiesData },
        { data: followsData },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
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
          .select("id, post_id, user_id, full_name, content, created_at"),
        supabase.from("saved_posts").select("id, user_id, post_id"),
        supabase
          .from("communities")
          .select("id, creator_id, name, category, description, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("community_members")
          .select("id, community_id, user_id, created_at"),
        supabase
          .from("videos")
          .select(
            "id, user_id, title, description, category, video_url, thumbnail_url, views_count, created_at"
          )
          .order("created_at", { ascending: false }),
        supabase
          .from("notifications")
          .select(
            "id, user_id, actor_id, type, post_id, actor_name, content, is_read, created_at"
          )
          .eq("user_id", currentUserId)
          .order("created_at", { ascending: false }),
        supabase
          .from("stories")
          .select("id, user_id, image_url, caption, created_at, expires_at")
          .gt("expires_at", nowIso)
          .order("created_at", { ascending: false }),
        supabase.from("follows").select("id, follower_id, following_id"),
      ]);

      const allProfiles = profilesData || [];
      const myProfile = allProfiles.find((profile) => profile.id === currentUserId);

      setProfiles(allProfiles);
      setPosts(postsData || []);
      setLikes(likesData || []);
      setComments(commentsData || []);
      setSavedPosts(savedPostsData || []);
      setCommunities(communitiesData || []);
      setCommunityMembers(communityMembersData || []);
      setVideos(videosData || []);
      setNotifications(notificationsData || []);
      setStories(storiesData || []);
      setFollows(followsData || []);
      setUserAvatar(
        myProfile?.avatar_url || getAvatarUrl(myProfile?.full_name || currentUserName)
      );
      setLoading(false);
    };

    void loadFeed();
  }, [router]);

  const isFollowingUser = (targetUserId: string) =>
    follows.some(
      (follow) =>
        follow.follower_id === userId && follow.following_id === targetUserId
    );

  const myCommunityIds = useMemo(() => {
    return communityMembers
      .filter((member) => member.user_id === userId)
      .map((member) => member.community_id);
  }, [communityMembers, userId]);

  const unreadNotificationsCount = notifications.filter(
    (notification) => !notification.is_read
  ).length;

  const suggestedPeople = useMemo(() => {
    return profiles
      .filter((profile) => profile.id !== userId && !isFollowingUser(profile.id))
      .slice(0, 6);
  }, [profiles, userId, follows]);

  const onlinePeople = useMemo(() => {
    const followedIds = follows
      .filter((follow) => follow.follower_id === userId)
      .map((follow) => follow.following_id);

    return profiles
      .filter((profile) => followedIds.includes(profile.id))
      .slice(0, 6);
  }, [profiles, follows, userId]);

  const yourFriends = useMemo(() => {
    const relatedIds = new Set<string>();

    follows.forEach((follow) => {
      if (follow.follower_id === userId) relatedIds.add(follow.following_id);
      if (follow.following_id === userId) relatedIds.add(follow.follower_id);
    });

    return profiles.filter((profile) => relatedIds.has(profile.id)).slice(0, 8);
  }, [profiles, follows, userId]);

  const suggestedCommunities = useMemo(() => {
    return communities
      .filter((community) => !myCommunityIds.includes(community.id))
      .slice(0, 5);
  }, [communities, myCommunityIds]);

  const latestVideoCards = useMemo(() => videos.slice(0, 4), [videos]);
  const latestActivity = useMemo(() => notifications.slice(0, 5), [notifications]);

  const filteredPosts = useMemo(() => {
    let result = [...posts];

    switch (activeFeedTab) {
      case "Following":
        result = result.filter((post) => isFollowingUser(post.user_id));
        break;
      case "Creators":
        result = result.filter((post) => {
          const profile = getProfileById(post.user_id);
          return !!profile?.username;
        });
        break;
      case "Faith":
        result = result.filter((post) => {
          const text = `${post.content} ${post.full_name || ""}`.toLowerCase();
          return (
            text.includes("faith") ||
            text.includes("jesus") ||
            text.includes("church") ||
            text.includes("gospel")
          );
        });
        break;
      case "Business":
        result = result.filter((post) => {
          const text = `${post.content} ${post.full_name || ""}`.toLowerCase();
          return (
            text.includes("business") ||
            text.includes("money") ||
            text.includes("brand") ||
            text.includes("market")
          );
        });
        break;
      case "Videos":
        result = result.filter((post) => !!post.video_url);
        break;
      case "For You":
      default:
        break;
    }

    const term = searchText.trim().toLowerCase();
    if (!term) return result;

    return result.filter((post) => {
      const author = getBestNameForUser(post.user_id, post.full_name).toLowerCase();
      const text = `${post.content} ${author}`.toLowerCase();
      return text.includes(term);
    });
  }, [activeFeedTab, posts, searchText, profiles, follows, userId]);

  const storyGroups = useMemo(() => {
    const grouped = new Map<string, StoryRecord[]>();

    for (const story of stories) {
      if (!grouped.has(story.user_id)) grouped.set(story.user_id, []);
      grouped.get(story.user_id)?.push(story);
    }

    const items = Array.from(grouped.entries()).map(([storyUserId, userStories]) => ({
      userId: storyUserId,
      stories: userStories
        .slice()
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      latestCreatedAt: userStories
        .slice()
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0]?.created_at,
    }));

    items.sort((a, b) => {
      if (a.userId === userId) return -1;
      if (b.userId === userId) return 1;
      return (
        new Date(b.latestCreatedAt || 0).getTime() -
        new Date(a.latestCreatedAt || 0).getTime()
      );
    });

    return items;
  }, [stories, userId]);

  const highlightedProfiles = useMemo(() => {
    const storyUserIds = new Set(storyGroups.map((group) => group.userId));
    return profiles
      .filter((profile) => profile.id !== userId && !storyUserIds.has(profile.id))
      .slice(0, 6);
  }, [profiles, userId, storyGroups]);

  const activeStoryGroup = useMemo(() => {
    if (!activeStoryUserId) return null;
    return storyGroups.find((group) => group.userId === activeStoryUserId) || null;
  }, [activeStoryUserId, storyGroups]);

  const activeStory = useMemo(() => {
    if (!activeStoryGroup) return null;
    return activeStoryGroup.stories[activeStoryIndex] || null;
  }, [activeStoryGroup, activeStoryIndex]);

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

  const uploadStoryImage = async (file: File) => {
    if (!userId) return null;

    const fileExt = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt.toLowerCase()}`;

    const { error: uploadError } = await supabase.storage
      .from("stories")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("stories").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleCreatePost = async () => {
    if (!userId) return;

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
      setActiveComposerAction("Photo");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not create post.");
    }

    setPosting(false);
  };

  const handleCreateStory = async (file: File) => {
    if (!userId) return;

    setStoryUploading(true);

    try {
      const imageUrl = await uploadStoryImage(file);

      if (!imageUrl) {
        throw new Error("Could not upload story image.");
      }

      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from("stories")
        .insert([
          {
            user_id: userId,
            image_url: imageUrl,
            caption: "",
            expires_at: expiresAt,
          },
        ])
        .select("id, user_id, image_url, caption, created_at, expires_at");

      if (error) {
        alert(error.message);
        setStoryUploading(false);
        return;
      }

      if (data && data.length > 0) {
        setStories((prev) => [data[0], ...prev]);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not create story.");
    }

    setStoryUploading(false);
  };

  const handleStoryInputChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleCreateStory(file);
    e.target.value = "";
  };

  const handleOpenStoryCreator = () => {
    if (storyUploading) return;
    storyInputRef.current?.click();
  };

  const handleToggleLike = async (postId: string, ownerId: string) => {
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

    if (ownerId !== userId) {
      await supabase.from("notifications").insert([
        {
          user_id: ownerId,
          actor_id: userId,
          type: "like",
          post_id: postId,
          actor_name: userName,
        },
      ]);
    }
  };

  const handleToggleSave = async (postId: string) => {
    const existingSaved = savedPosts.find(
      (saved) => saved.post_id === postId && saved.user_id === userId
    );

    if (existingSaved) {
      const { error } = await supabase
        .from("saved_posts")
        .delete()
        .eq("id", existingSaved.id);

      if (!error) {
        setSavedPosts((prev) => prev.filter((saved) => saved.id !== existingSaved.id));
      }
      return;
    }

    const { data, error } = await supabase
      .from("saved_posts")
      .insert([{ post_id: postId, user_id: userId }])
      .select("id, user_id, post_id");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setSavedPosts((prev) => [...prev, data[0]]);
    }
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
    setSavedPosts((prev) => prev.filter((saved) => saved.post_id !== postId));
  };

  const handleToggleFollow = async (targetUserId: string) => {
    const existingFollow = follows.find(
      (follow) =>
        follow.follower_id === userId && follow.following_id === targetUserId
    );

    if (existingFollow) {
      const { error } = await supabase
        .from("follows")
        .delete()
        .eq("id", existingFollow.id);

      if (error) {
        alert(error.message);
        return;
      }

      setFollows((prev) => prev.filter((follow) => follow.id !== existingFollow.id));
      return;
    }

    const { data, error } = await supabase
      .from("follows")
      .insert([
        {
          follower_id: userId,
          following_id: targetUserId,
        },
      ])
      .select("id, follower_id, following_id");

    if (error) {
      alert(error.message);
      return;
    }

    if (data && data.length > 0) {
      setFollows((prev) => [...prev, data[0]]);
    }
  };

  const getPostLikesCount = (postId: string) =>
    likes.filter((like) => like.post_id === postId).length;

  const getPostCommentsCount = (postId: string) =>
    comments.filter((comment) => comment.post_id === postId).length;

  const isSaved = (postId: string) =>
    savedPosts.some((saved) => saved.user_id === userId && saved.post_id === postId);

  const isLiked = (postId: string) =>
    likes.some((like) => like.user_id === userId && like.post_id === postId);

  const openStoryViewer = (storyUserId: string) => {
    setActiveStoryUserId(storyUserId);
    setActiveStoryIndex(0);
    setStoryViewerOpen(true);
  };

  const closeStoryViewer = () => {
    setStoryViewerOpen(false);
    setActiveStoryUserId("");
    setActiveStoryIndex(0);
  };

  const goToNextStory = () => {
    if (!activeStoryGroup) return;

    if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      return;
    }

    const currentGroupIndex = storyGroups.findIndex(
      (group) => group.userId === activeStoryGroup.userId
    );

    if (currentGroupIndex >= 0 && currentGroupIndex < storyGroups.length - 1) {
      setActiveStoryUserId(storyGroups[currentGroupIndex + 1].userId);
      setActiveStoryIndex(0);
      return;
    }

    closeStoryViewer();
  };

  const goToPreviousStory = () => {
    if (!activeStoryGroup) return;

    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      return;
    }

    const currentGroupIndex = storyGroups.findIndex(
      (group) => group.userId === activeStoryGroup.userId
    );

    if (currentGroupIndex > 0) {
      const prevGroup = storyGroups[currentGroupIndex - 1];
      setActiveStoryUserId(prevGroup.userId);
      setActiveStoryIndex(prevGroup.stories.length - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f0f2f5] text-[#050505]">
        Loading FaceGrem feed...
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f0f2f5] pb-24 text-[#050505] xl:pb-0">
      <style jsx>{`
        @keyframes blobFloatA {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(40px, -30px, 0) scale(1.15);
          }
        }

        @keyframes blobFloatB {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(-35px, 35px, 0) scale(1.1);
          }
        }

        @keyframes blobFloatC {
          0%,
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(20px, 25px, 0) scale(1.08);
          }
        }

        .blob-a {
          animation: blobFloatA 14s ease-in-out infinite;
        }

        .blob-b {
          animation: blobFloatB 18s ease-in-out infinite;
        }

        .blob-c {
          animation: blobFloatC 16s ease-in-out infinite;
        }
      `}</style>

      <input
        ref={storyInputRef}
        type="file"
        accept="image/*"
        onChange={handleStoryInputChange}
        className="hidden"
      />

      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-[#f0f2f5]" />
        <div className="absolute left-[-8rem] top-[-5rem] h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />
        <div className="absolute right-[-8rem] top-10 h-[28rem] w-[28rem] rounded-full bg-sky-200/40 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-[24rem] w-[24rem] rounded-full bg-indigo-100/40 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-xl">
        <div className="flex items-center gap-3 px-4 py-4 mx-auto max-w-7xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsMenuOpen(true)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-lg text-slate-700 shadow-sm transition hover:bg-slate-200"
              aria-label="Open menu"
            >
              ☰
            </button>

            <div className="flex items-center gap-3">
              <FaceGremLogo
                href="/feed"
                showWordmark={false}
                markClassName="h-11 w-11 rounded-2xl ring-0 shadow-sm sm:h-12 sm:w-12"
              />
              <div className="hidden sm:block">
                <h1 className="text-xl font-black tracking-tight text-slate-950">FaceGrem</h1>
                <p className="text-xs font-medium text-slate-500">Your social world, live now</p>
              </div>
            </div>
          </div>

          <div className="flex-1 hidden lg:block">
            <div className="max-w-xl mx-auto">
              <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${softCard}`}>
                <span className="text-sm text-slate-500">⌕</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  placeholder="Search posts, creators, communities, topics..."
                  className="w-full text-sm text-slate-900 bg-transparent outline-none placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setActiveRightPanel("friends")}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-lg transition ${
                activeRightPanel === "friends"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200"
              }`}
              aria-label="Friends"
              title="Friends"
            >
              <FriendsFistIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveRightPanel("communities")}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-lg transition ${
                activeRightPanel === "communities"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200"
              }`}
              aria-label="Communities"
              title="Communities"
            >
              <CommunityCircleIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveRightPanel("messages")}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-lg transition ${
                activeRightPanel === "messages"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200"
              }`}
              aria-label="Messages"
              title="Messages"
            >
              <MessageBubblesIcon className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => setActiveRightPanel("videos")}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-lg transition ${
                activeRightPanel === "videos"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200"
              }`}
              aria-label="Videos"
              title="Videos"
            >
              <span className="text-sm font-black">▶</span>
            </button>

            <div className="relative">
              <Link
                href="/notifications"
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-700 transition hover:bg-slate-100"
              >
                <span className="text-sm">🔔</span>
              </Link>

              {unreadNotificationsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-blue-600 px-1 text-[11px] font-bold text-white shadow-sm">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              )}
            </div>

            <Link
              href="/profile"
              className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-2 transition hover:bg-slate-200 sm:px-2 sm:pr-3"
            >
              <img
                src={userAvatar}
                alt={userName}
                className="object-cover h-9 w-9 rounded-full"
              />
              <span className="hidden max-w-[120px] truncate text-sm font-medium text-slate-950 lg:inline-block">
                {userName}
              </span>
            </Link>
          </div>
        </div>

        <div className="px-4 pb-4 sm:px-6 lg:hidden">
          <div className="mx-auto space-y-3 max-w-7xl">
            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${softCard}`}>
              <span className="text-sm text-slate-500">⌕</span>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search FaceGrem..."
                className="w-full text-sm text-slate-900 bg-transparent outline-none placeholder:text-slate-500"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setActiveRightPanel("friends")}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-medium text-slate-950 transition hover:bg-slate-100"
              >
                Friends
              </button>
              <button
                type="button"
                onClick={() => setActiveRightPanel("communities")}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-medium text-slate-950 transition hover:bg-slate-100"
              >
                Groups
              </button>
              <button
                type="button"
                onClick={() => setActiveRightPanel("messages")}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-medium text-slate-950 transition hover:bg-slate-100"
              >
                Chat
              </button>
              <button
                type="button"
                onClick={() => setActiveRightPanel("videos")}
                className="rounded-2xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-medium text-slate-950 transition hover:bg-slate-100"
              >
                Videos
              </button>
            </div>
          </div>
        </div>
      </header>

      <section className="relative mx-auto mt-4 max-w-7xl px-4 sm:px-6">
        <div className="grid gap-3 rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:grid-cols-3">
          <div className="rounded-2xl bg-blue-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Live feed</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{filteredPosts.length}</p>
            <p className="text-xs text-slate-500">Posts visible now</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Creators</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{profiles.length}</p>
            <p className="text-xs text-slate-500">People in your world</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Notifications</p>
            <p className="mt-1 text-2xl font-black text-slate-950">{unreadNotificationsCount}</p>
            <p className="text-xs text-slate-500">Unread updates</p>
          </div>
        </div>
      </section>

      {isMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsMenuOpen(false)}
          />
          <aside className="fixed right-0 top-0 z-[70] flex h-full w-[310px] flex-col border-r border-slate-200 bg-white p-5 backdrop-blur-2xl shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center font-bold text-white h-11 w-11 rounded-2xl bg-blue-600">
                  F
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-950">FaceGrem</h2>
                  <p className="text-xs text-slate-500">Navigation</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-xl bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-2">
              <Link
                href="/feed"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                🏠 Home Feed
              </Link>
              <Link
                href="/videos"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                🎬 Videos
              </Link>
              <Link
                href="/communities"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                👥 Communities
              </Link>
              <Link
                href="/messages"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                💬 Messages
              </Link>
              <Link
                href="/saved"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                🔖 Saved
              </Link>
              <Link
                href="/profile"
                onClick={() => setIsMenuOpen(false)}
                className="block rounded-2xl px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                👤 Profile
              </Link>
            </div>

            <div className="pt-5 mt-8 border-t border-slate-200">
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                More
              </p>

              <div className="space-y-2">
                <button className="block w-full rounded-2xl px-4 py-3 text-left text-slate-950 transition hover:bg-slate-100">
                  ⚙️ Settings
                </button>
                <button className="block w-full rounded-2xl px-4 py-3 text-left text-slate-950 transition hover:bg-slate-100">
                  🌐 Language
                </button>
                <button className="block w-full rounded-2xl px-4 py-3 text-left text-slate-950 transition hover:bg-slate-100">
                  🔒 Privacy
                </button>
                <button className="block w-full rounded-2xl px-4 py-3 text-left text-slate-950 transition hover:bg-slate-100">
                  ❓ Help
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 xl:grid-cols-[260px_minmax(0,1fr)_340px]">
        <aside className="hidden xl:block">
          <div className="sticky top-[104px] space-y-4">
            <div className={`overflow-hidden rounded-[30px] p-4 ${glassCard}`}>
              <button
                type="button"
                onClick={() => setIsProfileCardOpen(!isProfileCardOpen)}
                className="flex items-center w-full gap-3 text-left"
              >
                <img
                  src={userAvatar}
                  alt={userName}
                  className="object-cover h-14 w-14 rounded-2xl ring-2 ring-cyan-400/20"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-950 truncate">{userName}</p>
                  <p className="text-sm truncate text-slate-500">Tap to view quick details</p>
                </div>
                <div className="text-xl text-slate-950">{isProfileCardOpen ? "−" : "+"}</div>
              </button>

              {isProfileCardOpen && (
                <div className="pt-4 mt-4 space-y-3 border-t border-slate-200">
                  <div className="grid grid-cols-3 gap-2">
                    <div className={`rounded-2xl px-3 py-3 text-center ${softCard}`}>
                      <p className="text-[11px] text-slate-500">Saved</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">{savedPosts.length}</p>
                    </div>
                    <div className={`rounded-2xl px-3 py-3 text-center ${softCard}`}>
                      <p className="text-[11px] text-slate-500">Alerts</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {unreadNotificationsCount}
                      </p>
                    </div>
                    <div className={`rounded-2xl px-3 py-3 text-center ${softCard}`}>
                      <p className="text-[11px] text-slate-500">Groups</p>
                      <p className="mt-1 text-sm font-semibold text-slate-950">
                        {myCommunityIds.length}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/profile"
                      className={`rounded-2xl px-4 py-3 text-center text-sm text-slate-950 transition hover:bg-slate-100 ${softCard}`}
                    >
                      Open Profile
                    </Link>
                    <Link
                      href="/saved"
                      className={`rounded-2xl px-4 py-3 text-center text-sm text-slate-950 transition hover:bg-slate-100 ${softCard}`}
                    >
                      Saved Posts
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className={`rounded-[28px] p-4 ${glassCard}`}>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-blue-600">Your communities</p>
                <Link
                  href="/communities"
                  className="text-xs transition text-blue-600 hover:text-blue-600"
                >
                  View all
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {communities.filter((community) => myCommunityIds.includes(community.id))
                  .length === 0 ? (
                  <p className="text-sm leading-7 text-slate-500">
                    Join communities to keep your favorite spaces close.
                  </p>
                ) : (
                  communities
                    .filter((community) => myCommunityIds.includes(community.id))
                    .slice(0, 4)
                    .map((community) => (
                      <Link
                        key={community.id}
                        href={`/communities/${community.id}`}
                        className={`block rounded-2xl px-4 py-3 transition hover:bg-slate-100 ${softCard}`}
                      >
                        <p className="font-medium text-slate-950">{community.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {community.category || "Community"}
                        </p>
                      </Link>
                    ))
                )}
              </div>
            </div>
          </div>
        </aside>

        <section className="min-w-0 space-y-5 sm:space-y-6">
          <div className="overflow-hidden rounded-[32px] border border-cyan-400/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.35),rgba(2,8,23,0.18)_55%,rgba(15,23,42,0.32))] p-6 backdrop-blur-2xl shadow-[0_30px_120px_rgba(6,182,212,0.10)]">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-blue-600">Welcome back</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                Good to see you, {userName.split(" ")[0]}.
              </h2>
              <p className="max-w-xl mt-4 text-sm leading-8 text-slate-600 sm:text-base">
                Discover what people are sharing right now across FaceGrem —
                moments, ideas, videos, conversations, and communities.
              </p>
            </div>
          </div>

          <div className={`overflow-x-auto rounded-[28px] p-3 sm:rounded-[30px] sm:p-4 ${glassCard}`}>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="text-sm font-semibold text-blue-600">Stories</p>
                <p className="text-xs text-slate-500">Quick moments from people around you</p>
              </div>

              <button
                type="button"
                onClick={handleOpenStoryCreator}
                disabled={storyUploading}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-70"
              >
                {storyUploading ? "Uploading..." : "Create story"}
              </button>
            </div>

            <div className="flex gap-3 min-w-max sm:gap-4">
              <button
                type="button"
                onClick={handleOpenStoryCreator}
                disabled={storyUploading}
                className="group relative h-48 w-28 shrink-0 overflow-hidden rounded-[28px] border border-cyan-400/15 bg-white/[0.04] p-1 text-left backdrop-blur-xl transition duration-300 hover:-translate-y-1 disabled:opacity-70 sm:h-52 sm:w-36"
              >
                <div className="relative h-full overflow-hidden rounded-[24px] bg-[#0f172a]/60">
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="absolute inset-0 object-cover w-full h-full opacity-35"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-[#020817]/20 to-transparent" />

                  <div className="relative flex flex-col justify-between h-full p-4">
                    <div className="flex items-center justify-center w-12 h-12 text-2xl font-semibold text-white shadow-sm rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-cyan-500/30">
                      +
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-950">
                        {storyUploading ? "Uploading..." : "Create story"}
                      </p>
                      <p className="mt-1 text-xs text-slate-950/75">Share a quick moment</p>
                    </div>
                  </div>
                </div>
              </button>

              {storyGroups.map((group, index) => {
                const storyProfile = getProfileById(group.userId);
                const storyUserName = storyProfile?.full_name || "FaceGrem User";
                const storyUserAvatar =
                  storyProfile?.avatar_url || getAvatarUrl(storyUserName);
                const previewStory =
                  group.stories[group.stories.length - 1] || group.stories[0];

                return (
                  <button
                    key={group.userId}
                    type="button"
                    onClick={() => openStoryViewer(group.userId)}
                    className={`group relative h-48 w-28 shrink-0 overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br ${
                      index % 2 === 0
                        ? "from-cyan-400/35 via-blue-500/25 to-fuchsia-500/25"
                        : "from-fuchsia-500/35 via-orange-400/20 to-cyan-500/25"
                    } p-1 text-left backdrop-blur-xl transition duration-300 hover:-translate-y-1 sm:h-52 sm:w-36`}
                  >
                    <div className="relative h-full overflow-hidden rounded-[24px] bg-[#0f172a]/55">
                      <img
                        src={previewStory.image_url}
                        alt={storyUserName}
                        className="absolute inset-0 object-cover w-full h-full transition duration-300 opacity-80 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-black/10" />

                      <div className="relative flex flex-col justify-between h-full p-4">
                        <img
                          src={storyUserAvatar}
                          alt={storyUserName}
                          className="object-cover w-12 h-12 border-2 shadow-lg rounded-2xl border-cyan-300/90"
                        />

                        <div>
                          <p className="text-sm font-semibold text-slate-950 line-clamp-2">
                            {storyUserName}
                          </p>
                          <p className="mt-1 text-xs text-slate-950/75">
                            {group.userId === userId
                              ? "Your story"
                              : `@${storyProfile?.username || "member"}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              {highlightedProfiles.map((profile, index) => (
                <Link
                  key={profile.id}
                  href={`/profile?id=${profile.id}`}
                  className={`group relative h-48 w-28 shrink-0 overflow-hidden rounded-[28px] border border-slate-200 bg-gradient-to-br ${
                    index % 2 === 0
                      ? "from-violet-500/30 via-blue-500/20 to-cyan-500/20"
                      : "from-amber-400/25 via-rose-500/20 to-fuchsia-500/20"
                  } p-1 backdrop-blur-xl transition duration-300 hover:-translate-y-1 sm:h-52 sm:w-36`}
                >
                  <div className="relative h-full overflow-hidden rounded-[24px] bg-[#0f172a]/55">
                    <img
                      src={
                        profile.avatar_url ||
                        getAvatarUrl(profile.full_name || "FaceGrem User")
                      }
                      alt={profile.full_name}
                      className="absolute inset-0 object-cover w-full h-full transition duration-300 opacity-80 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-black/10" />

                    <div className="relative flex flex-col justify-between h-full p-4">
                      <img
                        src={
                          profile.avatar_url ||
                          getAvatarUrl(profile.full_name || "FaceGrem User")
                        }
                        alt={profile.full_name}
                        className="object-cover w-12 h-12 border-2 shadow-lg rounded-2xl border-cyan-300/90"
                      />

                      <div>
                        <p className="text-sm font-semibold text-slate-950 line-clamp-2">
                          {profile.full_name}
                        </p>
                        <p className="mt-1 text-xs text-slate-950/75">
                          @{profile.username || "member"}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className={`overflow-hidden rounded-[30px] ${glassCard}`}>
            <div className="px-4 py-4 border-b border-slate-200 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-blue-600">Create post</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Share a thought, photo, story, or video with FaceGrem
                  </p>
                </div>

                <div className="items-center hidden gap-2 sm:flex">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                    Public post
                  </span>
                  <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-blue-600">
                    Live composer
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="object-cover w-12 h-12 rounded-2xl ring-2 ring-cyan-400/15 sm:h-14 sm:w-14"
                />

                <div className="flex-1 min-w-0">
                  <div className={`rounded-[24px] p-4 ${softCard}`}>
                    <div className="flex flex-wrap items-center gap-2 mb-3 sm:gap-3">
                      <p className="font-medium text-slate-950">{userName}</p>
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
                        Posting to everyone
                      </span>
                    </div>

                    <textarea
                      value={postText}
                      onChange={(e) => setPostText(e.target.value)}
                      rows={4}
                      placeholder="What’s on your mind today?"
                      className="w-full resize-none bg-transparent text-[15px] leading-7 text-slate-950 placeholder:text-slate-500 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5 sm:mt-5 sm:gap-3">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => {
                      setActiveComposerAction(action);
                      if (action === "Story") handleOpenStoryCreator();
                    }}
                    className={`rounded-full px-4 py-2.5 text-sm font-medium transition sm:px-5 sm:py-3 ${
                      activeComposerAction === action
                        ? "bg-blue-600 text-white shadow-sm"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>

              {(activeComposerAction === "Photo" || activeComposerAction === "Story") && (
                <div className={`mt-5 rounded-[24px] p-4 ${softCard}`}>
                  <div>
                    <p className="text-sm font-medium text-slate-950">
                      {activeComposerAction === "Story" ? "Story image" : "Photo upload"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {activeComposerAction === "Story"
                        ? "Use the Create story button above to publish a real story"
                        : "Add a strong visual to make your post stand out"}
                    </p>
                  </div>

                  {activeComposerAction === "Photo" && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-4 block w-full rounded-2xl text-sm text-slate-950 file:mr-4 file:rounded-xl file:border-0 file:bg-cyan-500/20 file:px-4 file:py-2.5 file:text-blue-600"
                      />

                      {imagePreview && (
                        <div className="mt-4 overflow-hidden rounded-[20px] border border-slate-200">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="object-cover w-full max-h-96"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {activeComposerAction === "Story" && (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={handleOpenStoryCreator}
                        disabled={storyUploading}
                        className="px-4 py-3 text-sm font-medium transition border rounded-2xl border-cyan-400/20 bg-cyan-500/10 text-blue-600 hover:bg-cyan-500/20 disabled:opacity-70"
                      >
                        {storyUploading ? "Uploading story..." : "Choose story image"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {(activeComposerAction === "Video" || activeComposerAction === "Live") && (
                <div className={`mt-5 rounded-[24px] p-4 ${softCard}`}>
                  <div>
                    <p className="text-sm font-medium text-slate-950">
                      {activeComposerAction === "Live" ? "Live stream link" : "Video link"}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Paste a YouTube link or direct video URL
                    </p>
                  </div>

                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder={
                      activeComposerAction === "Live"
                        ? "Paste a live stream or video URL"
                        : "Paste a YouTube or video URL"
                    }
                    className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 placeholder:text-slate-500 outline-none transition focus:border-cyan-400/40"
                  />
                </div>
              )}

              <div className="flex flex-col gap-4 pt-4 mt-5 border-t border-slate-200 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600">
                    Text
                  </span>
                  {imagePreview && (
                    <span className="rounded-full border border-fuchsia-400/20 bg-fuchsia-500/10 px-3 py-1.5 text-xs text-fuchsia-200">
                      Image attached
                    </span>
                  )}
                  {videoUrl.trim() && (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-1.5 text-xs text-blue-600">
                      Video linked
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPostText("");
                      setVideoUrl("");
                      setImageFile(null);
                      setImagePreview("");
                      setActiveComposerAction("Photo");
                    }}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    Clear
                  </button>

                  <button
                    onClick={handleCreatePost}
                    disabled={posting}
                    className="px-6 py-3 text-sm font-semibold text-white shadow-sm rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200 disabled:opacity-70"
                  >
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {feedTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveFeedTab(tab);
                  if (tab === "Videos") router.push("/videos");
                }}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFeedTab === tab
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className={`rounded-[30px] p-8 text-center ${glassCard}`}>
              <p className="text-lg font-medium text-slate-950">No posts found here yet.</p>
              <p className="mt-2 text-sm text-slate-500">
                Try another feed tab or create the first post.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => {
                const authorProfile = getProfileById(post.user_id);
                const authorName = getBestNameForUser(post.user_id, post.full_name);
                const authorAvatar = getBestAvatarForUser(
                  post.user_id,
                  post.full_name,
                  post.avatar_url
                );
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
                  <article key={post.id} className={`overflow-hidden rounded-[32px] ${glassCard}`}>
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <Link
                          href={`/profile?id=${post.user_id}`}
                          className="flex items-center min-w-0 gap-3 hover:opacity-90"
                        >
                          <img
                            src={authorAvatar}
                            alt={authorName}
                            className="object-cover w-12 h-12 rounded-2xl ring-1 ring-white/10"
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-950 truncate">{authorName}</p>

                              {authorProfile?.username && (
                                <span className="text-sm truncate text-slate-500">
                                  @{authorProfile.username}
                                </span>
                              )}

                              <span className="hidden w-1 h-1 rounded-full bg-slate-500 sm:block" />

                              <span className="text-xs text-slate-500">
                                {new Date(post.created_at).toLocaleString()}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] text-slate-600">
                                Public
                              </span>

                              {post.video_url && (
                                <span className="rounded-full border border-cyan-400/20 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-blue-600">
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

                        {post.user_id === userId && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="px-4 py-2 text-xs text-red-200 transition border rounded-2xl border-red-400/20 bg-red-500/10 hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {post.content && (
                        <div className="mt-5">
                          <p className="text-[15px] leading-8 text-slate-700">{post.content}</p>
                        </div>
                      )}
                    </div>

                    {post.image_url && (
                      <div className="px-3 pb-3 border-y border-slate-200 bg-black/20 sm:px-4 sm:pb-4">
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
                      <div className="px-3 pb-3 border-y border-slate-200 bg-slate-950 sm:px-4 sm:pb-4">
                        <div className="overflow-hidden rounded-[28px]">
                          {isYouTubeUrl(post.video_url) ? (
                            <iframe
                              src={getYouTubeEmbedUrl(post.video_url)}
                              title={`feed-video-${post.id}`}
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
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1.5">
                            <span className="text-base">❤️</span>
                            <span className="text-slate-700">
                              {likesCount} {likesCount === 1 ? "like" : "likes"}
                            </span>
                          </div>

                          <div className="rounded-full bg-white px-3 py-1.5 text-slate-600">
                            {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
                          </div>
                        </div>

                        <Link
                          href={`/post/${post.id}`}
                          className="text-sm font-medium transition text-blue-600 hover:text-blue-600"
                        >
                          View discussion
                        </Link>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
                        <button
                          onClick={() => handleToggleLike(post.id, post.user_id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            isLiked(post.id)
                              ? "border border-cyan-400/20 bg-cyan-500/20 text-blue-600"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {isLiked(post.id) ? "Liked" : "Like"}
                        </button>

                        <Link
                          href={`/post/${post.id}`}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                        >
                          Comment
                        </Link>

                        <button
                          onClick={() => handleToggleSave(post.id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
                            isSaved(post.id)
                              ? "border border-cyan-400/20 bg-cyan-500/20 text-blue-600"
                              : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                          }`}
                        >
                          {isSaved(post.id) ? "Saved" : "Save"}
                        </button>

                        <Link
                          href={`/post/${post.id}`}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-sm font-medium text-blue-600 transition hover:bg-slate-100"
                        >
                          Open
                        </Link>
                      </div>

                      {latestComments.length > 0 && (
                        <div className="pt-4 mt-5 space-y-3 border-t border-slate-200">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                            Recent comments
                          </p>

                          {latestComments.map((comment) => {
                            const commentAuthorName = getBestNameForUser(
                              comment.user_id,
                              comment.full_name
                            );
                            const commentAuthorAvatar = getBestAvatarForUser(
                              comment.user_id,
                              comment.full_name,
                              null
                            );

                            return (
                              <div
                                key={comment.id}
                                className={`flex items-start gap-3 rounded-2xl px-3 py-3 ${softCard}`}
                              >
                                <img
                                  src={commentAuthorAvatar}
                                  alt={commentAuthorName}
                                  className="object-cover h-9 w-9 rounded-xl"
                                />

                                <div className="flex-1 min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-medium text-slate-950">
                                      {commentAuthorName}
                                    </p>
                                    <span className="text-[11px] text-slate-500">
                                      {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                  </div>

                                  <p className="mt-1 text-sm leading-6 line-clamp-2 text-slate-600">
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

        <aside className="space-y-5">
          <div className={`rounded-[28px] p-5 ${glassCard}`}>
            {activeRightPanel === "friends" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-blue-600">Friends</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Online, suggestions, and your friends
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveFriendsTab("online")}
                    className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                      activeFriendsTab === "online"
                        ? "bg-cyan-500/20 text-blue-600"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Online
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFriendsTab("suggestions")}
                    className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                      activeFriendsTab === "suggestions"
                        ? "bg-cyan-500/20 text-blue-600"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Suggestions
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFriendsTab("your_friends")}
                    className={`rounded-full px-3 py-2 text-xs font-medium transition ${
                      activeFriendsTab === "your_friends"
                        ? "bg-cyan-500/20 text-blue-600"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Your Friends
                  </button>
                </div>

                {activeFriendsTab === "online" && (
                  <div className="space-y-4">
                    {onlinePeople.length === 0 ? (
                      <p className="text-sm text-slate-500">No online friends to show yet.</p>
                    ) : (
                      onlinePeople.map((person) => (
                        <div key={person.id} className={`rounded-2xl p-4 ${softCard}`}>
                          <Link href={`/profile?id=${person.id}`} className="flex items-center gap-3">
                            <div className="relative">
                              <img
                                src={
                                  person.avatar_url ||
                                  getAvatarUrl(person.full_name || "FaceGrem User")
                                }
                                alt={person.full_name}
                                className="object-cover w-12 h-12 rounded-2xl"
                              />
                              <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-[#07111f] bg-emerald-400" />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-950 truncate">{person.full_name}</p>
                              <p className="text-xs truncate text-slate-500">
                                @{person.username || "member"} • online
                              </p>
                            </div>
                          </Link>

                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Link
                              href={`/messages?user=${person.id}`}
                              className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm shadow-blue-200"
                            >
                              Message
                            </Link>

                            <Link
                              href={`/profile?id=${person.id}`}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm text-slate-600 transition hover:bg-slate-100"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeFriendsTab === "suggestions" && (
                  <div className="space-y-4">
                    {suggestedPeople.length === 0 ? (
                      <p className="text-sm text-slate-500">No suggestions yet.</p>
                    ) : (
                      suggestedPeople.map((person) => {
                        const following = isFollowingUser(person.id);

                        return (
                          <div key={person.id} className={`rounded-2xl p-4 ${softCard}`}>
                            <Link href={`/profile?id=${person.id}`} className="flex items-center gap-3">
                              <img
                                src={
                                  person.avatar_url ||
                                  getAvatarUrl(person.full_name || "FaceGrem User")
                                }
                                alt={person.full_name}
                                className="object-cover w-12 h-12 rounded-2xl"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-950 truncate">{person.full_name}</p>
                                <p className="text-xs truncate text-slate-500">
                                  @{person.username || "member"}
                                </p>
                              </div>
                            </Link>

                            <div className="flex gap-2 mt-3">
                              <button
                                onClick={() => handleToggleFollow(person.id)}
                                className={`flex-1 rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                                  following
                                    ? "border border-cyan-400/20 bg-cyan-500/20 text-blue-600"
                                    : "bg-blue-600 text-white shadow-sm"
                                }`}
                              >
                                {following ? "Following" : "Follow"}
                              </button>

                              <Link
                                href={`/profile?id=${person.id}`}
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 transition hover:bg-slate-100"
                              >
                                View
                              </Link>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {activeFriendsTab === "your_friends" && (
                  <div className="space-y-4">
                    {yourFriends.length === 0 ? (
                      <p className="text-sm text-slate-500">You have no friends to show yet.</p>
                    ) : (
                      yourFriends.map((person) => (
                        <div key={person.id} className={`rounded-2xl p-4 ${softCard}`}>
                          <Link href={`/profile?id=${person.id}`} className="flex items-center gap-3">
                            <img
                              src={
                                person.avatar_url ||
                                getAvatarUrl(person.full_name || "FaceGrem User")
                              }
                              alt={person.full_name}
                              className="object-cover w-12 h-12 rounded-2xl"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-950 truncate">{person.full_name}</p>
                              <p className="text-xs truncate text-slate-500">
                                @{person.username || "member"}
                              </p>
                            </div>
                          </Link>

                          <div className="grid grid-cols-2 gap-2 mt-3">
                            <Link
                              href={`/messages?user=${person.id}`}
                              className="rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2.5 text-center text-sm font-medium text-white shadow-sm shadow-blue-200"
                            >
                              Message
                            </Link>

                            <Link
                              href={`/profile?id=${person.id}`}
                              className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-center text-sm text-slate-600 transition hover:bg-slate-100"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeRightPanel === "communities" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-blue-600">Communities</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Discover and open communities
                  </p>
                </div>

                {suggestedCommunities.length === 0 ? (
                  <p className="text-sm text-slate-500">No communities to show yet.</p>
                ) : (
                  suggestedCommunities.map((community) => {
                    const memberCount = communityMembers.filter(
                      (member) => member.community_id === community.id
                    ).length;

                    return (
                      <Link
                        key={community.id}
                        href={`/communities/${community.id}`}
                        className={`block rounded-2xl p-4 transition hover:bg-slate-100 ${softCard}`}
                      >
                        <p className="font-medium text-slate-950">{community.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {community.category || "Community"} • {memberCount} members
                        </p>
                      </Link>
                    );
                  })
                )}

                <Link
                  href="/communities"
                  className="block px-4 py-3 text-sm font-medium text-center text-white shadow-sm rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200"
                >
                  Open communities page
                </Link>
              </div>
            )}

            {activeRightPanel === "messages" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-blue-600">Messages</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Recent activity and quick access
                  </p>
                </div>

                {latestActivity.length === 0 ? (
                  <p className="text-sm text-slate-500">No activity yet.</p>
                ) : (
                  latestActivity.map((notification) => (
                    <div key={notification.id} className={`rounded-2xl px-4 py-3 ${softCard}`}>
                      <p className="text-sm leading-6 text-slate-950">
                        <span className="font-medium">
                          {notification.actor_name || "Someone"}
                        </span>{" "}
                        {notification.type}
                        {notification.content ? `: ${notification.content}` : ""}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                )}

                <Link
                  href="/messages"
                  className="block px-4 py-3 text-sm font-medium text-center text-white shadow-sm rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200"
                >
                  Open messages
                </Link>
              </div>
            )}

            {activeRightPanel === "videos" && (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-blue-600">Videos</p>
                  <p className="mt-1 text-xs text-slate-500">
                    Trending and recent videos
                  </p>
                </div>

                {latestVideoCards.length === 0 ? (
                  <p className="text-sm text-slate-500">No videos published yet.</p>
                ) : (
                  latestVideoCards.map((video) => (
                    <Link
                      key={video.id}
                      href="/videos"
                      className={`block rounded-2xl p-4 transition hover:bg-slate-100 ${softCard}`}
                    >
                      <p className="font-medium text-slate-950">{video.title}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {(video.views_count || 0).toLocaleString()} views
                      </p>
                    </Link>
                  ))
                )}

                <Link
                  href="/videos"
                  className="block px-4 py-3 text-sm font-medium text-center text-white shadow-sm rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-200"
                >
                  Open videos page
                </Link>
              </div>
            )}
          </div>
        </aside>
      </main>

      {storyViewerOpen && activeStory && activeStoryGroup && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 px-4 backdrop-blur-md">
          <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-slate-200 bg-[#07111f] shadow-2xl">
            <div className="absolute inset-x-0 top-0 z-10 flex gap-1 px-4 pt-4">
              {activeStoryGroup.stories.map((story, index) => (
                <div key={story.id} className="flex-1 h-1 rounded-full bg-white/20">
                  <div
                    className={`h-1 rounded-full ${
                      index <= activeStoryIndex ? "bg-white" : "bg-transparent"
                    }`}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={closeStoryViewer}
              className="absolute z-20 px-3 py-1 text-sm text-slate-950 border rounded-full right-4 top-6 border-slate-200 bg-slate-950"
            >
              ✕
            </button>

            <div className="relative">
              <img
                src={activeStory.image_url}
                alt={getBestNameForUser(activeStory.user_id)}
                className="h-[72vh] w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

              <button
                type="button"
                onClick={goToPreviousStory}
                className="absolute top-0 left-0 w-1/3 h-full"
                aria-label="Previous story"
              />
              <button
                type="button"
                onClick={goToNextStory}
                className="absolute top-0 right-0 w-1/3 h-full"
                aria-label="Next story"
              />

              <div className="absolute z-10 flex items-center gap-3 pt-4 left-4 top-6">
                <img
                  src={getBestAvatarForUser(activeStory.user_id)}
                  alt={getBestNameForUser(activeStory.user_id)}
                  className="object-cover border h-11 w-11 rounded-2xl border-white/20"
                />
                <div>
                  <p className="font-medium text-slate-950">
                    {getBestNameForUser(activeStory.user_id)}
                  </p>
                  <p className="text-xs text-slate-950/75">
                    {new Date(activeStory.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {activeStory.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-sm leading-7 text-slate-950">{activeStory.caption}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav unreadNotificationsCount={unreadNotificationsCount} />
    </div>
  );
}