"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

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

export default function CommunitiesPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("FaceGrem User");
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [communityMembers, setCommunityMembers] = useState<CommunityMemberRecord[]>([]);
  const [communityPosts, setCommunityPosts] = useState<PostRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creatingCommunity, setCreatingCommunity] = useState(false);
  const [communityName, setCommunityName] = useState("");
  const [communityCategory, setCommunityCategory] = useState("");
  const [communityDescription, setCommunityDescription] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name
    )}&background=0f172a&color=ffffff&bold=true`;

  const getProfileById = (profileId?: string) => {
    if (!profileId) return undefined;
    return profiles.find((profile) => profile.id === profileId);
  };

  const getBestNameForUser = (uid?: string) => {
    const profile = getProfileById(uid);
    return profile?.full_name || "FaceGrem User";
  };

  const getBestAvatarForUser = (uid?: string) => {
    const profile = getProfileById(uid);
    return profile?.avatar_url || getAvatarUrl(profile?.full_name || "FaceGrem User");
  };

  useEffect(() => {
    const loadCommunitiesPage = async () => {
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
        { data: profilesData },
        { data: communitiesData },
        { data: communityMembersData },
        { data: communityPostsData },
      ] = await Promise.all([
        supabase.from("profiles").select("id, full_name, username, bio, avatar_url"),
        supabase
          .from("communities")
          .select("id, creator_id, name, category, description, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("community_members")
          .select("id, community_id, user_id, created_at"),
        supabase
          .from("posts")
          .select(
            "id, user_id, content, created_at, full_name, avatar_url, image_url, video_url, community_id"
          )
          .not("community_id", "is", null)
          .order("created_at", { ascending: false }),
      ]);

      setProfiles(profilesData || []);
      setCommunities(communitiesData || []);
      setCommunityMembers(communityMembersData || []);
      setCommunityPosts(communityPostsData || []);
      setLoading(false);
    };

    void loadCommunitiesPage();
  }, [router]);

  const myCommunityIds = useMemo(() => {
    return communityMembers
      .filter((member) => member.user_id === userId)
      .map((member) => member.community_id);
  }, [communityMembers, userId]);

  const filteredCommunities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return communities;

    return communities.filter((community) => {
      const haystack = `${community.name} ${community.category || ""} ${community.description || ""}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [communities, searchTerm]);

  const getCommunityMembersCount = (communityId: string) => {
    return communityMembers.filter((member) => member.community_id === communityId).length;
  };

  const getCommunityPostsCount = (communityId: string) => {
    return communityPosts.filter((post) => post.community_id === communityId).length;
  };

  const isMember = (communityId: string) => {
    return myCommunityIds.includes(communityId);
  };

  const handleCreateCommunity = async (e: FormEvent) => {
    e.preventDefault();

    const trimmedName = communityName.trim();
    const trimmedCategory = communityCategory.trim();
    const trimmedDescription = communityDescription.trim();

    if (!trimmedName) {
      alert("Community name is required.");
      return;
    }

    setCreatingCommunity(true);

    const { data, error } = await supabase
      .from("communities")
      .insert([
        {
          creator_id: userId,
          name: trimmedName,
          category: trimmedCategory || null,
          description: trimmedDescription || null,
        },
      ])
      .select("id, creator_id, name, category, description, created_at");

    if (error) {
      alert(error.message);
      setCreatingCommunity(false);
      return;
    }

    if (data && data.length > 0) {
      const createdCommunity = data[0];

      const { data: memberData, error: memberError } = await supabase
        .from("community_members")
        .insert([
          {
            community_id: createdCommunity.id,
            user_id: userId,
          },
        ])
        .select("id, community_id, user_id, created_at");

      if (memberError) {
        alert(memberError.message);
        setCreatingCommunity(false);
        return;
      }

      setCommunities((prev) => [createdCommunity, ...prev]);
      if (memberData && memberData.length > 0) {
        setCommunityMembers((prev) => [...prev, memberData[0]]);
      }

      setCommunityName("");
      setCommunityCategory("");
      setCommunityDescription("");
      setShowCreateForm(false);
    }

    setCreatingCommunity(false);
  };

  const handleJoinCommunity = async (communityId: string) => {
    if (isMember(communityId)) {
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#07111f] text-white">
        Loading communities...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#07111f] text-white">
      <header className="border-b border-white/10 bg-[#07111f]/85 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-4 px-4 py-4 mx-auto max-w-7xl sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">Communities</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateForm((prev) => !prev)}
              className="px-4 py-2 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20"
            >
              {showCreateForm ? "Close" : "Create community"}
            </button>
            <Link
              href="/feed"
              className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"
            >
              Back to Feed
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <img
                src={getBestAvatarForUser(userId)}
                alt={userName}
                className="object-cover h-14 w-14 rounded-2xl"
              />
              <div>
                <p className="font-semibold text-white">{userName}</p>
                <p className="text-sm text-slate-400">
                  {myCommunityIds.length} joined communities
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
            <p className="text-sm font-medium text-cyan-200">Search communities</p>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name or category"
              className="w-full px-4 py-3 mt-4 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
            />
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreateCommunity}
              className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
            >
              <p className="text-sm font-medium text-cyan-200">New community</p>

              <div className="mt-4 space-y-4">
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="Community name"
                  className="w-full px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
                />

                <input
                  type="text"
                  value={communityCategory}
                  onChange={(e) => setCommunityCategory(e.target.value)}
                  placeholder="Category (optional)"
                  className="w-full px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
                />

                <textarea
                  value={communityDescription}
                  onChange={(e) => setCommunityDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe your community"
                  className="w-full px-4 py-3 text-sm text-white border outline-none resize-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
                />

                <button
                  type="submit"
                  disabled={creatingCommunity}
                  className="w-full py-3 text-sm font-semibold text-white rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 disabled:opacity-70"
                >
                  {creatingCommunity ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          )}
        </aside>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl">
            <p className="text-sm font-medium text-cyan-200">Discover & belong</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Explore communities built around shared interests.
            </h2>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              Join spaces where people post, discuss, and grow together inside FaceGrem.
            </p>
          </div>

          {filteredCommunities.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-300">
              No communities found.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredCommunities.map((community) => {
                const memberCount = getCommunityMembersCount(community.id);
                const postCount = getCommunityPostsCount(community.id);
                const creatorName = getBestNameForUser(community.creator_id);
                const joined = isMember(community.id);

                return (
                  <article
                    key={community.id}
                    className="rounded-[30px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-cyan-200">
                          {community.category || "Community"}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold tracking-tight text-white">
                          {community.name}
                        </h3>
                        <p className="mt-2 text-sm text-slate-300">
                          {community.description || "No description yet."}
                        </p>
                      </div>

                      <div className="px-3 py-1 text-xs border rounded-full border-white/10 bg-white/5 text-slate-300">
                        {joined ? "Joined" : "Open"}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-5">
                      <img
                        src={getBestAvatarForUser(community.creator_id)}
                        alt={creatorName}
                        className="object-cover w-10 h-10 rounded-2xl"
                      />
                      <div>
                        <p className="text-sm font-medium text-white">{creatorName}</p>
                        <p className="text-xs text-slate-400">Creator</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-5">
                      <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                        <p className="text-xs text-slate-400">Members</p>
                        <p className="mt-2 text-xl font-bold text-white">{memberCount}</p>
                      </div>
                      <div className="p-4 border rounded-2xl border-white/10 bg-white/5">
                        <p className="text-xs text-slate-400">Posts</p>
                        <p className="mt-2 text-xl font-bold text-white">{postCount}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-5">
                      <button
                        onClick={() => handleJoinCommunity(community.id)}
                        className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                          joined
                            ? "border border-red-400/20 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                            : "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
                        }`}
                      >
                        {joined ? "Leave" : "Join"}
                      </button>

                      <Link
                        href={`/communities/${community.id}`}
                        className="px-4 py-2 text-sm border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                      >
                        Open community
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