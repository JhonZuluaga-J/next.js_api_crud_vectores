import { Pool } from "pg";

const globalForPool = global as unknown as { pgPool?: Pool };

function createPool(): Pool {
  return new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

export const pool = globalForPool.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}

process.on("SIGTERM", () => pool.end());
process.on("SIGINT", () => pool.end());
