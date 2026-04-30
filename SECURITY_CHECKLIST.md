# FaceGrem professional security checklist

## Vercel
- Turn on Vercel Firewall.
- Add rate limit rule for auth/sign-in/sign-up endpoints.
- Add rate limit rule for write endpoints: posts, comments, messages, uploads.
- Keep environment variables private.
- Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.

## Supabase Auth
- Enable email confirmation.
- Enable strong password requirements.
- Use MFA later for admin/moderator accounts.
- Disable anonymous public writes.

## Supabase Database
- Enable RLS on every user-data table.
- Use FORCE ROW LEVEL SECURITY.
- Add unique indexes for likes, follows, saved posts, community members.
- Test every policy using a normal logged-in user, not the service role.

## Storage
- Use user-id folder paths: avatars/{user_id}/file.png.
- Restrict upload types in the UI.
- Restrict bucket policies.
- Do not allow public write access.

## Code
- Validate all inputs with Zod.
- Do not use dangerouslySetInnerHTML for user posts.
- Rate limit sensitive actions.
- Use middleware to protect logged-in pages.
- Keep dependencies updated with npm audit.
