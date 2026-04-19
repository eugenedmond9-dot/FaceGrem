"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

const categories = ["All", "Creators", "Faith", "Local", "Business", "Education"];

export default function CommunitiesPage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [communities, setCommunities] = useState<CommunityRecord[]>([]);
  const [members, setMembers] = useState<CommunityMemberRecord[]>([]);
  const [profiles, setProfiles] = useState<ProfileRecord[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [creatingCommunity, setCreatingCommunity] = useState(false);
  const [joinLoadingId, setJoinLoadingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [category, setCategory] = useState("Creators");
  const [description, setDescription] = useState("");

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

  const getBestAvatarForUser = (uid?: string, fallbackName?: string | null) => {
    const profile = getProfileById(uid);
    return (
      profile?.avatar_url ||
      getAvatarUrl(profile?.full_name || fallbackName || "FaceGrem User")
    );
  };

  useEffect(() => {
    const loadCommunities = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/");
        return;
      }

      setUserId(session.user.id);

      const [
        { data: communitiesData, error: communitiesError },
        { data: membersData, error: membersError },
        { data: profilesData, error: profilesError },
      ] = await Promise.all([
        supabase
          .from("communities")
          .select("id, creator_id, name, category, description, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("community_members")
          .select("id, community_id, user_id, created_at"),
        supabase
          .from("profiles")
          .select("id, full_name, username, bio, avatar_url"),
      ]);

      if (communitiesError) {
        alert(communitiesError.message);
      } else {
        setCommunities(communitiesData || []);
      }

      if (membersError) {
        alert(membersError.message);
      } else {
        setMembers(membersData || []);
      }

      if (profilesError) {
        alert(profilesError.message);
      } else {
        setProfiles(profilesData || []);
      }

      setLoading(false);
    };

    void loadCommunities();
  }, [router]);

  const filteredCommunities = useMemo(() => {
    if (activeCategory === "All") return communities;
    return communities.filter(
      (community) => (community.category || "Creators") === activeCategory
    );
  }, [communities, activeCategory]);

  const getMemberCount = (communityId: string) => {
    return members.filter((member) => member.community_id === communityId).length;
  };

  const getCreatorProfile = (creatorId: string) => {
    return getProfileById(creatorId);
  };

  const isJoined = (communityId: string) => {
    return members.some(
      (member) => member.community_id === communityId && member.user_id === userId
    );
  };

  const handleCreateCommunity = async () => {
    if (!name.trim()) {
      alert("Community name is required.");
      return;
    }

    if (!userId) {
      alert("You must be logged in.");
      return;
    }

    setCreatingCommunity(true);

    const { data, error } = await supabase
      .from("communities")
      .insert([
        {
          creator_id: userId,
          name: name.trim(),
          category,
          description: description.trim() || null,
        },
      ])
      .select("id, creator_id, name, category, description, created_at");

    if (error) {
      alert(error.message);
      setCreatingCommunity(false);
      return;
    }

    if (data && data.length > 0) {
      setCommunities((prev) => [data[0], ...prev]);
      setName("");
      setCategory("Creators");
      setDescription("");
    }

    setCreatingCommunity(false);
  };

  const handleToggleJoin = async (communityId: string) => {
    if (!userId) return;

    setJoinLoadingId(communityId);

    const existingMembership = members.find(
      (member) => member.community_id === communityId && member.user_id === userId
    );

    if (existingMembership) {
      const { error } = await supabase
        .from("community_members")
        .delete()
        .eq("id", existingMembership.id);

      if (error) {
        alert(error.message);
      } else {
        setMembers((prev) =>
          prev.filter((member) => member.id !== existingMembership.id)
        );
      }

      setJoinLoadingId(null);
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
    } else if (data && data.length > 0) {
      setMembers((prev) => [...prev, data[0]]);
    }

    setJoinLoadingId(null);
  };

  const handleDeleteCommunity = async (communityId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this community?"
    );
    if (!confirmed) return;

    const { error } = await supabase
      .from("communities")
      .delete()
      .eq("id", communityId);

    if (error) {
      alert(error.message);
      return;
    }

    setCommunities((prev) =>
      prev.filter((community) => community.id !== communityId)
    );
    setMembers((prev) =>
      prev.filter((member) => member.community_id !== communityId)
    );
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
        <div className="flex items-center justify-between px-6 py-4 mx-auto max-w-7xl">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center font-bold shadow-lg h-11 w-11 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 shadow-cyan-500/20">
              F
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FaceGrem</h1>
              <p className="text-xs text-slate-400">Communities</p>
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

      <main className="px-6 py-10 mx-auto max-w-7xl">
        <section className="rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%),linear-gradient(to_bottom_right,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-6 backdrop-blur-xl">
          <p className="text-sm font-medium text-cyan-200">Community discovery</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight">
            Build and join real communities on FaceGrem.
          </h2>
          <p className="max-w-3xl mt-3 text-sm leading-7 text-slate-300">
            Create spaces for creators, faith, business, local discussions, and
            education. Open any community to see members and community posts.
          </p>
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-xl font-semibold text-white">Create a community</h3>

          <div className="grid gap-4 mt-5 md:grid-cols-2">
            <input
              type="text"
              placeholder="Community name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5"
            >
              <option value="Creators">Creators</option>
              <option value="Faith">Faith</option>
              <option value="Local">Local</option>
              <option value="Business">Business</option>
              <option value="Education">Education</option>
            </select>

            <textarea
              placeholder="Community description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="px-4 py-3 text-sm text-white border outline-none rounded-2xl border-white/10 bg-white/5 placeholder:text-slate-400 md:col-span-2"
            />
          </div>

          <button
            onClick={handleCreateCommunity}
            disabled={creatingCommunity}
            className="px-5 py-3 mt-5 text-sm font-semibold text-white shadow-lg rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 shadow-cyan-500/20 disabled:opacity-70"
          >
            {creatingCommunity ? "Creating..." : "Create community"}
          </button>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap gap-3 mb-5">
            {categories.map((item) => (
              <button
                key={item}
                onClick={() => setActiveCategory(item)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategory === item
                    ? "bg-gradient-to-r from-cyan-400 to-blue-600 text-white"
                    : "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {filteredCommunities.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-slate-300">
              No communities available yet.
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredCommunities.map((community) => {
                const memberCount = getMemberCount(community.id);
                const joined = isJoined(community.id);
                const creatorProfile = getCreatorProfile(community.creator_id);
                const creatorName = getBestNameForUser(
                  community.creator_id,
                  creatorProfile?.full_name
                );
                const creatorAvatar = getBestAvatarForUser(
                  community.creator_id,
                  creatorProfile?.full_name
                );

                return (
                  <article
                    key={community.id}
                    className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-xl"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center justify-center w-16 h-16 text-2xl font-bold text-white rounded-3xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20">
                        {community.name.charAt(0).toUpperCase()}
                      </div>

                      <span className="px-3 py-1 text-xs rounded-full bg-white/10 text-slate-300">
                        {community.category || "Creators"}
                      </span>
                    </div>

                    <div className="mt-4">
                      <Link
                        href={`/communities/${community.id}`}
                        className="text-lg font-semibold leading-7 text-white hover:text-cyan-300"
                      >
                        {community.name}
                      </Link>

                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {community.description || "No description yet."}
                      </p>

                      <div className="flex items-center gap-3 p-3 mt-4 border rounded-2xl border-white/10 bg-white/5">
                        <img
                          src={creatorAvatar}
                          alt={creatorName}
                          className="object-cover w-10 h-10 rounded-2xl"
                        />
                        <div>
                          <p className="text-sm font-medium text-white">
                            {creatorName}
                          </p>
                          <p className="text-xs text-slate-400">
                            Creator • {memberCount}{" "}
                            {memberCount === 1 ? "member" : "members"}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3 text-xs text-slate-500">
                        {new Date(community.created_at).toLocaleString()}
                      </p>

                      <div className="flex flex-wrap gap-3 mt-5">
                        <Link
                          href={`/communities/${community.id}`}
                          className="px-4 py-2 text-sm font-medium transition border rounded-2xl border-white/10 bg-white/5 text-cyan-300 hover:bg-white/10"
                        >
                          Open community
                        </Link>

                        <button
                          onClick={() => handleToggleJoin(community.id)}
                          disabled={joinLoadingId === community.id}
                          className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                            joined
                              ? "border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                              : "bg-gradient-to-r from-cyan-400 to-blue-600 text-white shadow-lg shadow-cyan-500/20"
                          } disabled:opacity-70`}
                        >
                          {joinLoadingId === community.id
                            ? "Please wait..."
                            : joined
                            ? "Leave"
                            : "Join"}
                        </button>

                        {community.creator_id === userId && (
                          <button
                            onClick={() => handleDeleteCommunity(community.id)}
                            className="px-4 py-2 text-sm text-red-200 border rounded-2xl border-red-400/20 bg-red-500/10 hover:bg-red-500/20"
                          >
                            Delete
                          </button>
                        )}
                      </div>
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