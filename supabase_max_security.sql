-- FaceGrem maximum Supabase security hardening.
-- Read before running. Adjust names if your schema differs.

-- Required extensions for helper constraints/indexes
create extension if not exists pgcrypto;

-- Enable RLS
alter table if exists public.profiles enable row level security;
alter table if exists public.posts enable row level security;
alter table if exists public.comments enable row level security;
alter table if exists public.likes enable row level security;
alter table if exists public.saved_posts enable row level security;
alter table if exists public.follows enable row level security;
alter table if exists public.conversations enable row level security;
alter table if exists public.messages enable row level security;
alter table if exists public.communities enable row level security;
alter table if exists public.community_members enable row level security;
alter table if exists public.videos enable row level security;
alter table if exists public.notifications enable row level security;
alter table if exists public.stories enable row level security;

-- Force RLS for table owners too where supported.
alter table if exists public.profiles force row level security;
alter table if exists public.posts force row level security;
alter table if exists public.comments force row level security;
alter table if exists public.likes force row level security;
alter table if exists public.saved_posts force row level security;
alter table if exists public.follows force row level security;
alter table if exists public.conversations force row level security;
alter table if exists public.messages force row level security;
alter table if exists public.communities force row level security;
alter table if exists public.community_members force row level security;
alter table if exists public.videos force row level security;
alter table if exists public.notifications force row level security;
alter table if exists public.stories force row level security;

-- Prevent accidental duplicate abuse.
create unique index if not exists unique_like_per_user_post
on public.likes(user_id, post_id);

create unique index if not exists unique_saved_post_per_user
on public.saved_posts(user_id, post_id);

create unique index if not exists unique_follow_pair
on public.follows(follower_id, following_id);

create unique index if not exists unique_community_member
on public.community_members(community_id, user_id);

-- Profiles
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Posts
drop policy if exists "posts_select_authenticated" on public.posts;
create policy "posts_select_authenticated" on public.posts for select to authenticated using (true);

drop policy if exists "posts_insert_self" on public.posts;
create policy "posts_insert_self" on public.posts for insert to authenticated
with check (user_id = auth.uid());

drop policy if exists "posts_update_self" on public.posts;
create policy "posts_update_self" on public.posts for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "posts_delete_self" on public.posts;
create policy "posts_delete_self" on public.posts for delete to authenticated
using (user_id = auth.uid());

-- Comments
drop policy if exists "comments_select_authenticated" on public.comments;
create policy "comments_select_authenticated" on public.comments for select to authenticated using (true);

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self" on public.comments for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.posts p where p.id = post_id)
);

drop policy if exists "comments_update_self" on public.comments;
create policy "comments_update_self" on public.comments for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "comments_delete_self" on public.comments;
create policy "comments_delete_self" on public.comments for delete to authenticated
using (user_id = auth.uid());

-- Likes
drop policy if exists "likes_select_authenticated" on public.likes;
create policy "likes_select_authenticated" on public.likes for select to authenticated using (true);

drop policy if exists "likes_insert_self" on public.likes;
create policy "likes_insert_self" on public.likes for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (select 1 from public.posts p where p.id = post_id)
);

drop policy if exists "likes_delete_self" on public.likes;
create policy "likes_delete_self" on public.likes for delete to authenticated
using (user_id = auth.uid());

-- Saved posts
drop policy if exists "saved_posts_select_self" on public.saved_posts;
create policy "saved_posts_select_self" on public.saved_posts for select to authenticated using (user_id = auth.uid());

drop policy if exists "saved_posts_insert_self" on public.saved_posts;
create policy "saved_posts_insert_self" on public.saved_posts for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "saved_posts_delete_self" on public.saved_posts;
create policy "saved_posts_delete_self" on public.saved_posts for delete to authenticated using (user_id = auth.uid());

-- Follows
drop policy if exists "follows_select_authenticated" on public.follows;
create policy "follows_select_authenticated" on public.follows for select to authenticated using (true);

drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self" on public.follows for insert to authenticated
with check (follower_id = auth.uid() and follower_id <> following_id);

drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self" on public.follows for delete to authenticated using (follower_id = auth.uid());

-- Conversations
drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant" on public.conversations for select to authenticated
using (auth.uid() = user_one or auth.uid() = user_two);

