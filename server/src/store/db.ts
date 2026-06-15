import { Pool } from "pg";

let pool: Pool | null = null;

export function isDatabaseEnabled() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl:
        process.env.PGSSL === "disable"
          ? false
          : process.env.NODE_ENV === "development"
            ? { rejectUnauthorized: false }
            : { rejectUnauthorized: false }
    });
  }

  return pool;
}
