import type { AnalysisResult, Entry, EntryInput, EntryUpdate } from "../types.js";
import { getPool } from "./db.js";

function normalizeEntry(row: Record<string, unknown>): Entry {
  return {
    id: String(row.id),
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
}

export async function listEntries() {
  const pool = getPool();
  const result = await pool.query("select * from public.entries order by occurred_at desc, created_at desc");
  return result.rows.map(normalizeEntry);
}

export async function getEntryById(id: string) {
  const pool = getPool();
  const result = await pool.query("select * from public.entries where id = $1 limit 1", [id]);
  return result.rows[0] ? normalizeEntry(result.rows[0]) : null;
}

export async function createEntry(input: EntryInput, analysis: AnalysisResult) {
  const pool = getPool();
  const occurredAt = input.occurred_at || new Date().toISOString();
  const result = await pool.query(
    `insert into public.entries
      (title, entry_type, raw_text, summary, tags, emotion, personality_indicators, context, source, device, occurred_at, needs_retry)
     values
      ($1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, $9, $10, $11, $12)
     returning *`,
    [
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

export async function updateEntry(id: string, updates: EntryUpdate) {
  const current = await getEntryById(id);
  if (!current) {
    return null;
  }

  const pool = getPool();
  const result = await pool.query(
    `update public.entries
     set
      title = $2,
      entry_type = $3,
      raw_text = $4,
      summary = $5,
      tags = $6,
      emotion = $7,
      personality_indicators = $8::jsonb,
      context = $9::jsonb,
      source = $10,
      device = $11,
      occurred_at = $12,
      needs_retry = $13
     where id = $1
     returning *`,
    [
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

export async function deleteEntry(id: string) {
  const pool = getPool();
  const result = await pool.query("delete from public.entries where id = $1", [id]);
  return (result.rowCount || 0) > 0;
}
