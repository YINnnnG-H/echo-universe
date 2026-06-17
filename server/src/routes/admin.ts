import { Router } from "express";
import { requireAuth, type AuthenticatedRequest } from "../auth.js";
import { getPool } from "../store/db.js";
import type { AdminUserStat, TagStat } from "../types.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const adminRouter = Router();
adminRouter.use(requireAuth);

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email?: string) {
  if (!email) {
    return false;
  }
  return getAdminEmails().includes(email.toLowerCase());
}

adminRouter.get(
  "/users",
  asyncHandler(async (req, res) => {
    const { email } = (req as AuthenticatedRequest).auth;
    if (!isAdminEmail(email)) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }

    const pool = getPool();
    const result = await pool.query<{
      user_id: string;
      email: string | null;
      created_at: string | null;
      last_sign_in_at: string | null;
      entry_count: number | string;
      latest_entry_at: string | null;
      top_tags: TagStat[] | null;
    }>(`
      select
        u.id::text as user_id,
        u.email,
        u.created_at::text,
        u.last_sign_in_at::text,
        count(e.id)::int as entry_count,
        max(e.occurred_at)::text as latest_entry_at,
        coalesce(
          (
            select json_agg(tag_row order by tag_row.count desc, tag_row.tag asc)
            from (
              select tag, count(*)::int as count
              from public.entries e2,
                unnest(coalesce(e2.tags, '{}')) as tag
              where e2.user_id = u.id
              group by tag
              order by count desc, tag asc
              limit 5
            ) tag_row
          ),
          '[]'::json
        ) as top_tags
      from auth.users u
      left join public.entries e on e.user_id = u.id
      group by u.id, u.email, u.created_at, u.last_sign_in_at
      order by max(e.occurred_at) desc nulls last, u.created_at desc
    `);

    const users: AdminUserStat[] = result.rows.map((row) => ({
      user_id: row.user_id,
      email: row.email || "",
      created_at: row.created_at ? new Date(row.created_at).toISOString() : undefined,
      last_sign_in_at: row.last_sign_in_at ? new Date(row.last_sign_in_at).toISOString() : undefined,
      entry_count: Number(row.entry_count || 0),
      latest_entry_at: row.latest_entry_at ? new Date(row.latest_entry_at).toISOString() : undefined,
      top_tags: Array.isArray(row.top_tags)
        ? row.top_tags.map((tag) => ({
            tag: String(tag.tag),
            count: Number(tag.count || 0)
          }))
        : []
    }));

    res.json({ users });
  })
);
