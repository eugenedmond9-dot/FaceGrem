import { z } from "zod";

const uuid = z.string().uuid();
const optionalUrl = z.string().trim().max(2048).url().optional().or(z.literal(""));

export const postSchema = z.object({
  content: z.string().trim().min(1, "Post cannot be empty").max(5000),
  image_url: optionalUrl,
  video_url: optionalUrl,
  community_id: uuid.optional().or(z.literal("")),
});

export const commentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty").max(1000),
  post_id: uuid,
});

export const messageSchema = z.object({
  conversation_id: uuid,
  content: z.string().trim().max(5000).optional().or(z.literal("")),
  media_url: optionalUrl,
  voice_url: optionalUrl,
});

export const profileSchema = z.object({
  full_name: z.string().trim().min(1).max(80),
  username: z.string().trim().min(3).max(30).regex(/^[a-zA-Z0-9._]+$/),
  bio: z.string().trim().max(300).optional().or(z.literal("")),
  avatar_url: optionalUrl,
});

export const fileUploadSchema = z.object({
  fileName: z.string().trim().min(1).max(180),
  fileSize: z.number().int().positive().max(25 * 1024 * 1024),
  mimeType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "video/mp4",
    "video/webm",
    "audio/webm",
    "audio/mpeg",
    "audio/wav",
  ]),
});

export function cleanPlainText(value: string) {
  return value
    .replace(/\u0000/g, "")
    .replace(/[<>]/g, "")
    .replace(/javascript:/gi, "")
    .trim();
}

export function validateOrThrow<T>(schema: z.ZodSchema<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new Error(result.error.issues[0]?.message || "Invalid input");
  return result.data;
}
