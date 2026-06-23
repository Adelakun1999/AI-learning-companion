// src/lib/api.ts
//
// WHY THIS FILE EXISTS:
//   Instead of calling fetch() directly inside every component
//   (which leads to repeated boilerplate — headers, error handling,
//   base URLs scattered everywhere), we centralise ALL backend calls
//   here. Every function:
//     1. Knows the exact endpoint shape (thanks to types.ts)
//     2. Automatically attaches the auth token if present
//     3. Throws a typed error on failure so callers can catch it
//
//   This mirrors how backend/api/auth.py and backend/api/sessions.py
//   are structured — one function per endpoint.

import { getToken } from "./auth";
import type {
  ApiError,
  ChatRequest,
  ChatResponse,
  SessionDetail,
  SessionSummary,
  TokenResponse,
  TopicProgress,
  User,
} from "./types";

// Base URL comes from an environment variable so we can point at
// localhost in dev and a real domain in production without code changes.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

/**
 * Custom error class so callers can distinguish "API returned an
 * error" from "network failed entirely" or "bug in our code".
 */
export class ApiRequestError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiRequestError";
  }
}

/**
 * The core request function. Every other function in this file
 * calls this one. This is the SINGLE place that:
 *   - builds the full URL
 *   - attaches Content-Type and Authorization headers
 *   - parses JSON
 *   - converts non-2xx responses into thrown errors
 */
async function request<TResponse>(
  path: string,
  options: RequestInit = {}
): Promise<TResponse> {
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // FastAPI returns { "detail": "..." } on errors (see backend HTTPException)
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiError | null;
    throw new ApiRequestError(
      response.status,
      errorBody?.detail || `Request failed with status ${response.status}`
    );
  }

  // Some endpoints (like 204 No Content) have no body to parse
  if (response.status === 204) {
    return undefined as TResponse;
  }

  return response.json() as Promise<TResponse>;
}

// ── Auth endpoints ──────────────────────────────────────────────
// Mirrors backend/api/auth.py

export async function registerUser(data: {
  name: string;
  email: string;
  password: string;
  learning_level?: string;
}): Promise<User> {
  return request<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function loginUser(data: {
  email: string;
  password: string;
}): Promise<TokenResponse> {
  return request<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ── Session endpoints ───────────────────────────────────────────
// Mirrors backend/api/sessions.py

export async function createSession(topic: string): Promise<SessionSummary> {
  return request<SessionSummary>("/sessions", {
    method: "POST",
    body: JSON.stringify({ topic }),
  });
}

export async function listSessions(): Promise<SessionSummary[]> {
  return request<SessionSummary[]>("/sessions");
}

export async function getSession(sessionId: string): Promise<SessionDetail> {
  return request<SessionDetail>(`/sessions/${sessionId}`);
}

export async function sendChatMessage(
  sessionId: string,
  body: ChatRequest
): Promise<ChatResponse> {
  return request<ChatResponse>(`/sessions/${sessionId}/chat`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function endSession(sessionId: string): Promise<SessionDetail> {
  return request<SessionDetail>(`/sessions/${sessionId}/end`, {
    method: "POST",
  });
}

export async function getProgress(): Promise<TopicProgress[]> {
  return request<TopicProgress[]>("/progress");
}
