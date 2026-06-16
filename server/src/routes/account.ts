import { Router } from "express";
import { AuthenticatedRequest, requireAuth } from "../auth.js";
import { bootstrapUserEntries } from "../store/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const accountRouter = Router();
accountRouter.use(requireAuth);

accountRouter.post(
  "/bootstrap",
  asyncHandler(async (req, res) => {
    const { userId } = (req as AuthenticatedRequest).auth;
    const claimed = await bootstrapUserEntries(userId);
    res.json({ claimed });
  })
);