drop policy if exists "conversations_insert_participant" on public.conversations;
create policy "conversations_insert_participant" on public.conversations for insert to authenticated
with check (auth.uid() = user_one or auth.uid() = user_two);

drop policy if exists "conversations_update_participant" on public.conversations;
create policy "conversations_update_participant" on public.conversations for update to authenticated
using (auth.uid() = user_one or auth.uid() = user_two)
with check (auth.uid() = user_one or auth.uid() = user_two);

-- Messages
drop policy if exists "messages_select_conversation_participant" on public.messages;
create policy "messages_select_conversation_participant" on public.messages for select to authenticated
using (
  exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.user_one = auth.uid() or c.user_two = auth.uid())
  )
);

drop policy if exists "messages_insert_sender_participant" on public.messages;
create policy "messages_insert_sender_participant" on public.messages for insert to authenticated
with check (
  sender_id = auth.uid()
  and exists (
    select 1 from public.conversations c
    where c.id = conversation_id
      and (c.user_one = auth.uid() or c.user_two = auth.uid())
  )
);

drop policy if exists "messages_update_sender" on public.messages;
create policy "messages_update_sender" on public.messages for update to authenticated
using (sender_id = auth.uid())
with check (sender_id = auth.uid());

-- Communities
drop policy if exists "communities_select_authenticated" on public.communities;
create policy "communities_select_authenticated" on public.communities for select to authenticated using (true);

drop policy if exists "communities_insert_creator" on public.communities;
create policy "communities_insert_creator" on public.communities for insert to authenticated with check (creator_id = auth.uid());

drop policy if exists "communities_update_creator" on public.communities;
create policy "communities_update_creator" on public.communities for update to authenticated
using (creator_id = auth.uid())
with check (creator_id = auth.uid());

drop policy if exists "communities_delete_creator" on public.communities;
create policy "communities_delete_creator" on public.communities for delete to authenticated using (creator_id = auth.uid());

-- Community members
drop policy if exists "community_members_select_authenticated" on public.community_members;
create policy "community_members_select_authenticated" on public.community_members for select to authenticated using (true);

drop policy if exists "community_members_insert_self" on public.community_members;
create policy "community_members_insert_self" on public.community_members for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "community_members_delete_self" on public.community_members;
create policy "community_members_delete_self" on public.community_members for delete to authenticated using (user_id = auth.uid());

-- Videos
drop policy if exists "videos_select_authenticated" on public.videos;
create policy "videos_select_authenticated" on public.videos for select to authenticated using (true);

drop policy if exists "videos_insert_self" on public.videos;
create policy "videos_insert_self" on public.videos for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "videos_update_self" on public.videos;
create policy "videos_update_self" on public.videos for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "videos_delete_self" on public.videos;
create policy "videos_delete_self" on public.videos for delete to authenticated using (user_id = auth.uid());

-- Notifications
drop policy if exists "notifications_select_self" on public.notifications;
create policy "notifications_select_self" on public.notifications for select to authenticated using (user_id = auth.uid());

drop policy if exists "notifications_update_self" on public.notifications;
create policy "notifications_update_self" on public.notifications for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "notifications_insert_system_or_self" on public.notifications;
create policy "notifications_insert_system_or_self" on public.notifications for insert to authenticated
with check (user_id = auth.uid() or actor_id = auth.uid());

-- Storage. File path should be bucket/{user_id}/filename.
drop policy if exists "storage_read_authenticated" on storage.objects;
create policy "storage_read_authenticated" on storage.objects for select to authenticated
using (bucket_id in ('avatars', 'posts', 'videos', 'voices'));

drop policy if exists "storage_insert_own_folder" on storage.objects;
create policy "storage_insert_own_folder" on storage.objects for insert to authenticated
with check (
  bucket_id in ('avatars', 'posts', 'videos', 'voices')
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "storage_update_own_folder" on storage.objects;
create policy "storage_update_own_folder" on storage.objects for update to authenticated
using (
  bucket_id in ('avatars', 'posts', 'videos', 'voices')
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id in ('avatars', 'posts', 'videos', 'voices')
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "storage_delete_own_folder" on storage.objects;
create policy "storage_delete_own_folder" on storage.objects for delete to authenticated
using (
  bucket_id in ('avatars', 'posts', 'videos', 'voices')
  and auth.uid()::text = (storage.foldername(name))[1]
);
