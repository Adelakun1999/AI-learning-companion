// src/lib/types.ts
//
// WHY THIS FILE EXISTS:
//   Our FastAPI backend returns JSON shaped by Pydantic schemas
//   (backend/schemas/user.py, backend/schemas/session.py).
//   These TypeScript types mirror those EXACTLY so that when we
//   fetch data, TypeScript catches mistakes at compile time instead
//   of us discovering bugs at runtime.
//
// RULE OF THUMB: every time you change a Pydantic schema in the
// backend, update the matching type here.

// ── User ───────────────────────────────────────────────────────

// Mirrors backend/schemas/user.py -> UserResponse
export interface User {
  id: string;
  name: string;
  email: string;
  learning_level: "beginner" | "intermediate" | "advanced";
  created_at: string; // ISO date string — JSON has no native Date type
}

// Mirrors backend/schemas/user.py -> TokenResponse
export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// Mirrors backend/schemas/user.py -> TopicProgressResponse
export interface TopicProgress {
  topic: string;
  mastery_score: number; // 0.0 - 1.0
  times_studied: number;
  times_quizzed: number;
  score_history: number[];
  last_studied_at: string;
}

// ── Sessions ───────────────────────────────────────────────────

// Mirrors backend/schemas/session.py -> SessionSummary
export interface SessionSummary {
  id: string;
  topic: string;
  started_at: string;
  ended_at: string | null;
}

// Mirrors backend/schemas/session.py -> MessageResponse
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agent: string | null; // "tutor_agent" | "quiz_agent" | "feedback_agent" | null
  created_at: string;
}

// Mirrors backend/schemas/session.py -> SessionResponse
export interface SessionDetail extends SessionSummary {
  summary: string | null;
  messages: Message[];
}

// ── Chat ───────────────────────────────────────────────────────

// What WE send when chatting — mirrors ChatRequest
export type MessageType = "auto" | "tutor" | "quiz" | "feedback";

export interface ChatRequest {
  message: string;
  message_type: MessageType;
}

// Quiz question shape returned inside quiz_data
export interface QuizQuestion {
  id: number;
  question: string;
  type: string;
  hint: string;
}

export interface QuizData {
  questions: QuizQuestion[];
  topic: string;
  level: string;
  current_question_index: number;
  awaiting_answer: boolean;
  scores: number[];
  final_score?: number;
}

// Mirrors backend/schemas/session.py -> ChatResponse
export interface ChatResponse {
  message: string;
  agent: string;
  session_id: string;
  quiz_data: QuizData | null;
}

// ── API error shape ────────────────────────────────────────────
// FastAPI's default error format: {"detail": "message"}
export interface ApiError {
  detail: string;
}
