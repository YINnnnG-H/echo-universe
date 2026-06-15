import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { randomUUID } from "node:crypto";
import type { AnalysisResult, Entry, EntryInput, EntryType, EntryUpdate } from "../types.js";
import { SAMPLE_ENTRIES } from "../utils/constants.js";

const dataPath = resolve(process.cwd(), "server", "data", "entries.json");

function normalizeEntry(entry: Partial<Entry>): Entry {
  const now = new Date().toISOString();
  return {
    id: entry.id || randomUUID(),
    title: entry.title || "",
    entry_type: (entry.entry_type || "reflection") as EntryType,
    raw_text: entry.raw_text || "",
    summary: entry.summary || "",
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    emotion: entry.emotion || "neutral",
    personality_indicators: entry.personality_indicators || {},
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

export async function listEntries() {
  const entries = await readEntries();
  return entries.sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime());
}

export async function getEntryById(id: string) {
  const entries = await readEntries();
  return entries.find((entry) => entry.id === id) || null;
}

export async function createEntry(input: EntryInput, analysis: AnalysisResult) {
  const entries = await readEntries();
  const now = new Date().toISOString();
  const occurredAt = input.occurred_at || now;
  const entry: Entry = {
    id: randomUUID(),
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

export async function updateEntry(id: string, updates: EntryUpdate) {
  const entries = await readEntries();
  const index = entries.findIndex((entry) => entry.id === id);

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

export async function deleteEntry(id: string) {
  const entries = await readEntries();
  const nextEntries = entries.filter((entry) => entry.id !== id);

  if (nextEntries.length === entries.length) {
    return false;
  }

  await writeEntries(nextEntries);
  return true;
}
