// Domain Models - Interfaces centralizadas

import { number, string } from "zod";

export interface Word {
  id: number;
  text: string;
  createdAt: Date;
}

export interface Embedding {
  id: number;
  wordId: number;
  vector: number[];
  createdAt: Date;
}

export interface WordWithEmbedding extends Word {
  embedding: Embedding | null;
}

export type SaveResult = "created" | "exists";

export interface ProcessWordResult {
  query: string;
  status: SaveResult;
  message: string;
  dimensions: number;
}

export interface SearchResult {
  wordId: number;
  vector: number[];
  similarity: number;
}

export interface Chat {
  id: number;
  title: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: number;
  role: "user" | "assistant" | "system";
  content: string;
  chatId: number;
  metadata?: Record<string, unknown> | null;
  createdAt: Date;
}

export interface CreateChatInput {
  title?: string;
}

export interface CreateChatMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
  chatId: number;
  metadata?: Record<string, unknown>;
}

export interface ChatResponse {
  message: string;
  chatId: number;
  contextUsed: string[];
}

export interface ChatMessageResponse {
  userMessage: ChatMessage;
  botMessage: ChatMessage;
}

export interface User {
  id: number;
  email: string;
  name: string;
  nickname?: string | null;
  password: string;
  role: "ADMIN" | "ABOGADO" | "CLIENTE";
  status: "PENDIENTE" | "ACTIVO" | "RECHAZADO" | "SUSPENDIDO";
  lawyerId?: number | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}


export interface CreateUserInput {
  email: string;
  name: string;
  nickname?: string;
  password: string;
  role?: "ADMIN" | "ABOGADO" | "CLIENTE";
  status?: "PENDIENTE" | "ACTIVO" | "RECHAZADO" | "SUSPENDIDO";
  lawyerId?: number;
}

export interface ClientKey {
  id: number;
  key: string;
  lawyerId: number;
  clientEmail: string;
  used: boolean;
  usedById?: number | null;
  createdAt: Date;
  expiresAt?: Date | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, "password">;
}



export interface CreateUserInput {
  email: string;
  name: string;
  nickname?: string;
  password: string;
}

export interface UpdateUserInput {
  name?: string;
  nickname?: string;
  password?: string;
}

export interface PgEmbeddingRow {
  id: number;
  word_id: number;
  vector: string;
  created_at: Date;
};

export interface EmbeddingRow {
  word_id: number;
  similarity: number;
}

/**
 * Servicio de hashing (abstracción)
 * de funciones que vamos a utilizar para la encriptar contraseñas
 * para no exponer directamente las funciones que usamos de bcrypt o otra libreria 
 */
export interface PasswordService {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
