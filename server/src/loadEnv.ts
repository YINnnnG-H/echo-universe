import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

let loaded = false;

export function loadEnv() {
  if (loaded) {
    return;
  }

  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(process.cwd(), "..", ".env"),
    resolve(process.cwd(), "server", ".env")
  ];

  for (const path of candidates) {
    if (existsSync(path)) {
      config({ path, override: false });
    }
  }

  loaded = true;
}
