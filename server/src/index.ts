import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { loadEnv } from "./loadEnv.js";
import { accountRouter } from "./routes/account.js";
import { entriesRouter } from "./routes/entries.js";
import { statsRouter } from "./routes/stats.js";

loadEnv();

const app = express();
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || "0.0.0.0";
const currentFilePath = fileURLToPath(import.meta.url);
const currentDir = dirname(currentFilePath);
const clientDistCandidates = [
  resolve(process.cwd(), "client", "dist"),
  resolve(process.cwd(), "..", "client", "dist"),
  resolve(currentDir, "..", "..", "client", "dist")
];
const clientDistPath = clientDistCandidates.find((path) => existsSync(path)) || clientDistCandidates[0];
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

app.use("/api/account", accountRouter);
app.use("/api/entries", entriesRouter);
app.use("/api/stats", statsRouter);

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);
  const message = error instanceof Error ? error.message : "Internal server error";
  res.status(500).json({ message });
});

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
