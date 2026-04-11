import { Pool } from "pg";
import type { Embedding } from "@/types";

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

function parseVector(vectorStr: string): number[] {
  return vectorStr
    .replace("[", "")
    .replace("]", "")
    .split(",")
    .map((v) => parseFloat(v));
}

export async function create(wordId: number, vector: number[]): Promise<void> {
  const vectorString = `[${vector.join(",")}]`;
  await pool.query(
    `INSERT INTO "Embedding" ("word_id", "vector") VALUES ($1, $2::vector)`,
    [wordId, vectorString]
  );
}

function mapToEmbedding(row: {
  id: number;
  word_id: number;
  vector: string;
  created_at: Date;
}): Embedding {
  return {
    id: row.id,
    wordId: row.word_id,
    vector: parseVector(row.vector),
    createdAt: row.created_at,
  };
}

async function queryEmbeddingByWordId(wordId: number) {
  return pool.query(
    `SELECT id, word_id, vector::text, created_at FROM "Embedding" WHERE word_id = $1`,
    [wordId]
  );
}

export async function findByWordId(wordId: number): Promise<Embedding | null> {
  const result = await queryEmbeddingByWordId(wordId);
  if (result.rows.length === 0) return null;
  return mapToEmbedding(result.rows[0]);
}
