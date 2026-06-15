import { Router } from "express";
import { analyzeEntry } from "../services/aiService.js";
import { createEntry, deleteEntry, getEntryById, listEntries, updateEntry } from "../store/index.js";
import type { EntryInput, EntryUpdate } from "../types.js";

export const entriesRouter = Router();

entriesRouter.get("/", async (_req, res) => {
  const entries = await listEntries();
  res.json(entries);
});

entriesRouter.get("/:id", async (req, res) => {
  const entry = await getEntryById(req.params.id);
  if (!entry) {
    res.status(404).json({ message: "Entry not found" });
    return;
  }
  res.json(entry);
});

entriesRouter.post("/", async (req, res) => {
  const payload = req.body as EntryInput;

  if (!payload.raw_text || !payload.raw_text.trim()) {
    res.status(400).json({ message: "raw_text is required" });
    return;
  }

  const normalized: EntryInput = {
    ...payload,
    raw_text: payload.raw_text.trim()
  };

  const analysis = await analyzeEntry(normalized);
  const entry = await createEntry(normalized, analysis);
  res.status(201).json(entry);
});

entriesRouter.put("/:id", async (req, res) => {
  const current = await getEntryById(req.params.id);
  if (!current) {
    res.status(404).json({ message: "Entry not found" });
    return;
  }

  const updates = req.body as EntryUpdate;
  const shouldReanalyze =
    updates.raw_text !== undefined ||
    updates.title !== undefined ||
    updates.entry_type !== undefined ||
    updates.context !== undefined;

  let mergedUpdates: EntryUpdate = updates;

  if (shouldReanalyze) {
    const nextInput: EntryInput = {
      title: updates.title ?? current.title,
      entry_type: updates.entry_type ?? current.entry_type,
      raw_text: updates.raw_text ?? current.raw_text,
      context: {
        ...current.context,
        ...(updates.context || {})
      },
      source: updates.source ?? current.source,
      device: updates.device ?? current.device,
      occurred_at: updates.occurred_at ?? current.occurred_at
    };
    const analysis = await analyzeEntry(nextInput);
    mergedUpdates = {
      ...updates,
      summary: analysis.summary,
      tags: analysis.tags,
      emotion: analysis.emotion,
      personality_indicators: analysis.personality_indicators,
      needs_retry: analysis.needs_retry
    };
  }

  const entry = await updateEntry(req.params.id, mergedUpdates);
  res.json(entry);
});

entriesRouter.delete("/:id", async (req, res) => {
  const deleted = await deleteEntry(req.params.id);
  if (!deleted) {
    res.status(404).json({ message: "Entry not found" });
    return;
  }
  res.status(204).send();
});
