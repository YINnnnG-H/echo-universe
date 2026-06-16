import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { loadEnv } from "../loadEnv.js";
import type { Entry, EntryType, Emotion } from "../types.js";
import { getPool } from "../store/db.js";

loadEnv();

const VALID_ENTRY_TYPES = new Set<EntryType>([
  "reflection",
  "podcast",
  "exhibition",
  "music",
  "movement",
  "reading",
  "conversation",
  "dream",
  "other"
]);

const VALID_EMOTIONS = new Set<Emotion>(["positive", "neutral", "negative"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function toUuid(value: string) {
  if (UUID_PATTERN.test(value)) {
    return value;
  }

  const hash = createHash("sha1").update(value).digest("hex");
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-a${hash.slice(17, 20)}-${hash.slice(20, 32)}`;
}

function findOption(name: string) {
  const index = process.argv.findIndex((argument) => argument === name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasFlag(name: string) {
  return process.argv.includes(name);
}

function resolveCandidatePaths() {
  const explicitPath = findOption("--path") || process.env.LOCAL_ENTRIES_PATH;

  return [
    explicitPath,
    resolve(process.cwd(), "server", "data", "entries.json"),
    resolve(process.cwd(), "server", "server", "data", "entries.json"),
    resolve(process.cwd(), "data", "entries.json")
  ].filter((value): value is string => Boolean(value));
}

function normalizeEntry(entry: Partial<Entry>, index: number): Entry {
  const now = new Date().toISOString();
  const entryType = VALID_ENTRY_TYPES.has(entry.entry_type as EntryType)
    ? (entry.entry_type as EntryType)
    : "reflection";
  const emotion = VALID_EMOTIONS.has(entry.emotion as Emotion) ? (entry.emotion as Emotion) : "neutral";

  return {
    id: toUuid(String(entry.id || randomUUID())),
    title: typeof entry.title === "string" ? entry.title : "",
    entry_type: entryType,
    raw_text: typeof entry.raw_text === "string" ? entry.raw_text : "",
    summary: typeof entry.summary === "string" ? entry.summary : "",
    tags: Array.isArray(entry.tags) ? entry.tags.map(String).filter(Boolean) : [],
    emotion,
    personality_indicators:
      entry.personality_indicators && typeof entry.personality_indicators === "object"
        ? entry.personality_indicators
        : {},
    context: entry.context && typeof entry.context === "object" ? entry.context : {},
    source: typeof entry.source === "string" ? entry.source : "mobile-web",
    device: typeof entry.device === "string" ? entry.device : "unknown",
    occurred_at: typeof entry.occurred_at === "string" ? entry.occurred_at : typeof entry.created_at === "string" ? entry.created_at : now,
    created_at: typeof entry.created_at === "string" ? entry.created_at : now,
    updated_at: typeof entry.updated_at === "string" ? entry.updated_at : typeof entry.created_at === "string" ? entry.created_at : now,
    needs_retry: Boolean(entry.needs_retry)
  };
}

async function loadLocalEntries() {
  const filePath = resolveCandidatePaths().find((candidate) => existsSync(candidate));

  if (!filePath) {
    throw new Error("没有找到本地 entries.json，请检查 LOCAL_ENTRIES_PATH 或 --path 参数");
  }

  const content = await readFile(filePath, "utf8");
  const parsed = JSON.parse(content) as Array<Partial<Entry>>;

  if (!Array.isArray(parsed)) {
    throw new Error("本地 entries.json 不是数组格式");
  }

  return {
    filePath,
    entries: parsed.map(normalizeEntry)
  };
}

async function importEntries() {
  const dryRun = hasFlag("--dry-run");
  const { filePath, entries } = await loadLocalEntries();

  console.log(`Using local data: ${filePath}`);
  console.log(`Found ${entries.length} local entries`);

  if (dryRun) {
    console.log("Dry run complete. No database changes were made.");
    return;
  }

  const pool = getPool();

  try {
    await pool.query("begin");

    for (const entry of entries) {
      await pool.query(
        `insert into public.entries
          (id, title, entry_type, raw_text, summary, tags, emotion, personality_indicators, context, source, device, occurred_at, needs_retry, created_at, updated_at)
         values
          ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11, $12, $13, $14, $15)
         on conflict (id) do update set
          title = excluded.title,
          entry_type = excluded.entry_type,
          raw_text = excluded.raw_text,
          summary = excluded.summary,
          tags = excluded.tags,
          emotion = excluded.emotion,
          personality_indicators = excluded.personality_indicators,
          context = excluded.context,
          source = excluded.source,
          device = excluded.device,
          occurred_at = excluded.occurred_at,
          needs_retry = excluded.needs_retry,
          created_at = excluded.created_at,
          updated_at = excluded.updated_at`,
        [
          entry.id,
          entry.title,
          entry.entry_type,
          entry.raw_text,
          entry.summary,
          entry.tags,
          entry.emotion,
          JSON.stringify(entry.personality_indicators),
          JSON.stringify(entry.context),
          entry.source,
          entry.device,
          entry.occurred_at,
          entry.needs_retry,
          entry.created_at,
          entry.updated_at
        ]
      );
    }

    await pool.query("commit");

    const countResult = await pool.query("select count(*)::int as count from public.entries");
    console.log(`Import complete. Cloud database now has ${countResult.rows[0]?.count ?? entries.length} entries.`);
  } catch (error) {
    await pool.query("rollback");
    throw error;
  } finally {
    await pool.end();
  }
}

importEntries().catch((error) => {
  console.error("Import failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
