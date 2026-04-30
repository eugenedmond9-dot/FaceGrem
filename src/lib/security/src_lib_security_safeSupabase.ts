import { SupabaseClient } from "@supabase/supabase-js";

export async function requireUser(supabase: SupabaseClient) {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("You must be signed in.");
  }

  return user;
}

export function assertOwnsUserId(currentUserId: string, requestedUserId: string) {
  if (currentUserId !== requestedUserId) {
    throw new Error("Not allowed.");
  }
}

export function buildUserFilePath(userId: string, fileName: string) {
  const safeName = fileName
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

  return `${userId}/${Date.now()}-${safeName}`;
}
