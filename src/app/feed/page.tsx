"use client";

import Link from "next/link";
import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import MobileBottomNav from "../../components/MobileBottomNav";
import FaceGremLogo from "../../components/FaceGremLogo";
import { CommunityCircleIcon, FriendsFistIcon, GroupPeopleIcon, MessageBubblesIcon, TranslateLanguageIcon } from "../../components/FaceGremCustomIcons";
import FaceGremHamburgerMenu from "../../components/FaceGremHamburgerMenu";

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
  const [signingOut, setSigningOut] = useState(false);
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

  const handleLogout = async () => {
    setSigningOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      alert(error.message);
      setSigningOut(false);
      return;
    }

    router.push("/");
  };

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
        <div className="rounded-[32px] bg-white px-7 py-6 text-center shadow-sm ring-1 ring-slate-200">
          <FaceGremLogo
            href="/feed"
            showWordmark={false}
            markClassName="mx-auto h-14 w-14 rounded-2xl ring-0 shadow-sm"
          />
          <p className="mt-4 text-sm font-bold text-slate-700">Loading FaceGrem feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#f0f2f5] pb-24 text-[#050505] xl:pb-0">
      <input
        ref={storyInputRef}
        type="file"
        accept="image/*"
        onChange={handleStoryInputChange}
        className="hidden"
      />

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[#f0f2f5]" />
        <div className="absolute -left-32 -top-28 h-96 w-96 rounded-full bg-blue-200/45 blur-3xl" />
        <div className="absolute -right-32 top-20 h-[30rem] w-[30rem] rounded-full bg-sky-200/45 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-1/3 h-[28rem] w-[28rem] rounded-full bg-indigo-100/45 blur-3xl" />
      </div>

      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/90 shadow-[0_10px_40px_rgba(15,23,42,0.06)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={() => setIsMenuOpen(true)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xl font-black text-slate-700 shadow-sm transition hover:bg-slate-200"
            aria-label="Open menu"
          >
            ≡
          </button>

          <div className="flex items-center gap-3">
            <FaceGremLogo
              href="/feed"
              showWordmark={false}
              markClassName="h-11 w-11 rounded-2xl ring-0 shadow-sm"
            />
            <div className="hidden sm:block">
              <h1 className="text-xl font-black tracking-tight text-slate-950">FaceGrem</h1>
              <p className="text-xs font-semibold text-slate-500">Professional social feed</p>
            </div>
          </div>

          <div className="hidden flex-1 lg:block">
            <div className="mx-auto max-w-xl">
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-inner transition focus-within:border-blue-300 focus-within:bg-white">
                <span className="text-sm text-slate-500">⌕</span>
                <input
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder="Search posts, creators, communities..."
                  className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveRightPanel("friends");
                router.push("/friends");
              }}
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full transition ${
                activeRightPanel === "friends"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200"
              }`}
              aria-label="Friends"
              title="Friends"
            >
              <FriendsFistIcon className="h-5 w-5" />
              {suggestedPeople.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                  {suggestedPeople.length > 9 ? "9+" : suggestedPeople.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveRightPanel("communities");
                router.push("/communities");
              }}
              className={`hidden h-11 w-11 items-center justify-center rounded-full transition sm:inline-flex ${
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
              onClick={() => {
                setActiveRightPanel("messages");
                router.push("/messages");
              }}
              className={`relative inline-flex h-11 w-11 items-center justify-center rounded-full transition ${
                activeRightPanel === "messages"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200"
              }`}
              aria-label="Messages"
              title="Messages"
            >
              <MessageBubblesIcon className="h-5 w-5" />
              {latestActivity.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                  {latestActivity.length > 9 ? "9+" : latestActivity.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => router.push("/videos")}
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700 shadow-sm transition hover:bg-slate-200 sm:inline-flex"
              aria-label="Videos"
              title="Videos"
            >
              ▶
            </button>

            <Link
              href="/settings"
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition hover:bg-slate-200 lg:inline-flex"
              aria-label="Language and settings"
              title="Language and settings"
            >
              <TranslateLanguageIcon className="h-5 w-5" />
            </Link>

            <Link
              href="/notifications"
              className="relative inline-flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-700 shadow-sm transition hover:bg-slate-200"
              aria-label="Notifications"
              title="Notifications"
            >
              🔔
              {unreadNotificationsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
                  {unreadNotificationsCount > 9 ? "9+" : unreadNotificationsCount}
                </span>
              )}
            </Link>

            <Link
              href="/profile"
              className="hidden items-center gap-2 rounded-full bg-slate-100 py-1.5 pl-1.5 pr-3 transition hover:bg-slate-200 md:flex"
            >
              <img src={userAvatar} alt={userName} className="h-9 w-9 rounded-full object-cover" />
              <span className="hidden max-w-[120px] truncate text-sm font-bold text-slate-700 lg:inline-block">
                {userName}
              </span>
            </Link>
          </div>
        </div>

        <div className="px-4 pb-3 sm:px-6 lg:hidden">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2.5 shadow-inner transition focus-within:border-blue-300 focus-within:bg-white">
              <span className="text-sm text-slate-500">⌕</span>
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Search FaceGrem..."
                className="w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>
      </header>

      {signingOut && (
        <div className="fixed bottom-4 left-1/2 z-[120] -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-2xl">
          Signing out...
        </div>
      )}

      <FaceGremHamburgerMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        userName={userName}
        userAvatar={userAvatar}
        onLogout={handleLogout}
        notificationCount={unreadNotificationsCount}
      />

      <main className="relative mx-auto grid max-w-7xl gap-6 px-4 py-5 sm:px-6 xl:grid-cols-[280px_minmax(0,1fr)_360px]">
        <aside className="hidden xl:block">
          <div className="sticky top-[96px] space-y-5">
            <section className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-slate-200">
              <div className="h-24 bg-gradient-to-br from-blue-600 via-blue-500 to-sky-400" />
              <div className="-mt-10 p-5">
                <button
                  type="button"
                  onClick={() => setIsProfileCardOpen((value) => !value)}
                  className="text-left"
                >
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="h-20 w-20 rounded-[26px] border-4 border-white object-cover shadow-sm"
                  />
                </button>
                <div className="mt-4">
                  <p className="truncate text-lg font-black text-slate-950">{userName}</p>
                  <p className="text-sm text-slate-500">Creator workspace</p>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <div className="rounded-2xl bg-blue-50 px-3 py-3 text-center">
                    <p className="text-[11px] font-bold text-blue-600">Saved</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{savedPosts.length}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                    <p className="text-[11px] font-bold text-slate-500">Alerts</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{unreadNotificationsCount}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-3 py-3 text-center">
                    <p className="text-[11px] font-bold text-slate-500">Groups</p>
                    <p className="mt-1 text-lg font-black text-slate-950">{myCommunityIds.length}</p>
                  </div>
                </div>

                {isProfileCardOpen && (
                  <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    Quick profile tools are ready. Open your profile or saved posts below.
                  </div>
                )}

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    href="/profile"
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    Profile
                  </Link>
                  <Link
                    href="/saved"
                    className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-bold text-slate-700 transition hover:bg-slate-200"
                  >
                    Saved
                  </Link>
                </div>
              </div>
            </section>

            <section className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-950">Your communities</p>
                  <p className="mt-1 text-xs text-slate-500">Spaces you joined</p>
                </div>
                <Link href="/communities" className="text-xs font-bold text-blue-600">
                  View all
                </Link>
              </div>

              <div className="mt-4 space-y-3">
                {communities.filter((community) => myCommunityIds.includes(community.id)).length === 0 ? (
                  <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
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
                        className="block rounded-2xl border border-slate-200 bg-white px-4 py-3 transition hover:bg-slate-50"
                      >
                        <p className="truncate font-bold text-slate-950">{community.name}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {community.category || "Community"}
                        </p>
                      </Link>
                    ))
                )}
              </div>
            </section>

            <section className="rounded-[32px] bg-slate-950 p-5 text-white shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-200">
                Pro workspace
              </p>
              <h3 className="mt-3 text-xl font-black tracking-tight">
                Clean, fast, social.
              </h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Built for clear reading, strong spacing, quick actions, and consistent mobile-to-desktop behavior.
              </p>
            </section>
          </div>
        </aside>

        <section className="min-w-0 space-y-5">
          <section className="overflow-hidden rounded-[34px] bg-white shadow-sm ring-1 ring-slate-200">
            <div className="grid gap-5 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-center">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-blue-600">
                  FaceGrem Feed
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  Good to see you, {userName.split(" ")[0] || "Creator"}.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                  Discover posts, stories, videos, creators, and conversations from across your FaceGrem world.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-[24px] bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-600">Feed</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{filteredPosts.length}</p>
                </div>
                <div className="rounded-[24px] bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">People</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{profiles.length}</p>
                </div>
                <div className="rounded-[24px] bg-white p-4 text-center shadow-sm ring-1 ring-slate-200">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">Alerts</p>
                  <p className="mt-2 text-3xl font-black text-slate-950">{unreadNotificationsCount}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-[32px] bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">Stories</p>
                <p className="text-xs text-slate-500">Fresh moments from people around you</p>
              </div>

              <button
                type="button"
                onClick={handleOpenStoryCreator}
                disabled={storyUploading}
                className="rounded-full bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-70"
              >
                {storyUploading ? "Uploading..." : "Create story"}
              </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={handleOpenStoryCreator}
                disabled={storyUploading}
                className="relative h-44 w-28 shrink-0 overflow-hidden rounded-[28px] bg-slate-950 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 disabled:opacity-70 sm:h-52 sm:w-36"
              >
                <img
                  src={userAvatar}
                  alt={userName}
                  className="absolute inset-0 h-full w-full object-cover opacity-40"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
                <div className="relative flex h-full flex-col justify-between p-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-2xl font-black text-white">
                    +
                  </span>
                  <div>
                    <p className="text-sm font-black text-white">
                      {storyUploading ? "Uploading..." : "Create story"}
                    </p>
                    <p className="mt-1 text-xs text-slate-300">Share a moment</p>
                  </div>
                </div>
              </button>

              {storyGroups.map((group) => {
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
                    className="relative h-44 w-28 shrink-0 overflow-hidden rounded-[28px] bg-slate-950 text-left shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 sm:h-52 sm:w-36"
                  >
                    <img
                      src={previewStory.image_url}
                      alt={storyUserName}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/10" />
                    <div className="relative flex h-full flex-col justify-between p-4">
                      <img
                        src={storyUserAvatar}
                        alt={storyUserName}
                        className="h-12 w-12 rounded-2xl border-2 border-white object-cover shadow-sm"
                      />
                      <div>
                        <p className="line-clamp-2 text-sm font-black text-white">{storyUserName}</p>
                        <p className="mt-1 text-xs text-slate-300">
                          {group.userId === userId ? "Your story" : `@${storyProfile?.username || "member"}`}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}

              {highlightedProfiles.map((profile) => (
                <Link
                  key={profile.id}
                  href={`/profile?id=${profile.id}`}
                  className="relative h-44 w-28 shrink-0 overflow-hidden rounded-[28px] bg-slate-950 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 sm:h-52 sm:w-36"
                >
                  <img
                    src={profile.avatar_url || getAvatarUrl(profile.full_name || "FaceGrem User")}
                    alt={profile.full_name}
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/10" />
                  <div className="relative flex h-full flex-col justify-between p-4">
                    <img
                      src={profile.avatar_url || getAvatarUrl(profile.full_name || "FaceGrem User")}
                      alt={profile.full_name}
                      className="h-12 w-12 rounded-2xl border-2 border-white object-cover shadow-sm"
                    />
                    <div>
                      <p className="line-clamp-2 text-sm font-black text-white">{profile.full_name}</p>
                      <p className="mt-1 text-xs text-slate-300">@{profile.username || "member"}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="overflow-hidden rounded-[32px] bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-black text-slate-950">Create post</p>
                  <p className="mt-1 text-xs text-slate-500">Share a thought, photo, story, or video.</p>
                </div>
                <span className="hidden rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700 sm:inline-flex">
                  Public post
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex items-start gap-3 sm:gap-4">
                <img
                  src={userAvatar}
                  alt={userName}
                  className="h-12 w-12 rounded-2xl object-cover sm:h-14 sm:w-14"
                />

                <div className="min-w-0 flex-1">
                  <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 transition focus-within:border-blue-300 focus-within:bg-white">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-950">{userName}</p>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                        Posting to everyone
                      </span>
                    </div>

                    <textarea
                      value={postText}
                      onChange={(event) => setPostText(event.target.value)}
                      rows={4}
                      placeholder="What’s on your mind today?"
                      className="w-full resize-none bg-transparent text-[15px] leading-7 text-slate-900 outline-none placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2.5">
                {quickActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    onClick={() => {
                      setActiveComposerAction(action);
                      if (action === "Story") handleOpenStoryCreator();
                    }}
                    className={`rounded-full px-4 py-2.5 text-sm font-bold transition ${
                      activeComposerAction === action
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>

              {(activeComposerAction === "Photo" || activeComposerAction === "Story") && (
                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">
                    {activeComposerAction === "Story" ? "Story image" : "Photo upload"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {activeComposerAction === "Story"
                      ? "Use the Create story button above to publish a story."
                      : "Add a strong visual to make your post stand out."}
                  </p>

                  {activeComposerAction === "Photo" && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="mt-4 block w-full rounded-2xl text-sm text-slate-900 file:mr-4 file:rounded-xl file:border-0 file:bg-blue-50 file:px-4 file:py-2.5 file:font-bold file:text-blue-700"
                      />

                      {imagePreview && (
                        <div className="mt-4 overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                          <img src={imagePreview} alt="Preview" className="max-h-96 w-full object-cover" />
                        </div>
                      )}
                    </>
                  )}

                  {activeComposerAction === "Story" && (
                    <button
                      type="button"
                      onClick={handleOpenStoryCreator}
                      disabled={storyUploading}
                      className="mt-4 rounded-2xl bg-blue-600 px-4 py-3 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-70"
                    >
                      {storyUploading ? "Uploading story..." : "Choose story image"}
                    </button>
                  )}
                </div>
              )}

              {(activeComposerAction === "Video" || activeComposerAction === "Live") && (
                <div className="mt-5 rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-black text-slate-950">
                    {activeComposerAction === "Live" ? "Live stream link" : "Video link"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Paste a YouTube link or direct video URL.</p>

                  <input
                    type="text"
                    value={videoUrl}
                    onChange={(event) => setVideoUrl(event.target.value)}
                    placeholder={
                      activeComposerAction === "Live"
                        ? "Paste a live stream or video URL"
                        : "Paste a YouTube or video URL"
                    }
                    className="mt-4 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none placeholder:text-slate-500 transition focus:border-blue-300"
                  />
                </div>
              )}

              <div className="mt-5 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
                    Text
                  </span>
                  {imagePreview && (
                    <span className="rounded-full bg-purple-50 px-3 py-1.5 text-xs font-bold text-purple-700">
                      Image attached
                    </span>
                  )}
                  {videoUrl.trim() && (
                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700">
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
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={handleCreatePost}
                    disabled={posting}
                    className="rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-70"
                  >
                    {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap gap-2 rounded-[28px] bg-white p-3 shadow-sm ring-1 ring-slate-200">
            {feedTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => {
                  setActiveFeedTab(tab);
                  if (tab === "Videos") router.push("/videos");
                }}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  activeFeedTab === tab
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {filteredPosts.length === 0 ? (
            <div className="rounded-[32px] bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-lg font-black text-slate-950">No posts found here yet.</p>
              <p className="mt-2 text-sm text-slate-500">Try another feed tab or create the first post.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredPosts.map((post) => {
                const authorProfile = getProfileById(post.user_id);
                const authorName = getBestNameForUser(post.user_id, post.full_name);
                const authorAvatar = getBestAvatarForUser(post.user_id, post.full_name, post.avatar_url);
                const likesCount = getPostLikesCount(post.id);
                const commentsCount = getPostCommentsCount(post.id);

                const latestComments = comments
                  .filter((comment) => comment.post_id === post.id)
                  .sort(
                    (a, b) =>
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                  )
                  .slice(0, 2);

                return (
                  <article
                    key={post.id}
                    className="overflow-hidden rounded-[34px] bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg"
                  >
                    <div className="p-5 sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <Link href={`/profile?id=${post.user_id}`} className="flex min-w-0 items-center gap-3">
                          <img
                            src={authorAvatar}
                            alt={authorName}
                            className="h-12 w-12 rounded-2xl object-cover"
                          />

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-black text-slate-950">{authorName}</p>

                              {authorProfile?.username && (
                                <span className="truncate text-sm text-slate-500">@{authorProfile.username}</span>
                              )}

                              <span className="hidden h-1 w-1 rounded-full bg-slate-300 sm:block" />
                              <span className="text-xs text-slate-500">
                                {new Date(post.created_at).toLocaleString()}
                              </span>
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">
                                Public
                              </span>

                              {post.video_url && (
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-700">
                                  Video post
                                </span>
                              )}

                              {post.image_url && !post.video_url && (
                                <span className="rounded-full bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-700">
                                  Photo post
                                </span>
                              )}
                            </div>
                          </div>
                        </Link>

                        {post.user_id === userId && (
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-600 transition hover:bg-red-100"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {post.content && (
                        <p className="mt-5 whitespace-pre-line text-[15px] leading-8 text-slate-700">
                          {post.content}
                        </p>
                      )}
                    </div>

                    {post.image_url && (
                      <div className="border-y border-slate-200 bg-slate-100 px-3 py-3 sm:px-4">
                        <div className="overflow-hidden rounded-[28px] bg-white">
                          <img src={post.image_url} alt="Post" className="max-h-[720px] w-full object-cover" />
                        </div>
                      </div>
                    )}

                    {post.video_url && (
                      <div className="border-y border-slate-200 bg-slate-950 px-3 py-3 sm:px-4">
                        <div className="overflow-hidden rounded-[28px]">
                          {isYouTubeUrl(post.video_url) ? (
                            <iframe
                              src={getYouTubeEmbedUrl(post.video_url)}
                              title={`feed-video-${post.id}`}
                              className="h-80 w-full md:h-[480px]"
                              allowFullScreen
                            />
                          ) : (
                            <video controls className="h-80 w-full bg-black md:h-[480px]" src={post.video_url} />
                          )}
                        </div>
                      </div>
                    )}

                    <div className="p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-bold text-slate-700">
                            ❤️ {likesCount} {likesCount === 1 ? "like" : "likes"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1.5 font-bold text-slate-700">
                            {commentsCount} {commentsCount === 1 ? "comment" : "comments"}
                          </span>
                        </div>

                        <Link href={`/post/${post.id}`} className="text-sm font-black text-blue-600 hover:text-blue-700">
                          View discussion
                        </Link>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                        <button
                          type="button"
                          onClick={() => handleToggleLike(post.id, post.user_id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                            isLiked(post.id)
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {isLiked(post.id) ? "Liked" : "Like"}
                        </button>

                        <Link
                          href={`/post/${post.id}`}
                          className="rounded-2xl bg-slate-100 px-4 py-3 text-center text-sm font-black text-slate-600 transition hover:bg-slate-200"
                        >
                          Comment
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleToggleSave(post.id)}
                          className={`rounded-2xl px-4 py-3 text-sm font-black transition ${
                            isSaved(post.id)
                              ? "bg-blue-600 text-white"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {isSaved(post.id) ? "Saved" : "Save"}
                        </button>

                        <Link
                          href={`/post/${post.id}`}
                          className="rounded-2xl bg-blue-50 px-4 py-3 text-center text-sm font-black text-blue-700 transition hover:bg-blue-100"
                        >
                          Open
                        </Link>
                      </div>

                      {latestComments.length > 0 && (
                        <div className="mt-5 space-y-3 border-t border-slate-200 pt-4">
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                            Recent comments
                          </p>

                          {latestComments.map((comment) => {
                            const commentAuthorName = getBestNameForUser(comment.user_id, comment.full_name);
                            const commentAuthorAvatar = getBestAvatarForUser(comment.user_id, comment.full_name, null);

                            return (
                              <div key={comment.id} className="flex items-start gap-3 rounded-2xl bg-slate-50 px-3 py-3">
                                <img
                                  src={commentAuthorAvatar}
                                  alt={commentAuthorName}
                                  className="h-9 w-9 rounded-xl object-cover"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-black text-slate-950">{commentAuthorName}</p>
                                    <span className="text-[11px] text-slate-500">
                                      {new Date(comment.created_at).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
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
          <section className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">People</p>
                <p className="mt-1 text-xs text-slate-500">Connect with members</p>
              </div>
              <FriendsFistIcon className="h-6 w-6 text-blue-600" />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
              {(["online", "suggestions", "your_friends"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveFriendsTab(tab)}
                  className={`rounded-xl px-2 py-2 text-[11px] font-black transition ${
                    activeFriendsTab === tab
                      ? "bg-white text-blue-700 shadow-sm"
                      : "text-slate-500 hover:bg-white/70"
                  }`}
                >
                  {tab === "online" ? "Online" : tab === "suggestions" ? "Suggested" : "Friends"}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3">
              {(activeFriendsTab === "online"
                ? onlinePeople
                : activeFriendsTab === "suggestions"
                  ? suggestedPeople
                  : yourFriends
              ).length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">
                  People will appear here as your network grows.
                </p>
              ) : (
                (activeFriendsTab === "online"
                  ? onlinePeople
                  : activeFriendsTab === "suggestions"
                    ? suggestedPeople
                    : yourFriends
                ).map((profile) => (
                  <div
                    key={profile.id}
                    className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <Link href={`/profile?id=${profile.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <img
                        src={profile.avatar_url || getAvatarUrl(profile.full_name || "FaceGrem User")}
                        alt={profile.full_name}
                        className="h-11 w-11 rounded-2xl object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-950">{profile.full_name}</p>
                        <p className="truncate text-xs text-slate-500">@{profile.username || "member"}</p>
                      </div>
                    </Link>

                    {profile.id !== userId && (
                      <button
                        type="button"
                        onClick={() => handleToggleFollow(profile.id)}
                        className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                          isFollowingUser(profile.id)
                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                      >
                        {isFollowingUser(profile.id) ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">Suggested communities</p>
                <p className="mt-1 text-xs text-slate-500">Find places to belong</p>
              </div>
              <GroupPeopleIcon className="h-6 w-6 text-blue-600" />
            </div>

            <div className="mt-4 space-y-3">
              {suggestedCommunities.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  No new communities to show yet.
                </p>
              ) : (
                suggestedCommunities.map((community) => (
                  <Link
                    key={community.id}
                    href={`/communities/${community.id}`}
                    className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:bg-slate-50"
                  >
                    <p className="truncate font-black text-slate-950">{community.name}</p>
                    <p className="mt-1 text-xs text-slate-500">{community.category || "Community"}</p>
                  </Link>
                ))
              )}
            </div>
          </section>

          <section className="rounded-[32px] bg-white p-5 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-slate-950">Latest videos</p>
                <p className="mt-1 text-xs text-slate-500">Fresh creator content</p>
              </div>
              <Link href="/videos" className="text-xs font-black text-blue-600">
                View
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {latestVideoCards.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
                  Videos will appear here soon.
                </p>
              ) : (
                latestVideoCards.map((video) => (
                  <Link
                    key={video.id}
                    href="/videos"
                    className="block rounded-2xl border border-slate-200 bg-white p-3 transition hover:bg-slate-50"
                  >
                    <div className="flex gap-3">
                      <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-slate-950 text-white">
                        {video.thumbnail_url ? (
                          <img src={video.thumbnail_url} alt={video.title} className="h-full w-full object-cover" />
                        ) : (
                          "▶"
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-black text-slate-950">{video.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{video.category || "Video"}</p>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </section>
        </aside>
      </main>

      {storyViewerOpen && activeStory && activeStoryGroup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4">
          <button
            type="button"
            onClick={closeStoryViewer}
            className="absolute right-5 top-5 rounded-full bg-white/10 px-4 py-2 text-sm font-black text-white transition hover:bg-white/20"
          >
            Close
          </button>

          <button
            type="button"
            onClick={goToPreviousStory}
            className="absolute left-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 px-4 py-4 text-2xl text-white transition hover:bg-white/20 sm:block"
            aria-label="Previous story"
          >
            ‹
          </button>

          <div className="w-full max-w-md overflow-hidden rounded-[34px] bg-white shadow-2xl">
            <div className="flex items-center gap-3 border-b border-slate-200 p-4">
              <img
                src={getBestAvatarForUser(activeStoryGroup.userId)}
                alt={getBestNameForUser(activeStoryGroup.userId)}
                className="h-11 w-11 rounded-2xl object-cover"
              />
              <div className="min-w-0">
                <p className="truncate font-black text-slate-950">
                  {getBestNameForUser(activeStoryGroup.userId)}
                </p>
                <p className="text-xs text-slate-500">
                  {new Date(activeStory.created_at).toLocaleString()}
                </p>
              </div>
            </div>

            <div className="relative bg-slate-950">
              <img
                src={activeStory.image_url}
                alt="Story"
                className="max-h-[72vh] w-full object-contain"
              />
            </div>

            {activeStory.caption && (
              <p className="border-t border-slate-200 p-4 text-sm leading-7 text-slate-700">
                {activeStory.caption}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={goToNextStory}
            className="absolute right-4 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/10 px-4 py-4 text-2xl text-white transition hover:bg-white/20 sm:block"
            aria-label="Next story"
          >
            ›
          </button>

          <div className="absolute bottom-6 flex gap-3 sm:hidden">
            <button
              type="button"
              onClick={goToPreviousStory}
              className="rounded-full bg-white/10 px-5 py-3 text-white"
            >
              Previous
            </button>
            <button
              type="button"
              onClick={goToNextStory}
              className="rounded-full bg-white/10 px-5 py-3 text-white"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  );
}
