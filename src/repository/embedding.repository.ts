import { prisma } from "@/lib/prisma";
import { normalizeText, isPrismaError } from "@/lib/validators";
import { DatabaseError } from "@/lib/errors";
export type SaveResult = "created" | "exists";

async function createWordAndEmbedding(text: string, vector: number[]): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const word = await tx.word.create({ data: { text } });
    await tx.$executeRaw`
      INSERT INTO "Embedding" ("word_id", "vector")
      VALUES (${word.id}, ${vector}::vector)`;
  });
}

export async function saveWordWithEmbedding(query: string, queryVector: number[]): Promise<SaveResult> {
  const text = normalizeText(query);

  try {
    await createWordAndEmbedding(text, queryVector);
    return "created";
  } catch (error: unknown) {
    if (isPrismaError(error) && error.code === "P2002") return "exists";
    throw new DatabaseError("Failed to save word");
  }
}
