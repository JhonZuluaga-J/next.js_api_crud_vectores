import OpenAI from "openai";
import { AIServiceError } from "@/lib/errors";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const res = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return res.data[0].embedding;
  } catch (error) {
    throw new AIServiceError(`Error al generar embedding ${error}`, { text });
  }
}
