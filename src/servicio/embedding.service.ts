import { generateEmbedding } from "./iaService";
import * as WordRepo from "@/repository/word.repository";
import * as EmbeddingRepo from "@/repository/embedding.repository";
import type { Word, Embedding, WordWithEmbedding, SaveResult } from "@/types";

export type { Word, Embedding, WordWithEmbedding, SaveResult };

function getMessageForStatus(status: SaveResult): string {
  const messages = {
    created: "Palabra guardada",
    exists: "Palabra ya existe",
  };
  return messages[status];
}

function buildSuccessResponse(
  query: string,
  status: SaveResult,
  dimensions: number
) {
  return {
    query,
    status,
    message: getMessageForStatus(status),
    dimensions,
  };
}

export async function processAndSaveWord(query: string): Promise<{
  query: string;
  status: SaveResult;
  message: string;
  dimensions: number;
}> {
  const vector = await generateEmbedding(query);

  const existing = await WordRepo.findByText(query);
  if (existing) {
    return buildSuccessResponse(query, "exists", vector.length);
  }

  const word = await WordRepo.create(query);
  await EmbeddingRepo.create(word.id, vector);

  return buildSuccessResponse(query, "created", vector.length);
}

async function findWordByCriteria(
  text?: string,
  id?: number
): Promise<Word | null> {
  if (text) return WordRepo.findByText(text);
  if (id) return WordRepo.findById(id);
  return null;
}

async function enrichWithEmbedding(word: Word): Promise<WordWithEmbedding> {
  const embedding = await EmbeddingRepo.findByWordId(word.id);
  return { ...word, embedding };
}

export async function findWord(
  text?: string,
  id?: number
): Promise<WordWithEmbedding | null> {
  const word = await findWordByCriteria(text, id);
  if (!word) return null;
  return enrichWithEmbedding(word);
}
