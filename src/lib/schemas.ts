import { z } from "zod";

export const embedRequestSchema = z.object({
  query: z
    .string()
    .min(1, "El texto no puede estar vacío")
    .max(500, "El texto no puede exceder 500 caracteres")
    .trim(),
});

export const searchWordSchema = z.object({
  text: z
    .string()
    .min(1, "El texto no puede estar vacío")
    .max(100, "El texto no puede exceder 100 caracteres")
    .trim()
    .optional(),
  id: z
    .string()
    .regex(/^\d+$/, "El ID debe ser un número válido")
    .transform((val) => parseInt(val, 10))
    .optional(),
});

export type EmbedRequest = z.infer<typeof embedRequestSchema>;
export type SearchWordRequest = z.infer<typeof searchWordSchema>;
