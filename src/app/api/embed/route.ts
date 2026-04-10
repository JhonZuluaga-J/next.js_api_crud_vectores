import { NextResponse } from "next/server";
import { processAndSaveWord } from "@/servicio/embedding.service";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    const result = await processAndSaveWord(query);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Embedding Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
