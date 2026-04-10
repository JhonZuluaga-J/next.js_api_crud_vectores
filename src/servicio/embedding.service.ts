import { generateEmbedding } from "./iaService";
import { saveWordWithEmbedding, SaveResult } from "@/repository/embedding.repository";

export async function processAndSaveWord(query: string): Promise<{
  query: string;
  status: SaveResult;
  message: string;
  dimensions: number;
}> {
  const queryVector = await generateEmbedding(query);
  const result = await saveWordWithEmbedding(query, queryVector);

  return {
    query,
    status: result,
    message: result === "created" ? "Palabra guardada" : "Palabra ya existe",
    dimensions: queryVector.length,
  };
}
