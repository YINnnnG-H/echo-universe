import { Router } from "express";
import { buildDashboardStats } from "../services/statsService.js";
import { listEntries } from "../store/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const statsRouter = Router();

statsRouter.get("/tags", asyncHandler(async (_req, res) => {
  const entries = await listEntries();
  const stats = buildDashboardStats(entries);
  res.json(stats.tags);
}));

statsRouter.get("/personality", asyncHandler(async (_req, res) => {
  const entries = await listEntries();
  const stats = buildDashboardStats(entries);
  res.json(stats.personality);
}));

statsRouter.get("/emotion", asyncHandler(async (_req, res) => {
  const entries = await listEntries();
  const stats = buildDashboardStats(entries);
  res.json(stats.emotions);
}));

statsRouter.get("/dashboard", asyncHandler(async (_req, res) => {
  const entries = await listEntries();
  res.json(buildDashboardStats(entries));
}));
