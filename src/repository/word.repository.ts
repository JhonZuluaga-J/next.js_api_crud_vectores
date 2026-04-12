import { prisma } from "@/lib/db/prisma";
import { normalizeText } from "@/lib/validation/validators";
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

export async function deleteById(id: number): Promise<void> {
  await prisma.word.delete({ where: { id } });
}

export async function update(id: number, text: string): Promise<Word> {
  const normalized = normalizeText(text);
  const word = await prisma.word.update({
    where: { id },
    data: { text: normalized },
  });
  return mapToWord(word);
}
