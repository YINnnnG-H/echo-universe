import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { AnalysisResult, Entry, EntryInput, EntryType, EntryUpdate } from "../types.js";
import { SAMPLE_ENTRIES } from "../utils/constants.js";
import { normalizeEntryInsights } from "../utils/insightNormalization.js";

const dataPath = resolve(process.cwd(), "server", "data", "entries.json");

function normalizeEntry(entry: Partial<Entry>): Entry {
  const now = new Date().toISOString();
  const normalizedInsights = normalizeEntryInsights({
    entry_type: (entry.entry_type || "reflection") as EntryType,
    raw_text: entry.raw_text || "",
    emotion: entry.emotion || "neutral",
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    personality_indicators: entry.personality_indicators || {}
  });

  return {
    id: entry.id || randomUUID(),
    user_id: entry.user_id || "",
    title: entry.title || "",
    entry_type: (entry.entry_type || "reflection") as EntryType,
    raw_text: entry.raw_text || "",
    summary: entry.summary || "",
    tags: normalizedInsights.tags,
    emotion: entry.emotion || "neutral",
    personality_indicators: normalizedInsights.personality_indicators,
    context: entry.context || {},
    source: entry.source || "mobile-web",
    device: entry.device || "unknown",
    occurred_at: entry.occurred_at || entry.created_at || now,
    created_at: entry.created_at || now,
    updated_at: entry.updated_at || now,
    needs_retry: Boolean(entry.needs_retry)
  };
}

async function ensureFile() {
  await mkdir(dirname(dataPath), { recursive: true });

  try {
    await readFile(dataPath, "utf8");
  } catch {
    await writeFile(dataPath, JSON.stringify(SAMPLE_ENTRIES, null, 2), "utf8");
  }
}

async function readEntries(): Promise<Entry[]> {
  await ensureFile();
  const content = await readFile(dataPath, "utf8");
  return (JSON.parse(content) as Array<Partial<Entry>>).map(normalizeEntry);
}

async function writeEntries(entries: Entry[]) {
  await writeFile(dataPath, JSON.stringify(entries, null, 2), "utf8");
}

export async function listEntries(userId: string) {
  const entries = await readEntries();
  return entries
    .filter((entry) => entry.user_id === userId)
    .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
}

export async function getEntryById(userId: string, id: string) {
  const entries = await readEntries();
  return entries.find((entry) => entry.id === id && entry.user_id === userId) || null;
}

export async function createEntry(userId: string, input: EntryInput, analysis: AnalysisResult) {
  const entries = await readEntries();
  const now = new Date().toISOString();
  const occurredAt = input.occurred_at || now;
  const entry: Entry = {
    id: randomUUID(),
    user_id: userId,
    title: input.title?.trim() || "",
    entry_type: input.entry_type || "reflection",
    raw_text: input.raw_text,
    summary: analysis.summary,
    tags: analysis.tags,
    emotion: analysis.emotion,
    personality_indicators: analysis.personality_indicators,
    context: input.context || {},
    source: input.source || "mobile-web",
    device: input.device || "unknown",
    occurred_at: occurredAt,
    created_at: now,
    updated_at: now,
    needs_retry: analysis.needs_retry
  };

  entries.push(entry);
  await writeEntries(entries);
  return entry;
}

export async function updateEntry(userId: string, id: string, updates: EntryUpdate) {
  const entries = await readEntries();
  const index = entries.findIndex((entry) => entry.id === id && entry.user_id === userId);

  if (index === -1) {
    return null;
  }

  entries[index] = normalizeEntry({
    ...entries[index],
    ...updates,
    context: {
      ...entries[index].context,
      ...(updates.context || {})
    },
    updated_at: new Date().toISOString()
  });

  await writeEntries(entries);
  return entries[index];
}

export async function deleteEntry(userId: string, id: string) {
  const entries = await readEntries();
  const nextEntries = entries.filter((entry) => !(entry.id === id && entry.user_id === userId));

  if (nextEntries.length === entries.length) {
    return false;
  }

  await writeEntries(nextEntries);
  return true;
}

export async function bootstrapUserEntries(userId: string) {
  const entries = await readEntries();
  const alreadyOwned = entries.some((entry) => entry.user_id === userId);
  if (alreadyOwned) {
    return 0;
  }

  let claimed = 0;
  const nextEntries = entries.map((entry) => {
    if (!entry.user_id) {
      claimed += 1;
      return {
        ...entry,
        user_id: userId,
        updated_at: new Date().toISOString()
      };
    }
    return entry;
  });

  if (claimed > 0) {
    await writeEntries(nextEntries);
  }

  return claimed;
}
