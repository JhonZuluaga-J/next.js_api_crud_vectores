import { pool } from "@/lib/db/pool";
import { NotFoundError, ConflictError, DatabaseError } from "@/lib/errors/errors";
import type { Embedding, PgEmbeddingRow, EmbeddingRow } from "@/types";



function parseVector(vectorStr: string): number[] {
  return vectorStr
  /* mira  /^\[ esto dicebuca corchete al inicio y borralo o si esta al final 
  |\]$ y borralo y /g que esta busque da es global  aunque est solo toca inicio y fin 
   */
    .replace(/^\[|\]$/g, "")
    .split(",")// separa en , donde encuentra ,
    .map(v => parseFloat(v));
    // recorre el array de numero y combierte cada uno en decimal 
}

function mapToEmbedding(row: PgEmbeddingRow ): Embedding {
  return {
    id: row.id,
    wordId: row.word_id,
    vector: parseVector(row.vector),
    createdAt: row.created_at,
  };
}

// Type guard para verificar que error tiene propiedad 'code' de tipo string
function isPgError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof (error as Record<string, unknown>).code === 'string'
  );
}


function catchGenericError(error: unknown, Code:string , messages:string): void {
  if (isPgError(error) && error.code === Code) {
    throw error; // relanzar error específico
  }
  throw new DatabaseError(messages, {
    message: error instanceof Error ? error.message : String(error),
  });
}

// Manejo de error para casos de "no encontrado" (ej. código P2025 de Prisma/PostgreSQL)
async function handlePgNotFound<T>(promise: Promise<{ rows: T[] }>, resource: string, id: PropertyKey,
): Promise<T> {
  try {
    const result = await promise;
    if (result.rows.length === 0) {
      // Transformamos en string el id para el error personalizado
      throw new NotFoundError(resource, id.toString());
    }
    return result.rows[0];
  } catch (error: unknown) {
    catchGenericError(error, 'P2025', 'Error al buscar embedding');
    throw error;
  }
}


// Manejo de error para violaciones de unicidad (código 23505 de PostgreSQL)
// acepto cualquier tipo de pool.query Promise<{ rows: T[] }
async function handlePgDuplicate<T>(promise: Promise<{ rows: T[] }>, resource: string, id: PropertyKey,
): Promise<T> {
  try {
    const result = await promise;
    if (result.rows.length === 0) {
      // Transformamos en string el id para el error personalizado
      throw new ConflictError(resource, id.toString());
    }
    return result.rows[0];
  } catch (error: unknown) {
    catchGenericError(error, "23505", "Error al buscar embedding");
    throw error;
  }
}



export async function create(wordId: number, vector: number[]): Promise<Embedding> {
  const vectorString = `[${vector.join(",")}]`;
  const row = await handlePgDuplicate (
    pool.query<PgEmbeddingRow>(`INSERT INTO "Embedding" ("word_id", "vector") 
      VALUES ($1, $2::vector) RETURNING *`, 
      [ wordId, vectorString]
    ),
    "Embedding",
    wordId
    );
  return mapToEmbedding(row);
}

export async function findByWordId(wordId: number): Promise<Embedding | null> {
  try {
    const result = await pool.query<PgEmbeddingRow>(
      `SELECT id, word_id, vector::text, created_at FROM "Embedding" WHERE word_id = $1`,
      [wordId]
    );
    if (result.rows.length === 0) return null;
    return mapToEmbedding(result.rows[0]);
  } catch (error: unknown) {
    throw new DatabaseError("Error al buscar embedding", {
      wordId,
      originalError: error instanceof Error ? error.message : String(error),
    });
  }
}


export async function deleteByWordId(wordId: number): Promise<Embedding> {
  const row = await handlePgNotFound(
    pool.query<PgEmbeddingRow>(`DELETE FROM "Embedding" 
    WHERE word_id = $1 RETURNING *`, 
      [wordId]),
      "Embedding",
      wordId,
    );
    return mapToEmbedding(row);
}

export async function update(wordId: number, vector: number[]): Promise<Embedding> {
  const vectorString = `[${vector.join(",")}]`;
  const row = await handlePgNotFound(
    //aca no ponemos await ya que la funcion que creamos
    //  anterior mente espera una promesa y 
    // si ponemos await le estariamos danod el resultado 
    pool.query<PgEmbeddingRow>(
      `UPDATE "Embedding" SET "vector" = $1::vector 
       WHERE "word_id" = $2 
       RETURNING *`,
      [vectorString, wordId],  // <-- Orden corregido
    ),
    "Embedding",
    wordId
  );
  return mapToEmbedding(row);
}
const toVectorStr = (v: number[]) => `[${v.join(",")}]`;
//en la query estamos resta 1 al proceso de calcular la distancia 
// para formatera el orden de que suelta los datos y a hacer que 
// -1 se a el mas lejano y 1 el igual
const querySearchVector = `
  SELECT word_id, 1 - ("vector" <=> $1::vector) as similarity
  FROM "Embedding" 
  ORDER BY "vector" <=> $1::vector 
  LIMIT $2
` as const;

export async function searchSimilar(
  queryVector: number[],
  limit: number = 5
): Promise<EmbeddingRow[]> {
  try{
    
    const { rows } = await pool.query<EmbeddingRow>(querySearchVector, [toVectorStr(queryVector), limit]);
       
 return rows.map(row => ({
      word_id: Number(row.word_id), // Aseguramos que sea número (Postgres a veces manda strings)
      similarity: Number(row.similarity)
    }));

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new DatabaseError(`Error en búsqueda semántica: ${message}`);
  }
}
  
