import "dotenv/config";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import cors from "cors";
import express from "express";
import { entriesRouter } from "./routes/entries.js";
import { statsRouter } from "./routes/stats.js";

const app = express();
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "0.0.0.0";
const clientDistPath = resolve(process.cwd(), "client", "dist");
const hasBuiltClient = existsSync(clientDistPath);

app.use(
  cors({
    origin: true
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "echoland-api" });
});

app.use("/api/entries", entriesRouter);
app.use("/api/stats", statsRouter);

if (hasBuiltClient) {
  app.use(express.static(clientDistPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      next();
      return;
    }
    res.sendFile(resolve(clientDistPath, "index.html"));
  });
}

app.listen(port, host, () => {
  const mode = hasBuiltClient ? "mobile/stable" : "api-only";
  console.log(`EchoLand API listening on http://${host}:${port} (${mode})`);
});
