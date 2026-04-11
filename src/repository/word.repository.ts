import { prisma } from "@/lib/prisma";
import { normalizeText } from "@/lib/validators";
import type { Word } from "@/types";

function mapToWord(dbWord: { id: number; text: string; createdAt: Date }): Word {
  return {
    id: dbWord.id,
    text: dbWord.text,
    createdAt: dbWord.createdAt,
  };
}

export async function findByText(text: string): Promise<Word | null> {
  const normalized = normalizeText(text);
  const word = await prisma.word.findUnique({ where: { text: normalized } });
  return word ? mapToWord(word) : null;
}

export async function findById(id: number): Promise<Word | null> {
  const word = await prisma.word.findUnique({ where: { id } });
  return word ? mapToWord(word) : null;
}

export async function create(text: string): Promise<Word> {
  const normalized = normalizeText(text);
  const word = await prisma.word.create({ data: { text: normalized } });
  return mapToWord(word);
}
