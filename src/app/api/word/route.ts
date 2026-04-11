import { NextResponse } from "next/server";
import { findWord } from "@/servicio/embedding.service";
import { searchWordSchema } from "@/lib/schemas";
import { NotFoundError } from "@/lib/errors";
import { handleApiError } from "@/lib/error-handler";

function buildVectorPreview(vector: number[]): string {
  const preview = vector.slice(0, 3).join(", ");
  return `${preview}... (${vector.length} dims)`;
}

function formatWordResponse(word: {
  id: number;
  text: string;
  createdAt: Date;
  embedding: { vector: number[] } | null;
}) {
  return {
    id: word.id,
    text: word.text,
    createdAt: word.createdAt,
    hasEmbedding: word.embedding !== null,
    vectorPreview: word.embedding ? buildVectorPreview(word.embedding.vector) : null,
  };
}

function parseSearchParams(req: Request) {
  const { searchParams } = new URL(req.url);
  return Object.fromEntries(searchParams.entries());
}

function ensureHasSearchCriteria(text: string | undefined, id: number | undefined) {
  if (!text && !id) {
    throw new NotFoundError("Parámetros", "text o id requeridos");
  }
}

async function fetchWord(text: string | undefined, id: number | undefined) {
  const word = await findWord(text, id);
  if (!word) {
    throw new NotFoundError("Palabra", text || String(id));
  }
  return word;
}

export async function GET(req: Request) {
  try {
    const params = parseSearchParams(req);
    const { text, id } = searchWordSchema.parse(params);

    ensureHasSearchCriteria(text, id);
    const word = await fetchWord(text, id);

    return NextResponse.json(formatWordResponse(word));
  } catch (error) {
    return handleApiError(error);
  }
}
