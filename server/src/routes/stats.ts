import { Router } from "express";
import { AuthenticatedRequest, requireAuth } from "../auth.js";
import { buildDashboardStats } from "../services/statsService.js";
import { listEntries } from "../store/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const statsRouter = Router();
statsRouter.use(requireAuth);

statsRouter.get("/tags", asyncHandler(async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).auth;
  const entries = await listEntries(userId);
  const stats = buildDashboardStats(entries);
  res.json(stats.tags);
}));

statsRouter.get("/personality", asyncHandler(async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).auth;
  const entries = await listEntries(userId);
  const stats = buildDashboardStats(entries);
  res.json(stats.personality);
}));

statsRouter.get("/emotion", asyncHandler(async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).auth;
  const entries = await listEntries(userId);
  const stats = buildDashboardStats(entries);
  res.json(stats.emotions);
}));

statsRouter.get("/dashboard", asyncHandler(async (req, res) => {
  const { userId } = (req as AuthenticatedRequest).auth;
  const entries = await listEntries(userId);
  res.json(buildDashboardStats(entries));
}));
