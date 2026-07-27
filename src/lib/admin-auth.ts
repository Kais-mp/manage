import { User } from '@supabase/supabase-js';

const allowedAdminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || 'admin@example.com')
  .split(',')
  .map((value) => value.trim().toLowerCase())
  .filter(Boolean);

export function isAdminUser(user: User | null | undefined) {
  if (!user) return false;
  const email = user.email?.toLowerCase();
  const role = (user.user_metadata as any)?.role;
  return Boolean(
    (email && allowedAdminEmails.includes(email)) ||
      role === 'admin'
  );
}
