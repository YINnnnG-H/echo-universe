import type { AnalysisResult, Entry, EntryInput, EntryUpdate } from "../types.js";
import { getPool } from "./db.js";
import { normalizeEntryInsights } from "../utils/insightNormalization.js";

function normalizeEntry(row: Record<string, unknown>): Entry {
  const rawEntry: Entry = {
    id: String(row.id),
    user_id: String(row.user_id || ""),
    title: String(row.title || ""),
    entry_type: row.entry_type as Entry["entry_type"],
    raw_text: String(row.raw_text || ""),
    summary: String(row.summary || ""),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    emotion: row.emotion as Entry["emotion"],
    personality_indicators:
      row.personality_indicators && typeof row.personality_indicators === "object"
        ? (row.personality_indicators as Entry["personality_indicators"])
        : {},
    context: row.context && typeof row.context === "object" ? (row.context as Entry["context"]) : {},
    source: String(row.source || "mobile-web"),
    device: String(row.device || "unknown"),
    occurred_at: new Date(String(row.occurred_at)).toISOString(),
    created_at: new Date(String(row.created_at)).toISOString(),
    updated_at: new Date(String(row.updated_at)).toISOString(),
    needs_retry: Boolean(row.needs_retry)
  };
  const normalizedInsights = normalizeEntryInsights(rawEntry);

  return {
    ...rawEntry,
    tags: normalizedInsights.tags,
    personality_indicators: normalizedInsights.personality_indicators
  };
}

export async function listEntries(userId: string) {
  const pool = getPool();
  const result = await pool.query(
    "select * from public.entries where user_id = $1 order by occurred_at desc, created_at desc",
    [userId]
  );
  return result.rows.map(normalizeEntry);
}

export async function getEntryById(userId: string, id: string) {
  const pool = getPool();
  const result = await pool.query("select * from public.entries where user_id = $1 and id = $2 limit 1", [userId, id]);
  return result.rows[0] ? normalizeEntry(result.rows[0]) : null;
}

export async function createEntry(userId: string, input: EntryInput, analysis: AnalysisResult) {
  const pool = getPool();
  const occurredAt = input.occurred_at || new Date().toISOString();
  const result = await pool.query(
    `insert into public.entries
      (user_id, title, entry_type, raw_text, summary, tags, emotion, personality_indicators, context, source, device, occurred_at, needs_retry)
     values
      ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13)
     returning *`,
    [
      userId,
      input.title?.trim() || "",
      input.entry_type || "reflection",
      input.raw_text,
      analysis.summary,
      analysis.tags,
      analysis.emotion,
      JSON.stringify(analysis.personality_indicators),
      JSON.stringify(input.context || {}),
      input.source || "mobile-web",
      input.device || "unknown",
      occurredAt,
      analysis.needs_retry
    ]
  );

  return normalizeEntry(result.rows[0]);
}

export async function updateEntry(userId: string, id: string, updates: EntryUpdate) {
  const current = await getEntryById(userId, id);
  if (!current) {
    return null;
  }

  const pool = getPool();
  const result = await pool.query(
    `update public.entries
     set
      title = $3,
      entry_type = $4,
      raw_text = $5,
      summary = $6,
      tags = $7,
      emotion = $8,
      personality_indicators = $9::jsonb,
      context = $10::jsonb,
      source = $11,
      device = $12,
      occurred_at = $13,
      needs_retry = $14
     where user_id = $1 and id = $2
     returning *`,
    [
      userId,
      id,
      updates.title ?? current.title,
      updates.entry_type ?? current.entry_type,
      updates.raw_text ?? current.raw_text,
      updates.summary ?? current.summary,
      updates.tags ?? current.tags,
      updates.emotion ?? current.emotion,
      JSON.stringify(updates.personality_indicators ?? current.personality_indicators),
      JSON.stringify({
        ...current.context,
        ...(updates.context || {})
      }),
      updates.source ?? current.source,
      updates.device ?? current.device,
      updates.occurred_at ?? current.occurred_at,
      updates.needs_retry ?? current.needs_retry
    ]
  );

  return result.rows[0] ? normalizeEntry(result.rows[0]) : null;
}

export async function deleteEntry(userId: string, id: string) {
  const pool = getPool();
  const result = await pool.query("delete from public.entries where user_id = $1 and id = $2", [userId, id]);
  return (result.rowCount || 0) > 0;
}

export async function bootstrapUserEntries(userId: string) {
  const pool = getPool();
  const existingResult = await pool.query("select count(*)::int as count from public.entries where user_id = $1", [userId]);
  if ((existingResult.rows[0]?.count || 0) > 0) {
    return 0;
  }

  const claimResult = await pool.query(
    "update public.entries set user_id = $1 where user_id is null returning id",
    [userId]
  );

  return claimResult.rowCount || 0;
}
