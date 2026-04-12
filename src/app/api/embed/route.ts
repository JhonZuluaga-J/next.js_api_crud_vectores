import { NextResponse } from "next/server";
import { processAndSaveWord } from "@/servicio/embedding.service";
import { embedRequestSchema } from "@/lib/validation/schemas";
import { handleApiError } from "@/lib/errors/error-handler";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { query } = embedRequestSchema.parse(body);

    const result = await processAndSaveWord(query);

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
