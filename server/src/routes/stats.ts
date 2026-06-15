import { Router } from "express";
import { buildDashboardStats } from "../services/statsService.js";
import { listEntries } from "../store/index.js";

export const statsRouter = Router();

statsRouter.get("/tags", async (_req, res) => {
  const entries = await listEntries();
  const stats = buildDashboardStats(entries);
  res.json(stats.tags);
});

statsRouter.get("/personality", async (_req, res) => {
  const entries = await listEntries();
  const stats = buildDashboardStats(entries);
  res.json(stats.personality);
});

statsRouter.get("/emotion", async (_req, res) => {
  const entries = await listEntries();
  const stats = buildDashboardStats(entries);
  res.json(stats.emotions);
});

statsRouter.get("/dashboard", async (_req, res) => {
  const entries = await listEntries();
  res.json(buildDashboardStats(entries));
});
